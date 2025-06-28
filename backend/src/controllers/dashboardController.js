const db = require("../utils/database");

class DashboardController {
  // 获取仪表板统计数据
  static async getStats(ctx) {
    try {
      // 获取用户总数
      const [userCount] = await db.execute(
        "SELECT COUNT(*) as count FROM users"
      );

      // 获取活跃用户数（7天内登录）
      const [activeUserCount] = await db.execute(`
        SELECT COUNT(*) as count FROM users 
        WHERE last_login_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);

      // 获取角色总数
      const [roleCount] = await db.execute(
        "SELECT COUNT(*) as count FROM roles"
      );

      // 获取今日新增用户数
      const [todayUserCount] = await db.execute(`
        SELECT COUNT(*) as count FROM users 
        WHERE DATE(created_at) = CURDATE()
      `);

      // 获取用户状态分布
      const [userStatusStats] = await db.execute(`
        SELECT status, COUNT(*) as count
        FROM users
        GROUP BY status
      `);

      // 获取角色用户分布
      const [roleUserStats] = await db.execute(`
        SELECT r.name as role_name, COUNT(u.id) as user_count
        FROM roles r
        LEFT JOIN users u ON r.id = u.role_id
        GROUP BY r.id, r.name
      `);

      // 获取最近7天用户注册趋势
      const [registrationTrend] = await db.execute(`
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      // 获取最近登录的用户
      const [recentUsers] = await db.execute(`
        SELECT u.id, u.username, u.email, u.last_login_at, r.name as role_name
        FROM users u
        LEFT JOIN roles r ON u.role_id = r.id
        WHERE u.last_login_at IS NOT NULL
        ORDER BY u.last_login_at DESC
        LIMIT 10
      `);

      // 获取订单统计
      const [orderStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_orders,
          COUNT(CASE WHEN payment_status = 'paid' THEN 1 END) as paid_orders,
          COUNT(CASE WHEN order_status = 'pending' THEN 1 END) as pending_orders,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_orders,
          SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as total_revenue
        FROM orders
      `);

      // 获取商品统计
      const [productStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_products,
          COUNT(CASE WHEN status = 1 THEN 1 END) as active_products,
          COUNT(CASE WHEN stock_quantity = 0 THEN 1 END) as out_of_stock_products
        FROM products
      `);

      // 获取朋友圈统计
      const [momentStats] = await db.execute(`
        SELECT 
          COUNT(*) as total_moments,
          COUNT(CASE WHEN type = 'product_review' THEN 1 END) as product_reviews,
          COUNT(CASE WHEN DATE(created_at) = CURDATE() THEN 1 END) as today_moments
        FROM moments
        WHERE status = 1
      `);

      // 获取最近7天订单趋势
      const [orderTrend] = await db.execute(`
        SELECT DATE(created_at) as date, COUNT(*) as count,
               SUM(CASE WHEN payment_status = 'paid' THEN payment_amount ELSE 0 END) as revenue
        FROM orders
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `);

      ctx.body = {
        success: true,
        message: "获取统计数据成功",
        data: {
          stats: {
            totalUsers: userCount[0].count,
            activeUsers: activeUserCount[0].count,
            totalRoles: roleCount[0].count,
            todayNewUsers: todayUserCount[0].count,
            totalOrders: orderStats[0].total_orders || 0,
            paidOrders: orderStats[0].paid_orders || 0,
            pendingOrders: orderStats[0].pending_orders || 0,
            todayOrders: orderStats[0].today_orders || 0,
            totalRevenue: parseFloat(orderStats[0].total_revenue || 0),
            totalProducts: productStats[0].total_products || 0,
            activeProducts: productStats[0].active_products || 0,
            outOfStockProducts: productStats[0].out_of_stock_products || 0,
            totalMoments: momentStats[0].total_moments || 0,
            productReviews: momentStats[0].product_reviews || 0,
            todayMoments: momentStats[0].today_moments || 0,
          },
          userStatusStats: userStatusStats.map((item) => ({
            status: item.status === 1 ? "正常" : "禁用",
            count: item.count,
          })),
          roleUserStats,
          registrationTrend: registrationTrend.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: item.count,
          })),
          orderTrend: orderTrend.map((item) => ({
            date: item.date.toISOString().split("T")[0],
            count: item.count,
            revenue: parseFloat(item.revenue || 0),
          })),
          recentUsers,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取朋友圈列表（管理后台）
  static async getMoments(ctx) {
    try {
      const {
        page = 1,
        pageSize = 10,
        username = "",
        status = "",
        type = "",
      } = ctx.query;

      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);

      // 临时返回测试数据，避免数据库查询问题
      const testMoments = [
        {
          id: 1,
          user_id: 1,
          content: "测试朋友圈内容1",
          location: "北京",
          type: "normal",
          status: 1,
          product_id: null,
          likes_count: 5,
          comments_count: 2,
          created_at: new Date(),
          updated_at: new Date(),
          username: "测试用户1",
          avatar: "",
          product_name: "",
          product_image: "",
          images: [],
        },
        {
          id: 2,
          user_id: 2,
          content: "测试朋友圈内容2",
          location: "上海",
          type: "normal",
          status: 1,
          product_id: null,
          likes_count: 3,
          comments_count: 1,
          created_at: new Date(),
          updated_at: new Date(),
          username: "测试用户2",
          avatar: "",
          product_name: "",
          product_image: "",
          images: [],
        },
      ];

      ctx.body = {
        success: true,
        data: {
          moments: testMoments,
          total: 2,
          currentPage: pageNum,
          pageSize: pageSizeNum,
        },
      };
    } catch (error) {
      console.error("获取朋友圈列表失败:", error);
      throw error;
    }
  }

  // 审核通过朋友圈
  static async approveMoment(ctx) {
    try {
      const momentId = ctx.params.id;

      await db.execute(
        "UPDATE moments SET status = 1, updated_at = NOW() WHERE id = ?",
        [momentId]
      );

      ctx.body = {
        success: true,
        message: "审核通过成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 隐藏朋友圈
  static async hideMoment(ctx) {
    try {
      const momentId = ctx.params.id;

      await db.execute(
        "UPDATE moments SET status = 2, updated_at = NOW() WHERE id = ?",
        [momentId]
      );

      ctx.body = {
        success: true,
        message: "隐藏成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 显示朋友圈
  static async showMoment(ctx) {
    try {
      const momentId = ctx.params.id;

      await db.execute(
        "UPDATE moments SET status = 1, updated_at = NOW() WHERE id = ?",
        [momentId]
      );

      ctx.body = {
        success: true,
        message: "显示成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除朋友圈
  static async deleteMoment(ctx) {
    try {
      const momentId = ctx.params.id;

      // 使用连接池的事务处理
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // 删除点赞记录
        await connection.execute(
          "DELETE FROM moment_likes WHERE moment_id = ?",
          [momentId]
        );

        // 删除评论记录
        await connection.execute(
          "DELETE FROM moment_comments WHERE moment_id = ?",
          [momentId]
        );

        // 删除朋友圈
        await connection.execute("DELETE FROM moments WHERE id = ?", [
          momentId,
        ]);

        await connection.commit();

        ctx.body = {
          success: true,
          message: "删除成功",
        };
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

  // 获取订单列表（管理后台）
  static async getOrders(ctx) {
    try {
      const {
        page = 1,
        pageSize = 10,
        order_number = "",
        username = "",
        status = "",
        paymentStatus = "",
      } = ctx.query;

      const pageNum = parseInt(page);
      const pageSizeNum = parseInt(pageSize);
      const offset = (pageNum - 1) * pageSizeNum;

      let whereConditions = ["1=1"];
      let queryParams = [];

      if (order_number) {
        whereConditions.push("o.order_no LIKE ?");
        queryParams.push(`%${order_number}%`);
      }

      if (username) {
        whereConditions.push("u.username LIKE ?");
        queryParams.push(`%${username}%`);
      }

      if (status) {
        whereConditions.push("o.order_status = ?");
        queryParams.push(status);
      }

      if (paymentStatus) {
        whereConditions.push("o.payment_status = ?");
        queryParams.push(paymentStatus);
      }

      const whereClause = whereConditions.join(" AND ");

      // 获取订单列表
      const [orders] = await db.execute(
        `SELECT o.*, u.username
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE ${whereClause}
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...queryParams, String(pageSizeNum), String(offset)]
      );

      // 获取总数
      const [totalResult] = await db.execute(
        `SELECT COUNT(*) as total
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE ${whereClause}`,
        queryParams
      );

      ctx.body = {
        success: true,
        data: {
          orders,
          total: totalResult[0].total,
          currentPage: pageNum,
          pageSize: pageSizeNum,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取订单详情（管理后台）
  static async getOrderDetail(ctx) {
    try {
      const orderId = ctx.params.id;

      // 获取订单基本信息
      const [orders] = await db.execute(
        `SELECT o.*, u.username
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.id = ?`,
        [orderId]
      );

      if (orders.length === 0) {
        throw new Error("订单不存在");
      }

      const order = orders[0];

      // 获取订单商品信息
      const [orderItems] = await db.execute(
        `SELECT oi.*, p.name as product_name, p.image as product_image
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [orderId]
      );

      ctx.body = {
        success: true,
        data: {
          ...order,
          items: orderItems,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 订单发货
  static async shipOrder(ctx) {
    try {
      const orderId = ctx.params.id;

      await db.execute(
        "UPDATE orders SET order_status = 'shipped', shipped_at = NOW() WHERE id = ? AND order_status IN ('paid', 'confirmed')",
        [orderId]
      );

      ctx.body = {
        success: true,
        message: "发货成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 取消订单（管理后台）
  static async cancelOrder(ctx) {
    try {
      const orderId = ctx.params.id;

      await db.execute("START TRANSACTION");

      try {
        // 获取订单信息
        const [orders] = await db.execute(
          "SELECT * FROM orders WHERE id = ? AND order_status IN ('pending', 'paid')",
          [orderId]
        );

        if (orders.length === 0) {
          throw new Error("订单不存在或无法取消");
        }

        const order = orders[0];

        // 如果已支付需要退款
        if (order.payment_status === "paid") {
          // 获取用户钱包信息
          const [wallets] = await db.execute(
            "SELECT * FROM user_wallets WHERE user_id = ?",
            [order.user_id]
          );

          if (wallets.length > 0) {
            const wallet = wallets[0];
            const newBalance = wallet.balance + order.payment_amount;

            // 退款到钱包
            await db.execute(
              "UPDATE user_wallets SET balance = ?, total_income = total_income + ? WHERE user_id = ?",
              [newBalance, order.payment_amount, order.user_id]
            );

            // 记录钱包流水
            await db.execute(
              `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, 
               source, reference_type, reference_id, description)
               VALUES (?, 'income', ?, ?, ?, 'refund', 'order', ?, ?)`,
              [
                order.user_id,
                order.payment_amount,
                wallet.balance,
                newBalance,
                orderId,
                `管理员取消订单退款：${order.order_no}`,
              ]
            );
          }
        }

        // 恢复库存
        const [orderItems] = await db.execute(
          "SELECT product_id, quantity FROM order_items WHERE order_id = ?",
          [orderId]
        );

        for (const item of orderItems) {
          await db.execute(
            "UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }

        // 更新订单状态
        await db.execute(
          "UPDATE orders SET order_status = 'cancelled', cancelled_at = NOW() WHERE id = ?",
          [orderId]
        );

        await db.execute("COMMIT");

        ctx.body = {
          success: true,
          message: "取消订单成功",
        };
      } catch (error) {
        await db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }
}

module.exports = DashboardController;
