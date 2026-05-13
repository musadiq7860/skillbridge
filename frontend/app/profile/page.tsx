"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import SkillForm from "@/components/SkillForm";
import {
  User2,
  MapPin,
  Sparkles,
  BookOpen,
  Camera,
  Save,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  location: string | null;
}

interface Skill {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offeredSkills, setOfferedSkills] = useState<Skill[]>([]);
  const [neededSkills, setNeededSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile edit state
  const [editName, setEditName] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [activeTab, setActiveTab] = useState<"offer" | "need">("offer");

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileData) {
        setProfile(profileData);
        setEditName(profileData.name || "");
        setEditLocation(profileData.location || "");
      }

      // Fetch offered skills
      const { data: offered } = await supabase
        .from("skills_offered")
        .select("id, title, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (offered) setOfferedSkills(offered);

      // Fetch needed skills
      const { data: needed } = await supabase
        .from("skills_needed")
        .select("id, title, description, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (needed) setNeededSkills(needed);

      setLoading(false);
    };

    loadProfile();
  }, [supabase, router]);

  const handleSaveProfile = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    await supabase
      .from("profiles")
      .update({ name: editName, location: editLocation })
      .eq("id", profile.id);

    setProfile({ ...profile, name: editName, location: editLocation });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const refreshSkills = async () => {
    if (!profile) return;
    const { data: offered } = await supabase
      .from("skills_offered")
      .select("id, title, description, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (offered) setOfferedSkills(offered);

    const { data: needed } = await supabase
      .from("skills_needed")
      .select("id, title, description, created_at")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false });
    if (needed) setNeededSkills(needed);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8 space-y-8">
      {/* ── Profile Card ────────────────────────────────────── */}
      <section className="rounded-2xl glass p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="relative group">
            <div className="h-24 w-24 rounded-2xl bg-slate-800 border-2 border-slate-700 flex items-center justify-center overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User2 className="h-10 w-10 text-slate-500" />
              )}
            </div>
            <button className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="h-5 w-5 text-white" />
            </button>
          </div>

          {/* Editable info */}
          <div className="flex-1 space-y-4 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="profile-name"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  Full Name
                </label>
                <input
                  id="profile-name"
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="block w-full px-3.5 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                />
              </div>
              <div>
                <label
                  htmlFor="profile-location"
                  className="block text-sm font-medium text-slate-400 mb-1"
                >
                  <MapPin className="inline h-3.5 w-3.5 mr-1" />
                  Location
                </label>
                <input
                  id="profile-location"
                  type="text"
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  placeholder="e.g. Lahore, PK"
                  className="block w-full px-3.5 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all"
                />
              </div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-teal-500 hover:bg-teal-600 text-slate-900 text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : saved ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* ── Skill Forms ─────────────────────────────────────── */}
      <section className="rounded-2xl glass p-6 md:p-8">
        {/* Tabs */}
        <div className="flex border-b border-slate-700/50 mb-6">
          <button
            onClick={() => setActiveTab("offer")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === "offer"
                ? "border-teal-400 text-teal-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Offer a Skill
          </button>
          <button
            onClick={() => setActiveTab("need")}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-[1px] ${
              activeTab === "need"
                ? "border-amber-400 text-amber-400"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            <BookOpen className="h-4 w-4" />
            Request a Skill
          </button>
        </div>

        {profile && (
          <SkillForm
            key={activeTab}
            type={activeTab}
            userId={profile.id}
            onSuccess={refreshSkills}
          />
        )}
      </section>

      {/* ── My Skills Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Offered */}
        <section className="rounded-2xl glass p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <Sparkles className="h-5 w-5 text-teal-400" />
            Skills I Offer
            <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {offeredSkills.length}
            </span>
          </h2>
          {offeredSkills.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No skills offered yet. Add one above!
            </p>
          ) : (
            <div className="space-y-3">
              {offeredSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-teal-500/30 transition-colors"
                >
                  <h4 className="text-sm font-medium text-white">
                    {skill.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Needed */}
        <section className="rounded-2xl glass p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white mb-4">
            <BookOpen className="h-5 w-5 text-amber-400" />
            Skills I Need
            <span className="ml-auto text-xs font-normal text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">
              {neededSkills.length}
            </span>
          </h2>
          {neededSkills.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              No skills requested yet. Add one above!
            </p>
          ) : (
            <div className="space-y-3">
              {neededSkills.map((skill) => (
                <div
                  key={skill.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:border-amber-500/30 transition-colors"
                >
                  <h4 className="text-sm font-medium text-white">
                    {skill.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {skill.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
