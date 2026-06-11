"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Users,
  CheckSquare,
  StickyNote,
  MessageSquare,
  Image as ImageIcon,
  Zap,
} from "lucide-react";
import { MorphingText } from "@/components/magicui/morphing-text";
import { BentoGrid, BentoCard } from "@/components/ui/bento-grid";
import { createClient } from "@/lib/supabase/client";
import { getAvatarColor } from "@/lib/avatar-color";
import type { Profile } from "@/lib/supabase/types";

const HERO_WORDS = [
  "collaborate",
  "create",
  "organise",
  "build",
  "plan",
  "ship",
];

const FEATURES = [
  {
    name: "Real-time collaboration",
    description:
      "Every change appears instantly for your whole team. No refresh, no conflicts. Just flow.",
    Icon: Zap,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div
        className="absolute inset-0"
        style={{ background: "rgba(134, 211, 250, 0.24)" }}
      >
        <svg width="100%" height="100%" className="absolute inset-0 opacity-30">
          <defs>
            <pattern
              id="dots-rt"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <circle cx="2" cy="2" r="1.5" fill="#86d3fa" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-rt)" />
        </svg>
        <div
          className="absolute top-8 right-12 w-36 h-36 rounded-full animate-ping opacity-20"
          style={{ background: "#86d3fa", animationDuration: "3s" }}
        />
        <div
          className="absolute top-14 right-20 w-20 h-20 rounded-full animate-ping opacity-30"
          style={{
            background: "#86d3fa",
            animationDuration: "2s",
            animationDelay: "0.7s",
          }}
        />
        <div
          className="absolute top-20 right-10 w-10 h-10 rounded-full animate-ping opacity-40"
          style={{
            background: "#86d3fa",
            animationDuration: "1.5s",
            animationDelay: "0.3s",
          }}
        />
      </div>
    ),
  },
  {
    name: "Task tracking",
    description:
      "Create task lists, check items off, and celebrate with confetti when you're done.",
    Icon: CheckSquare,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div
        className="absolute inset-0 p-6 pt-8"
        style={{ background: "rgba(250, 173, 134, 0.22)" }}
      >
        <div className="w-full space-y-3 opacity-70 mt-2">
          {[
            ["Design review", true],
            ["Write copy", true],
            ["Ship v1", false],
          ].map(([, done], i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-4 h-4 rounded shrink-0 flex items-center justify-center"
                style={{
                  background: done ? "#faad86" : "transparent",
                  border: `2px solid ${done ? "#faad86" : "#faad8680"}`,
                }}
              >
                {done && (
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path
                      d="M1 4l2 2 4-4"
                      stroke="white"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <div
                className="h-2 rounded-full"
                style={{
                  width: `${75 - i * 14}%`,
                  background: done ? "#faad8660" : "#faad8630",
                }}
              />
            </div>
          ))}
        </div>
        <div className="absolute bottom-16 right-4 flex flex-wrap gap-1 w-20 opacity-30">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#faad86" }}
            />
          ))}
        </div>
      </div>
    ),
  },
  {
    name: "Rich post types",
    description:
      "Notes, questions, and task lists: express every kind of idea in its natural format.",
    Icon: StickyNote,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div
        className="absolute inset-0"
        style={{ background: "rgba(134, 250, 150, 0.22)" }}
      >
        <div className="absolute top-6 right-4 flex flex-col gap-2 opacity-60">
          {[
            ["Note", "#86fa96"],
            ["Task list", "#86d3fa"],
            ["Question", "#faad86"],
          ].map(([type, color], i) => (
            <div
              key={i}
              className="rounded-full px-3 py-1 text-[10px] font-semibold"
              style={{
                background: `${color}30`,
                color: "#262626",
                border: `1px solid ${color}60`,
              }}
            >
              {type}
            </div>
          ))}
        </div>
        <div className="absolute bottom-16 left-4 right-4 space-y-1.5 opacity-30">
          <div
            className="h-1.5 rounded-full w-full"
            style={{ background: "#86fa96" }}
          />
          <div
            className="h-1.5 rounded-full w-4/5"
            style={{ background: "#86fa96" }}
          />
          <div
            className="h-1.5 rounded-full w-3/5"
            style={{ background: "#86fa96" }}
          />
        </div>
      </div>
    ),
  },
  {
    name: "Threaded replies",
    description:
      "Keep conversations in context. Replies live inside the post they belong to.",
    Icon: MessageSquare,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div
        className="absolute inset-0"
        style={{ background: "rgba(255, 252, 237, 0.7)" }}
      >
        <div className="absolute top-6 right-3 flex flex-col gap-2 opacity-65 w-36">
          <div
            className="rounded-2xl rounded-tr-none px-3 py-2"
            style={{
              background: "rgba(134, 211, 250, 0.35)",
              border: "1px solid rgba(134, 211, 250, 0.4)",
            }}
          >
            <div
              className="h-1.5 rounded-full mb-1"
              style={{ background: "#86d3fa80", width: "100%" }}
            />
            <div
              className="h-1.5 rounded-full"
              style={{ background: "#86d3fa50", width: "70%" }}
            />
          </div>
          <div
            className="rounded-2xl rounded-tl-none px-3 py-2 self-end w-28"
            style={{
              background: "rgba(250, 173, 134, 0.35)",
              border: "1px solid rgba(250, 173, 134, 0.4)",
            }}
          >
            <div
              className="h-1.5 rounded-full mb-1"
              style={{ background: "#faad8680", width: "100%" }}
            />
            <div
              className="h-1.5 rounded-full"
              style={{ background: "#faad8650", width: "60%" }}
            />
          </div>
          <div
            className="rounded-2xl rounded-tr-none px-3 py-2 w-24"
            style={{
              background: "rgba(134, 250, 150, 0.35)",
              border: "1px solid rgba(134, 250, 150, 0.4)",
            }}
          >
            <div
              className="h-1.5 rounded-full"
              style={{ background: "#86fa9680", width: "80%" }}
            />
          </div>
        </div>
      </div>
    ),
  },
  {
    name: "Image attachments",
    description:
      "Drop a photo straight into a post. Perfect for mockups, screenshots, and inspiration.",
    Icon: ImageIcon,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-1",
    background: (
      <div
        className="absolute inset-0"
        style={{ background: "rgba(134, 211, 250, 0.20)" }}
      >
        <div
          className="absolute top-5 right-4 w-28 h-28 rounded-xl overflow-hidden opacity-65"
          style={{ border: "1px solid rgba(134, 211, 250, 0.5)" }}
        >
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(134,211,250,0.5) 0%, rgba(134,250,150,0.5) 100%)",
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-full"
              style={{ background: "rgba(255,255,255,0.6)" }}
            />
          </div>
        </div>
        <div
          className="absolute top-5 right-36 w-14 h-14 rounded-xl overflow-hidden opacity-40"
          style={{ border: "1px solid rgba(250,173,134,0.5)" }}
        >
          <div
            className="w-full h-full"
            style={{
              background:
                "linear-gradient(135deg, rgba(250,173,134,0.5) 0%, rgba(255,252,237,0.8) 100%)",
            }}
          />
        </div>
      </div>
    ),
  },
  {
    name: "Multiplayer boards",
    description:
      "Invite your whole team. Everyone sees the board live, all at once.",
    Icon: Users,
    href: "/login",
    cta: "Get started",
    className: "col-span-3 lg:col-span-2",
    background: (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{ background: "rgba(38, 38, 38, 0.07)" }}
      >
        <div className="grid grid-cols-4 gap-2.5 scale-110 rotate-6">
          {[...Array(12)].map((_, i) => {
            const colors = ["#86d3fa", "#faad86", "#86fa96", "#fffced"];
            return (
              <div
                key={i}
                className="w-12 h-16 rounded-xl opacity-65"
                style={{
                  background: colors[i % colors.length],
                  border: `1px solid ${colors[i % colors.length]}`,
                }}
              />
            );
          })}
        </div>
      </div>
    ),
  },
];

