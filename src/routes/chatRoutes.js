const express = require("express");
const { protect } = require("../middlewares/authMiddleware");
const {
  getGroups,
  getDiscoverGroups,
  createGroup,
  joinGroup,
  getMessages,
} = require("../controllers/chatController");

const router = express.Router();

router.use(protect);
router.get("/groups", getGroups);
router.get("/groups/discover", getDiscoverGroups);
router.post("/groups", createGroup);
router.post("/groups/:groupId/join", joinGroup);
router.get("/groups/:groupId/messages", getMessages);

module.exports = router;
