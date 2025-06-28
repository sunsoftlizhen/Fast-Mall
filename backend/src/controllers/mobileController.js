const Joi = require("joi");
const db = require("../utils/database");

class MobileController {
  // 获取已上架商品列表（移动端）
  static async getProducts(ctx) {
    try {
      const { page = 1, pageSize = 10, keyword = "" } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;

      let whereClause = "WHERE p.status = 1"; // 只显示上架商品
      const params = [];

      if (keyword && keyword.trim()) {
        whereClause += " AND (p.name LIKE ? OR p.description LIKE ?)";
        params.push(`%${keyword.trim()}%`, `%${keyword.trim()}%`);
      }

      const [products] = await db.execute(
        `SELECT p.id, p.name, p.image, p.description, p.sale_price, p.discount_price,
                p.stock_quantity, ps.name as spec_name, pu.name as unit_name
         FROM products p
         LEFT JOIN product_specs ps ON p.spec_id = ps.id
         LEFT JOIN product_units pu ON p.unit_id = pu.id
         ${whereClause}
         ORDER BY p.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, String(pageSizeNum), String(offset)]
      );

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM products p ${whereClause}`,
        params
      );

      ctx.body = {
        success: true,
        data: {
          products,
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

  // 获取商品详情
  static async getProductDetail(ctx) {
    try {
      const productId = ctx.params.id;

      const [products] = await db.execute(
        `SELECT p.*, ps.name as spec_name, pu.name as unit_name
         FROM products p
         LEFT JOIN product_specs ps ON p.spec_id = ps.id
         LEFT JOIN product_units pu ON p.unit_id = pu.id
         WHERE p.id = ? AND p.status = 1`,
        [productId]
      );

      if (products.length === 0) {
        throw new Error("商品不存在或已下架");
      }

      ctx.body = {
        success: true,
        data: products[0],
      };
    } catch (error) {
      throw error;
    }
  }

  // 添加到购物车
  static async addToCart(ctx) {
    try {
      const schema = Joi.object({
        product_id: Joi.number().integer().required(),
        quantity: Joi.number().integer().min(1).default(1),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { product_id, quantity } = value;
      const userId = ctx.state.user.id;

      // 检查商品是否存在且上架
      const [products] = await db.execute(
        "SELECT id, stock_quantity FROM products WHERE id = ? AND status = 1",
        [product_id]
      );

      if (products.length === 0) {
        throw new Error("商品不存在或已下架");
      }

      if (products[0].stock_quantity < quantity) {
        throw new Error("商品库存不足");
      }

      // 检查购物车中是否已有该商品
      const [existingItems] = await db.execute(
        "SELECT id, quantity FROM shopping_cart WHERE user_id = ? AND product_id = ?",
        [userId, product_id]
      );

      if (existingItems.length > 0) {
        // 更新数量
        const newQuantity = existingItems[0].quantity + quantity;
        await db.execute(
          "UPDATE shopping_cart SET quantity = ?, updated_at = NOW() WHERE id = ?",
          [newQuantity, existingItems[0].id]
        );
      } else {
        // 新增购物车项
        await db.execute(
          "INSERT INTO shopping_cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
          [userId, product_id, quantity]
        );
      }

      ctx.body = {
        success: true,
        message: "添加到购物车成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取购物车列表
  static async getCartList(ctx) {
    try {
      const userId = ctx.state.user.id;

      const [cartItems] = await db.execute(
        `SELECT sc.id, sc.quantity, p.id as product_id, p.name, p.image, 
                p.sale_price, p.discount_price, p.stock_quantity,
                ps.name as spec_name, pu.name as unit_name
         FROM shopping_cart sc
         JOIN products p ON sc.product_id = p.id
         LEFT JOIN product_specs ps ON p.spec_id = ps.id
         LEFT JOIN product_units pu ON p.unit_id = pu.id
         WHERE sc.user_id = ? AND p.status = 1
         ORDER BY sc.created_at DESC`,
        [userId]
      );

      ctx.body = {
        success: true,
        data: cartItems,
      };
    } catch (error) {
      throw error;
    }
  }

  // 更新购物车商品数量
  static async updateCartItem(ctx) {
    try {
      const cartItemId = ctx.params.id;
      const schema = Joi.object({
        quantity: Joi.number().integer().min(1).required(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { quantity } = value;
      const userId = ctx.state.user.id;

      await db.execute(
        "UPDATE shopping_cart SET quantity = ?, updated_at = NOW() WHERE id = ? AND user_id = ?",
        [quantity, cartItemId, userId]
      );

      ctx.body = {
        success: true,
        message: "更新成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 删除购物车商品
  static async removeCartItem(ctx) {
    try {
      const cartItemId = ctx.params.id;
      const userId = ctx.state.user.id;

      await db.execute(
        "DELETE FROM shopping_cart WHERE id = ? AND user_id = ?",
        [cartItemId, userId]
      );

      ctx.body = {
        success: true,
        message: "删除成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 创建订单
  static async createOrder(ctx) {
    console.log("=== createOrder 方法被调用 ===");
    console.log("HTTP Method:", ctx.method);
    console.log("Request URL:", ctx.url);
    console.log("Query params:", ctx.query);
    console.log("Request body:", ctx.request.body);

    try {
      const schema = Joi.object({
        cart_items: Joi.array().items(Joi.number().integer()).required(),
        delivery_address: Joi.string().required(),
        delivery_phone: Joi.string().required(),
        delivery_name: Joi.string().required(),
        remark: Joi.string().optional(),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const {
        cart_items,
        delivery_address,
        delivery_phone,
        delivery_name,
        remark,
      } = value;
      const userId = ctx.state.user.id;

      // 使用连接池的事务处理
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();
        // 获取购物车商品信息
        const [cartProducts] = await connection.execute(
          `SELECT sc.id as cart_id, sc.quantity, p.id as product_id, p.name, p.image,
                  p.sale_price, p.discount_price, p.stock_quantity,
                  ps.name as spec_name, pu.name as unit_name
           FROM shopping_cart sc
           JOIN products p ON sc.product_id = p.id
           LEFT JOIN product_specs ps ON p.spec_id = ps.id
           LEFT JOIN product_units pu ON p.unit_id = pu.id
           WHERE sc.id IN (${cart_items
             .map(() => "?")
             .join(",")}) AND sc.user_id = ?`,
          [...cart_items, userId]
        );

        if (cartProducts.length === 0) {
          throw new Error("购物车商品不存在");
        }

        // 计算总金额
        let totalAmount = 0;
        for (const item of cartProducts) {
          if (item.stock_quantity < item.quantity) {
            throw new Error(`商品 ${item.name} 库存不足`);
          }
          const price = item.discount_price || item.sale_price;
          totalAmount += price * item.quantity;
        }

        // 生成订单号
        const orderNo =
          "ORD" +
          Date.now() +
          Math.random().toString(36).substr(2, 4).toUpperCase();

        // 创建订单
        const [orderResult] = await connection.execute(
          `INSERT INTO orders (order_no, user_id, total_amount, payment_amount, 
           delivery_address, delivery_phone, delivery_name, remark)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderNo,
            userId,
            totalAmount,
            totalAmount,
            delivery_address,
            delivery_phone,
            delivery_name,
            remark,
          ]
        );

        const orderId = orderResult.insertId;

        // 创建订单商品
        for (const item of cartProducts) {
          const price = item.discount_price || item.sale_price;
          const itemTotal = price * item.quantity;

          await connection.execute(
            `INSERT INTO order_items (order_id, product_id, product_name, product_image,
             spec_name, unit_name, price, quantity, total_amount)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              orderId,
              item.product_id,
              item.name,
              item.image,
              item.spec_name,
              item.unit_name,
              price,
              item.quantity,
              itemTotal,
            ]
          );

          // 减少库存
          await connection.execute(
            "UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?",
            [item.quantity, item.product_id]
          );
        }

        // 清空购物车
        await connection.execute(
          `DELETE FROM shopping_cart WHERE id IN (${cart_items
            .map(() => "?")
            .join(",")})`,
          cart_items
        );

        await connection.commit();

        ctx.body = {
          success: true,
          message: "订单创建成功",
          data: {
            order_id: orderId,
            order_no: orderNo,
            total_amount: totalAmount,
          },
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

  // 获取用户订单列表
  static async getOrderList(ctx) {
    console.log("=== getOrderList 方法被调用 ===");
    console.log("HTTP Method:", ctx.method);
    console.log("Request URL:", ctx.url);
    console.log("Query params:", ctx.query);
    console.log("Request body:", ctx.request.body);

    try {
      const { page = 1, pageSize = 10, status = "" } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;
      const userId = ctx.state.user.id;

      let whereClause = "WHERE o.user_id = ?";
      const params = [userId];

      if (status && status !== "") {
        whereClause += " AND o.order_status = ?";
        params.push(status);
      }

      const [orders] = await db.execute(
        `SELECT o.*, COUNT(oi.id) as items_count
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         ${whereClause}
         GROUP BY o.id
         ORDER BY o.created_at DESC
         LIMIT ? OFFSET ?`,
        [...params, String(pageSizeNum), String(offset)]
      );

      // 获取订单商品
      for (const order of orders) {
        const [items] = await db.execute(
          "SELECT * FROM order_items WHERE order_id = ?",
          [order.id]
        );
        order.items = items;
      }

      const [countResult] = await db.execute(
        `SELECT COUNT(*) as total FROM orders o ${whereClause}`,
        params
      );

      ctx.body = {
        success: true,
        data: {
          orders,
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

  // 获取订单详情
  static async getOrderDetail(ctx) {
    try {
      const orderId = ctx.params.id;
      const userId = ctx.state.user.id;

      const [orders] = await db.execute(
        "SELECT * FROM orders WHERE id = ? AND user_id = ?",
        [orderId, userId]
      );

      if (orders.length === 0) {
        throw new Error("订单不存在");
      }

      const [items] = await db.execute(
        "SELECT * FROM order_items WHERE order_id = ?",
        [orderId]
      );

      const order = orders[0];
      order.items = items;

      ctx.body = {
        success: true,
        data: order,
      };
    } catch (error) {
      throw error;
    }
  }

  // 支付订单
  static async payOrder(ctx) {
    try {
      const orderId = ctx.params.id;
      const userId = ctx.state.user.id;
      const { payment_method = "balance" } = ctx.request.body;

      // 使用连接池的事务处理
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // 获取订单信息
        const [orders] = await connection.execute(
          "SELECT * FROM orders WHERE id = ? AND user_id = ? AND payment_status = 'pending'",
          [orderId, userId]
        );

        if (orders.length === 0) {
          throw new Error("订单不存在或已支付");
        }

        const order = orders[0];

        if (payment_method === "balance") {
          // 获取用户钱包信息
          const [wallets] = await connection.execute(
            "SELECT * FROM user_wallets WHERE user_id = ?",
            [userId]
          );

          if (wallets.length === 0) {
            throw new Error("用户钱包不存在");
          }

          const wallet = wallets[0];

          if (wallet.balance < order.payment_amount) {
            throw new Error("钱包余额不足");
          }

          // 扣除钱包余额
          const newBalance = wallet.balance - order.payment_amount;
          await connection.execute(
            "UPDATE user_wallets SET balance = ?, total_expense = total_expense + ? WHERE user_id = ?",
            [newBalance, order.payment_amount, userId]
          );

          // 记录钱包流水
          await connection.execute(
            `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, 
             source, reference_type, reference_id, description)
             VALUES (?, 'expense', ?, ?, ?, 'payment', 'order', ?, ?)`,
            [
              userId,
              order.payment_amount,
              wallet.balance,
              newBalance,
              orderId,
              `订单支付：${order.order_no}`,
            ]
          );
        }

        // 更新订单状态
        await connection.execute(
          "UPDATE orders SET payment_status = 'paid', order_status = 'paid', payment_method = ?, paid_at = NOW() WHERE id = ?",
          [payment_method, orderId]
        );

        await connection.commit();

        ctx.body = {
          success: true,
          message: "支付成功",
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

  // 取消订单
  static async cancelOrder(ctx) {
    try {
      const orderId = ctx.params.id;
      const userId = ctx.state.user.id;

      // 使用连接池的事务处理
      const connection = await db.getConnection();

      try {
        await connection.beginTransaction();

        // 获取订单信息
        const [orders] = await connection.execute(
          "SELECT * FROM orders WHERE id = ? AND user_id = ? AND order_status IN ('pending', 'paid')",
          [orderId, userId]
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
            [userId]
          );

          if (wallets.length > 0) {
            const wallet = wallets[0];
            const newBalance = wallet.balance + order.payment_amount;

            // 退款到钱包
            await db.execute(
              "UPDATE user_wallets SET balance = ?, total_income = total_income + ? WHERE user_id = ?",
              [newBalance, order.payment_amount, userId]
            );

            // 记录钱包流水
            await db.execute(
              `INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, 
               source, reference_type, reference_id, description)
               VALUES (?, 'income', ?, ?, ?, 'refund', 'order', ?, ?)`,
              [
                userId,
                order.payment_amount,
                wallet.balance,
                newBalance,
                orderId,
                `订单退款：${order.order_no}`,
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
          message: "订单已取消",
        };
      } catch (error) {
        await db.execute("ROLLBACK");
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  // 确认收货
  static async confirmReceive(ctx) {
    try {
      const orderId = ctx.params.id;
      const userId = ctx.state.user.id;

      // 获取订单信息
      const [orders] = await db.execute(
        "SELECT * FROM orders WHERE id = ? AND user_id = ? AND order_status = 'shipped'",
        [orderId, userId]
      );

      if (orders.length === 0) {
        throw new Error("订单不存在或状态不正确");
      }

      // 更新订单状态
      await db.execute(
        "UPDATE orders SET order_status = 'delivered', delivered_at = NOW() WHERE id = ?",
        [orderId]
      );

      ctx.body = {
        success: true,
        message: "确认收货成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户钱包信息
  static async getWallet(ctx) {
    try {
      const userId = ctx.state.user.id;

      const [wallets] = await db.execute(
        "SELECT * FROM user_wallets WHERE user_id = ?",
        [userId]
      );

      if (wallets.length === 0) {
        // 创建钱包
        await db.execute(
          "INSERT INTO user_wallets (user_id, balance) VALUES (?, 0.00)",
          [userId]
        );
        ctx.body = {
          success: true,
          data: {
            user_id: userId,
            balance: 0.0,
            total_income: 0.0,
            total_expense: 0.0,
          },
        };
      } else {
        ctx.body = {
          success: true,
          data: wallets[0],
        };
      }
    } catch (error) {
      throw error;
    }
  }

  // 获取钱包流水
  static async getWalletTransactions(ctx) {
    try {
      const { page = 1, pageSize = 10 } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const pageSizeNum = parseInt(pageSize) || 10;
      const offset = (pageNum - 1) * pageSizeNum;
      const userId = ctx.state.user.id;

      const [transactions] = await db.execute(
        `SELECT * FROM wallet_transactions 
         WHERE user_id = ? 
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, String(pageSizeNum), String(offset)]
      );

      const [countResult] = await db.execute(
        "SELECT COUNT(*) as total FROM wallet_transactions WHERE user_id = ?",
        [userId]
      );

      ctx.body = {
        success: true,
        data: {
          transactions,
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

  // ==================== 地址管理 ====================

  // 获取用户地址列表
  static async getAddresses(ctx) {
    try {
      const userId = ctx.state.user.id;

      const [addresses] = await db.execute(
        `SELECT * FROM user_addresses 
         WHERE user_id = ? 
         ORDER BY is_default DESC, created_at DESC`,
        [userId]
      );

      ctx.body = {
        success: true,
        data: addresses,
      };
    } catch (error) {
      throw error;
    }
  }

  // 添加地址
  static async addAddress(ctx) {
    try {
      const schema = Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        province: Joi.string().required(),
        city: Joi.string().required(),
        district: Joi.string().required(),
        address: Joi.string().required(),
        is_default: Joi.boolean().default(false),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { name, phone, province, city, district, address, is_default } =
        value;
      const userId = ctx.state.user.id;

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // 如果设置为默认地址，先取消其他默认地址
        if (is_default) {
          await connection.execute(
            "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
            [userId]
          );
        }

        // 添加新地址
        const [result] = await connection.execute(
          `INSERT INTO user_addresses (user_id, name, phone, province, city, district, address, is_default)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            name,
            phone,
            province,
            city,
            district,
            address,
            is_default ? 1 : 0,
          ]
        );

        await connection.commit();

        ctx.body = {
          success: true,
          message: "地址添加成功",
          data: {
            id: result.insertId,
          },
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

  // 更新地址
  static async updateAddress(ctx) {
    try {
      const addressId = ctx.params.id;
      const userId = ctx.state.user.id;

      const schema = Joi.object({
        name: Joi.string().required(),
        phone: Joi.string().required(),
        province: Joi.string().required(),
        city: Joi.string().required(),
        district: Joi.string().required(),
        address: Joi.string().required(),
        is_default: Joi.boolean().default(false),
      });

      const { error, value } = schema.validate(ctx.request.body);
      if (error) {
        throw new Error(`验证失败: ${error.details[0].message}`);
      }

      const { name, phone, province, city, district, address, is_default } =
        value;

      // 检查地址是否属于当前用户
      const [existingAddress] = await db.execute(
        "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
        [addressId, userId]
      );

      if (existingAddress.length === 0) {
        throw new Error("地址不存在或无权限");
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // 如果设置为默认地址，先取消其他默认地址
        if (is_default) {
          await connection.execute(
            "UPDATE user_addresses SET is_default = 0 WHERE user_id = ? AND id != ?",
            [userId, addressId]
          );
        }

        // 更新地址
        await connection.execute(
          `UPDATE user_addresses 
           SET name = ?, phone = ?, province = ?, city = ?, district = ?, address = ?, is_default = ?
           WHERE id = ? AND user_id = ?`,
          [
            name,
            phone,
            province,
            city,
            district,
            address,
            is_default ? 1 : 0,
            addressId,
            userId,
          ]
        );

        await connection.commit();

        ctx.body = {
          success: true,
          message: "地址更新成功",
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

  // 删除地址
  static async deleteAddress(ctx) {
    try {
      const addressId = ctx.params.id;
      const userId = ctx.state.user.id;

      // 检查地址是否属于当前用户
      const [existingAddress] = await db.execute(
        "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
        [addressId, userId]
      );

      if (existingAddress.length === 0) {
        throw new Error("地址不存在或无权限");
      }

      await db.execute(
        "DELETE FROM user_addresses WHERE id = ? AND user_id = ?",
        [addressId, userId]
      );

      ctx.body = {
        success: true,
        message: "地址删除成功",
      };
    } catch (error) {
      throw error;
    }
  }

  // 设置默认地址
  static async setDefaultAddress(ctx) {
    try {
      const addressId = ctx.params.id;
      const userId = ctx.state.user.id;

      // 检查地址是否属于当前用户
      const [existingAddress] = await db.execute(
        "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
        [addressId, userId]
      );

      if (existingAddress.length === 0) {
        throw new Error("地址不存在或无权限");
      }

      const connection = await db.getConnection();
      try {
        await connection.beginTransaction();

        // 取消其他默认地址
        await connection.execute(
          "UPDATE user_addresses SET is_default = 0 WHERE user_id = ?",
          [userId]
        );

        // 设置当前地址为默认
        await connection.execute(
          "UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?",
          [addressId, userId]
        );

        await connection.commit();

        ctx.body = {
          success: true,
          message: "默认地址设置成功",
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

  // 获取单个地址详情
  static async getAddressDetail(ctx) {
    try {
      const addressId = ctx.params.id;
      const userId = ctx.state.user.id;

      const [address] = await db.execute(
        "SELECT * FROM user_addresses WHERE id = ? AND user_id = ?",
        [addressId, userId]
      );

      if (address.length === 0) {
        throw new Error("地址不存在或无权限");
      }

      ctx.body = {
        success: true,
        data: address[0],
      };
    } catch (error) {
      throw error;
    }
  }

  // 获取用户自己的动态列表
  static async getMyMoments(ctx) {
    try {
      const { page = 1, limit = 10 } = ctx.query;
      const pageNum = parseInt(page) || 1;
      const limitNum = parseInt(limit) || 10;
      const offset = (pageNum - 1) * limitNum;
      const userId = ctx.state.user.id;

      // 获取用户动态列表
      const [moments] = await db.execute(
        `SELECT m.id, m.content, m.images, m.type, m.product_id, m.location, 
                m.created_at, m.updated_at, u.username, u.avatar,
                m.user_id,
                (SELECT COUNT(*) FROM moment_likes ml WHERE ml.moment_id = m.id) as likes_count,
                (SELECT COUNT(*) FROM moment_comments mc WHERE mc.moment_id = m.id) as comments_count
         FROM moments m
         JOIN users u ON m.user_id = u.id
         WHERE m.user_id = ?
         ORDER BY m.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, String(limitNum), String(offset)]
      );

      // 处理图片字段
      const processedMoments = moments.map((moment) => {
        let images = [];
        if (moment.images) {
          try {
            // 如果是JSON字符串，解析它
            images = JSON.parse(moment.images);
          } catch (error) {
            // 如果不是JSON格式，可能是单个图片URL字符串，转换为数组
            images = [moment.images];
          }
        }
        return {
          ...moment,
          images: images,
        };
      });

      // 获取总数
      const [countResult] = await db.execute(
        "SELECT COUNT(*) as total FROM moments WHERE user_id = ?",
        [userId]
      );

      ctx.body = {
        success: true,
        data: {
          items: processedMoments,
          total: countResult[0].total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(countResult[0].total / limitNum),
        },
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MobileController;