export function LandingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        setProfile(data);
      }
      setAuthChecked(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-jk-bg text-jk-text antialiased">
      {/* ── Hero ── */}
      <div
        className="relative overflow-hidden min-h-screen pb-16"
        style={{
          background: "linear-gradient(180deg, #2C353D 21.63%, #8F6E6F 100%)",
        }}
      >
        {/* ── Floating dark navbar ── */}
        <div className="relative z-50 top-0 flex justify-center pt-4 px-4">
          <nav className="flex items-center gap-6 bg-[#0c1a2e] text-white rounded-full px-5 py-2.5 shadow-[0_4px_24px_rgba(0,0,0,0.30)]">
            <Link href="/" className="flex items-center gap-2 mr-2">
              <Image
                src="/logo.png"
                alt="Jackal"
                width={24}
                height={24}
                className="w-6 h-6 rounded-md object-cover shrink-0"
              />
              <span className="font-semibold text-sm">Jackal</span>
            </Link>
            <Link
              href="#features"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Features
            </Link>
            <Link
              href="#features"
              className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block"
            >
              Pricing
            </Link>
            <div className="flex items-center gap-2 ml-2">
              {authChecked && profile ? (
                <Link
                  href="/welcome"
                  className="relative w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-xs font-semibold ring-2 ring-white/20 hover:ring-white/50 transition-all shrink-0"
                  style={{ backgroundColor: getAvatarColor(profile.id) }}
                  title={profile.display_name}
                >
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.display_name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    (profile.display_name?.[0]?.toUpperCase() ?? "?")
                  )}
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-sm text-white/70 hover:text-white transition-colors px-3 py-1.5"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login"
                    className="text-sm font-medium bg-[#0ea5e9] text-white rounded-full px-4 py-1.5 hover:bg-sky-400 transition-colors"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>

        {/* ── Hero text ── */}
        <section className="relative z-10 flex flex-col items-center text-center px-4 pt-14 pb-10">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span className="text-sm text-white/80 font-medium">
              Now in open beta
            </span>
          </div>

          <MorphingText texts={HERO_WORDS} className="text-white" />

          <p className="mt-6 text-lg text-white/55 max-w-lg leading-relaxed text-balance">
            Visual boards, task tracking, and real-time collaboration, all in
            one place. No setup. Just start.
          </p>

          <div className="mt-8">
            <Link
              href="/login"
              className="rounded-full bg-white text-[#1a1917] px-8 py-3.5 text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg"
            >
              Get started free
            </Link>
          </div>
        </section>

        {/* ── Hero image placeholder ── */}
        {/* Replace this div with an <img> or <Image> when ready */}
        <div className="relative z-10 px-4 sm:px-6 max-w-5xl mx-auto">
          <div
            className="w-full rounded-t-2xl"
            style={{
              height: "504px",
              background: "rgba(255,255,255,0.04)",
              border: "1px dashed rgba(255,255,255,0.15)",
            }}
          />
        </div>

        {/* ── Scroll-through blur ── */}
        <div
          className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none"
          style={{
            height: "240px",
            backdropFilter: "blur(20px) saturate(0.75)",
            WebkitBackdropFilter: "blur(20px) saturate(0.75)",
            maskImage: "linear-gradient(to bottom, transparent 0%, black 40%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 40%)",
          }}
        />
      </div>

      {/* ── Bento grid features ── */}
      <section
        id="features"
        className="px-4 sm:px-8 max-w-5xl mx-auto pt-16 pb-24"
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-balance">
            Everything your team needs
          </h2>
          <p className="mt-3 text-jk-text-muted">
            Built for how teams actually work, together.
          </p>
        </div>

        <BentoGrid>
          {FEATURES.map((f) => (
            <BentoCard key={f.name} {...f} />
          ))}
        </BentoGrid>
      </section>

      {/* ── CTA strip ── */}
      <section className="border-t border-jk-border py-20 text-center px-4">
        <h2 className="text-3xl font-bold tracking-tight mb-3 text-balance">
          Ready to bring your team together?
        </h2>
        <p className="text-jk-text-muted mb-8">
          Free to get started. No credit card required.
        </p>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-full bg-[#0ea5e9] text-white px-8 py-3.5 text-sm font-semibold hover:bg-sky-400 transition-colors shadow-sm"
        >
          Get started for free
        </Link>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-jk-border py-8 px-4 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 text-sm text-jk-text-muted">
          <Image
            src="/logo.png"
            alt="Jackal"
            width={20}
            height={20}
            className="w-5 h-5 rounded-md object-cover"
          />
          Jackal © {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-6 text-sm text-jk-text-muted">
          <Link
            href="/login"
            className="hover:text-jk-accent transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/login"
            className="hover:text-jk-accent transition-colors"
          >
            Sign up
          </Link>
        </div>
      </footer>
    </div>
  );
}
