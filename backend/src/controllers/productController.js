const Joi = require("joi");
const db = require("../utils/database");

class ProductController {
  // 获取商品列表
  static async getProducts(ctx) {
    try {
      const { page = 1, pageSize = 10, keyword = "", status = "" } = ctx.query;

      // 确保参数为数字类型
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      let whereClause = "WHERE 1=1";
      let countWhereClause = "WHERE 1=1";
      const params = [];
      const countParams = [];

      if (keyword && keyword.trim()) {
        whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)";
        countWhereClause += " AND (name LIKE ? OR description LIKE ?)";
        params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
        countParams.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
      }

      if (status !== "" && status !== undefined) {
        whereClause += " AND p.status = ?";
        countWhereClause += " AND status = ?";
        params.push(parseInt(status));
        countParams.push(parseInt(status));
      }

      // 获取商品列表
      const [products] = await db.execute(
        `
      SELECT p.*, 
             ps.name as spec_name, ps.code as spec_code,
             pu.name as unit_name, pu.code as unit_code,
             u1.username as created_by_name,
             u2.username as updated_by_name
      FROM products p
      LEFT JOIN product_specs ps ON p.spec_id = ps.id
      LEFT JOIN product_units pu ON p.unit_id = pu.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `,
        [...params, pageSizeNum + "", offset + ""]
      );

      // 获取总数
      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM products ${countWhereClause}`,
        countParams
      );

      const total = countResult[0].total;

      ctx.body = {
        success: true,
        message: "获取商品列表成功",
        data: {
          products,
          pagination: {
            page: pageNum,
            pageSize: pageSizeNum,
            total,
            totalPages: Math.ceil(total / pageSizeNum),
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 创建商品
  static async createProduct(ctx) {
    try {
      const schema = Joi.object({
        name: Joi.string().min(1).max(200).required().messages({
          "string.min": "商品名称不能为空",
          "string.max": "商品名称最多200个字符",
          "any.required": "商品名称不能为空",
        }),
        image: Joi.string().optional(),
        spec_id: Joi.number().integer().required().messages({
          "any.required": "请选择商品规格",
        }),
        unit_id: Joi.number().integer().required().messages({
          "any.required": "请选择商品单位",
        }),
        description: Joi.string().optional(),
        purchase_price: Joi.number().min(0).required().messages({
          "number.min": "进货价不能为负数",
          "any.required": "进货价不能为空",
        }),
        discount_price: Joi.number().min(0).optional(),
        sale_price: Joi.number().min(0).required().messages({
          "number.min": "售价不能为负数",
          "any.required": "售价不能为空",
        }),
        shelf_life: Joi.number().integer().min(0).optional(),
        stock_quantity: Joi.number().integer().min(0).default(0),
        status: Joi.number().integer().valid(0, 1).default(1),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const {
        name,
        image,
        spec_id,
        unit_id,
        description,
        purchase_price,
        discount_price,
        sale_price,
        shelf_life,
        stock_quantity,
        status,
      } = value;

      // 检查规格是否存在
      const [specs] = await db.execute(
        "SELECT id FROM product_specs WHERE id = ?",
        [spec_id]
      );
      if (specs.length === 0) {
        throw new Error("选择的规格不存在");
      }

      // 检查单位是否存在
      const [units] = await db.execute(
        "SELECT id FROM product_units WHERE id = ?",
        [unit_id]
      );
      if (units.length === 0) {
        throw new Error("选择的单位不存在");
      }

      // 创建商品
      const [result] = await db.execute(
        `INSERT INTO products (
        name, image, spec_id, unit_id, description, 
        purchase_price, discount_price, sale_price, shelf_life, 
        stock_quantity, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          name,
          image || null,
          spec_id,
          unit_id,
          description || null,
          purchase_price,
          discount_price || null,
          sale_price,
          shelf_life || null,
          stock_quantity,
          status,
          ctx.state.user.id,
        ]
      );

