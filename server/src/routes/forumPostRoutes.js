const express = require("express");
const router = express.Router();
const forumPostController = require("../controllers/forumPostController");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);
router.route("/").get(forumPostController.getForumPosts).post(forumPostController.createForumPost);

module.exports = router;
