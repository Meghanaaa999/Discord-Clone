import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  createGroup,
  getDiscoverGroups,
  getGroups,
  getMessages,
  joinGroup,
} from "../services/api";
import { createSocket } from "../services/socket";

export default function ChatPage() {
  const navigate = useNavigate();
  const { user, token, logout } = useAuth();
  const [myGroups, setMyGroups] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState("");
  const [messages, setMessages] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const socket = useMemo(() => createSocket(token), [token]);

  useEffect(() => {
    let mounted = true;

    async function loadGroupData() {
      setLoadingGroups(true);
      setError("");
      try {
        const [mineResponse, discoverResponse] = await Promise.all([
          getGroups(token),
          getDiscoverGroups(token),
        ]);
        if (!mounted) return;

        const mine = mineResponse.groups || [];
        setMyGroups(mine);
        setDiscoverGroups(discoverResponse.groups || []);

        if (mine.length) {
          setActiveGroupId(mine[0]._id);
        } else {
          setActiveGroupId("");
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      } finally {
        if (mounted) setLoadingGroups(false);
      }
    }

    loadGroupData();
    return () => {
      mounted = false;
    };
  }, [token]);

  useEffect(() => {
    if (!activeGroupId) {
      setMessages([]);
      return;
    }

    let mounted = true;

    async function loadMessages() {
      setLoadingMessages(true);
      try {
        const response = await getMessages(token, activeGroupId);
        if (mounted) {
          setMessages(response.messages || []);
        }
      } catch (loadError) {
        if (mounted) setError(loadError.message);
      } finally {
        if (mounted) setLoadingMessages(false);
      }
    }

    loadMessages();
    return () => {
      mounted = false;
    };
  }, [activeGroupId, token]);

  useEffect(() => {
    socket.connect();

    socket.on("new-message", (incoming) => {
      if (String(incoming.group) === String(activeGroupId)) {
        setMessages((prev) => [...prev, incoming]);
      }
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
    };
  }, [socket, activeGroupId]);

  useEffect(() => {
    if (activeGroupId) {
      socket.emit("join-group", activeGroupId);
    }
  }, [socket, activeGroupId]);

  async function handleCreateGroup(event) {
    event.preventDefault();
    if (!newGroupName.trim()) return;

    setError("");
    try {
      const response = await createGroup(token, { name: newGroupName.trim() });
      setMyGroups((prev) => {
        if (prev.some((group) => group._id === response.group._id)) return prev;
        return [...prev, response.group];
      });
      setDiscoverGroups((prev) => {
        if (prev.some((group) => group._id === response.group._id)) return prev;
        return [
          ...prev,
          {
            _id: response.group._id,
            name: response.group.name,
            createdAt: response.group.createdAt,
            joined: true,
            memberCount: response.group.members?.length || 1,
          },
        ];
      });
      setNewGroupName("");
      setActiveGroupId(response.group._id);
    } catch (createError) {
      setError(createError.message);
    }
  }

  async function handleJoinGroup(groupId) {
    setError("");
    try {
      const response = await joinGroup(token, groupId);
      setMyGroups((prev) => {
        const exists = prev.some((group) => group._id === response.group._id);
        return exists ? prev : [...prev, response.group];
      });
      setDiscoverGroups((prev) =>
        prev.map((group) =>
          group._id === groupId
            ? {
                ...group,
                joined: true,
                memberCount: (group.memberCount || 0) + 1,
              }
            : group,
        ),
      );
      setActiveGroupId(groupId);
    } catch (joinError) {
      setError(joinError.message);
    }
  }

  function handleSendMessage(event) {
    event.preventDefault();
    if (!newMessage.trim() || !activeGroupId) return;

    socket.emit("send-message", {
      groupId: activeGroupId,
      text: newMessage.trim(),
    });
    setNewMessage("");
  }

  return (
    <div className="chat-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h3>Discord Clone</h3>
          <small>Signed in as @{user?.username}</small>
        </div>

        <form onSubmit={handleCreateGroup} className="group-form">
          <input
            placeholder="New group name"
            value={newGroupName}
            onChange={(event) => setNewGroupName(event.target.value)}
          />
          <button type="submit">Create</button>
        </form>

        {loadingGroups ? <p className="sidebar-loading">Loading groups...</p> : null}
        <div className="group-list">
          {myGroups.map((group) => (
            <button
              key={group._id}
              className={activeGroupId === group._id ? "group-item active" : "group-item"}
              onClick={() => setActiveGroupId(group._id)}
              type="button"
            >
              #{group.name}
            </button>
          ))}
          {!loadingGroups && myGroups.length === 0 ? (
            <div className="empty-hint">Create or join a group to start chatting.</div>
          ) : null}
        </div>

        <div className="sidebar-actions">
          <button className="secondary-btn" onClick={() => logout()} type="button">
            Logout
          </button>
          <button
            className="secondary-btn"
            onClick={() => {
              logout();
              navigate("/register");
            }}
            type="button"
          >
            Register New Account
          </button>
        </div>
      </aside>

      <main className="chat-panel">
        <header className="chat-header">
          <h2 className="chat-title">
            {activeGroupId
              ? `#${myGroups.find((group) => group._id === activeGroupId)?.name || "chat"}`
              : "Select a group"}
          </h2>
          <span className="chat-subtitle">
            {activeGroupId ? "Realtime room connected" : "Pick or join a room to start"}
          </span>
        </header>

        {error ? <div className="error-box">{error}</div> : null}

        <section className="discover-panel">
          <h4>Discover Groups</h4>
          <div className="discover-list">
            {discoverGroups.map((group) => (
              <div className="discover-item" key={group._id}>
                <span>#{group.name} ({group.memberCount || 0})</span>
                <button
                  type="button"
                  className="secondary-btn"
                  disabled={group.joined}
                  onClick={() => handleJoinGroup(group._id)}
                >
                  {group.joined ? "Joined" : "Join"}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="messages">
          {loadingMessages ? <p className="messages-empty">Loading messages...</p> : null}
          {!loadingMessages && messages.length === 0 ? (
            <p className="messages-empty">No messages yet. Be the first one to say hi.</p>
          ) : null}
          {messages.map((message) => (
            <div key={message._id} className="message">
              <span className="message-user">{message.sender?.username || "Unknown"}</span>
              <span className="message-text">{message.text}</span>
            </div>
          ))}
        </section>

        <form className="message-form" onSubmit={handleSendMessage}>
          <input
            placeholder={activeGroupId ? "Type a message..." : "Pick a group first"}
            value={newMessage}
            onChange={(event) => setNewMessage(event.target.value)}
            disabled={!activeGroupId}
          />
          <button type="submit" disabled={!activeGroupId || !newMessage.trim()}>
            Send
          </button>
        </form>
      </main>
    </div>
  );
}
