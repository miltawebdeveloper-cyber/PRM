module.exports = (requirements) => {
  return (req, res, next) => {
    const userRole = req.user.role;
    const userPermissions = req.user.permissions || {};

    // Legacy support for role array
    if (Array.isArray(requirements)) {
      if (!requirements.includes(userRole)) {
        return res.status(403).json({ message: "Access denied" });
      }
      return next();
    }

    // New support for specific permission string (e.g. 'tasks.view')
    if (typeof requirements === "string") {
      const [moduleName, action] = requirements.split(".");
      if (userRole === "Admin" || (userPermissions[moduleName] && userPermissions[moduleName][action])) {
        return next();
      }
      return res.status(403).json({ message: `Permission denied: ${requirements}` });
    }

    next();
  };
};