import React, { useEffect, useMemo, useState } from "react";
import "./App.css";  // ← 加這行

function App() {
  // ===== Auth State =====
  const [token, setToken] = useState(localStorage.getItem("access_token") || "");
  const [user, setUser] = useState(localStorage.getItem("username") || "");

  // ===== Conversations State =====
  // 每個對話：{ id, name, messages: [{sender:'user'|'bot', text:string}] }
  const [convs, setConvs] = useState(() => {
    const saved = localStorage.getItem("convs");
    return saved
      ? JSON.parse(saved)
      : [
          {
            id: "conv-1",
            name: "新的對話 1",
            messages: [],
          },
        ];
  });
  const [activeId, setActiveId] = useState(() => {
    return localStorage.getItem("activeId") || "conv-1";
  });

  // ===== Chat State =====
  const activeConv = useMemo(() => convs.find((c) => c.id === activeId), [convs, activeId]);
  const [input, setInput] = useState("");

  // ===== UI State =====
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isSending, setIsSending] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [rename, setRename] = useState("");

  // ===== Persist conversations / activeId =====
  useEffect(() => {
    localStorage.setItem("convs", JSON.stringify(convs));
  }, [convs]);
  useEffect(() => {
    localStorage.setItem("activeId", activeId);
  }, [activeId]);

  // ===== Helpers =====
  const addMessage = (convId, message) => {
    setConvs((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, messages: [...c.messages, message] } : c))
    );
  };

  // ===== Auth Handlers =====
  const openLogin = () => setShowLogin(true);
  const closeLogin = () => setShowLogin(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // 依你的 FastAPI 規劃調整：假設 /api/login 回傳 { access_token, username }
      const resp = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await resp.json();
      if (resp.ok && data.access_token) {
        setToken(data.access_token);
        setUser(data.username || loginForm.username);
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("username", data.username || loginForm.username);
        setShowLogin(false);
      } else {
        alert(data.detail || "登入失敗");
      }
    } catch (err) {
      alert("登入請求失敗");
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser("");
    localStorage.removeItem("access_token");
    localStorage.removeItem("username");
  };

  // ===== Conversation CRUD =====
  const newConversation = () => {
    const id = `conv-${Date.now()}`;
    const next = { id, name: `新的對話`, messages: [] };
    setConvs((prev) => [next, ...prev]);
    setActiveId(id);
  };

  const deleteConversation = (id) => {
    const next = convs.filter((c) => c.id !== id);
    setConvs(next.length ? next : [{ id: "conv-1", name: "新的對話 1", messages: [] }]);
    if (activeId === id) {
      setActiveId(next.length ? next[0].id : "conv-1");
    }
  };

  const startRename = (c) => {
    setRenamingId(c.id);
    setRename(c.name);
  };
  const saveRename = (id) => {
    setConvs((prev) => prev.map((c) => (c.id === id ? { ...c, name: rename.trim() || c.name } : c)));
    setRenamingId(null);
    setRename("");
  };

  // ===== Chat Send =====
  const sendMessage = async () => {
    if (!input.trim()) return;
    if (!token) {
      alert("請先登入後再使用聊天功能。");
      return;
    }
    if (!activeConv) return;

    const userMessage = { sender: "user", text: input.trim() };
    addMessage(activeConv.id, userMessage);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.text, conversation_id: activeConv.id }),
      });
      const data = await response.json();

      if (response.ok && data.reply) {
        addMessage(activeConv.id, { sender: "bot", text: data.reply });
      } else {
        addMessage(activeConv.id, {
          sender: "bot",
          text: data.error || data.detail || "發生錯誤，請稍後再試。",
        });
      }
    } catch (error) {
      addMessage(activeConv.id, { sender: "bot", text: "連線失敗或伺服器無回應。" });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app-root">
      {/* 左側：對話清單 */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand">RAG Demo</div>
          <button className="btn btn-primary" onClick={newConversation}>
            ＋ 新對話
          </button>
        </div>

        <div className="conv-list">
          {convs.map((c) => (
            <div
              key={c.id}
              className={`conv-item ${c.id === activeId ? "active" : ""}`}
              onClick={() => setActiveId(c.id)}
            >
              {renamingId === c.id ? (
                <div className="rename-row" onClick={(e) => e.stopPropagation()}>
                  <input
                    value={rename}
                    onChange={(e) => setRename(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(c.id)}
                    autoFocus
                  />
                  <button className="btn btn-ghost" onClick={() => saveRename(c.id)}>
                    儲存
                  </button>
                </div>
              ) : (
                <>
                  <span className="conv-name">{c.name}</span>
                  <div className="conv-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="icon-btn" title="重新命名" onClick={() => startRename(c)}>
                      ✏️
                    </button>
                    <button className="icon-btn" title="刪除" onClick={() => deleteConversation(c.id)}>
                      🗑️
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </aside>

      {/* 右側：主視圖 */}
      <main className="main">
        <header className="topbar">
          <h1>GPT-4o Chatbot</h1>

          <div className="auth-area">
            {token ? (
              <div className="user-box">
                <span className="hello">Hi, {user}</span>
                <button className="btn btn-outline" onClick={handleLogout}>
                  登出
                </button>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={openLogin}>
                登入以使用
              </button>
            )}
          </div>
        </header>

        <section className="chat-card">
          {!token && (
            <div className="locked-banner">
              🔒 需登入後才能聊天。請點右上角「登入以使用」。
            </div>
          )}

          <div className="messages" id="messages">
            {activeConv?.messages.map((msg, idx) => (
              <div key={idx} className={`bubble-row ${msg.sender === "user" ? "right" : "left"}`}>
                <div className={`bubble ${msg.sender}`}>{msg.text}</div>
              </div>
            ))}
          </div>

          <div className="composer">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={token ? "輸入訊息，Enter 送出，Shift+Enter 換行" : "請先登入"}
              disabled={!token || isSending}
              rows={2}
            />
            <button className="btn btn-primary" onClick={sendMessage} disabled={!token || isSending}>
              {isSending ? "傳送中…" : "送出"}
            </button>
          </div>
        </section>
      </main>

      {/* 登入對話框 */}
      {showLogin && (
        <div className="modal-mask" onClick={closeLogin}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>登入</h3>
            <form onSubmit={handleLogin} className="form">
              <label>
                帳號
                <input
                  type="text"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  required
                />
              </label>
              <label>
                密碼
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
              </label>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={closeLogin}>
                  取消
                </button>
                <button type="submit" className="btn btn-primary">
                  登入
                </button>
              </div>
            </form>
            <p className="hint">
              成功登入後將把 <code>access_token</code> 儲存在 localStorage，
              之後呼叫 API 會自動帶 <code>Authorization: Bearer &lt;token&gt;</code>。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
