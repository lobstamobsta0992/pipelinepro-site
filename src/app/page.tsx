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
} from "lucide-react";

export default function Home() {
  // Live Trial Countdown State (Simulating 5 days trial)
  const [countdown, setCountdown] = useState({
    days: "04",
    hours: "23",
    minutes: "59",
    seconds: "59",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      // Pre-set some future target for demonstration (always 5 days in future relative to first load, stored in localStorage)
      let targetStr = localStorage.getItem("enigma_trial_target");
      let target = targetStr ? parseInt(targetStr) : 0;
      
      if (!target) {
        target = now + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000; // 5 days + 4 mins
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

  // Pre-baked street-smart responses based on technical depth
  const getEResponse = (input: string, level: typeof depth) => {
    const query = input.toLowerCase();
    
    if (query.includes("btc") || query.includes("bitcoin") || query.includes("market") || query.includes("cycle")) {
      if (level === "beginner") {
        return "Bitcoin is currently in its 'Late Bull Accumulation' phase. Translation: The big money is quietly buying up the supply before the public FOMO kicks in. Watch the $65k level—if it holds, we head higher. Don't panic-sell the liquidations.";
      } else if (level === "intermediate") {
        return "BTC is defending key support at the 20-week EMA. The Pi Cycle Top indicator is still cool, meaning we aren't near a local peak. However, funding rates are slightly elevated. Whales are shifting stables into BTC, which usually signals a volatility expansion is imminent. Bias is long as long as $64,200 holds on a daily close.";
      } else {
        return "BTC/USD is forming a standard high-timeframe re-accumulation range. Weekly RSI is at 62, consolidating healthily. We've seen net negative exchange inflows for 12 consecutive days (-18k BTC). Derivative orderbooks show heavy bid depth clustered around the $63.8k liquidity pool. The MVRV Z-Score sits at 2.4—well below previous cycle tops of 6+, suggesting substantial expansion potential remains in this structural wave 5.";
      }
    }

    if (query.includes("whale") || query.includes("alert") || query.includes("smart money")) {
      if (level === "beginner") {
        return "Whales are just ultra-wealthy investors. I track their wallets in real-time. Just saw a massive whale deposit $42 Million worth of ETH onto Coinbase—usually this means they might want to sell, or use it as collateral. Keep your guard up.";
      } else if (level === "intermediate") {
        return "Smart money wallet address 0x5a9f just rotated $2.4M out of high-cap stables into high-beta SOL ecosystem tokens. Typically, these guys get in 3-5 days before the pump. I've flagged this movement inside the scanner. If you want the exact wallet tracking, grab the Elite tier.";
      } else {
        return "On-chain monitoring indicates institutional cluster wallets (linked to Cumberland/FalconX) transferred 45,000,000 USDC into Coinbase/Binance over the last 4 hours. Historically, Cumberland exchange transfers of this magnitude have a 84% correlation with a local market bottom (+4.2% average swing over 48h). Recommend tracking the 0x3d... wallet cluster for sub-500k entry points.";
      }
    }

    // Default response
    if (level === "beginner") {
      return "Interesting question. In crypto, you want to focus on risk management first. Let me know if you want to look at market cycles, check whale alerts, or scan some coins!";
    } else if (level === "intermediate") {
      return "Got it. Looking at the charts, volume is drying up on this consolidation. When volume declines during a flat range, it means a massive explosive move is cooking. Keep your stops tight and monitor whale wallet transfers.";
    } else {
      return "Understood. The macro structure exhibits a classic Wyckoff spring development. Volume profiling indicates a high volume node (HVN) at current levels, with a low volume node (LVN) directly below. I'm monitoring delta volume divergence to confirm institutional absorption.";
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { sender: "user", text: userText }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      const eText = getEResponse(userText, depth);
      setMessages((prev) => [...prev, { sender: "e", text: eText }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-enigma-bg text-enigma-text flex flex-col font-sans">
      {/* 1. Bloomberg Style Live Cycle Ticker */}
      <div className="bg-[#0c0c12] border-b border-enigma-border py-2 px-4 overflow-hidden text-xs text-[#9ca3af] font-terminal relative z-50">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between flex-wrap gap-y-1 gap-x-6">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2 h-2 rounded-full bg-enigma-purple animate-pulse"></span>
            <span className="text-enigma-purple font-semibold">E-LIVE FEED:</span>
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
              CYCLE PHASE: <span className="text-enigma-orange font-semibold">LATE BULL ACCUMULATION</span>
            </span>
            <span>
              FEAR & GREED: <span className="text-enigma-green font-semibold">74 (GREED)</span>
            </span>
            <span className="border-l border-enigma-border pl-4 text-enigma-purple">
              WHALE FEED: <span className="text-white">12,500 ETH ($43.8M) moved from cold wallet to exchange</span>
            </span>
          </div>
        </div>
      </div>

      {/* 2. Custom Navigation Header */}
      <header className="border-b border-enigma-border bg-enigma-bg/80 backdrop-blur sticky top-0 z-40 py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-enigma-orange to-enigma-purple flex items-center justify-center font-bold text-white shadow-lg shadow-enigma-purple/20">
              Ξ
            </div>
            <div>
              <span className="font-terminal font-bold tracking-widest text-lg bg-gradient-to-r from-enigma-orange to-white bg-clip-text text-transparent">
                ENIGMA
              </span>
              <span className="font-sans font-light tracking-widest text-xs ml-1 text-[#9ca3af] block sm:inline">
                INTELLIGENCE
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm">
            <a href="#about" className="text-enigma-text-dim hover:text-white transition-colors">
              Meet E
            </a>
            <a href="#features" className="text-enigma-text-dim hover:text-white transition-colors">
              Scanner & Tools
            </a>
            <a href="#lockouts" className="text-enigma-text-dim hover:text-white transition-colors">
              War Room Previews
            </a>
            <a href="#pricing" className="text-enigma-text-dim hover:text-white transition-colors">
              Pricing Plans
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:opacity-90 text-white font-medium rounded text-sm transition-all shadow-md shadow-enigma-orange/20 flex items-center space-x-2"
            >
              <span>Enter War Room</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* 3. Hero Section & E Chat Centerpiece */}
      <section className="relative py-16 md:py-24 px-6 border-b border-enigma-border overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/4 w-[300px] h-[300px] bg-enigma-orange/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-enigma-purple/10 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Tagline Column */}
          <div className="lg:col-span-5 flex flex-col space-y-6">
            <div className="inline-flex items-center space-x-2 bg-enigma-panel-light/60 border border-enigma-purple/30 rounded-full px-3 py-1 text-xs text-enigma-purple w-fit">
              <Sparkles className="w-3.5 h-3.5" />
              <span>5-Day Elite Free Trial Available • No Credit Card Required</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-[1.1] text-white">
              An AI-Centric <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-enigma-orange to-enigma-purple">
                Crypto Intelligence
              </span>{" "}
              Platform.
            </h1>

            <p className="text-[#9ca3af] text-lg leading-relaxed max-w-xl">
              Meet <strong className="text-white">E</strong>, your persistent, street-smart crypto trading partner.
              E monitors market cycles, tracks whale wallets, aggregates sentiment, and executes automation. E adapts
              to your knowledge level in real-time.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link
                href="/dashboard"
                className="px-6 py-3 bg-enigma-orange text-white font-medium rounded hover:bg-enigma-orange/90 transition-colors shadow-lg shadow-enigma-orange/20 text-center flex items-center justify-center space-x-2"
              >
                <span>Launch Elite Trial</span>
                <Play className="w-4 h-4 fill-current" />
              </Link>
              <a
                href="#pricing"
                className="px-6 py-3 bg-enigma-panel border border-enigma-border rounded text-enigma-text font-medium hover:bg-enigma-panel-light transition-colors text-center"
              >
                View Plans
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-enigma-border">
              <div>
                <span className="block text-2xl font-bold text-white">5 Days</span>
                <span className="text-xs text-enigma-text-dim">Elite Free Trial</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">200+ Coins</span>
                <span className="text-xs text-enigma-text-dim">Real-time Scanner</span>
              </div>
              <div>
                <span className="block text-2xl font-bold text-white">$500k+</span>
                <span className="text-xs text-enigma-text-dim">Whale Alert Cap</span>
              </div>
            </div>
          </div>

          {/* Interactive E Chat Centerpiece */}
          <div className="lg:col-span-7">
            <div className="bg-enigma-panel border border-enigma-border rounded-lg shadow-2xl overflow-hidden flex flex-col h-[520px]">
              {/* Terminal Header */}
              <div className="bg-[#07070a] px-4 py-3 border-b border-enigma-border flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-enigma-red"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-enigma-orange"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-enigma-green"></div>
                  <span className="font-terminal text-xs text-[#9ca3af] ml-2">E_SOUL_CONSOLE_v1.09</span>
                </div>

                {/* Technical Depth Selector */}
                <div className="flex items-center bg-enigma-bg border border-enigma-border rounded px-1 py-0.5">
                  <span className="text-[10px] text-enigma-text-dim px-2 hidden sm:inline">ADAPTER DEPTH:</span>
                  <button
                    onClick={() => setDepth("beginner")}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      depth === "beginner" ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                    }`}
                  >
                    Beginner
                  </button>
                  <button
                    onClick={() => setDepth("intermediate")}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      depth === "intermediate" ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                    }`}
                  >
                    Intermediate
                  </button>
                  <button
                    onClick={() => setDepth("advanced")}
                    className={`text-[10px] px-2 py-0.5 rounded transition-all ${
                      depth === "advanced" ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                    }`}
                  >
                    Advanced
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4 font-terminal text-xs leading-relaxed">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[85%] rounded p-3 ${
                        msg.sender === "user"
                          ? "bg-enigma-panel-light text-white border border-enigma-border"
                          : "bg-enigma-bg text-enigma-text border border-enigma-border"
                      }`}
                    >
                      {msg.sender === "e" && (
                        <div className="flex items-center space-x-1.5 mb-1 text-enigma-purple font-bold">
                          <span>E</span>
                          <span className="text-[9px] px-1 bg-enigma-purple/20 border border-enigma-purple/40 rounded text-enigma-purple font-normal">
                            AI PARTNER
                          </span>
                        </div>
                      )}
                      {msg.sender === "user" && (
                        <div className="text-right text-enigma-orange font-bold mb-1">TRADER</div>
                      )}
                      <p>{msg.text}</p>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-enigma-bg text-enigma-text border border-enigma-border rounded p-3">
                      <div className="flex items-center space-x-1.5 mb-1 text-enigma-purple font-bold">
                        <span>E</span>
                      </div>
                      <span className="inline-block w-2 h-4 bg-enigma-purple animate-pulse"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestions Helper */}
              <div className="px-6 py-2 bg-[#08080c] border-t border-enigma-border flex items-center space-x-2 overflow-x-auto whitespace-nowrap text-[10px]">
                <span className="text-enigma-text-dim font-terminal">QUICK TOPICS:</span>
                <button
                  onClick={() => setInputValue("What is the current BTC cycle status?")}
                  className="px-2 py-1 bg-enigma-panel border border-enigma-border rounded text-enigma-text hover:border-enigma-orange transition-colors"
                >
                  BTC Cycle Status
                </button>
                <button
                  onClick={() => setInputValue("Any whale alerts active right now?")}
                  className="px-2 py-1 bg-enigma-panel border border-enigma-border rounded text-enigma-text hover:border-enigma-orange transition-colors"
                >
                  Whale Alerts
                </button>
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-4 bg-[#07070a] border-t border-enigma-border flex space-x-3">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask E anything (e.g., 'Analyze BTC', 'Whale wallets tracker')..."
                  className="flex-1 bg-enigma-bg border border-enigma-border rounded px-4 py-3 text-xs font-terminal text-white placeholder-enigma-muted focus:outline-none focus:border-enigma-orange focus:ring-1 focus:ring-enigma-orange"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-enigma-orange hover:bg-enigma-orange/90 text-white rounded font-terminal text-xs transition-colors"
                >
                  EXECUTE
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Grid */}
      <section id="features" className="py-20 px-6 border-b border-enigma-border bg-[#09090e]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Elite Intelligence Capabilities</h2>
            <p className="text-enigma-text-dim">
              Enigma acts as a terminal wrapper. Deep live data feeds, real-time trigger scripts, and an AI execution engine working together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-purple/40 transition-colors">
              <Compass className="w-8 h-8 text-enigma-purple mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Cycle Intelligence</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Stay macro-aware. Track accumulation patterns, standard deviations from cycle bottoms, and structural exhaustion levels before markets rotate.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-orange/40 transition-colors">
              <ShieldAlert className="w-8 h-8 text-enigma-orange mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Real-time Whale Tracking</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Monitor whale activity over $500k in real-time. Know where smart money rotates capital before they execute on public orderbooks.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-green/40 transition-colors">
              <Zap className="w-8 h-8 text-enigma-green mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Auto-Trading Engine</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Elite automation. Seamlessly deploy E to execute automated buy and sell blocks on your Coinbase Advanced account based on real-time triggers.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-orange/40 transition-colors">
              <Database className="w-8 h-8 text-enigma-orange mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Market Scanner</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Instantly filter across 200+ leading coins. Detect momentum divergences, RSI extremes, and orderbook pressure within seconds.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-purple/40 transition-colors">
              <MessageSquare className="w-8 h-8 text-enigma-purple mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">E Chat Engine</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Your direct hotline to cycle data. Chat naturally with E to run scripts, calculate on-chain health, and plan execution strategies.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg hover:border-enigma-green/40 transition-colors">
              <Sparkles className="w-8 h-8 text-enigma-green mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Adaptive Adapter</h3>
              <p className="text-xs text-enigma-text-dim leading-relaxed">
                Beginner or advanced, E adapts. E explains complex derivative delta curves simply, or gives raw metrics, standard deviations, and MVRV stats dynamically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature Lockout Preview Sections */}
      <section id="lockouts" className="py-20 px-6 border-b border-enigma-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Elite Dashboard Preview</h2>
            <p className="text-enigma-text-dim">
              Get a teaser of the powerful premium intelligence tools reserved for our active trial and Elite tier members.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Locked Feature 1: Market Scanner */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-terminal tracking-wider">PREVIEW: MARKET SCANNER (200+ COINS)</span>
                <span className="px-2 py-0.5 bg-enigma-orange/20 border border-enigma-orange/40 rounded text-[10px] text-enigma-orange font-semibold">
                  ELITE ONLY
                </span>
              </div>

              {/* Blurred Mockup Grid */}
              <div className="relative border border-enigma-border rounded-lg bg-enigma-panel overflow-hidden h-[300px]">
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-[#060608]/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-enigma-orange/20 border border-enigma-orange/40 flex items-center justify-center mb-4 text-enigma-orange animate-bounce">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Market Scanner is Locked</h4>
                  <p className="text-xs text-enigma-text-dim max-w-md mb-4 leading-relaxed">
                    Instantly scan volume, RSI, and funding rates across 200+ high-beta coins. Free and Pro tiers have limited preview metrics.
                  </p>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-enigma-orange hover:bg-enigma-orange/90 text-white font-semibold text-xs rounded transition-colors"
                  >
                    Unlock with Elite Trial
                  </Link>
                </div>

                {/* Simulated Blurred Content */}
                <div className="p-4 space-y-3 font-terminal text-[10px] select-none pointer-events-none">
                  <div className="grid grid-cols-6 border-b border-enigma-border pb-2 text-[#9ca3af]">
                    <span>COIN</span>
                    <span>PRICE</span>
                    <span>24H</span>
                    <span>RSI (14)</span>
                    <span>FUNDING</span>
                    <span>ALERT</span>
                  </div>
                  {[
                    { coin: "BTC", price: "$67,420", change: "+1.4%", rsi: "58.2", fund: "+0.010%", alert: "COOL" },
                    { coin: "ETH", price: "$3,510", change: "+0.8%", rsi: "54.5", fund: "+0.005%", alert: "COOL" },
                    { coin: "SOL", price: "$142.8", change: "-1.2%", rsi: "38.1", fund: "+0.015%", alert: "OVERSOLD" },
                    { coin: "DOGE", price: "$0.141", change: "+4.2%", rsi: "71.4", fund: "+0.030%", alert: "OVERBOUGHT" },
                    { coin: "LINK", price: "$15.42", change: "+0.5%", rsi: "44.1", fund: "+0.002%", alert: "ACCUMULATION" },
                    { coin: "PEPE", price: "$0.000012", change: "+12.1%", rsi: "68.9", fund: "+0.045%", alert: "MOMENTUM" },
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-6 border-b border-enigma-border/40 py-2">
                      <span className="font-bold text-white">{row.coin}</span>
                      <span>{row.price}</span>
                      <span className="text-enigma-green">{row.change}</span>
                      <span>{row.rsi}</span>
                      <span>{row.fund}</span>
                      <span>{row.alert}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Locked Feature 2: Auto-Trading Engine */}
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-white font-terminal tracking-wider">PREVIEW: COINBASE AUTO-TRADING ENGINE</span>
                <span className="px-2 py-0.5 bg-enigma-purple/20 border border-enigma-purple/40 rounded text-[10px] text-enigma-purple font-semibold">
                  ELITE ONLY
                </span>
              </div>

              {/* Blurred Mockup Panel */}
              <div className="relative border border-enigma-border rounded-lg bg-enigma-panel overflow-hidden h-[300px]">
                {/* Lock Overlay */}
                <div className="absolute inset-0 bg-[#060608]/40 backdrop-blur-md z-10 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center mb-4 text-enigma-purple animate-pulse">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Auto-Trading Console is Locked</h4>
                  <p className="text-xs text-enigma-text-dim max-w-md mb-4 leading-relaxed">
                    Deploy E to scan real-time order blocks and automatically place Coinbase trade orders inside our high-speed secure sandbox.
                  </p>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 bg-enigma-purple hover:bg-enigma-purple/90 text-white font-semibold text-xs rounded transition-colors"
                  >
                    Unlock with Elite Trial
                  </Link>
                </div>

                {/* Simulated Blurred Content */}
                <div className="p-6 flex flex-col space-y-4 font-terminal text-[10px] select-none pointer-events-none">
                  <div className="flex justify-between items-center bg-enigma-bg p-4 border border-enigma-border rounded">
                    <div>
                      <div className="text-[#9ca3af]">COINBASE API STATUS:</div>
                      <div className="font-bold text-enigma-green text-xs">CONNECTED (SANDBOX)</div>
                    </div>
                    <div className="px-3 py-1.5 bg-enigma-muted rounded text-white">DEACTIVATE ENGINE</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-white font-bold">AUTOMATED EXECUTION LOGS:</div>
                    <div className="p-3 bg-[#060608] border border-enigma-border rounded h-[120px] overflow-hidden space-y-1.5 font-mono text-[9px] text-enigma-text-dim">
                      <div>[04:22:15] E ENGINE initialized... scanning cycles.</div>
                      <div>[04:22:18] WHALE TRANSFERS trigger detected on SOL/USDC pool.</div>
                      <div>[04:22:20] EXECUTION: BUY SOL block - Size: 15.2 SOL ($2,160 USD)</div>
                      <div>[04:22:21] Coinbase Order ID: 29a8f102-cb90... SOLD OUT. Success.</div>
                      <div>[04:23:05] Watching BTC support line...</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Premium Pricing Section */}
      <section id="pricing" className="py-20 px-6 bg-[#09090e] border-b border-enigma-border">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">Elite Pricing Tiers</h2>
            <p className="text-enigma-text-dim">
              Activate your 5-day Elite Free Trial to test drive full unlimited capabilities—no credit card required. Churn anytime.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-enigma-panel border border-enigma-border p-8 rounded-lg flex flex-col justify-between hover:border-enigma-muted transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Enigma Free</h3>
                <p className="text-xs text-enigma-text-dim mb-6">Preview tier to experience E's raw persona.</p>
                <div className="text-3xl font-extrabold text-white mb-6">
                  $0<span className="text-xs text-enigma-text-dim font-normal">/mo</span>
                </div>
                <ul className="space-y-3 text-xs text-enigma-text-dim border-t border-enigma-border pt-6 mb-8">
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>2 Daily Messages with E</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>Standard technical depth</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>Delayed Whale alerts (&gt;$10M)</span>
                  </li>
                  <li className="flex items-center space-x-2 line-through opacity-40">
                    <span className="text-enigma-orange">•</span>
                    <span>Live Market Scanner</span>
                  </li>
                  <li className="flex items-center space-x-2 line-through opacity-40">
                    <span className="text-enigma-orange">•</span>
                    <span>Coinbase Auto-Trading</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 bg-enigma-bg border border-enigma-border hover:bg-enigma-panel-light text-center text-xs font-semibold rounded transition-colors text-white"
              >
                Launch Free Dashboard
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-enigma-panel border border-enigma-border p-8 rounded-lg flex flex-col justify-between hover:border-enigma-orange transition-colors relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-enigma-orange rounded-full text-[10px] text-white font-bold tracking-widest uppercase shadow">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Enigma Pro</h3>
                <p className="text-xs text-enigma-text-dim mb-6">Full cycle metrics and deeper whale alerts.</p>
                <div className="text-3xl font-extrabold text-white mb-6">
                  $49<span className="text-xs text-enigma-text-dim font-normal">/mo</span>
                </div>
                <ul className="space-y-3 text-xs text-enigma-text-dim border-t border-enigma-border pt-6 mb-8">
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span className="text-white">20 Daily Messages with E</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>Full Cycle Intelligence Panel</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>Research Tools (Coin Deep Dives)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-orange">•</span>
                    <span>Real-time Whale alerts (&gt;$1M)</span>
                  </li>
                  <li className="flex items-center space-x-2 line-through opacity-40">
                    <span className="text-enigma-orange">•</span>
                    <span>Coinbase Auto-Trading Engine</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 bg-enigma-orange hover:bg-enigma-orange/90 text-center text-xs font-semibold rounded text-white transition-colors shadow-lg shadow-enigma-orange/20"
              >
                Start 5-Day Elite Trial
              </Link>
            </div>

            {/* Elite Plan */}
            <div className="bg-enigma-panel border border-enigma-border p-8 rounded-lg flex flex-col justify-between hover:border-enigma-purple transition-colors">
              <div>
                <h3 className="text-lg font-bold text-white mb-2">Enigma Elite</h3>
                <p className="text-xs text-enigma-text-dim mb-6">Full automation power & unlimited access.</p>
                <div className="text-3xl font-extrabold text-white mb-6">
                  $149<span className="text-xs text-enigma-text-dim font-normal">/mo</span>
                </div>
                <ul className="space-y-3 text-xs text-enigma-text-dim border-t border-enigma-border pt-6 mb-8">
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-purple">•</span>
                    <span className="text-white">Unlimited Messages with E</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-purple">•</span>
                    <span>Full Market Scanner (200+ Coins)</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-purple">•</span>
                    <span className="text-white">Coinbase Auto-Trading Engine</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-purple">•</span>
                    <span>Early Signal Access</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-enigma-purple">•</span>
                    <span>Elite Whale alerts (&gt;$500k)</span>
                  </li>
                </ul>
              </div>
              <Link
                href="/dashboard"
                className="w-full py-3 bg-enigma-purple hover:bg-enigma-purple/90 text-center text-xs font-semibold rounded text-white transition-colors shadow-lg shadow-enigma-purple/20"
              >
                Start 5-Day Elite Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-enigma-border bg-enigma-bg py-12 px-6 text-xs text-enigma-text-dim font-terminal mt-auto">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-white">ENIGMA INTELLIGENCE © 2026</span>
            <span>•</span>
            <span>CYCLES • WHALES • SENTIMENT • AUTOMATION</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#about" className="hover:text-white transition-colors">MEET E</a>
            <a href="#features" className="hover:text-white transition-colors">RESOURCES</a>
            <a href="#pricing" className="hover:text-white transition-colors">SUBSCRIBE</a>
          </div>
        </div>
      </footer>

      {/* 7. Live 5-Day Trial Countdown Banner */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0c0c12] border-t border-enigma-orange/40 p-3.5 z-50 shadow-2xl backdrop-blur-md">
        <div className="max-w-[1400px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-y-3">
          <div className="flex items-center space-x-3 text-sm">
            <div className="w-2.5 h-2.5 rounded-full bg-enigma-orange animate-ping"></div>
            <span className="font-terminal text-white">
              LIMITED TRIAL POOL ACTIVE:
            </span>
            <span className="text-enigma-text-dim text-xs hidden sm:inline">
              Unlock Elite free for 5 days. Secure your slot now.
            </span>
          </div>

          <div className="flex items-center space-x-4">
            {/* Countdown Box */}
            <div className="flex items-center space-x-1 font-terminal text-xs">
              <span className="bg-enigma-panel border border-enigma-border px-2 py-1 rounded text-white font-bold">{countdown.days}d</span>
              <span className="text-[#9ca3af]">:</span>
              <span className="bg-enigma-panel border border-enigma-border px-2 py-1 rounded text-white font-bold">{countdown.hours}h</span>
              <span className="text-[#9ca3af]">:</span>
              <span className="bg-enigma-panel border border-enigma-border px-2 py-1 rounded text-[#ff6600] font-bold">{countdown.minutes}m</span>
              <span className="text-[#9ca3af]">:</span>
              <span className="bg-enigma-panel border border-enigma-border px-2 py-1 rounded text-[#ff6600] font-bold terminal-cursor">{countdown.seconds}s</span>
              <span className="text-enigma-text-dim text-[10px] ml-1.5 hidden md:inline">LEFT</span>
            </div>

            <Link
              href="/dashboard"
              className="px-4 py-1.5 bg-enigma-orange hover:bg-enigma-orange/90 text-white font-terminal text-xs font-bold rounded transition-colors flex items-center space-x-1 shadow-md shadow-enigma-orange/10"
            >
              <span>CLAIM FREE SLOT</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
