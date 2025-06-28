module.exports = async (ctx, next) => {
  try {
    await next();
  } catch (error) {
    console.error("错误:", error);

    // 根据错误类型设置状态码
    let status = 500;
    let message = "服务器内部错误";

    if (error.message === "Token无效" || error.message === "未授权访问") {
      status = 401;
      message = error.message;
    } else if (error.message === "权限不足") {
      status = 403;
      message = error.message;
    } else if (error.message.includes("验证失败")) {
      status = 400;
      message = error.message;
    } else if (error.message.includes("不存在")) {
      status = 404;
      message = error.message;
    } else if (error.message.includes("已存在")) {
      status = 409;
      message = error.message;
    }

    ctx.status = status;
    ctx.body = {
      success: false,
      message: message,
      data: null,
    };
  }
};
