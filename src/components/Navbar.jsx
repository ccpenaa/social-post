"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { FaCrown, FaBars, FaTimes, FaImages, FaTag, FaCoins, FaMagic } from "react-icons/fa";
import { SiVercel } from "react-icons/si";

const DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https://github.com/SamurAIGPT/social-post";

const NAV_LINKS = [
  { href: "/", label: "Studio", icon: <FaMagic className="text-xs" /> },
  { href: "/gallery", label: "Gallery", icon: <FaImages className="text-xs" /> },
  { href: "/pricing", label: "Pricing", icon: <FaTag className="text-xs" /> },
];

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <FaMagic className="text-white text-xs" />
          </div>
          <span className="font-bold text-sm text-white tracking-tight hidden sm:block">
            AI Social <span className="text-gradient-purple">Post</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                pathname === link.href
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Right */}
        <div className="hidden md:flex items-center gap-2">
          {/* Deploy Button */}
          <a
            href={DEPLOY_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all border border-zinc-700"
          >
            <SiVercel className="text-xs" />
            Deploy
          </a>

          {session ? (
            <div className="flex items-center gap-2">
              {/* Credits badge */}
              <Link
                href="/pricing"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all animate-pulse-border"
              >
                <FaCoins className="text-[10px]" />
                {session.user.credits ?? 0}
              </Link>
              {/* Avatar */}
              <div className="relative group">
                <img
                  src={session.user.image || ""}
                  alt={session.user.name || "User"}
                  className="w-7 h-7 rounded-full border border-zinc-700 cursor-pointer hover:border-purple-500 transition-all object-cover"
                />
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl p-3 w-44 z-50 animate-slide-up">
                  <p className="text-xs text-zinc-300 font-medium truncate mb-2">{session.user.name}</p>
                  <p className="text-[10px] text-zinc-500 truncate mb-3">{session.user.email}</p>
                  <button
                    onClick={() => signOut()}
                    className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 py-1.5 px-2 rounded-lg transition-all text-left"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              id="navbar-signin-btn"
              onClick={() => signIn("google")}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-lg hover:shadow-purple-500/20"
            >
              Sign in with Google
            </button>
          )}
        </div>

        {/* Mobile: Credits + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {session && (
            <Link
              href="/pricing"
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold"
            >
              <FaCoins className="text-[10px]" />
              {session.user.credits ?? 0}
            </Link>
          )}
          <button
            id="navbar-hamburger-btn"
            onClick={() => setMenuOpen((p) => !p)}
            className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 z-[200] bg-zinc-950/98 backdrop-blur-md border-b border-zinc-800 shadow-2xl md:hidden">
          <div className="px-4 py-4 flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  pathname === link.href
                    ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                    : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="border-t border-zinc-800 my-2" />

            {session ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img
                    src={session.user.image || ""}
                    alt={session.user.name || ""}
                    className="w-8 h-8 rounded-full border border-zinc-700 object-cover"
                  />
                  <div>
                    <p className="text-xs font-medium text-zinc-300">{session.user.name}</p>
                    <p className="text-[10px] text-zinc-500">{session.user.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => { signOut(); setMenuOpen(false); }}
                  className="text-xs text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { signIn("google"); setMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-bold"
              >
                Sign in with Google
              </button>
            )}

            {/* Deploy button in mobile */}
            <a
              href={DEPLOY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium transition-all mt-1 border border-zinc-700"
            >
              <SiVercel className="text-sm" />
              Deploy to Vercel
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
