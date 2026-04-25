const { Router } = require("express");
const {
  register,
  login,
  getProfile,
} = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/auth");

const router = Router();

router.post("/auth/signup", register);
router.post("/auth/register", register);
router.post("/auth/login", login);
router.get("/auth/profile", authenticateToken, getProfile);

module.exports = router;
