const { Announcement, User } = require("../models");

exports.getAnnouncements = async (req, res, next) => {
  try {
    const announcements = await Announcement.findAll({
      include: [{ model: User, as: "Author", attributes: ["id", "firstName", "lastName"] }],
      order: [["createdAt", "DESC"]]
    });
    res.json(announcements);
  } catch (error) {
    next(error);
  }
};

exports.createAnnouncement = async (req, res, next) => {
  try {
    const { title, content, type, targetAudience } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      type,
      targetAudience,
      authorId: req.user.id
    });
    res.status(201).json(announcement);
  } catch (error) {
    next(error);
  }
};
