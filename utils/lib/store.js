const { MongoClient } = require("mongodb");

class Store {
  constructor() {
    const uri = process.env["MONGODB_URI"];
    if (!uri) {
      console.warn("MONGODB_URI not set, using in-memory store");
      this.enableInMemory();
      return;
    }

    this.inMemory = false;
    this.client = new MongoClient(uri);
    this.db = null;
    this.usersCollection = null;
    this.channelsCollection = null;
    this.messagesCollection = null;
    this.countersCollection = null;
    this.initialized = false;
    this.initPromise = null;
  }

  enableInMemory() {
    this.inMemory = true;
    this.usersMap = new Map();
    this.channelsMap = new Map();
    this.messagesMap = new Map();
    this.idCounter = { users: 1, channels: 1, messages: 1 };
    this.initialized = true;
  }

  async init() {
    if (this.initialized) {
      return;
    }
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = (async () => {
      try {
        await this.client.connect();
      } catch (error) {
        console.warn("Mongo connection failed, using in-memory store:", error.message);
        this.enableInMemory();
        await this.seedChannels();
        return;
      }

      const dbName = process.env["MONGODB_DB_NAME"] ?? "discord-clone";
      this.db = this.client.db(dbName);
      this.usersCollection = this.db.collection("users");
      this.channelsCollection = this.db.collection("channels");
      this.messagesCollection = this.db.collection("messages");
      this.countersCollection = this.db.collection("counters");

      await this.usersCollection.createIndex({ id: 1 }, { unique: true });
      await this.usersCollection.createIndex({ username: 1 }, { unique: true });
      await this.channelsCollection.createIndex({ id: 1 }, { unique: true });
      await this.channelsCollection.createIndex({ name: 1 }, { unique: true });
      await this.messagesCollection.createIndex({ id: 1 }, { unique: true });
      await this.messagesCollection.createIndex({ channelId: 1, createdAt: 1 });
      await this.countersCollection.createIndex({ key: 1 }, { unique: true });

      await this.seedChannels();
      this.initialized = true;
    })();

    try {
      await this.initPromise;
    } finally {
      this.initPromise = null;
    }
  }

  get users() {
    if (!this.usersCollection) {
      throw new Error("Store not initialized");
    }
    return this.usersCollection;
  }

  get channels() {
    if (!this.channelsCollection) {
      throw new Error("Store not initialized");
    }
    return this.channelsCollection;
  }

  get messages() {
    if (!this.messagesCollection) {
      throw new Error("Store not initialized");
    }
    return this.messagesCollection;
  }

  get counters() {
    if (!this.countersCollection) {
      throw new Error("Store not initialized");
    }
    return this.countersCollection;
  }

  async nextId(key) {
    if (this.inMemory) {
      const next = this.idCounter[key] ?? 1;
      this.idCounter[key] = next + 1;
      return next;
    }

    const result = await this.counters.findOneAndUpdate(
      { key },
      { $inc: { seq: 1 } },
      { upsert: true, returnDocument: "after" },
    );
    return result?.seq ?? 1;
  }

  async seedChannels() {
    if (this.inMemory) {
      if (this.channelsMap.size > 0) {
        return;
      }

      const names = ["general", "random", "announcements", "gaming", "tech-talk"];
      for (const name of names) {
        const id = await this.nextId("channels");
        this.channelsMap.set(id, { id, name, createdAt: new Date() });
      }
      return;
    }

    const existingChannels = await this.channels.countDocuments();
    if (existingChannels > 0) {
      return;
    }

    const names = ["general", "random", "announcements", "gaming", "tech-talk"];
    const now = new Date();
    const docs = [];

    for (const name of names) {
      docs.push({
        id: await this.nextId("channels"),
        name,
        createdAt: now,
      });
    }

    await this.channels.insertMany(docs);
  }

  async findUserById(id) {
    await this.init();
    if (this.inMemory) {
      return this.usersMap.get(id);
    }
    return (await this.users.findOne({ id })) ?? undefined;
  }

  async findUserByUsername(username) {
    await this.init();
    if (this.inMemory) {
      for (const user of this.usersMap.values()) {
        if (user.username === username) {
          return user;
        }
      }
      return undefined;
    }
    return (await this.users.findOne({ username })) ?? undefined;
  }

  async createUser(data) {
    await this.init();
    const user = {
      id: await this.nextId("users"),
      username: data.username,
      displayName: data.displayName,
      avatarUrl: data.avatarUrl ?? null,
      passwordSalt: data.passwordSalt ?? null,
      passwordHash: data.passwordHash ?? null,
      createdAt: new Date(),
    };
    if (this.inMemory) {
      this.usersMap.set(user.id, user);
      return user;
    }

    await this.users.insertOne(user);
    return user;
  }

  async updateUser(id, data) {
    await this.init();
    if (this.inMemory) {
      const user = this.usersMap.get(id);
      if (!user) return undefined;
      const updated = { ...user, displayName: data.displayName };
      this.usersMap.set(id, updated);
      return updated;
    }

    await this.users.updateOne(
      { id },
      { $set: { displayName: data.displayName } },
    );
    return this.findUserById(id);
  }

  async listChannels() {
    await this.init();
    if (this.inMemory) {
      return Array.from(this.channelsMap.values()).sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
      );
    }
    return this.channels.find({}).sort({ createdAt: 1 }).toArray();
  }

  async findChannelById(id) {
    await this.init();
    if (this.inMemory) {
      return this.channelsMap.get(id);
    }
    return (await this.channels.findOne({ id })) ?? undefined;
  }

  async createChannel(name) {
    await this.init();
    const channel = {
      id: await this.nextId("channels"),
      name,
      createdAt: new Date(),
    };
    if (this.inMemory) {
      this.channelsMap.set(channel.id, channel);
      return channel;
    }

    await this.channels.insertOne(channel);
    return channel;
  }

  async listMessages(channelId) {
    await this.init();

    if (this.inMemory) {
      const messages = Array.from(this.messagesMap.values())
        .filter((m) => m.channelId === channelId)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      return messages.map((m) => {
        const user = this.usersMap.get(m.userId);
        return {
          ...m,
          username: user?.username ?? "Unknown",
          displayName: user?.displayName ?? "Unknown",
          avatarUrl: user?.avatarUrl ?? null,
        };
      });
    }

    const messages = await this.messages
      .find({ channelId })
      .sort({ createdAt: 1 })
      .toArray();
    if (messages.length === 0) {
      return [];
    }

    const userIds = Array.from(new Set(messages.map((m) => m.userId)));
    const users = await this.users.find({ id: { $in: userIds } }).toArray();
    const userMap = new Map(users.map((u) => [u.id, u]));

    return messages.map((m) => {
      const user = userMap.get(m.userId);
      return {
        ...m,
        username: user?.username ?? "Unknown",
        displayName: user?.displayName ?? "Unknown",
        avatarUrl: user?.avatarUrl ?? null,
      };
    });
  }

  async createMessage(data) {
    await this.init();
    const msg = {
      id: await this.nextId("messages"),
      content: data.content,
      channelId: data.channelId,
      userId: data.userId,
      createdAt: new Date(),
    };
    if (this.inMemory) {
      this.messagesMap.set(msg.id, msg);
      return msg;
    }

    await this.messages.insertOne(msg);
    return msg;
  }
}

const store = new Store();

module.exports = { store };
