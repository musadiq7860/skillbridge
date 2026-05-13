"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import AiCoachBubble from "@/components/AiCoachBubble";
import { Send, Loader2, ArrowDown } from "lucide-react";

interface Message {
  id: string;
  session_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_ai?: boolean;
}

interface ChatWindowProps {
  sessionId: string;
  currentUserId: string;
}

export default function ChatWindow({ sessionId, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [aiStreaming, setAiStreaming] = useState(false);
  const [aiStreamContent, setAiStreamContent] = useState("");
  const [showScrollBtn, setShowScrollBtn] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();

  // Scroll to bottom
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (data) {
        setMessages(data);
        setTimeout(() => scrollToBottom("instant"), 100);
      }
    };
    loadMessages();
  }, [sessionId, supabase, scrollToBottom]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          // Only add if it's not from us (we already added our own optimistically)
          if (msg.sender_id !== currentUserId) {
            setMessages((prev) => {
              if (prev.find((m) => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
            scrollToBottom();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, currentUserId, supabase, scrollToBottom]);

  // Scroll detection for "scroll to bottom" button
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  // Send message
  const handleSend = async () => {
    const text = newMessage.trim();
    if (!text || sending) return;

    setSending(true);
    setNewMessage("");

    // Optimistic add
    const optimisticMsg: Message = {
      id: crypto.randomUUID(),
      session_id: sessionId,
      sender_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    scrollToBottom();

    // Insert into Supabase directly (as per architecture)
    const { error } = await supabase.from("messages").insert({
      session_id: sessionId,
      sender_id: currentUserId,
      content: text,
    });

    if (error) {
      console.error("Failed to send message:", error);
    }

    setSending(false);

    // Check if AI Coach should respond (every 4th message)
    const updatedCount = messages.length + 1;
    if (updatedCount % 4 === 0) {
      triggerAiCoach([...messages, optimisticMsg]);
    }
  };

  // Trigger AI Coach stream
  const triggerAiCoach = async (allMessages: Message[]) => {
    setAiStreaming(true);
    setAiStreamContent("");

    const chatHistory = allMessages.slice(-10).map((m) => ({
      sender_id: m.sender_id,
      content: m.content,
    }));

    try {
      let fullContent = "";
      for await (const chunk of api.streamCoachResponse({
        session_id: sessionId,
        messages: chatHistory,
        message_count: allMessages.length,
      })) {
        fullContent += chunk;
        setAiStreamContent(fullContent);
      }

      // After streaming completes, add AI message to the list
      if (fullContent) {
        const aiMsg: Message = {
          id: `ai-${Date.now()}`,
          session_id: sessionId,
          sender_id: "ai-coach",
          content: fullContent,
          created_at: new Date().toISOString(),
          is_ai: true,
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error("AI Coach error:", err);
    } finally {
      setAiStreaming(false);
      setAiStreamContent("");
      scrollToBottom();
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm">
            No messages yet. Start the conversation!
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === currentUserId;
          const isAi = msg.sender_id === "ai-coach" || msg.is_ai;

          if (isAi) {
            return (
              <AiCoachBubble key={msg.id} content={msg.content} isStreaming={false} />
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex ${isMe ? "justify-end" : "justify-start"} my-1 animate-in fade-in slide-in-from-bottom-1 duration-200`}
            >
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  isMe
                    ? "bg-teal-500 text-slate-900 rounded-br-sm shadow-lg shadow-teal-500/10"
                    : "bg-slate-800 text-slate-200 rounded-bl-sm border border-slate-700/50"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    isMe ? "text-teal-800" : "text-slate-500"
                  }`}
                >
                  {new Date(msg.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}

        {/* Live AI stream */}
        {aiStreaming && aiStreamContent && (
          <AiCoachBubble content={aiStreamContent} isStreaming={true} />
        )}

        <div ref={bottomRef} />
      </div>

      {/* Scroll-to-bottom button */}
      {showScrollBtn && (
        <button
          onClick={() => scrollToBottom()}
          className="absolute bottom-24 right-6 h-9 w-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-lg"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      )}

      {/* Input Area */}
      <div className="border-t border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 py-3">
        <div className="flex items-end gap-3">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            rows={1}
            className="flex-1 resize-none px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all max-h-32"
            style={{ minHeight: "42px" }}
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim() || sending}
            className="shrink-0 h-[42px] w-[42px] rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-900 flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-teal-500/20"
          >
            {sending ? (
              <Loader2 className="h-4.5 w-4.5 animate-spin" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
