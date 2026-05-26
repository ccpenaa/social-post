"use client";

import { useSession, signIn } from "next-auth/react";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import {
  FaCrown,
  FaMagic,
  FaCopy,
  FaCheck,
  FaSpinner,
  FaRegClipboard,
  FaHistory,
  FaGlobe,
  FaLinkedin,
  FaTwitter,
  FaFacebook,
  FaInstagram,
  FaChevronDown,
  FaChevronUp,
  FaGoogle,
} from "react-icons/fa";
import { SOCIAL_PLATFORMS, SOCIAL_TONES } from "@/lib/config";

function StatusBadge({ status }) {
  if (status === "processing")
    return (
      <span className="flex items-center gap-1.5 text-xs text-purple-400 font-medium">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse-dot" />
        Processing…
      </span>
    );
  if (status === "completed")
    return (
      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
        <FaCheck className="text-[10px]" />
        Completed
      </span>
    );
  return (
    <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium">
      Failed
    </span>
  );
}

export default function WorkspacePage() {
  const { data: session, status: authStatus, update: updateSession } = useSession();

  const [topic, setTopic] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState(SOCIAL_PLATFORMS[0]);
  const [selectedTone, setSelectedTone] = useState(SOCIAL_TONES[0]);
  const [includeEmojis, setIncludeEmojis] = useState(true);
  const [includeHashtags, setIncludeHashtags] = useState(true);

  const [platformOpen, setPlatformOpen] = useState(false);
  const [toneOpen, setToneOpen] = useState(false);

  const platformRef = useRef(null);
  const toneRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (platformRef.current && !platformRef.current.contains(event.target)) {
        setPlatformOpen(false);
      }
      if (toneRef.current && !toneRef.current.contains(event.target)) {
        setToneOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [currentCreation, setCurrentCreation] = useState(null);
  const [recentCreations, setRecentCreations] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pollingId, setPollingId] = useState(null);
  
  const pollingRef = useRef(null);
  const creditCost = 4;

  // Fetch recent creations
  const fetchCreations = useCallback(async () => {
    if (!session?.user) return;
    try {
      const res = await fetch("/api/creations");
      if (res.ok) {
        const data = await res.json();
        setRecentCreations(data.slice(0, 6));
        const any = data.some((c) => c.status === "processing");
        return any;
      }
    } catch {}
    return false;
  }, [session]);

  useEffect(() => {
    if (!session?.user) return;
    setLoadingHistory(true);
    fetchCreations().finally(() => setLoadingHistory(false));
    const interval = setInterval(async () => {
      const anyProcessing = await fetchCreations();
      if (anyProcessing) updateSession();
    }, 4000);
    return () => clearInterval(interval);
  }, [session, fetchCreations, updateSession]);

  // Poll for current job
  useEffect(() => {
    if (!pollingId) return;
    pollingRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/creations?requestId=${pollingId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.status === "completed") {
            // Find creation
            const updatedCreation = data.creation;
            setCurrentCreation(updatedCreation);
            setPollingId(null);
            clearInterval(pollingRef.current);
            fetchCreations();
            updateSession();
          } else if (data.status === "failed") {
            setError(data.error || "Generation failed. Credits refunded.");
            setPollingId(null);
            clearInterval(pollingRef.current);
            fetchCreations();
            updateSession();
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [pollingId, fetchCreations, updateSession]);

  const handleGenerate = async () => {
    if (!session?.user) return;
    if (!topic || topic.trim() === "") {
      setError("Please describe what your post is about.");
      return;
    }

    setGenerating(true);
    setError("");
    setCopied(false);

    try {
      const res = await fetch("/api/creations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          platformId: selectedPlatform.id,
          toneId: selectedTone.id,
          includeEmojis,
          includeHashtags,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text);
      }

      const creation = await res.json();
      setCurrentCreation(creation);

      if (creation.status === "processing" && creation.requestId) {
        setPollingId(creation.requestId);
      } else {
        setGenerating(false);
        fetchCreations();
        updateSession();
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred.");
      setGenerating(false);
    }
  };

  useEffect(() => {
    if (currentCreation && currentCreation.status === "completed") {
      setGenerating(false);
    }
  }, [currentCreation]);

  const getParsedText = (creation) => {
    if (!creation || !creation.resultText) return null;
    try {
      return JSON.parse(creation.resultText);
    } catch {
      return { postText: creation.resultText, headline: "AI Social Post", suggestedHashtags: [] };
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentParsed = getParsedText(currentCreation);
  const canGenerate = topic && topic.trim() !== "" && !generating && (session?.user?.credits ?? 0) >= creditCost;

  // Render platform specific preview mock card
  const renderPreviewMock = () => {
    if (!currentCreation || currentCreation.status === "processing") {
      // Shimmer Skeleton
      return (
        <div className="border border-zinc-800 bg-zinc-900/40 rounded-2xl p-6 glow-purple animate-float max-w-lg mx-auto w-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-zinc-800 shimmer" />
            <div className="flex-1">
              <div className="h-3 bg-zinc-800 rounded shimmer w-1/3 mb-2" />
              <div className="h-2 bg-zinc-800 rounded shimmer w-1/5" />
            </div>
          </div>
          <div className="space-y-3 mb-4">
            <div className="h-3 bg-zinc-800 rounded shimmer w-full" />
            <div className="h-3 bg-zinc-800 rounded shimmer w-5/6" />
            <div className="h-3 bg-zinc-800 rounded shimmer w-4/5" />
          </div>
          <div className="h-36 bg-zinc-800/50 rounded-xl shimmer w-full" />
        </div>
      );
    }

    const data = currentParsed;
    if (!data) return null;

    const userAvatar = session?.user?.image || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200";
    const userName = session?.user?.name || "AI Copywriter";

    if (currentCreation.platform === "LinkedIn") {
      return (
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white hover:text-purple-400 transition-colors cursor-pointer">{userName}</h4>
                <p className="text-[10px] text-zinc-400">Social Media Expert • 1st</p>
                <p className="text-[9px] text-zinc-500">2h • Edited • 🌐</p>
              </div>
            </div>
            <span className="text-zinc-500 text-xs font-bold hover:bg-zinc-800 px-2 py-1 rounded cursor-pointer">•••</span>
          </div>
          {/* Body */}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3">
            {data.postText}
          </div>
          {/* Footer stats */}
          <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[10px] text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-[8px] text-white">👍</span>
                <span className="w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center text-[8px] text-white">💡</span>
              </span>
              42 likes
            </span>
            <span>12 comments • 3 shares</span>
          </div>
        </div>
      );
    }

    if (currentCreation.platform === "Twitter / X") {
      const textLen = data.postText.length;
      return (
        <div className="border border-zinc-800 bg-black rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex gap-2">
              <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white flex items-center gap-1">
                  {userName} 
                  <span className="w-3.5 h-3.5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[7px]">✔</span>
                </h4>
                <p className="text-[10px] text-zinc-500">@{userName.toLowerCase().replace(/\s+/g, "")}</p>
              </div>
            </div>
            <span className="text-zinc-500 font-bold text-xs hover:bg-zinc-900 px-2 py-1 rounded cursor-pointer">•••</span>
          </div>
          {/* Body */}
          <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3 font-sans">
            {data.postText}
          </div>
          {/* Timestamp */}
          <p className="text-[9px] text-zinc-500 mb-3 border-b border-zinc-800 pb-2">5:24 PM • May 26, 2026 • 12.4K Views</p>
          {/* Action Footer */}
          <div className="flex justify-between px-2 text-zinc-500 text-xs">
            <span>💬 24</span>
            <span>🔁 18</span>
            <span>❤️ 152</span>
            <span>🔖 8</span>
          </div>
          {textLen > 280 && (
            <div className="mt-3 text-[10px] text-amber-500 bg-amber-500/10 border border-amber-500/20 p-2 rounded">
              ⚠️ Warning: Post is {textLen} characters and exceeds Twitter's 280-character limit. Consider shortening or posting as a thread.
            </div>
          )}
        </div>
      );
    }

    if (currentCreation.platform === "Instagram") {
      return (
        <div className="border border-zinc-800 bg-zinc-900 rounded-xl max-w-lg mx-auto w-full text-zinc-100 text-left text-sm overflow-hidden animate-slide-up shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-zinc-850">
            <div className="flex items-center gap-2">
              <img src={userAvatar} alt="avatar" className="w-8 h-8 rounded-full object-cover border border-zinc-700" />
              <div>
                <h4 className="font-semibold text-xs text-white">{userName}</h4>
                <p className="text-[8px] text-zinc-400">Original Audio</p>
              </div>
            </div>
            <span className="text-zinc-400 font-bold text-xs cursor-pointer">•••</span>
          </div>
          {/* Mock Visual Banner */}
          <div className="aspect-video bg-gradient-to-tr from-purple-900/60 to-indigo-900/60 flex flex-col items-center justify-center p-6 border-b border-zinc-800 text-center relative">
            <div className="absolute top-2 right-2 bg-black/60 text-[9px] px-2 py-0.5 rounded-full text-zinc-300 font-medium">1/1</div>
            <FaMagic className="text-3xl text-purple-400 mb-2 animate-float" />
            <h5 className="font-bold text-sm text-white drop-shadow">{data.headline}</h5>
            <p className="text-[9px] text-zinc-300 mt-1 max-w-xs">{topic}</p>
          </div>
          {/* Actions */}
          <div className="p-3">
            <div className="flex justify-between mb-2 text-zinc-300 text-xs">
              <div className="flex gap-3">
                <span>❤️</span>
                <span>💬</span>
                <span>📤</span>
              </div>
              <span>🔖</span>
            </div>
            <p className="font-bold text-[10px] text-white mb-1.5">85 likes</p>
            {/* Caption */}
            <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs">
              <span className="font-bold text-white mr-1">{userName.toLowerCase().replace(/\s+/g, "")}</span>
              {data.postText}
            </div>
          </div>
        </div>
      );
    }

    // Facebook / generic
    return (
      <div className="border border-zinc-800 bg-zinc-900 rounded-xl p-4 max-w-lg mx-auto w-full text-zinc-100 text-left text-sm animate-slide-up shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2">
            <img src={userAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover border border-zinc-700" />
            <div>
              <h4 className="font-semibold text-xs text-white">{userName}</h4>
              <p className="text-[9px] text-zinc-400">2h • 🌐</p>
            </div>
          </div>
          <span className="text-zinc-500 text-xs font-bold hover:bg-zinc-800 px-2 py-1 rounded cursor-pointer">•••</span>
        </div>
        {/* Body */}
        <div className="whitespace-pre-wrap leading-relaxed text-zinc-200 text-xs mb-3">
          {data.postText}
        </div>
        {/* Reactions */}
        <div className="border-t border-zinc-800 pt-2 flex items-center justify-between text-[10px] text-zinc-400">
          <span>👍❤️ 89 reactions</span>
          <span>14 comments</span>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto max-w-7xl w-full mx-auto px-4 py-4 gap-4">
        {/* ─────────────── LEFT CONTROL PANEL ─────────────── */}
        <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-4 md:overflow-y-auto overflow-visible pb-4">
          
          {/* Scaffolding Form Card */}
          <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
              <FaMagic className="text-purple-500 text-xs" />
              Describe Your Post
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">What is this post about?</label>
                <textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. 3 strategies we used to scale our startup to 10k users in a month using dynamic automation..."
                  rows={4}
                  className="w-full text-xs bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
                />
              </div>

              {/* Platform Selector Dropdown */}
              <div className="relative" ref={platformRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Choose Platform</label>
                <button
                  type="button"
                  onClick={() => setPlatformOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{selectedPlatform.emoji}</span>
                    <span className="text-xs font-semibold">{selectedPlatform.name}</span>
                  </div>
                  {platformOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {platformOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {SOCIAL_PLATFORMS.map((platform) => {
                      const isSelected = selectedPlatform.id === platform.id;
                      return (
                        <button
                          key={platform.id}
                          type="button"
                          onClick={() => {
                            setSelectedPlatform(platform);
                            setPlatformOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{platform.emoji}</span>
                            <span className="text-xs">{platform.name}</span>
                          </div>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tone Selector Dropdown */}
              <div className="relative" ref={toneRef}>
                <label className="text-[10px] text-zinc-500 uppercase tracking-wider block mb-1">Select Tone of Voice</label>
                <button
                  type="button"
                  onClick={() => setToneOpen(prev => !prev)}
                  className="w-full flex items-center justify-between gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded-lg text-left text-zinc-200 hover:border-purple-500/40 focus:outline-none transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{selectedTone.emoji}</span>
                    <span className="text-xs font-semibold">{selectedTone.name}</span>
                  </div>
                  {toneOpen ? <FaChevronUp className="text-zinc-500 text-xs" /> : <FaChevronDown className="text-zinc-500 text-xs" />}
                </button>
                {toneOpen && (
                  <div className="absolute z-50 w-full bg-zinc-900 border border-zinc-800 rounded-lg mt-1.5 py-1 shadow-2xl animate-slide-up overscroll-contain max-h-60 overflow-y-auto">
                    {SOCIAL_TONES.map((tone) => {
                      const isSelected = selectedTone.id === tone.id;
                      return (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => {
                            setSelectedTone(tone);
                            setToneOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 text-left hover:bg-zinc-800 transition-colors cursor-pointer ${
                            isSelected ? "bg-purple-500/10 text-purple-400 font-semibold" : "text-zinc-400"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">{tone.emoji}</span>
                            <span className="text-xs">{tone.name}</span>
                          </div>
                          {isSelected && <FaCheck className="text-[10px] text-purple-400" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Custom Sliding Toggle Switches */}
              <div className="border-t border-zinc-800 pt-3 flex flex-col gap-3">
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIncludeEmojis(p => !p)}>
                  <span className="text-xs text-zinc-400 font-medium">Include Emojis</span>
                  <button
                    type="button"
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none cursor-pointer ${
                      includeEmojis ? "bg-purple-600 shadow-md shadow-purple-500/10" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                        includeEmojis ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between cursor-pointer select-none" onClick={() => setIncludeHashtags(p => !p)}>
                  <span className="text-xs text-zinc-400 font-medium">Include Hashtags</span>
                  <button
                    type="button"
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors relative focus:outline-none cursor-pointer ${
                      includeHashtags ? "bg-purple-600 shadow-md shadow-purple-500/10" : "bg-zinc-800"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-all shadow-sm ${
                        includeHashtags ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Action Button */}
              <div className="border-t border-zinc-800 pt-3">
                {session ? (
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-zinc-500 mb-2">
                      <span>Cost per generation</span>
                      <span>Your balance</span>
                    </div>
                    <div className="flex items-center justify-between text-xs font-bold mb-3">
                      <span className="text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-lg">⚡ {creditCost} credits</span>
                      <span className={`px-2.5 py-1 rounded-lg border ${
                        (session.user.credits ?? 0) >= creditCost 
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                          : "text-rose-400 bg-rose-500/10 border-rose-500/20 animate-pulse"
                      }`}>
                        {session.user.credits ?? 0} credits
                      </span>
                    </div>

                    {error && (
                      <div className="mb-3 p-3 rounded bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2">
                        <span>⚠️</span>
                        <span className="flex-1 leading-normal">{error}</span>
                      </div>
                    )}

                    <button
                      onClick={handleGenerate}
                      disabled={!canGenerate}
                      className={`w-full py-2.5 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        canGenerate
                          ? "bg-gradient-to-r from-purple-600 via-fuchsia-600 to-indigo-600 hover:from-purple-500 hover:via-fuchsia-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-purple-500/30 hover:scale-[1.01] active:scale-[0.99] border-t border-purple-400/20"
                          : "bg-zinc-850 text-zinc-600 border border-zinc-800/80 cursor-not-allowed"
                      }`}
                    >
                      {generating ? (
                        <>
                          <FaSpinner className="animate-spin text-sm" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <FaMagic className="text-[10px]" />
                          Generate Social Post
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-zinc-500 text-center mb-3">Please sign in with Google to generate high-engagement social media posts.</p>
                    <button
                      onClick={() => signIn("google")}
                      className="w-full py-2.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-100 text-xs font-bold transition-all flex items-center justify-center gap-2 border border-zinc-700 cursor-pointer"
                    >
                      <FaGoogle />
                      Sign in with Google
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ─────────────── RIGHT PREVIEW PANEL ─────────────── */}
        <div className="flex-1 flex flex-col gap-4 md:overflow-hidden overflow-visible">
          
          {/* Main Showcase Preview */}
          <div className="flex-1 rounded bg-zinc-900 border border-zinc-800 overflow-hidden flex flex-col min-h-[400px]">
            {currentCreation ? (
              <div className="flex flex-col h-full">
                {/* Preview Header */}
                <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-300">Social Media Live Feed Preview</span>
                    <StatusBadge status={currentCreation.status} />
                  </div>
                  {currentCreation.status === "completed" && currentParsed && (
                    <button
                      onClick={() => handleCopy(currentParsed.postText)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-all cursor-pointer"
                    >
                      {copied ? (
                        <>
                          <FaCheck className="text-[10px] text-emerald-400" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <FaCopy className="text-[10px]" />
                          Copy Post
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Preview Frame */}
                <div className="flex-1 overflow-y-auto p-8 flex items-center justify-center bg-zinc-950/40">
                  {generating && currentCreation.status === "processing" ? (
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full border-2 border-purple-500/10 border-t-purple-500 animate-spin" />
                        <div className="absolute -inset-1 rounded-full border-2 border-purple-500/30 animate-ping" />
                      </div>
                      <div>
                        <p className="text-sm text-zinc-300 font-semibold">Creating your high-impact social post…</p>
                        <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-normal">MuAPI is running predictions using large language models. This takes 5-10 seconds.</p>
                      </div>
                    </div>
                  ) : (
                    renderPreviewMock()
                  )}
                </div>
              </div>
            ) : (
              /* Static Placeholder Showcase */
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-950/20 animate-slide-up">
                <div className="w-16 h-16 rounded-full bg-zinc-800/80 flex items-center justify-center shadow-lg border border-zinc-700/50 mb-4 animate-float">
                  <FaRegClipboard className="text-xl text-purple-500" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-300 mb-1">Generate High-Engagement Copies</h3>
                <p className="text-xs text-zinc-500 max-w-sm leading-relaxed mb-6">
                  Input your topic on the left, choose your platform and tone of voice, and generate optimized social posts in seconds.
                </p>
                <div className="grid grid-cols-2 gap-3 max-w-md w-full">
                  {SOCIAL_PLATFORMS.map((p, i) => (
                    <div key={i} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-left">
                      <span className="text-sm">{p.emoji}</span>
                      <div>
                        <h4 className="text-[10px] font-semibold text-zinc-300">{p.name} Format</h4>
                        <p className="text-[8px] text-zinc-600">Optimized structure</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* History Gallery list */}
          {recentCreations.length > 0 && (
            <div className="rounded bg-zinc-900 border border-zinc-800 p-4">
              <div className="flex items-center justify-between mb-3 border-b border-zinc-850 pb-2">
                <h3 className="text-xs font-bold text-zinc-400 flex items-center gap-2">
                  <FaHistory className="text-purple-500 text-xs" />
                  Recent Generations
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {recentCreations.map((c) => {
                  const data = getParsedText(c);
                  return (
                    <div
                      key={c.id}
                      onClick={() => c.status === "completed" && setCurrentCreation(c)}
                      className={`p-3 rounded-lg border text-left cursor-pointer transition-all hover:scale-[1.01] ${
                        currentCreation?.id === c.id
                          ? "bg-purple-500/5 border-purple-500/40"
                          : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10px] font-bold text-zinc-200 flex items-center gap-1.5">
                          <span>
                            {c.platform === "LinkedIn" ? "💼" : c.platform === "Instagram" ? "📸" : c.platform === "Twitter / X" ? "🐦" : "👥"}
                          </span>
                          {c.platform}
                        </span>
                        <span className="text-[8px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-semibold">{c.tone}</span>
                      </div>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 leading-relaxed mb-1.5">
                        {c.topic}
                      </p>
                      <p className="text-[8px] text-zinc-600">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
