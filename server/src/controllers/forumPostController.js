const { ForumPost, User } = require("../models");

exports.getForumPosts = async (req, res, next) => {
  try {
    const { projectId } = req.query;
    const where = {};
    if (projectId) where.projectId = projectId;
    const posts = await ForumPost.findAll({
      where,
      include: [{ model: User, as: "Author", attributes: ["id", "firstName", "lastName"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(posts);
  } catch (error) {
    next(error);
  }
};

exports.createForumPost = async (req, res, next) => {
  try {
    const { title, content, projectId } = req.body;
    const post = await ForumPost.create({
      title,
      content,
      projectId,
      authorId: req.user.id
    });
    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};
