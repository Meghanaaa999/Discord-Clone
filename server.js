require("dotenv").config();
const http = require("http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { Server } = require("socket.io");
const app = require("./src/app");
const connectDB = require("./src/config/db");
const Group = require("./src/models/Group");
const Message = require("./src/models/Message");
const User = require("./src/models/User");

const port = Number(process.env.PORT) || 3001;
const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
const allowedOrigins = [clientUrl, "http://localhost:5173", "http://127.0.0.1:5173"];
const defaultGroupNames = ["khyathisreeyarra", "khyathiteam1", "khyathiteam2", "khyathiteam3"];
const groupsToRemove = [
  "bfjdvbsajvhjsa",
  "team3392",
  "grp1632",
  "jkzfjg",
  "khyathigroup1",
  "khyathigroup2",
  "khyathigroup3",
];

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin) || /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by Socket CORS"));
      }
    },
    credentials: true,
  },
});

io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) {
      return next(new Error("Authentication failed"));
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = payload;
    next();
  } catch (error) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  socket.on("join-group", async (groupId) => {
    if (!groupId) return;

    const group = await Group.findById(groupId);
    if (!group) return;

    const isMember = group.members.some((member) => member.toString() === socket.user.userId);
    if (!isMember) return;

    socket.join(groupId);
  });

  socket.on("send-message", async ({ groupId, text }) => {
    if (!groupId || !text || !text.trim()) return;

    const group = await Group.findById(groupId);
    if (!group) return;

    const isMember = group.members.some((member) => member.toString() === socket.user.userId);
    if (!isMember) return;

    const message = await Message.create({
      group: groupId,
      sender: socket.user.userId,
      text: text.trim(),
    });

    const sender = await User.findById(socket.user.userId).select("username");

    io.to(groupId).emit("new-message", {
      _id: message._id,
      text: message.text,
      group: message.group,
      createdAt: message.createdAt,
      sender: {
        _id: sender?._id,
        username: sender?.username || socket.user.username,
      },
    });
  });
});

async function startServer() {
  await connectDB();
  await ensureEvaluationUser();
  await ensureDefaultGroups();
  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

async function ensureEvaluationUser() {
  const evaluationUsername = "khyathisree@gmail.com";
  const evaluationPassword = "pass1234";
  const passwordHash = await bcrypt.hash(evaluationPassword, 10);

  const user = await User.findOne({ username: evaluationUsername });
  if (!user) {
    await User.create({
      username: evaluationUsername,
      password: passwordHash,
    });
    return;
  }

  user.password = passwordHash;
  await user.save();
}

async function ensureDefaultGroups() {
  const systemUsername = "__system__";
  let systemUser = await User.findOne({ username: systemUsername });

  if (!systemUser) {
    const password = await bcrypt.hash("system-account-not-for-login", 10);
    systemUser = await User.create({
      username: systemUsername,
      password,
    });
  }

  await Group.deleteMany({ name: { $in: groupsToRemove } });

  for (const name of defaultGroupNames) {
    const existing = await Group.findOne({ name });
    if (existing) continue;

    await Group.create({
      name,
      createdBy: systemUser._id,
      members: [systemUser._id],
    });
  }
}

startServer().catch((error) => {
  console.error("Server failed to start:", error.message);
  process.exit(1);
});
