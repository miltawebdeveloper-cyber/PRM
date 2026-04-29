module.exports = (req, res, next) => {
  const { organizationId, role } = req.user;

  // Admins can see everything (or we can still scope them if needed)
  if (role === "Admin") {
    return next();
  }

  if (!organizationId) {
    return res.status(403).json({ message: "No organization assigned to user" });
  }

  // Attach a helper to req for controllers to use in their where clauses
  req.tenantWhere = { organizationId };
  
  next();
};
