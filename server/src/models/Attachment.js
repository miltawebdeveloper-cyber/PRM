module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define("Attachment", {
    originalName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    storedName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    // Local disk path (swap to S3 key when migrating to S3)
    filePath: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Served URL (local: /uploads/filename — S3: bucket URL)
    fileUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Nullable FKs — file can belong to a task, project, or issue
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    issueId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  });

  return Attachment;
};
