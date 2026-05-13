"use client";

import { useEffect, useState, useRef } from "react";
import { Bot, Sparkles } from "lucide-react";

interface AiCoachBubbleProps {
  content: string;
  isStreaming?: boolean;
}

export default function AiCoachBubble({
  content,
  isStreaming = false,
}: AiCoachBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const indexRef = useRef(0);

  // Streaming character-by-character effect
  useEffect(() => {
    if (!isStreaming) {
      setDisplayedText(content);
      return;
    }

    setDisplayedText("");
    indexRef.current = 0;

    const interval = setInterval(() => {
      if (indexRef.current < content.length) {
        setDisplayedText(content.slice(0, indexRef.current + 1));
        indexRef.current += 1;
      } else {
        clearInterval(interval);
      }
    }, 18);

    return () => clearInterval(interval);
  }, [content, isStreaming]);

  return (
    <div className="flex items-start gap-3 max-w-[85%] mr-auto my-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* AI Avatar */}
      <div className="relative shrink-0">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
          <Bot className="h-4.5 w-4.5 text-amber-400" />
        </div>
        {/* Glow pulse */}
        <div className="absolute inset-0 rounded-xl bg-amber-400/10 blur-md animate-pulse" />
      </div>

      {/* Message Bubble */}
      <div className="relative flex-1 min-w-0">
        {/* Label */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wide">
            AI Coach
          </span>
        </div>

        {/* Bubble with glassmorphism */}
        <div className="relative rounded-2xl rounded-tl-sm px-4 py-3 bg-amber-500/5 backdrop-blur-sm border border-amber-500/20 shadow-lg shadow-amber-500/5">
          {/* Gradient glow on top edge */}
          <div className="absolute top-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />

          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {displayedText}
            {/* Blinking cursor while streaming */}
            {isStreaming && indexRef.current < content.length && (
              <span className="inline-block w-1.5 h-4 ml-0.5 bg-amber-400/70 animate-pulse rounded-sm align-text-bottom" />
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
