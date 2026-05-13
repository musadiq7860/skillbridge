"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import SkillCard from "@/components/SkillCard";
import MatchNotification from "@/components/MatchNotification";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  Users,
  TrendingUp,
  ArrowRight,
  Loader2,
  Search,
  MessageSquare,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
}

interface FeedSkill {
  id: string;
  title: string;
  description: string;
  user_id: string;
  profiles: {
    name: string;
    avatar_url: string | null;
    location: string | null;
  };
}

interface MatchRow {
  id: string;
  teacher_id: string;
  learner_id: string;
  score: number;
  status: string;
  chat_session_id?: string;
  skill_title?: string;
  partner_name?: string;
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [feedSkills, setFeedSkills] = useState<FeedSkill[]>([]);
  const [matches, setMatches] = useState<MatchRow[]>([]);
  const [offeredCount, setOfferedCount] = useState(0);
  const [neededCount, setNeededCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Profile
      const { data: p } = await supabase
        .from("profiles")
        .select("id, name")
        .eq("id", user.id)
        .single();
      if (p) setProfile(p);

      // Counts
      const { count: oc } = await supabase
        .from("skills_offered")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setOfferedCount(oc ?? 0);

      const { count: nc } = await supabase
        .from("skills_needed")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setNeededCount(nc ?? 0);

      // Feed: skills offered by OTHER users
      const { data: feed } = await supabase
        .from("skills_offered")
        .select("id, title, description, user_id, profiles(name, avatar_url, location)")
        .neq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (feed) setFeedSkills(feed as unknown as FeedSkill[]);

      // Matches
      const { data: m } = await supabase
        .from("matches")
        .select("*")
        .or(`teacher_id.eq.${user.id},learner_id.eq.${user.id}`)
        .neq("status", "rejected")
        .order("created_at", { ascending: false })
        .limit(10);
      if (m) setMatches(m as MatchRow[]);

      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const filteredFeed = feedSkills.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Real-time Match Notifications */}
      {profile && <MatchNotification userId={profile.id} />}

      {/* ── Hero / Greeting ────────────────────────────────── */}
      <section>
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">
          Welcome back,{" "}
          <span className="text-teal-400">
            {profile?.name?.split(" ")[0] || "there"}
          </span>
          !
        </h1>
        <p className="text-slate-400">
          Here&apos;s what&apos;s happening on your SkillBridge.
        </p>
      </section>

      {/* ── Stat Cards (Bento) ─────────────────────────────── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Skills Offered",
            value: offeredCount,
            icon: Sparkles,
            color: "teal",
          },
          {
            label: "Skills Needed",
            value: neededCount,
            icon: BookOpen,
            color: "amber",
          },
          {
            label: "Active Matches",
            value: matches.filter((m) => m.status === "pending" || m.status === "accepted").length,
            icon: Users,
            color: "violet",
          },
          {
            label: "Match Rate",
            value:
              offeredCount + neededCount > 0
                ? `${Math.round(
                    (matches.length / (offeredCount + neededCount)) * 100
                  )}%`
                : "—",
            icon: TrendingUp,
            color: "emerald",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl glass p-4 md:p-5 group hover:border-slate-600 transition-colors"
          >
            <div
              className={`flex h-9 w-9 items-center justify-center rounded-xl mb-3 ${
                stat.color === "teal"
                  ? "bg-teal-500/10 text-teal-400"
                  : stat.color === "amber"
                  ? "bg-amber-500/10 text-amber-400"
                  : stat.color === "violet"
                  ? "bg-violet-500/10 text-violet-400"
                  : "bg-emerald-500/10 text-emerald-400"
              }`}
            >
              <stat.icon className="h-4.5 w-4.5" />
            </div>
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </section>

      {/* ── Active Matches ─────────────────────────────────── */}
      {matches.length > 0 && (
        <section className="rounded-2xl glass p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="h-5 w-5 text-violet-400" />
              Your Matches
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {matches.map((match) => (
              <Link
                key={match.id}
                href={`/chat/${match.chat_session_id || match.id}`}
                className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/30 hover:bg-slate-800 transition-all group"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 group-hover:bg-violet-500/20 transition-colors">
                  <MessageSquare className="h-4.5 w-4.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {match.skill_title || "Skill Match"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {Math.round(match.score * 100)}% match •{" "}
                    <span
                      className={`${
                        match.status === "accepted"
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {match.status}
                    </span>
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-violet-400 transition-colors" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Skill Feed ─────────────────────────────────────── */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Skill Feed
            </h2>
            <p className="text-sm text-slate-400">
              Discover skills offered by the community
            </p>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search skills…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700 bg-slate-800/50 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
            />
          </div>
        </div>

        {filteredFeed.length === 0 ? (
          <div className="rounded-2xl glass p-12 text-center">
            <Sparkles className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">
              {searchQuery
                ? "No skills match your search."
                : "No skills available yet. Be the first to offer one!"}
            </p>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-900 text-sm font-semibold transition-colors"
            >
              <Sparkles className="h-4 w-4" />
              Offer a Skill
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFeed.map((skill) => (
              <SkillCard
                key={skill.id}
                id={skill.id}
                title={skill.title}
                description={skill.description}
                userName={skill.profiles?.name || "Anonymous"}
                userAvatar={skill.profiles?.avatar_url}
                userLocation={skill.profiles?.location}
                onRequest={(skillId) => {
                  // TODO: wire up match request
                  console.log("Request skill:", skillId);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
