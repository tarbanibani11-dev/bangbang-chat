const modalOverlay  = document.getElementById("modal-overlay");
const usernameInput = document.getElementById("username-input");
const joinBtn       = document.getElementById("join-btn");
const app           = document.getElementById("app");
const messagesArea  = document.getElementById("messages");
const msgInput      = document.getElementById("msg-input");
const sendBtn       = document.getElementById("send-btn");
const userList      = document.getElementById("user-list");
const sidebarCount  = document.getElementById("sidebar-count");
const headerCount   = document.getElementById("header-count");
const connectionDot = document.getElementById("connection-dot");

let myUsername = "";
let socket = null;

const AVATAR_COLORS = ["#4f46e5","#0891b2","#059669","#d97706","#dc2626","#7c3aed","#db2777","#0284c7"];

function getAvatarColor(name) {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + ch.charCodeAt(0)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(hash)];
}

function getInitials(name) { return name.trim().slice(0, 2).toUpperCase(); }

usernameInput.addEventListener("input", () => {
  joinBtn.disabled = usernameInput.value.trim().length === 0;
});

usernameInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !joinBtn.disabled) joinRoom();
});

joinBtn.addEventListener("click", joinRoom);

function joinRoom() {
  const name = usernameInput.value.trim();
  if (!name) return;
  myUsername = name;
  modalOverlay.classList.add("hidden");
  app.classList.remove("hidden");
  initSocket();
  msgInput.focus();
}

function initSocket() {
  socket = io();

  socket.on("connect", () => {
    setConnectionDot("connected");
    socket.emit("user_join", myUsername);
  });

  socket.on("disconnect", () => {
    setConnectionDot("disconnected");
    addSystemMessage("Koneksi terputus. Mencoba menghubungkan kembali...");
  });

  socket.on("chat_message", (payload) => {
    const isOwn = payload.username === myUsername;
    addChatMessage(payload.username, payload.message, payload.time, isOwn);
  });

  socket.on("system_message", (payload) => {
    addSystemMessage(payload.text);
  });

  socket.on("user_list", (users) => {
    renderUserList(users);
  });
}

function setConnectionDot(state) {
  connectionDot.className = "brand-dot " + state;
}

sendBtn.addEventListener("click", sendMessage);
msgInput.addEventListener("keydown", (e) => { if (e.key === "Enter") sendMessage(); });

function sendMessage() {
  if (!socket) return;
  const text = msgInput.value.trim();
  if (!text) return;
  socket.emit("chat_message", { message: text });
  msgInput.value = "";
  msgInput.focus();
}

function addChatMessage(username, message, time, isOwn) {
  const wrap = document.createElement("div");
  wrap.className = "msg-wrap" + (isOwn ? " own" : "");

  const meta = document.createElement("div");
  meta.className = "msg-meta";

  const nameEl = document.createElement("span");
  nameEl.className = "msg-username";
  nameEl.textContent = isOwn ? "Kamu" : username;

  const timeEl = document.createElement("span");
  timeEl.className = "msg-time";
  timeEl.textContent = time;

  meta.appendChild(nameEl);
  meta.appendChild(timeEl);

  const bubble = document.createElement("div");
  bubble.className = "msg-bubble";
  bubble.textContent = message;

  wrap.appendChild(meta);
  wrap.appendChild(bubble);
  messagesArea.appendChild(wrap);
  scrollToBottom();
}

function addSystemMessage(text) {
  const el = document.createElement("div");
  el.className = "msg-system";
  el.textContent = text;
  messagesArea.appendChild(el);
  scrollToBottom();
}

function scrollToBottom() {
  requestAnimationFrame(() => { messagesArea.scrollTop = messagesArea.scrollHeight; });
}

function renderUserList(users) {
  sidebarCount.textContent = users.length;
  headerCount.textContent = users.length;
  userList.innerHTML = "";
  users.forEach((name) => {
    const li = document.createElement("li");
    li.className = "user-item";
    const avatar = document.createElement("div");
    avatar.className = "user-avatar";
    avatar.style.background = getAvatarColor(name);
    avatar.textContent = getInitials(name);
    const nameEl = document.createElement("span");
    nameEl.className = "user-name" + (name === myUsername ? " is-you" : "");
    nameEl.textContent = name;
    li.appendChild(avatar);
    li.appendChild(nameEl);
    userList.appendChild(li);
  });
                }