      ctx.body = {
        success: true,
        message: "创建商品成功",
        data: {
          productId: result.insertId,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // 更新商品
  static async updateProduct(ctx) {
    const productId = ctx.params.id;

    const schema = Joi.object({
      name: Joi.string().min(1).max(200).optional(),
      image: Joi.string().optional(),
      spec_id: Joi.number().integer().optional(),
      unit_id: Joi.number().integer().optional(),
      description: Joi.string().optional(),
      purchase_price: Joi.number().min(0).optional(),
      discount_price: Joi.number().min(0).optional(),
      sale_price: Joi.number().min(0).optional(),
      shelf_life: Joi.number().integer().min(0).optional(),
      stock_quantity: Joi.number().integer().min(0).optional(),
      status: Joi.number().integer().valid(0, 1).optional(),
    });

    const { error, value } = schema.validate(ctx.request.body);
    if (error) {
      throw new Error(`验证失败: ${error.details[0].message}`);
    }

    // 检查商品是否存在
    const [products] = await db.execute(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );
    if (products.length === 0) {
      throw new Error("商品不存在");
    }

    const updateFields = [];
    const updateValues = [];

    // 构建更新语句
    for (const [key, val] of Object.entries(value)) {
      if (val !== undefined) {
        if (key === "spec_id") {
          // 检查规格是否存在
          const [specs] = await db.execute(
            "SELECT id FROM product_specs WHERE id = ?",
            [val]
          );
          if (specs.length === 0) {
            throw new Error("选择的规格不存在");
          }
        }

        if (key === "unit_id") {
          // 检查单位是否存在
          const [units] = await db.execute(
            "SELECT id FROM product_units WHERE id = ?",
            [val]
          );
          if (units.length === 0) {
            throw new Error("选择的单位不存在");
          }
        }

        updateFields.push(`${key} = ?`);
        updateValues.push(val);
      }
    }

    if (updateFields.length === 0) {
      throw new Error("没有需要更新的字段");
    }

    // 添加更新人和更新时间
    updateFields.push("updated_by = ?");
    updateValues.push(ctx.state.user.id);

    // 执行更新
    await db.execute(
      `UPDATE products SET ${updateFields.join(", ")} WHERE id = ?`,
      [...updateValues, productId]
    );

    ctx.body = {
      success: true,
      message: "更新商品成功",
    };
  }

  // 删除商品
  static async deleteProduct(ctx) {
    const productId = ctx.params.id;

    // 检查商品是否存在
    const [products] = await db.execute(
      "SELECT id FROM products WHERE id = ?",
      [productId]
    );
    if (products.length === 0) {
      throw new Error("商品不存在");
    }

    // 删除商品
    await db.execute("DELETE FROM products WHERE id = ?", [productId]);

    ctx.body = {
      success: true,
      message: "删除商品成功",
    };
  }

  // 获取商品详情
  static async getProductById(ctx) {
    const productId = ctx.params.id;

    const [products] = await db.execute(
      `
      SELECT p.*, 
             ps.name as spec_name, ps.code as spec_code,
             pu.name as unit_name, pu.code as unit_code,
             u1.username as created_by_name,
             u2.username as updated_by_name
      FROM products p
      LEFT JOIN product_specs ps ON p.spec_id = ps.id
      LEFT JOIN product_units pu ON p.unit_id = pu.id
      LEFT JOIN users u1 ON p.created_by = u1.id
      LEFT JOIN users u2 ON p.updated_by = u2.id
      WHERE p.id = ?
    `,
      [productId]
    );

    if (products.length === 0) {
      throw new Error("商品不存在");
    }

    ctx.body = {
      success: true,
      message: "获取商品详情成功",
      data: products[0],
    };
  }

  // 获取商品规格列表
  static async getProductSpecs(ctx) {
    const [specs] = await db.execute(`
      SELECT id, code, name, description
      FROM product_specs
      ORDER BY id ASC
    `);

    ctx.body = {
      success: true,
      message: "获取商品规格列表成功",
      data: specs,
    };
  }

  // 获取商品单位列表
  static async getProductUnits(ctx) {
    const [units] = await db.execute(`
      SELECT id, code, name, description
      FROM product_units
      ORDER BY id ASC
    `);

    ctx.body = {
      success: true,
      message: "获取商品单位列表成功",
      data: units,
    };
  }
}

module.exports = ProductController;
