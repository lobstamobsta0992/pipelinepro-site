"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldAlert,
  Zap,
  Lock,
  MessageSquare,
  Compass,
  AlertTriangle,
  ChevronRight,
  Database,
  ArrowUpRight,
  User,
  HelpCircle,
  Play,
  ArrowRight,
  Clock,
  Sparkles,
  BarChart3,
  Globe,
  Cpu,
} from "lucide-react";
import { startOnboarding, sendOnboardingMessage } from "../lib/api";

export default function Home() {
  // Live Trial Countdown State
  const [countdown, setCountdown] = useState({
    days: "04",
    hours: "23",
    minutes: "59",
    seconds: "59",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      let targetStr = localStorage.getItem("enigma_trial_target");
      let target = targetStr ? parseInt(targetStr) : 0;
      
      if (!target) {
        target = now + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000;
        localStorage.setItem("enigma_trial_target", target.toString());
      }

      const difference = target - now;

      if (difference <= 0) {
        clearInterval(timer);
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setCountdown({
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          minutes: m.toString().padStart(2, "0"),
          seconds: s.toString().padStart(2, "0"),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // E Chat Adapter Preview States
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [messages, setMessages] = useState<Array<{ sender: "user" | "e"; text: string }>>([
    {
      sender: "e",
      text: "Yo, I'm E. I don't give you generic textbook fluff. I watch the whales, study the cycles, and look for street-smart trading setups. What are we scanning today, partner?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Initialize onboarding on first load
  useEffect(() => {
    const init = async () => {
      try {
        const data = await startOnboarding();
        setUserId(data.userId);
        setMessages([{ sender: "e", text: data.message }]);
      } catch (err) {
        console.error("Failed to start onboarding:", err);
      }
    };
    init();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !userId) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const data = await sendOnboardingMessage(userId, userText, depth);
      
      setMessages((prev) => [...prev, { sender: "e", text: data.message }]);
      
      if (data.isComplete) {
        if (data.profile) {
          localStorage.setItem("enigma_user_profile", JSON.stringify(data.profile));
        }
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 2000);
      }
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { sender: "e", text: "System glitch. My brain is rebooting. Try again in a sec." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="min-h-screen bg-enigma-bg text-enigma-text flex flex-col font-sans">
      {/* 1. Bloomberg Style Live Cycle Ticker */}
      <div className="bg-[#0c0c12] border-b border-enigma-border py-2 px-4 overflow-hidden text-xs text-[#9ca3af] font-terminal relative z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-y-1 gap-x-6">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-enigma-purple animate-pulse"></span>
            <span className="text-enigma-purple font-semibold uppercase tracking-tighter">System Live:</span>
          </div>
          <div className="flex items-center space-x-6 overflow-x-auto whitespace-nowrap scrollbar-none flex-1 justify-end">
            <span className="hover:text-white transition-colors">
              BTC-USD <span className="text-enigma-green">$67,420.50 (+1.4%)</span>
            </span>
            <span className="hover:text-white transition-colors">
              ETH-USD <span className="text-enigma-green">$3,510.15 (+0.8%)</span>
            </span>
            <span className="hover:text-white transition-colors">
              SOL-USD <span className="text-enigma-red">$142.80 (-1.2%)</span>
            </span>
            <span className="border-l border-enigma-border pl-4">
              CYCLE: <span className="text-enigma-orange font-semibold">LATE BULL ACCUMULATION</span>
            </span>
            <span>
              SENTIMENT: <span className="text-enigma-green font-semibold">74 (GREED)</span>
            </span>
            <span className="border-l border-enigma-border pl-4 text-enigma-purple">
              TELEMETRY: <span className="text-white">12,500 ETH ($43.8M) moved to Exchange</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Custom Navigation Header */}
      <header className="border-b border-enigma-border bg-enigma-bg/80 backdrop-blur sticky top-0 z-40 py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-enigma-orange to-enigma-purple flex items-center justify-center font-bold text-white shadow-lg shadow-enigma-purple/20">
              Ξ
            </div>
            <div>
              <span className="font-terminal font-bold tracking-widest text-lg bg-gradient-to-r from-enigma-orange to-white bg-clip-text text-transparent uppercase">
                Enigma
              </span>
              <span className="font-sans font-light tracking-widest text-xs ml-1 text-[#9ca3af] hidden sm:inline">
                INTELLIGENCE
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center space-x-8 text-[10px] uppercase tracking-[0.2em] font-bold">
            <Link href="/how-it-works" className="text-enigma-text-dim hover:text-white transition-colors">
              How it Works
            </Link>
            <Link href="/methodology" className="text-enigma-text-dim hover:text-white transition-colors">
              Methodology
            </Link>
            <a href="#pricing" className="text-enigma-text-dim hover:text-white transition-colors">
              Pricing
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white text-black hover:bg-orange-500 hover:text-white font-bold rounded text-[10px] uppercase tracking-widest transition-all shadow-md flex items-center space-x-2"
            >
              <span>Launch Terminal</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section & E Chat Centerpiece */}
      <section className="relative py-16 md:py-24 px-6 border-b border-enigma-border overflow-hidden bg-gradient-to-b from-[#060608] to-[#0a0a0f]">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-enigma-orange/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-enigma-purple/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="inline-flex items-center space-x-2 bg-enigma-panel-light/60 border border-enigma-purple/30 rounded-full px-3 py-1 text-[10px] uppercase tracking-widest text-enigma-purple w-fit font-bold">
              <Sparkles className="w-3 h-3" />
              <span>Institutional Grade Intelligence • 5-Day Free Trial</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[0.9] text-white uppercase">
              DECODE THE <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">
                BLOCKCHAIN
              </span>{" "}
              MATRIX.
            </h1>

            <p className="text-[#9ca3af] text-lg leading-relaxed max-w-xl font-mono">
              Meet <strong className="text-white">E</strong>, your vertically integrated trading partner. Enigma monitors 5,000+ smart-money wallets and macro cycle telemetry to deliver high-probability alpha.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-8 py-4 bg-orange-600 text-white font-bold uppercase tracking-widest rounded hover:bg-orange-500 transition-all shadow-lg shadow-orange-900/20 text-center flex items-center justify-center space-x-2"
              >
                <span>Activate Elite Beta</span>
                <Play className="w-4 h-4 fill-current" />
              </Link>
              <Link
                href="/how-it-works"
                className="px-8 py-4 bg-transparent border border-gray-800 text-white font-bold uppercase tracking-widest rounded hover:bg-gray-900 transition-all text-center"
              >
                The Methodology
              </Link>
            </div>

            <div className="flex space-x-6 pt-8 text-[10px] text-gray-600 font-bold uppercase tracking-[0.2em]">
              <span>#CryptoAI</span>
              <span>#WhaleWatcher</span>
              <span>#TradingAlpha</span>
            </div>
          </div>

          {/* Interactive E Chat Centerpiece */}
          <div className="lg:col-span-7">
            <div className="bg-[#0d0d12] border border-gray-800 rounded shadow-2xl overflow-hidden flex flex-col h-[520px] relative">
              {/* Terminal Header */}
              <div className="bg-[#07070a] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-900"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-900"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-900"></div>
                  <span className="font-terminal text-[10px] uppercase tracking-widest text-gray-500 ml-2">E_BRAIN_V2_ENCRYPTED</span>
                </div>

                {/* Technical Depth Selector */}
                <div className="flex items-center bg-black border border-gray-800 rounded px-1 py-0.5">
                  <span className="text-[9px] text-gray-600 px-2 hidden sm:inline font-bold uppercase">Depth:</span>
                  <button
                    onClick={() => setDepth("beginner")}
                    className={`text-[9px] px-2 py-0.5 rounded transition-all uppercase font-bold ${
                      depth === "beginner" ? "bg-orange-600 text-white" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    Beg
                  </button>
                  <button
                    onClick={() => setDepth("intermediate")}
                    className={`text-[9px] px-2 py-0.5 rounded transition-all uppercase font-bold ${
                      depth === "intermediate" ? "bg-orange-600 text-white" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    Int
                  </button>
                  <button
                    onClick={() => setDepth("advanced")}
                    className={`text-[9px] px-2 py-0.5 rounded transition-all uppercase font-bold ${
                      depth === "advanced" ? "bg-orange-600 text-white" : "text-gray-500 hover:text-white"
                    }`}
                  >
                    Adv
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 font-mono text-xs leading-relaxed">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] p-4 rounded ${
                        msg.sender === "user"
                          ? "bg-[#1a1a24] text-white border border-gray-800"
                          : "bg-black text-gray-300 border border-gray-800"
                      }`}
                    >
                      {msg.sender === "e" && (
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="text-purple-500 font-bold uppercase tracking-widest">[E]</span>
                          <span className="text-[8px] px-1 bg-purple-900/20 border border-purple-800 rounded text-purple-400 font-bold uppercase">
                            Intelligence Core
                          </span>
                        </div>
                      )}
                      {msg.sender === "user" && (
                        <div className="text-right text-orange-500 font-bold uppercase tracking-widest mb-2">[TRADER]</div>
                      )}
                      <p className={msg.sender === "e" ? "text-gray-300" : "text-white"}>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-black text-gray-500 border border-gray-800 rounded p-4 font-mono">
                      <span className="animate-pulse">_PROCESSING...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#07070a] border-t border-gray-800 flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Initiate analysis protocol..."
                  className="flex-1 bg-black border border-gray-800 rounded px-4 py-3 text-[10px] uppercase font-mono text-white placeholder-gray-700 focus:outline-none focus:border-orange-600 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-gray-800 hover:bg-orange-600 text-white rounded font-bold text-[10px] uppercase tracking-widest transition-all"
                >
                  Execute
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Feature Snapshots Section */}
      <section className="py-24 px-6 border-b border-enigma-border bg-black">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid md:grid-cols-2 gap-24 items-center mb-32">
            <div>
              <h2 className="text-sm font-bold text-orange-500 uppercase tracking-[0.3em] mb-4">Phase 1 Integration</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase mb-6 leading-none">
                THE COMMAND <br />DASHBOARD
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 font-mono">
                A high-density UI designed for speed. Monitor whale feeds, cycle ratios, and AI signals from a single, vertically integrated war room.
              </p>
              <Link href="/how-it-works" className="text-white font-bold uppercase tracking-widest text-xs flex items-center group">
                Explore the Interface <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-purple-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative bg-[#0d0d12] border border-gray-800 rounded-lg overflow-hidden p-2">
                <img src="/screenshots/dashboard-preview.png" alt="Enigma Dashboard" className="rounded grayscale hover:grayscale-0 transition-all duration-700" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-24 items-center">
            <div className="order-2 md:order-1">
              <div className="bg-[#0d0d12] border border-gray-800 rounded-lg overflow-hidden p-8 font-mono text-[10px] space-y-4">
                <div className="flex justify-between border-b border-gray-900 pb-4">
                  <span className="text-gray-600 uppercase">Metric</span>
                  <span className="text-gray-600 uppercase">Accuracy</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white uppercase">Whale classification</span>
                  <span className="text-green-500 font-bold">94.2%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white uppercase">Cycle Top Precision</span>
                  <span className="text-green-500 font-bold">88.7%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white uppercase">Sentiment Alpha</span>
                  <span className="text-green-500 font-bold">72.1%</span>
                </div>
                <div className="pt-4">
                  <Link href="/methodology" className="bg-white/5 hover:bg-white/10 text-white w-full py-3 block text-center rounded uppercase tracking-widest font-bold">
                    View Full Methodology
                  </Link>
                </div>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-sm font-bold text-purple-500 uppercase tracking-[0.3em] mb-4">Quantitative Alpha</h2>
              <h3 className="text-4xl md:text-5xl font-extrabold text-white tracking-tighter uppercase mb-6 leading-none">
                BACKTESTED <br />PRECISION.
              </h3>
              <p className="text-gray-500 text-lg leading-relaxed mb-8 font-mono">
                We don't trade on hope. Our AI core analyzes historical cycle tops and bottom-formation telemetry to map high-probability signatures.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-[#09090e] border-b border-enigma-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.4em] mb-4 font-mono">Subscription Access</h2>
            <h3 className="text-4xl font-extrabold text-white tracking-tighter uppercase mb-4">Choose Your Tier</h3>
            <p className="text-gray-500 font-mono text-sm">
              All tiers include a 5-day Elite trial upon initial activation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pro Plan */}
            <div className="bg-[#0d0d12] border border-gray-800 p-10 rounded hover:border-orange-600 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Enigma Pro</h3>
              <div className="text-4xl font-extrabold text-white mb-8">$49<span className="text-xs text-gray-600 font-normal">/mo</span></div>
              <ul className="space-y-4 text-[10px] uppercase tracking-widest text-gray-500 flex-1 font-bold">
                <li className="flex items-center text-white"><ChevronRight className="w-3 h-3 text-orange-600 mr-2" /> 20 Daily Intelligence Messages</li>
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-orange-600 mr-2" /> Full Cycle Intelligence Panel</li>
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-orange-600 mr-2" /> Real-time Whale Alerts (&gt;$1M)</li>
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-orange-600 mr-2" /> Advanced Research Tools</li>
              </ul>
              <Link href="/dashboard" className="mt-10 w-full py-4 bg-orange-600 text-white text-center font-bold uppercase tracking-[0.2em] text-[10px] rounded hover:bg-orange-500 transition-colors">
                Start Pro Trial
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-[#0d0d12] border-2 border-purple-600 p-10 rounded relative flex flex-col transform scale-105 shadow-2xl shadow-purple-900/20">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-purple-600 rounded text-[9px] text-white font-bold tracking-[0.3em] uppercase">
                Most Powerful
              </div>
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter">Enigma Elite</h3>
              <div className="text-4xl font-extrabold text-white mb-8">$149<span className="text-xs text-gray-600 font-normal">/mo</span></div>
              <ul className="space-y-4 text-[10px] uppercase tracking-widest text-gray-500 flex-1 font-bold">
                <li className="flex items-center text-white"><ChevronRight className="w-3 h-3 text-purple-600 mr-2" /> Unlimited E-Brain Messages</li>
                <li className="flex items-center text-white"><ChevronRight className="w-3 h-3 text-purple-600 mr-2" /> Full Market Scanner (200+ Assets)</li>
                <li className="flex items-center text-white"><ChevronRight className="w-3 h-3 text-purple-600 mr-2" /> Coinbase Auto-Trading Engine</li>
                <li className="flex items-center text-white"><ChevronRight className="w-3 h-3 text-purple-600 mr-2" /> Early Signal & Whale Alerts (&gt;$500k)</li>
              </ul>
              <Link href="/dashboard" className="mt-10 w-full py-4 bg-purple-600 text-white text-center font-bold uppercase tracking-[0.2em] text-[10px] rounded hover:bg-purple-500 transition-colors shadow-lg">
                Activate Elite Beta
              </Link>
            </div>

            {/* Free Plan */}
            <div className="bg-[#0d0d12] border border-gray-800 p-10 rounded hover:border-gray-600 transition-all flex flex-col">
              <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-tighter text-gray-400">Enigma Free</h3>
              <div className="text-4xl font-extrabold text-gray-400 mb-8">$0<span className="text-xs text-gray-600 font-normal">/mo</span></div>
              <ul className="space-y-4 text-[10px] uppercase tracking-widest text-gray-700 flex-1 font-bold">
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-gray-800 mr-2" /> 2 Daily Intelligence Messages</li>
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-gray-800 mr-2" /> Delayed Whale alerts (&gt;$10M)</li>
                <li className="flex items-center"><ChevronRight className="w-3 h-3 text-gray-800 mr-2" /> Restricted Dashboard Access</li>
              </ul>
              <Link href="/dashboard" className="mt-10 w-full py-4 bg-transparent border border-gray-800 text-gray-400 text-center font-bold uppercase tracking-[0.2em] text-[10px] rounded hover:bg-gray-900 transition-colors">
                Launch Preview
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-900 bg-black py-20 px-6 text-[10px] text-gray-600 font-bold uppercase tracking-[0.3em]">
        <div className="max-w-[1400px] mx-auto grid md:grid-cols-4 gap-12">
          <div className="col-span-2">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center font-bold text-white text-[10px]">Ξ</div>
              <span className="text-white tracking-[0.4em]">Enigma Intelligence</span>
            </div>
            <p className="max-w-sm leading-loose">
              Enigma is a non-custodial intelligence platform. We provide blockchain telemetry and AI analysis for educational purposes. All automated trading involves risk.
            </p>
          </div>
          <div>
            <h4 className="text-white mb-6">Resources</h4>
            <ul className="space-y-4">
              <li><Link href="/how-it-works" className="hover:text-orange-500 transition-colors">How it Works</Link></li>
              <li><Link href="/methodology" className="hover:text-orange-500 transition-colors">Methodology</Link></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white mb-6">Connect</h4>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-orange-500 transition-colors">Twitter / X</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Discord Community</a></li>
              <li><a href="#" className="hover:text-orange-500 transition-colors">Support Portal</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1400px] mx-auto border-t border-gray-900 mt-20 pt-8 flex justify-between">
          <span>© 2026 ENIGMA INTEL SYSTEMS</span>
          <span>EST. LATENCY: 24MS</span>
        </div>
      </footer>

      {/* 7. Live 5-Day Trial Countdown Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c12] border-t border-orange-600/40 p-3.5 z-50 shadow-2xl backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-y-3">
          <div className="flex items-center space-x-4">
            <div className="w-2 h-2 rounded-full bg-orange-600 animate-ping"></div>
            <span className="font-mono text-white text-[10px] uppercase tracking-[0.2em] font-bold">
              Limited Elite Trial Pool Active
            </span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2 font-mono text-xs">
              <span className="text-gray-600 uppercase font-bold text-[9px]">Expiring:</span>
              <div className="flex space-x-1">
                <span className="bg-black border border-gray-800 px-2 py-1 rounded text-white font-bold">{countdown.days}D</span>
                <span className="bg-black border border-gray-800 px-2 py-1 rounded text-white font-bold">{countdown.hours}H</span>
                <span className="bg-black border border-gray-800 px-2 py-1 rounded text-orange-600 font-bold">{countdown.minutes}M</span>
                <span className="bg-black border border-gray-800 px-2 py-1 rounded text-orange-600 font-bold">{countdown.seconds}S</span>
              </div>
            </div>

            <Link
              href="/dashboard"
              className="px-6 py-2 bg-white text-black hover:bg-orange-600 hover:text-white font-bold text-[10px] uppercase tracking-[0.2em] rounded transition-all flex items-center space-x-2 shadow-md shadow-orange-900/10"
            >
              <span>Secure Slot</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
