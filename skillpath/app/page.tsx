import Link from "next/link";
import {
    ArrowRight,
    Brain,
    Target,
    LineChart,
    BookOpen,
    Radar,
    ShieldCheck,
    Sparkles,
    Zap,
    Trophy,
    CheckCircle2,
    Code2,
    GitBranch,
    Palette,
    Database,
    Server,
    TerminalSquare,
} from "lucide-react";

const features = [
    {
        icon: Brain,
        title: "Adaptive assessments",
        desc: "Smart tests that adjust to your level and pinpoint exactly what you know — and what you don't.",
    },
    {
        icon: Radar,
        title: "Skill radar",
        desc: "Visualize your strengths and gaps across every category on a live, interactive radar.",
    },
    {
        icon: Target,
        title: "Personalized goals",
        desc: "Set objectives, track progress, and stay accountable with a plan built around you.",
    },
    {
        icon: BookOpen,
        title: "Curated resources",
        desc: "Hand-picked learning material matched to your weakest areas. No more guessing what to study.",
    },
    {
        icon: LineChart,
        title: "Progress analytics",
        desc: "Beautiful dashboards that turn every attempt into insight and every session into momentum.",
    },
    {
        icon: Trophy,
        title: "Prove your level",
        desc: "Earn a verified estimated level — from Beginner to Senior — you can actually show off.",
    },
];

const steps = [
    {
        n: "01",
        icon: Zap,
        title: "Take an assessment",
        desc: "Pick a category and run a quick, focused test. It takes minutes, not hours.",
    },
    {
        n: "02",
        icon: Radar,
        title: "See your skill map",
        desc: "Get an instant breakdown of your level with a radar of strengths and weak spots.",
    },
    {
        n: "03",
        icon: BookOpen,
        title: "Level up",
        desc: "Follow tailored resources, hit your goals, and watch your score climb.",
    },
];

const categories = [
    { icon: Code2, name: "Programming Fundamentals" },
    { icon: GitBranch, name: "Git & GitHub" },
    { icon: Palette, name: "HTML, CSS & JavaScript" },
    { icon: Database, name: "Databases" },
    { icon: Server, name: "Backend" },
    { icon: TerminalSquare, name: "DevOps" },
];

function Logo() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/30">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="h-5 w-5 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
            </div>
            <span className="text-lg font-bold tracking-tight text-white">SkillPath</span>
        </div>
    );
}

