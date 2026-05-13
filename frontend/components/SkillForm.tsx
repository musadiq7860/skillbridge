"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import {
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface SkillFormProps {
  type: "offer" | "need";
  userId: string;
  onSuccess?: () => void;
}

export default function SkillForm({ type, userId, onSuccess }: SkillFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOffer = type === "offer";
  const Icon = isOffer ? Sparkles : BookOpen;
  const accentColor = isOffer ? "teal" : "amber";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      if (isOffer) {
        await api.offerSkill({ user_id: userId, title, description });
      } else {
        await api.needSkill({ user_id: userId, title, description });
      }
      setSuccess(true);
      setTitle("");
      setDescription("");
      onSuccess?.();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
            isOffer
              ? "bg-teal-500/10 text-teal-400"
              : "bg-amber-500/10 text-amber-400"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-semibold text-white text-lg">
            {isOffer ? "Offer a Skill" : "Request a Skill"}
          </h3>
          <p className="text-sm text-slate-400">
            {isOffer
              ? "Share what you can teach others"
              : "Tell us what you want to learn"}
          </p>
        </div>
      </div>

      {/* Feedback */}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm animate-in fade-in slide-in-from-top-1">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>
            {isOffer
              ? "Skill offered successfully! Others can now find you."
              : "Skill request submitted! We're looking for matches…"}
          </span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Title */}
      <div>
        <label
          htmlFor={`skill-title-${type}`}
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Skill Title
        </label>
        <input
          id={`skill-title-${type}`}
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            isOffer ? 'e.g. "React & Next.js"' : 'e.g. "Machine Learning"'
          }
          className="block w-full px-3.5 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor={`skill-desc-${type}`}
          className="block text-sm font-medium text-slate-300 mb-1.5"
        >
          Description
        </label>
        <textarea
          id={`skill-desc-${type}`}
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={
            isOffer
              ? "Describe your expertise level, what you can teach, and your preferred teaching style…"
              : "Describe what you want to learn, your current level, and your goals…"
          }
          className="block w-full px-3.5 py-2.5 border border-slate-700 rounded-lg bg-slate-800/50 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all resize-none"
        />
        <p className="mt-1.5 text-xs text-slate-500">
          Be specific — our AI uses this to find the best matches.
        </p>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loading || !title.trim() || !description.trim()}
        className={`w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
          isOffer
            ? "bg-teal-500 hover:bg-teal-600 text-slate-900 shadow-lg shadow-teal-500/20"
            : "bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20"
        }`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Icon className="h-4 w-4" />
            {isOffer ? "Offer This Skill" : "Request This Skill"}
          </>
        )}
      </button>
    </form>
  );
}
