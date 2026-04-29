const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Returns Express middleware that validates req.body against a schema.
 *
 * Schema shape per field:
 *   { required, type: 'string'|'number'|'boolean'|'email', minLength, maxLength, enum }
 */
function validate(schema) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = req.body?.[field];
      const missing = value === undefined || value === null || value === "";

      if (rules.required && missing) {
        errors.push(`${field} is required`);
        continue;
      }

      if (missing) continue;

      if (rules.type === "email" && !EMAIL_RE.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }

      if (rules.type === "number" && !Number.isFinite(Number(value))) {
        errors.push(`${field} must be a number`);
      }

      if ((rules.type === "string" || rules.type === "email") && typeof value !== "string") {
        errors.push(`${field} must be a string`);
      }

      if (rules.minLength && String(value).trim().length < rules.minLength) {
        errors.push(`${field} must be at least ${rules.minLength} characters`);
      }

      if (rules.maxLength && String(value).trim().length > rules.maxLength) {
        errors.push(`${field} must be at most ${rules.maxLength} characters`);
      }

      if (rules.enum && !rules.enum.includes(value)) {
        errors.push(`${field} must be one of: ${rules.enum.join(", ")}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ message: errors[0], errors });
    }

    next();
  };
}

module.exports = validate;
