"use client";

import { useSession, signIn } from "next-auth/react";
import { useState } from "react";
import Navbar from "@/components/Navbar";
import { useSearchParams } from "next/navigation";
import {
  FaCrown,
  FaCheckCircle,
  FaCoins,
  FaSpinner,
  FaGoogle,
  FaBolt,
} from "react-icons/fa";
import { Suspense } from "react";

const PLANS = [
  {
    id: "basic",
    name: "Basic Pack",
    credits: 1000,
    price: 5,
    priceInCents: 500,
    posts: 250,
    badge: null,
    accent: "zinc",
    features: ["1,000 Credits", "~250 Social Posts", "LinkedIn, X, FB & IG Formats", "Emoji & Hashtag Toggles", "One-Click Copy"],
  },
  {
    id: "standard",
    name: "Standard Pack",
    credits: 2000,
    price: 10,
    priceInCents: 1000,
    posts: 500,
    badge: "Popular",
    accent: "purple",
    features: ["2,000 Credits", "~500 Social Posts", "LinkedIn, X, FB & IG Formats", "Emoji & Hashtag Toggles", "One-Click Copy", "Priority Customer Support"],
  },
  {
    id: "pro",
    name: "Pro Pack",
    credits: 4000,
    price: 20,
    priceInCents: 2000,
    posts: 1000,
    badge: "Best Value",
    accent: "purple",
    features: ["4,000 Credits", "~1,000 Social Posts", "LinkedIn, X, FB & IG Formats", "Emoji & Hashtag Toggles", "One-Click Copy", "Priority Customer Support"],
  },
  {
    id: "business",
    name: "Business Pack",
    credits: 10000,
    price: 50,
    priceInCents: 5000,
    posts: 2500,
    badge: "Enterprise",
    accent: "zinc",
    features: ["10,000 Credits", "~2,500 Social Posts", "LinkedIn, X, FB & IG Formats", "Emoji & Hashtag Toggles", "One-Click Copy", "Priority Customer Support", "Bulk Volume Discount"],
  },
];

function PricingContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const canceled = searchParams.get("canceled");
  const [loading, setLoading] = useState(null);

  const handleCheckout = async (planId) => {
    if (!session?.user) { signIn("google"); return; }
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      alert("Failed to start checkout. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-10">
        {/* Success/Canceled Banners */}
        {success && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 animate-slide-up">
            <FaCheckCircle />
            <div>
              <p className="text-sm font-semibold">Payment successful!</p>
              <p className="text-xs opacity-80">Credits have been added to your account.</p>
            </div>
          </div>
        )}
        {canceled && (
          <div className="mb-6 p-4 rounded-2xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm animate-slide-up">
            Payment was canceled. You can try again anytime.
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-4 animate-pulse-border">
            <FaBolt className="text-[10px]" />
            One-Time Purchase · No Subscription
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-3">
            Acquire Generation <span className="text-gradient-purple">Credits</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-md mx-auto leading-relaxed">
            Each professional social post costs just <strong className="text-purple-400">4 credits ($0.02)</strong>. Buy once, use anytime. Credits never expire.
          </p>
          {session?.user && (
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm shadow-md">
              <FaCoins className="text-purple-400 text-xs" />
              <span className="text-zinc-400">Your balance:</span>
              <span className="text-purple-400 font-bold">{session.user.credits} credits</span>
              <span className="text-zinc-600 text-xs">({Math.floor((session.user.credits ?? 0) / 4)} posts remaining)</span>
            </div>
          )}
        </div>

        {/* Plans grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const isPopular = plan.badge === "Popular";
            return (
              <div
                key={plan.id}
                className={`relative rounded-3xl p-5 flex flex-col border transition-all hover:scale-[1.02] ${
                  isPopular
                    ? "bg-gradient-to-b from-purple-500/10 to-zinc-900 border-purple-500/40 shadow-xl shadow-purple-500/5 glow-purple"
                    : "bg-zinc-900 border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {plan.badge && (
                  <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold ${
                    isPopular ? "bg-purple-500 text-white" : "bg-zinc-750 text-zinc-300 border border-zinc-700"
                  }`}>
                    {plan.badge}
                  </div>
                )}

                <div className="mb-4">
                  <h2 className="text-sm font-bold text-zinc-200">{plan.name}</h2>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-extrabold text-white">${plan.price}</span>
                    <span className="text-zinc-500 text-[10px]">one-time</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-2">
                    <FaCoins className="text-purple-400 text-[10px]" />
                    <span className="text-purple-300 font-semibold text-xs">{plan.credits.toLocaleString()} Credits</span>
                    <span className="text-zinc-500 text-[9px]">= {plan.posts.toLocaleString()} posts</span>
                  </div>
                </div>

                <ul className="flex flex-col gap-2 mb-5 flex-1 border-t border-zinc-850 pt-3">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-[10px] text-zinc-400">
                      <FaCheckCircle className="text-emerald-500 text-[9px] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  id={`checkout-${plan.id}-btn`}
                  onClick={() => handleCheckout(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isPopular
                      ? "bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white shadow-lg hover:shadow-purple-500/25"
                      : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 hover:border-zinc-600"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === plan.id ? (
                    <><FaSpinner className="animate-spin text-xs" /> Processing…</>
                  ) : !session ? (
                    <><FaGoogle className="text-[10px]" /> Sign in to Buy</>
                  ) : (
                    <><FaCrown className="text-[10px]" /> Get {plan.credits.toLocaleString()} Credits</>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQs */}
        <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { q: "How much is 1 social post?", a: "Each social post costs 4 credits, which is just $0.02. Incredibly affordable!" },
            { q: "Do credits expire?", a: "No! Credits are yours forever. Buy once and generate posts whenever you like." },
            { q: "Which networks are supported?", a: "We support customized outputs and preview feed layouts for LinkedIn, Twitter/X, Instagram, and Facebook." },
          ].map((faq) => (
            <div key={faq.q} className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-300 mb-2">{faq.q}</h3>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}
