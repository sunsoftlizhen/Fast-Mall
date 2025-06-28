// 检查权限的中间件工厂函数
function checkPermission(requiredPermission) {
  return async (ctx, next) => {
    const user = ctx.state.user;

    if (!user) {
      throw new Error("未授权访问");
    }

    // 管理员拥有所有权限
    if (user.role_name === "管理员") {
      await next();
      return;
    }

    // 检查用户是否拥有所需权限
    if (!user.permissions.includes(requiredPermission)) {
      throw new Error("权限不足");
    }

    await next();
  };
}

module.exports = checkPermission;
