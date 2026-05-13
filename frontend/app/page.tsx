import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative flex items-center justify-center min-h-[85vh] overflow-hidden">
        {/* Gradient orbs */}
        <div className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-teal-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-amber-500/8 blur-3xl" />

        <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-teal-500/20 bg-teal-500/5 text-teal-400 text-sm font-medium mb-8">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-400" />
            </span>
            AI-Powered Skill Matching
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-6 leading-tight">
            Swap Skills.
            <br />
            <span className="bg-gradient-to-r from-teal-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Grow Together.
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Offer what you know, learn what you need. Our AI matches you with
            the perfect skill-swap partner and coaches you through the journey.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-900 font-semibold text-base shadow-lg shadow-teal-500/20 hover:shadow-teal-500/30 transition-all"
            >
              Get Started — It&apos;s Free
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white font-medium text-base transition-all"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: "AI Matching",
              description:
                "Our semantic AI engine understands your skills deeply and finds the most compatible swap partners.",
              icon: "🧠",
              color: "teal",
            },
            {
              title: "Real-Time Chat",
              description:
                "Connect instantly with your match through a built-in chat. No external apps needed.",
              icon: "💬",
              color: "violet",
            },
            {
              title: "AI Coach",
              description:
                "An intelligent assistant monitors your sessions and offers tips, resources, and guidance.",
              icon: "✨",
              color: "amber",
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl bg-slate-900/40 backdrop-blur-sm border border-slate-700/50 p-6 hover:border-slate-600 transition-colors group"
            >
              <div className="text-3xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-teal-300 transition-colors">
                {feature.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} SkillBridge. Built with AI.
        </div>
      </footer>
    </div>
  );
}
