import React, { useState, useRef, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Mode = "file_only" | "rag";

interface Message {
  id: string;
  role: "user" | "assistant" | "error";
  content: string;
  mode?: Mode;
  timestamp: Date;
}

interface ChatBotProps {
  fileName: string;
  onReset: () => void;
}

// ─── API ──────────────────────────────────────────────────────────────────────
const CHAT_API_URL = "https://rag-backend-1-x6fr.onrender.com/api/chat";

async function sendMessage(question: string): Promise<string> {
  try {
    const response = await fetch(CHAT_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, mode: "rag" }),
    });

    if (!response.ok) {
      // optionally log for debugging
      console.error("API failed:", response.status, response.statusText);
      throw new Error("Something went wrong. Please try again.");
    }

    const data = await response.json();

    return (
      data.answer ??
      data.response ??
      data.message ??
      "Something went wrong. Please try again."
    );
  } catch (err) {
    // 👇 internal logging (keep for dev)
    console.error("sendMessage error:", err);

    // 👇 user-safe message
    return "Something went wrong. Please try again.";
  }
}
// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateId() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ─── Typing indicator ─────────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-zinc-500"
          style={{
            animation: `typing-bounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  const isError = msg.role === "error";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} items-end`}>
      {/* Avatar */}
      <div
        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isUser
            ? "bg-lime-400 text-zinc-950"
            : isError
            ? "bg-red-500/20 text-red-400 border border-red-500/30"
            : "bg-zinc-800 border border-zinc-700 text-zinc-400"
        }`}
      >
        {isUser ? "U" : isError ? "!" : "AI"}
      </div>

      <div className={`max-w-[75%] flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        {/* Mode badge for assistant messages */}
        {!isUser && !isError && msg.mode && (
          <span className={`text-[10px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${
            msg.mode === "rag"
              ? "text-lime-400 border-lime-400/30 bg-lime-400/5"
              : "text-sky-400 border-sky-400/30 bg-sky-400/5"
          }`}>
            {msg.mode === "rag" ? "AI + File" : "File Only"}
          </span>
        )}

        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser
              ? "bg-lime-400 text-zinc-950 rounded-br-sm"
              : isError
              ? "bg-red-500/10 text-red-400 border border-red-500/20 rounded-bl-sm"
              : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-sm"
          }`}
        >
          {msg.content}
        </div>

        <span className="text-[10px] text-zinc-600 px-1">{formatTime(msg.timestamp)}</span>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChatBot({ fileName, onReset }: ChatBotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: generateId(),
      role: "assistant",
      content: `Document loaded. I'm ready to answer questions about **${fileName}**.\n\nUse the toggle to switch between:\n• **File Only** — strict answers from the document\n• **AI + File** — enhanced answers using AI reasoning`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [mode] = useState<Mode>("file_only");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async () => {
    const prompt = input.trim();
    if (!prompt || loading) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: prompt,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const answer = await sendMessage(prompt);
      const assistantMsg: Message = {
        id: generateId(),
        role: "assistant",
        content: answer,
        mode,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: Message = {
        id: generateId(),
        role: "error",
        content: err?.message ?? "Something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col" style={{ fontFamily: "'DM Mono', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Syne:wght@400;700;800&display=swap');

        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }

        @keyframes slide-up {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .msg-enter { animation: slide-up 0.25s ease forwards; }

        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #3f3f46; border-radius: 4px; }

        .toggle-track {
          transition: background 0.3s ease;
        }
        .toggle-thumb {
          transition: transform 0.3s ease;
        }
      `}</style>

      {/* ── Header ── */}
      <header className="border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: file info */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-base flex-shrink-0">
              📄
            </div>
            <div className="min-w-0">
              <p className="text-white text-sm font-medium truncate" style={{ fontFamily: "'Syne', sans-serif" }}>
                {fileName}
              </p>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
                <span className="text-zinc-500 text-xs">Ready</span>
              </div>
            </div>
          </div>

          {/* Center: Mode toggle */}
          {/* <div className="flex items-center gap-3 flex-shrink-0">
            <span className={`text-xs tracking-wide transition-colors ${mode === "file_only" ? "text-sky-400" : "text-zinc-600"}`}>
              File
            </span>

            <button
              onClick={() => setMode((m) => (m === "file_only" ? "rag" : "file_only"))}
              className={`relative w-12 h-6 rounded-full border transition-all duration-300 focus:outline-none ${
                mode === "rag"
                  ? "border-lime-400/50 bg-lime-400/10"
                  : "border-sky-400/50 bg-sky-400/10"
              }`}
              title={`Mode: ${mode === "file_only" ? "File Only" : "AI + File (RAG)"}`}
            >
              <span
                className={`toggle-thumb absolute top-0.5 left-0.5 w-4 h-4 rounded-full shadow-sm ${
                  mode === "rag" ? "translate-x-6 bg-lime-400" : "translate-x-0 bg-sky-400"
                }`}
                style={{ display: "block" }}
              ></span>
            </button>

            <span className={`text-xs tracking-wide transition-colors ${mode === "rag" ? "text-lime-400" : "text-zinc-600"}`}>
              AI
            </span>
          </div> */}

          {/* Right: mode label + reset */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className={`hidden sm:inline-flex text-[10px] tracking-widest uppercase px-2 py-1 rounded-full border ${
              mode === "rag"
                ? "text-lime-400 border-lime-400/30 bg-lime-400/5"
                : "text-sky-400 border-sky-400/30 bg-sky-400/5"
            }`}>
              {mode === "rag" ? "AI + File" : "File Only"}
            </span>

            <button
              onClick={onReset}
              className="text-zinc-600 hover:text-zinc-300 transition-colors text-xs border border-zinc-800 hover:border-zinc-600 px-2 py-1 rounded-lg"
              title="Upload new file"
            >
              ↩ New
            </button>
          </div>
        </div>

        {/* Mode description bar */}
        <div className={`border-t text-center py-1.5 text-[10px] tracking-widest uppercase transition-all duration-300 ${
          mode === "rag"
            ? "border-lime-400/10 text-lime-400/60 bg-lime-400/3"
            : "border-sky-400/10 text-sky-400/60 bg-sky-400/3"
        }`}>
          {mode === "rag"
            ? "Enhanced mode — AI reasons over your document for richer answers"
            : "Strict mode — answers sourced directly from the document only"}
        </div>
      </header>

      {/* ── Messages ── */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id} className="msg-enter">
              <MessageBubble msg={msg} />
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-end msg-enter">
              <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-400 flex-shrink-0">
                AI
              </div>
              <div className="bg-zinc-800/80 border border-zinc-700/50 rounded-2xl rounded-bl-sm">
                <TypingDots />
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </main>

      {/* ── Input ── */}
      <footer className="border-t border-zinc-800/80 bg-zinc-950/90 backdrop-blur sticky bottom-0">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className={`flex gap-2 items-end rounded-2xl border bg-zinc-900/80 transition-all duration-200 focus-within:border-zinc-600 ${
            mode === "rag" ? "border-lime-400/20" : "border-zinc-700/50"
          }`}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === "file_only"
                  ? "Ask something from the document..."
                  : "Ask anything — AI will reason over the document..."
              }
              disabled={loading}
              className="flex-1 bg-transparent text-zinc-200 placeholder-zinc-600 text-sm px-4 py-3 resize-none focus:outline-none leading-relaxed"
              style={{ minHeight: "44px", maxHeight: "140px" }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className={`m-2 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                input.trim() && !loading
                  ? "bg-lime-400 text-zinc-950 hover:bg-lime-300 active:scale-95"
                  : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
              }`}
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a8 8 0 100 16v-4a8 8 0 01-8-8z"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"/>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                </svg>
              )}
            </button>
          </div>

          <p className="text-center text-zinc-700 text-[10px] tracking-widest mt-2 uppercase">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </footer>
    </div>
  );
}