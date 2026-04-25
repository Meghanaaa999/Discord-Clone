const Group = require("../models/Group");
const Message = require("../models/Message");

async function getGroups(req, res) {
  try {
    const groups = await Group.find({ members: req.user.userId })
      .sort({ createdAt: 1 })
      .select("_id name members createdAt");
    return res.json({ groups });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load groups" });
  }
}

async function getDiscoverGroups(req, res) {
  try {
    const groups = await Group.find({})
      .sort({ createdAt: -1 })
      .select("_id name members createdAt");

    return res.json({
      groups: groups.map((group) => ({
        _id: group._id,
        name: group.name,
        createdAt: group.createdAt,
        memberCount: group.members.length,
        joined: group.members.some((member) => member.toString() === req.user.userId),
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load discover groups" });
  }
}

async function createGroup(req, res) {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Group name is required" });
    }

    const existing = await Group.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "Group already exists" });
    }

    const group = await Group.create({
      name: name.trim(),
      createdBy: req.user.userId,
      members: [req.user.userId],
    });

    return res.status(201).json({ group });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create group" });
  }
}

async function joinGroup(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!group.members.some((member) => member.toString() === req.user.userId)) {
      group.members.push(req.user.userId);
      await group.save();
    }

    return res.json({ group });
  } catch (error) {
    return res.status(500).json({ message: "Failed to join group" });
  }
}

async function getMessages(req, res) {
  try {
    const { groupId } = req.params;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const isMember = group.members.some((member) => member.toString() === req.user.userId);
    if (!isMember) {
      return res.status(403).json({ message: "Join this group first" });
    }

    const messages = await Message.find({ group: groupId })
      .sort({ createdAt: 1 })
      .populate("sender", "username");

    return res.json({
      messages: messages.map((message) => ({
        _id: message._id,
        text: message.text,
        group: message.group,
        createdAt: message.createdAt,
        sender: {
          _id: message.sender?._id,
          username: message.sender?.username || "Unknown",
        },
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to load messages" });
  }
}

module.exports = { getGroups, getDiscoverGroups, createGroup, joinGroup, getMessages };
