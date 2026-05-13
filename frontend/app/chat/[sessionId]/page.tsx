"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter, useParams } from "next/navigation";
import ChatWindow from "@/components/ChatWindow";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  ShieldAlert,
  Users,
} from "lucide-react";

interface MatchDetails {
  id: string;
  teacher_id: string;
  learner_id: string;
  score: number;
  status: string;
  skill_offered_title?: string;
  skill_needed_title?: string;
  partner_name?: string;
}

export default function ChatPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      // Get the chat session and its match
      const { data: session } = await supabase
        .from("chat_sessions")
        .select("id, match_id")
        .eq("id", sessionId)
        .single();

      if (!session) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Get match details to verify user is a participant
      const { data: match } = await supabase
        .from("matches")
        .select("*")
        .eq("id", session.match_id)
        .single();

      if (!match) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Security check: user must be teacher or learner
      if (match.teacher_id !== user.id && match.learner_id !== user.id) {
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Get partner name
      const partnerId =
        match.teacher_id === user.id ? match.learner_id : match.teacher_id;
      const { data: partner } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", partnerId)
        .single();

      setMatchDetails({
        ...match,
        partner_name: partner?.name || "Unknown",
      });
      setAuthorized(true);
      setLoading(false);
    };

    load();
  }, [sessionId, supabase, router]);

  // Loading
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  // Unauthorized
  if (!authorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="h-16 w-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
          <ShieldAlert className="h-8 w-8 text-red-400" />
        </div>
        <h1 className="text-xl font-semibold text-white mb-2">
          Access Denied
        </h1>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          You don't have permission to view this chat, or it doesn't exist.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-900 text-sm font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Chat Header */}
      <div className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Link
          href="/dashboard"
          className="shrink-0 h-9 w-9 rounded-lg border border-slate-700 hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center shrink-0">
            <Users className="h-4.5 w-4.5 text-violet-400" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">
              {matchDetails?.partner_name}
            </p>
            <p className="text-xs text-slate-500">
              {matchDetails?.score
                ? `${Math.round(matchDetails.score * 100)}% match`
                : "Skill swap session"}
            </p>
          </div>
        </div>

        {/* Match score badge */}
        {matchDetails?.score && (
          <div className="shrink-0 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            {Math.round(matchDetails.score * 100)}%
          </div>
        )}
      </div>

      {/* Chat Window */}
      {currentUserId && (
        <ChatWindow sessionId={sessionId} currentUserId={currentUserId} />
      )}
    </div>
  );
}
