"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase";
import { X, MessageSquare, UserCheck, Zap } from "lucide-react";
import Link from "next/link";

interface MatchData {
  id: string;
  teacher_id: string;
  learner_id: string;
  score: number;
  status: string;
  skill_title?: string;
  teacher_name?: string;
  learner_name?: string;
  chat_session_id?: string;
}

interface MatchNotificationProps {
  userId: string;
}

export default function MatchNotification({ userId }: MatchNotificationProps) {
  const [notifications, setNotifications] = useState<MatchData[]>([]);
  const supabase = createClient();

  const dismiss = useCallback((matchId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== matchId));
  }, []);

  useEffect(() => {
    // Subscribe to new matches for this user (as teacher or learner)
    const channel = supabase
      .channel("match-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "matches",
        },
        (payload) => {
          const match = payload.new as MatchData;
          if (
            match.teacher_id === userId ||
            match.learner_id === userId
          ) {
            setNotifications((prev) => [match, ...prev]);
            // Auto-dismiss after 15 seconds
            setTimeout(() => dismiss(match.id), 15000);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, supabase, dismiss]);

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full">
      {notifications.map((match, index) => (
        <div
          key={match.id}
          className="relative overflow-hidden rounded-2xl border border-amber-500/30 bg-slate-900/90 backdrop-blur-xl shadow-2xl shadow-amber-500/10 p-4 animate-in slide-in-from-right fade-in duration-500"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          {/* Animated top accent line */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400" />

          {/* Dismiss */}
          <button
            onClick={() => dismiss(match.id)}
            className="absolute top-3 right-3 text-slate-500 hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-3 pr-6">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10">
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white mb-0.5">
                New Match Found!
              </p>
              <p className="text-xs text-slate-400 mb-3">
                {Math.round(match.score * 100)}% compatibility •{" "}
                {match.skill_title || "Skill match"}
              </p>
              <div className="flex gap-2">
                <Link
                  href={`/chat/${match.chat_session_id || match.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-semibold transition-colors"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Start Chat
                </Link>
                <button
                  onClick={() => dismiss(match.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-medium transition-colors"
                >
                  <UserCheck className="h-3.5 w-3.5" />
                  View Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