export default function LandingPage() {
    return (
        <div className="relative min-h-screen overflow-x-hidden bg-[#0e1016] text-slate-100 selection:bg-indigo-500/30">
            {/* Ambient background glows */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="lp-animate-glow absolute -top-40 left-1/2 h-[560px] w-[860px] -translate-x-1/2 rounded-full bg-indigo-600/25 blur-[130px]" />
                <div className="absolute top-1/3 -left-40 h-[400px] w-[400px] rounded-full bg-violet-600/20 blur-[120px]" />
                <div className="absolute bottom-0 right-0 h-[420px] w-[420px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
            </div>

            {/* NAV */}
            <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0e1016]/70 backdrop-blur-xl">
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
                    <Logo />
                    <div className="hidden items-center gap-8 text-sm text-slate-400 md:flex">
                        <a href="#features" className="transition-colors hover:text-white">Features</a>
                        <a href="#how" className="transition-colors hover:text-white">How it works</a>
                        <a href="#categories" className="transition-colors hover:text-white">Categories</a>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white">
                            Log in
                        </Link>
                        <Link
                            href="/signup"
                            className="group inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-all hover:bg-indigo-50 hover:shadow-indigo-500/20"
                        >
                            Get started
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </nav>
            </header>

            {/* HERO */}
            <section className="relative">
                <div className="lp-grid-bg pointer-events-none absolute inset-0 -z-10" />
                <div className="mx-auto max-w-7xl px-6 pb-24 pt-20 md:pt-28">
                    <div className="mx-auto max-w-4xl text-center">
                        <div className="lp-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
                            Know your level. Own your growth.
                        </div>

                        <h1 className="lp-fade-up lp-delay-1 text-balance text-5xl font-extrabold leading-[1.05] tracking-tight text-white md:text-7xl">
                            Master your skills.
                            <br />
                            <span className="lp-gradient-text">Prove your level.</span>
                        </h1>

                        <p className="lp-fade-up lp-delay-2 mx-auto mt-6 max-w-2xl text-pretty text-lg text-slate-400 md:text-xl">
                            SkillPath turns fuzzy self-doubt into a clear map. Take adaptive assessments,
                            see exactly where you stand, and follow a path built to make you better — fast.
                        </p>

                        <div className="lp-fade-up lp-delay-3 mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/signup"
                                className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.03] hover:shadow-indigo-500/50 sm:w-auto"
                            >
                                Start for free
                                <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10 sm:w-auto"
                            >
                                I already have an account
                            </Link>
                        </div>

                        <p className="lp-fade-up lp-delay-4 mt-5 flex items-center justify-center gap-2 text-sm text-slate-500">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            No credit card. Just your curiosity.
                        </p>
                    </div>

                    {/* HERO VISUAL — mock dashboard */}
                    <div className="lp-fade-up lp-delay-5 relative mx-auto mt-16 max-w-5xl">
                        <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-b from-indigo-500/20 to-transparent blur-2xl" />
                        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#161922]/80 shadow-2xl backdrop-blur-xl">
                            {/* window chrome */}
                            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
                                <span className="h-3 w-3 rounded-full bg-red-400/70" />
                                <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                                <span className="h-3 w-3 rounded-full bg-green-400/70" />
                                <div className="ml-3 rounded-md bg-white/5 px-3 py-1 text-xs text-slate-500">skillpath.app/dashboard</div>
                            </div>
                            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
                                {/* stat cards */}
                                {[
                                    { label: "Tests completed", value: "24", sub: "+4 this week", color: "text-indigo-400" },
                                    { label: "Current level", value: "Intermediate", sub: "top 18%", color: "text-violet-400" },
                                    { label: "Accuracy", value: "87%", sub: "+6% this mo.", color: "text-emerald-400" },
                                ].map((s) => (
                                    <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                                        <p className="text-xs text-slate-500">{s.label}</p>
                                        <p className="mt-1 text-2xl font-bold text-white">{s.value}</p>
                                        <p className={`mt-1 text-xs font-medium ${s.color}`}>{s.sub}</p>
                                    </div>
                                ))}
                                {/* radar mock */}
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:col-span-1">
                                    <p className="mb-2 text-xs text-slate-500">Skill radar</p>
                                    <div className="flex items-center justify-center">
                                        <RadarMock />
                                    </div>
                                </div>
                                {/* bar chart mock */}
                                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 md:col-span-2">
                                    <p className="mb-3 text-xs text-slate-500">Weekly activity</p>
                                    <div className="flex h-[132px] items-end gap-2.5">
                                        {[42, 68, 35, 80, 55, 92, 74].map((h, i) => (
                                            <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
                                                <div
                                                    className="w-full rounded-md bg-gradient-to-t from-indigo-600/40 to-violet-500"
                                                    style={{ height: `${h}%` }}
                                                />
                                                <span className="text-[10px] text-slate-600">{["M", "T", "W", "T", "F", "S", "S"][i]}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* floating badges */}
                        <div className="lp-animate-float absolute -left-6 top-24 hidden rounded-xl border border-white/10 bg-[#1b1f2b] px-4 py-3 shadow-xl lg:block">
                            <div className="flex items-center gap-2">
                                <Trophy className="h-5 w-5 text-amber-400" />
                                <div>
                                    <p className="text-xs font-semibold text-white">Level up!</p>
                                    <p className="text-[11px] text-slate-500">Junior → Mid</p>
                                </div>
                            </div>
                        </div>
                        <div className="lp-animate-float-slow absolute -right-6 top-44 hidden rounded-xl border border-white/10 bg-[#1b1f2b] px-4 py-3 shadow-xl lg:block">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                                <div>
                                    <p className="text-xs font-semibold text-white">12 questions</p>
                                    <p className="text-[11px] text-slate-500">all correct</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* STATS STRIP */}
            <section className="border-y border-white/5 bg-white/[0.02]">
                <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-10 md:grid-cols-4">
                    {[
                        { value: "12+", label: "Skill categories" },
                        { value: "500+", label: "Curated questions" },
                        { value: "4", label: "Proficiency levels" },
                        { value: "∞", label: "Room to grow" },
                    ].map((s) => (
                        <div key={s.label} className="text-center">
                            <p className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-3xl font-extrabold text-transparent md:text-4xl">
                                {s.value}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="mx-auto max-w-7xl px-6 py-24">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Everything you need</p>
                    <h2 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                        A smarter way to grow
                    </h2>
                    <p className="mt-4 text-lg text-slate-400">
                        Stop guessing where you stand. SkillPath gives you the map, the compass, and the path.
                    </p>
                </div>

                <div className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map((f) => {
                        const Icon = f.icon;
                        return (
                            <div
                                key={f.title}
                                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-white/[0.05]"
                            >
                                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
                                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-inset ring-white/10">
                                    <Icon className="h-6 w-6 text-indigo-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-white">{f.title}</h3>
                                <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.desc}</p>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section id="how" className="relative border-y border-white/5 bg-white/[0.02]">
                <div className="mx-auto max-w-7xl px-6 py-24">
                    <div className="mx-auto max-w-2xl text-center">
                        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">How it works</p>
                        <h2 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                            Three steps to clarity
                        </h2>
                    </div>

                    <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
                        {steps.map((s, i) => {
                            const Icon = s.icon;
                            return (
                                <div key={s.n} className="relative">
                                    {i < steps.length - 1 && (
                                        <div className="absolute left-1/2 top-10 hidden h-px w-full bg-gradient-to-r from-indigo-500/40 to-transparent md:block" />
                                    )}
                                    <div className="relative flex flex-col items-center text-center">
                                        <div className="relative mb-5 flex h-20 w-20 items-center justify-center rounded-2xl border border-white/10 bg-[#161922] shadow-xl">
                                            <Icon className="h-8 w-8 text-indigo-300" />
                                            <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-xs font-bold text-white shadow-lg">
                                                {i + 1}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-semibold text-white">{s.title}</h3>
                                        <p className="mt-2 max-w-xs text-sm text-slate-400">{s.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CATEGORIES */}
            <section id="categories" className="mx-auto max-w-7xl px-6 py-24">
                <div className="mx-auto max-w-2xl text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400">Skill categories</p>
                    <h2 className="mt-3 text-4xl font-bold tracking-tight text-white md:text-5xl">
                        Test what matters
                    </h2>
                    <p className="mt-4 text-lg text-slate-400">From the fundamentals to the deep end — pick your battle.</p>
                </div>

                <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {categories.map((c) => {
                        const Icon = c.icon;
                        return (
                            <div
                                key={c.name}
                                className="group flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center transition-all hover:-translate-y-1 hover:border-indigo-500/40 hover:bg-white/[0.06]"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-inset ring-white/10 transition-transform group-hover:scale-110">
                                    <Icon className="h-6 w-6 text-indigo-300" />
                                </div>
                                <span className="text-sm font-medium text-slate-300">{c.name}</span>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* CTA */}
            <section className="mx-auto max-w-7xl px-6 pb-24">
                <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-600/30 via-violet-600/20 to-fuchsia-600/20 px-8 py-16 text-center shadow-2xl">
                    <div className="lp-grid-bg pointer-events-none absolute inset-0 opacity-40" />
                    <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-indigo-500/40 blur-[100px]" />
                    <div className="relative">
                        <h2 className="mx-auto max-w-2xl text-4xl font-extrabold tracking-tight text-white md:text-5xl">
                            Ready to find out how good you really are?
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
                            Join SkillPath and turn your next assessment into your next level.
                        </p>
                        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                            <Link
                                href="/signup"
                                className="group inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-semibold text-slate-900 shadow-xl transition-all hover:scale-[1.03] hover:bg-indigo-50"
                            >
                                Create your account
                                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                            </Link>
                            <Link
                                href="/login"
                                className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-base font-semibold text-white backdrop-blur transition-all hover:bg-white/10"
                            >
                                Log in
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-white/5">
                <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-6 py-10 md:flex-row">
                    <Logo />
                    <p className="text-sm text-slate-500">© 2026 SkillPath. Built to make you better.</p>
                    <div className="flex items-center gap-6 text-sm text-slate-400">
                        <Link href="/login" className="transition-colors hover:text-white">Log in</Link>
                        <Link href="/signup" className="transition-colors hover:text-white">Sign up</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}

/* Simple decorative SVG radar — no data, pure vibe */
function RadarMock() {
    const cx = 60;
    const cy = 55;
    const levels = [12, 24, 36];
    // pentagon points for the filled skill area
    const pts = [
        [60, 22],
        [96, 46],
        [82, 88],
        [38, 88],
        [24, 46],
    ];
    const poly = pts.map((p) => p.join(",")).join(" ");
    return (
        <svg viewBox="0 0 120 110" className="h-[120px] w-[120px]">
            {levels.map((r) => (
                <polygon
                    key={r}
                    points={pentagon(cx, cy, r)}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth="1"
                />
            ))}
            {pts.map((p, i) => (
                <line key={i} x1={cx} y1={cy} x2={pentagon(cx, cy, 36).split(" ")[i].split(",")[0]} y2={pentagon(cx, cy, 36).split(" ")[i].split(",")[1]} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            ))}
            <polygon points={poly} fill="rgba(129,140,248,0.25)" stroke="#818cf8" strokeWidth="1.5" />
            {pts.map((p, i) => (
                <circle key={i} cx={p[0]} cy={p[1]} r="2.2" fill="#a5b4fc" />
            ))}
        </svg>
    );
}

function pentagon(cx: number, cy: number, r: number) {
    const pts = [];
    for (let i = 0; i < 5; i++) {
        const angle = (Math.PI / 2) * -1 + (i * 2 * Math.PI) / 5;
        pts.push(`${(cx + r * Math.cos(angle)).toFixed(1)},${(cy + r * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(" ");
}
