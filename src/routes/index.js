const { Router } = require("express");
const healthRouter = require("./health");
const authRouter = require("./auth");
const channelsRouter = require("./channels");
const messagesRouter = require("./messages");

const router = Router();

router.get("/", (_req, res) => {
  res.json({ message: "API is running", routes: ["/api/healthz", "/api/auth/register", "/api/auth/login"] });
});

router.use(healthRouter);
router.use(authRouter);
router.use(channelsRouter);
router.use(messagesRouter);

module.exports = router;
