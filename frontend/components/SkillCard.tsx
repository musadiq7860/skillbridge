"use client";

import { User2, MapPin } from "lucide-react";

interface SkillCardProps {
  id: string;
  title: string;
  description: string;
  userName: string;
  userAvatar?: string | null;
  userLocation?: string | null;
  onRequest?: (skillId: string) => void;
}

export default function SkillCard({
  id,
  title,
  description,
  userName,
  userAvatar,
  userLocation,
  onRequest,
}: SkillCardProps) {
  return (
    <div className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/60 backdrop-blur-sm p-5 transition-all duration-300 hover:border-teal-500/40 hover:shadow-lg hover:shadow-teal-500/5 hover:-translate-y-1">
      {/* Glow effect on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-br from-teal-500/5 via-transparent to-transparent" />

      {/* User info */}
      <div className="relative flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
          {userAvatar ? (
            <img
              src={userAvatar}
              alt={userName}
              className="h-full w-full object-cover"
            />
          ) : (
            <User2 className="h-5 w-5 text-slate-500" />
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-white truncate">{userName}</p>
          {userLocation && (
            <p className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {userLocation}
            </p>
          )}
        </div>
      </div>

      {/* Skill info */}
      <div className="relative">
        <h3 className="text-lg font-semibold text-white mb-1.5 group-hover:text-teal-300 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-slate-400 line-clamp-3 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Action */}
      {onRequest && (
        <div className="relative mt-5">
          <button
            onClick={() => onRequest(id)}
            className="w-full py-2 px-4 rounded-lg border border-teal-500/30 text-teal-400 text-sm font-medium bg-teal-500/5 hover:bg-teal-500/15 hover:border-teal-500/50 transition-all duration-200"
          >
            Request to Learn
          </button>
        </div>
      )}
    </div>
  );
}
