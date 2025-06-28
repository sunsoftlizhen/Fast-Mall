const Joi = require("joi");
const db = require("../utils/database");

class MomentController {
  // 获取朋友圈列表
  static async getMoments(ctx) {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      const [moments] = await db.execute(
        `SELECT m.*, u.username, u.avatar,
                p.name as product_name, p.image as product_image
         FROM moments m
         JOIN users u ON m.user_id = u.id
         LEFT JOIN products p ON m.product_id = p.id
         WHERE m.status = 1
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [String(pageSizeNum), String(offset)]
      );

      // 获取每条朋友圈的评论和点赞信息
      for (const moment of moments) {
        // 获取评论
        const [comments] = await db.execute(
          `SELECT mc.*, u.username, u.avatar
           FROM moment_comments mc
           JOIN users u ON mc.user_id = u.id
           WHERE mc.moment_id = ? AND mc.status = 1
           ORDER BY mc.created_at ASC`,
          [moment.id]
        );

        // 处理回复关系
        const commentMap = {};
        const rootComments = [];

        comments.forEach((comment) => {
          commentMap[comment.id] = { ...comment, replies: [] };
          if (comment.parent_id) {
            if (commentMap[comment.parent_id]) {
              commentMap[comment.parent_id].replies.push(
                commentMap[comment.id]
              );
            }
          } else {
            rootComments.push(commentMap[comment.id]);
          }
        });

        moment.comments = rootComments;

        // 获取点赞用户
        const [likes] = await db.execute(
          `SELECT ml.*, u.username
           FROM moment_likes ml
           JOIN users u ON ml.user_id = u.id
           WHERE ml.moment_id = ?
           ORDER BY ml.created_at DESC`,
          [moment.id]
        );

        moment.likes = likes;

        // 解析图片JSON
        if (moment.images) {
          try {
            moment.images = JSON.parse(moment.images);
          } catch (e) {
            moment.images = [];
          }
        } else {
          moment.images = [];
        }
      }

      const [countResult] = await db.execute(
        "SELECT COUNT(*) as total FROM moments WHERE status = 1"
      );

      ctx.body = {
        success: true,
        data: {
          moments,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 发布朋友圈
  static async createMoment(ctx) {
    try {
      const schema = Joi.object({
        content: Joi.string().min(1).max(1000).required().messages({
          "string.min": "内容不能为空",
          "string.max": "内容不能超过1000个字符",
        }),
        images: Joi.array().items(Joi.string()).optional(),
        location: Joi.string().max(100).optional(),
        type: Joi.string().valid("normal", "product_review").default("normal"),
        product_id: Joi.number().integer().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { content, images, location, type, product_id } = value;
      const userId = ctx.state.user.id;

      // 如果是商品评论，检查商品是否存在
      if (type === "product_review" && product_id) {
        const [products] = await db.execute(
          "SELECT id FROM products WHERE id = ?",
          [product_id]
        );

        if (products.length === 0) {
          throw new Error("商品不存在");
        }
      }

      const [result] = await db.execute(
        `INSERT INTO moments (user_id, content, images, location, type, product_id)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          userId,
          content,
          images ? JSON.stringify(images) : null,
          location || null,
          type,
          product_id || null,
        ]
      );

