module.exports = (sequelize, DataTypes) => {
  const Client = sequelize.define("Client", {
    name: DataTypes.STRING,
    client_code: {
      type: DataTypes.STRING,
      unique: true,
    },
    hourly_rate: DataTypes.FLOAT,
  });

  return Client;
};