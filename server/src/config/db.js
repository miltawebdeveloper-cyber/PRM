const { Sequelize } = require("sequelize");

const dbPassword = process.env.DB_PASS ?? process.env.DB_PASSWORD;

if (typeof dbPassword !== "string" || dbPassword.length === 0) {
  throw new Error("Missing DB password: set DB_PASS or DB_PASSWORD in your .env file.");
}

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  dbPassword,
  {
    host: process.env.DB_HOST,
    dialect: "postgres"
  }
);

module.exports = sequelize;