      ctx.body = {
        success: true,
        message: "发布成功",
        data: {
          moment_id: result.insertId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 评论朋友圈
  static async commentMoment(ctx) {
    try {
      const momentId = ctx.params.id;
      const { content } = ctx.request.body;
      const userId = ctx.state.user.id;

      // 基本验证
      if (!content || content.trim().length === 0) {
        throw new Error("评论内容不能为空");
      }

      if (content.length > 500) {
        throw new Error("评论内容不能超过500个字符");
      }

      // 直接插入评论，不做复杂检查
      const [result] = await db.execute(
        `INSERT INTO moment_comments (moment_id, user_id, content)
         VALUES (?, ?, ?)`,
        [momentId, userId, content.trim()]
      );

      ctx.body = {
        success: true,
        message: "评论成功",
        data: {
          comment_id: result.insertId,
        },
      };
    } catch (error) {
      console.error("朋友圈评论失败:", error);
      throw error;
    }
  }

  // 点赞/取消点赞朋友圈
  static async toggleLikeMoment(ctx) {
    try {
      const momentId = ctx.params.id;
      const userId = ctx.state.user.id;

      // 检查朋友圈是否存在
      const [moments] = await db.execute(
        "SELECT id FROM moments WHERE id = ? AND status = 1",
        [momentId]
      );

      if (moments.length === 0) {
        throw new Error("朋友圈不存在");
      }

      // 检查是否已点赞
      const [existingLikes] = await db.execute(
        "SELECT id FROM moment_likes WHERE moment_id = ? AND user_id = ?",
        [momentId, userId]
      );

      // 使用连接池的事务处理
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        if (existingLikes.length > 0) {
          // 取消点赞
          await connection.execute(
            "DELETE FROM moment_likes WHERE moment_id = ? AND user_id = ?",
            [momentId, userId]
          );

          await connection.execute(
            "UPDATE moments SET likes_count = likes_count - 1 WHERE id = ?",
            [momentId]
          );

          await connection.commit();

          ctx.body = {
            success: true,
            message: "取消点赞成功",
            data: { liked: false },
          };
        } else {
          // 添加点赞
          await connection.execute(
            "INSERT INTO moment_likes (moment_id, user_id) VALUES (?, ?)",
            [momentId, userId]
          );

          await connection.execute(
            "UPDATE moments SET likes_count = likes_count + 1 WHERE id = ?",
            [momentId]
          );

          await connection.commit();

          ctx.body = {
            success: true,
            message: "点赞成功",
            data: { liked: true },
          };
        }
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    } catch (error) {
      throw error;
    }
  }

  // 获取用户发布的朋友圈
  static async getUserMoments(ctx) {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;
      const userId = ctx.state.user.id;

      const [moments] = await db.execute(
        `SELECT m.*, p.name as product_name, p.image as product_image
         FROM moments m
         LEFT JOIN products p ON m.product_id = p.id
         WHERE m.user_id = ? AND m.status = 1
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, String(pageSizeNum), String(offset)]
      );

      // 解析图片JSON
      moments.forEach((moment) => {
        if (moment.images) {
          try {
            moment.images = JSON.parse(moment.images);
          } catch (e) {
            moment.images = [];
          }
        } else {
          moment.images = [];
        }
      });

      const [countResult] = await db.execute(
        "SELECT COUNT(*) as total FROM moments WHERE user_id = ? AND status = 1",
        [userId]
      );

      ctx.body = {
        success: true,
        data: {
          moments,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除朋友圈
  static async deleteMoment(ctx) {
    try {
      const momentId = ctx.params.id;
      const userId = ctx.state.user.id;

      const [result] = await db.execute(
        "UPDATE moments SET status = 0 WHERE id = ? AND user_id = ?",
        [momentId, userId]
      );

      if (result.affectedRows === 0) {
        throw new Error("朋友圈不存在或无权删除");
      }

      ctx.body = {
        success: true,
        message: "删除成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 管理员获取所有朋友圈（管理后台用）
  static async getAllMomentsForAdmin(ctx) {
    try {
      const { page = 1, pageSize = 10, keyword = "", type = "" } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      let whereClause = "WHERE 1=1";
      const params = [];

      if (keyword && keyword.trim()) {
        whereClause += " AND (m.content LIKE ? OR u.username LIKE ?)";
        params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
      }

      if (type && type !== "") {
        whereClause += " AND m.type = ?";
        params.push(type);
      }

      const [moments] = await db.execute(
        `SELECT m.*, u.username, u.avatar, u.email,
                p.name as product_name
         FROM moments m
         JOIN users u ON m.user_id = u.id
         LEFT JOIN products p ON m.product_id = p.id
         ${whereClause}
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, String(pageSizeNum), String(offset)]
      );

      // 解析图片JSON
      moments.forEach((moment) => {
        if (moment.images) {
          try {
            moment.images = JSON.parse(moment.images);
          } catch (e) {
            moment.images = [];
          }
        } else {
          moment.images = [];
        }
      });

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM moments m JOIN users u ON m.user_id = u.id ${whereClause}`,
        params
      );

      ctx.body = {
        success: true,
        data: {
          moments,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total: countResult[0].total,
            totalPages: Math.ceil(countResult[0].total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 管理员隐藏/显示朋友圈
  static async toggleMomentStatus(ctx) {
    try {
      const momentId = ctx.params.id;
      const schema = Joi.object({
        status: Joi.number().integer().valid(0, 1).required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { status } = value;

      const [result] = await db.execute(
        "UPDATE moments SET status = ? WHERE id = ?",
        [status, momentId]
      );

      if (result.affectedRows === 0) {
        throw new Error("朋友圈不存在");
      }

      ctx.body = {
        success: true,
        message: status === 1 ? "显示成功" : "隐藏成功",
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MomentController;
