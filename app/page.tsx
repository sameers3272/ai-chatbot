"use client";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { UserMenu } from "@/components/user-menu";
// No client-side SDK; calls go through our backend to keep the API key server-side

function NeonGridBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-20%,rgba(59,130,246,0.15),transparent),radial-gradient(800px_400px_at_20%_20%,rgba(168,85,247,0.15),transparent),radial-gradient(800px_400px_at_80%_30%,rgba(34,197,94,0.12),transparent)]" />
      <div className="absolute inset-0 [mask-image:linear-gradient(180deg,black,transparent)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:64px_64px]" />
    </div>
  );
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [modelName, setModelName] = useState<string>("gemini-1.5-flash");
  const [input, setInput] = useState<string>("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const listRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | undefined>();

  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendPrompt() {
    setError("");
    if (!input.trim()) return;
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: input,
    };
    setMessages((m) => [...m, userMessage]);
    setInput("");
    try {
      setLoading(true);
      const res = await fetch("/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: userMessage.content, modelName, conversationId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Request failed: ${res.status}`);
      }
      const data = (await res.json()) as { text?: string; conversationId?: string };
      const responseText = data.text ?? "";
      if (data.conversationId) setConversationId(data.conversationId);
      const assistantMessage: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: responseText,
      };
      setMessages((m) => [...m, assistantMessage]);
    } catch (e: unknown) {
      const message =
        typeof e === "object" && e && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to fetch from Gemini.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh text-white">
      <NeonGridBackground />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <header className="flex items-center justify-between">
          <motion.h1
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-2xl md:text-3xl font-semibold tracking-tight"
          >
            Sameer's
            <span className="ml-2 text-sm font-normal text-zinc-300">AI Chatbot</span>
          </motion.h1>
          <div className="flex gap-3 items-center">
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="bg-zinc-900/60 border border-zinc-700/60 text-sm rounded-md px-3 py-2 backdrop-blur-md shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
            >
              <option value="gemini-1.5-flash">gemini-1.5-flash</option>
              <option value="gemini-1.5-pro">gemini-1.5-pro</option>
            </select>
            <UserMenu />
          </div>
        </header>

        <main className="mt-8 grid grid-rows-[1fr_auto] h-[75dvh] rounded-2xl bg-zinc-950/40 border border-zinc-800/60 backdrop-blur-xl shadow-[0_0_0_1px_rgba(255,255,255,0.06),0_20px_60px_-20px_rgba(0,0,0,0.6)]">
          <div ref={listRef} className="overflow-y-auto p-4 md:p-6 space-y-4">
            {messages.length === 0 && !session && (
              <div className="h-full grid place-items-center text-zinc-400 text-sm">
                <div className="text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-lg md:text-xl font-medium"
                  >
                    Welcome to Neon Nexus
                  </motion.div>
                  <div className="mt-1">Sign in to save your chat history.</div>
                </div>
              </div>
            )}
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className={`max-w-3xl ${m.role === "user" ? "ml-auto" : ""} md:max-w-2xl`}
              >
                <div
                  className={`rounded-xl px-4 py-3 border ${
                    m.role === "user"
                      ? "bg-blue-500/10 border-blue-400/20"
                      : "bg-zinc-900/60 border-zinc-700/60"
                  }`}
                >
                  <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">
                    {m.role}
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed">
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl"
              >
                <div className="rounded-xl px-4 py-3 border bg-zinc-900/60 border-zinc-700/60">
                  <div className="text-xs uppercase tracking-wide text-zinc-400 mb-1">assistant</div>
                  <div className="h-5 w-28 animate-pulse bg-zinc-700/50 rounded" />
                </div>
              </motion.div>
            )}
            {error && (
              <div className="text-rose-400 text-sm">{error}</div>
            )}
          </div>

          <form
            className="p-3 md:p-4 border-t border-zinc-800/60 backdrop-blur-xl"
            onSubmit={(e) => {
              e.preventDefault();
              sendPrompt();
            }}
          >
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className="flex-1 bg-zinc-900/60 border border-zinc-700/60 text-sm rounded-md px-3 py-3 placeholder:text-zinc-500"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-3 text-sm rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 transition-colors"
              >
                {loading ? "Thinking…" : "Send"}
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
