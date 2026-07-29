"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldAlert,
  Zap,
  Lock,
  MessageSquare,
  Compass,
  AlertTriangle,
  ArrowUpRight,
  Database,
  User,
  Clock,
  LogOut,
  Sliders,
  DollarSign,
  Activity,
  ArrowRight,
  BarChart2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle,
  Globe,
  Cpu,
  ZapOff,
  Maximize2,
  Gamepad2,
  Layers
} from "lucide-react";
import { PaperTradingTerminal } from "../../components/PaperTradingTerminal";
import { CoinbaseTerminal } from "../../components/CoinbaseTerminal";

// Types for whale alerts
interface WhaleAlert {
  id: string;
  time: string;
  coin: string;
  amount: string;
  value: string;
  type: "deposit" | "withdrawal" | "transfer";
  from: string;
  to: string;
}

// --- Components ---

const ScrollingTicker = () => {
  const assets = [
    { symbol: "BTC-USD", price: "$67,420.50", change: "+1.4%", up: true },
    { symbol: "ETH-USD", price: "$3,510.15", change: "+0.8%", up: true },
    { symbol: "SOL-USD", price: "$142.80", change: "-1.2%", up: false },
    { symbol: "USDT-DOM", price: "4.12%", change: "-0.05%", up: false },
    { symbol: "FEAR-GREED", price: "64", change: "Greed", up: true },
    { symbol: "CYCLE-INDEX", price: "0.68", change: "Late Bull", up: true },
    { symbol: "GAS-PRICE", price: "34 gwei", change: "Normal", up: true },
  ];

  return (
    <div className="bg-[#040406] border-b border-enigma-border h-8 overflow-hidden flex items-center relative z-50">
      <div className="flex animate-marquee whitespace-nowrap">
        {[...assets, ...assets].map((asset, i) => (
          <div key={i} className="flex items-center space-x-2 px-6 font-terminal text-[10px]">
            <span className="text-enigma-text-dim">{asset.symbol}:</span>
            <span className="text-white font-bold">{asset.price}</span>
            <span className={asset.up ? "text-enigma-green" : "text-enigma-red"}>
              {asset.up ? "▲" : "▼"} {asset.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SystemMonitor = () => {
  return (
    <div className="p-4 space-y-4 border-t border-enigma-border">
      <div className="flex justify-between items-center text-[9px] font-terminal text-enigma-text-dim uppercase tracking-widest">
        <span>E_BRAIN STATUS</span>
        <span className="text-enigma-green">SYNCED</span>
      </div>
      <div className="space-y-2">
        <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
          <div className="h-full bg-enigma-purple w-[68%] animate-pulse"></div>
        </div>
        <div className="flex justify-between text-[8px] font-terminal text-enigma-muted uppercase">
          <span>Neural Load</span>
          <span>68%</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#07070a] border border-enigma-border p-2 rounded text-center">
          <div className="text-[8px] text-enigma-muted uppercase">Latency</div>
          <div className="text-[10px] text-enigma-green font-bold">14ms</div>
        </div>
        <div className="bg-[#07070a] border border-enigma-border p-2 rounded text-center">
          <div className="text-[8px] text-enigma-muted uppercase">Signals</div>
          <div className="text-[10px] text-enigma-orange font-bold">Active</div>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState<
    "war-room" | "cycle-intel" | "scanner" | "auto-trader" | "portfolio" | "whale-alerts"
  >("war-room");

  // Trading mode state
  const [tradingMode, setTradingMode] = useState<"live" | "paper">("live");

  // Onboarding user trial state
  const [trialTimeLeft, setTrialTimeLeft] = useState({
    days: "04",
    hours: "23",
    minutes: "59",
    seconds: "59",
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      let targetStr = typeof window !== 'undefined' ? localStorage.getItem("enigma_trial_target") : null;
      let target = targetStr ? parseInt(targetStr) : 0;

      if (!target) {
        target = now + 5 * 24 * 60 * 60 * 1000 + 4 * 60 * 1000;
        if (typeof window !== 'undefined') localStorage.setItem("enigma_trial_target", target.toString());
      }

      const difference = target - now;

      if (difference <= 0) {
        clearInterval(timer);
      } else {
        const d = Math.floor(difference / (1000 * 60 * 60 * 24));
        const h = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((difference % (1000 * 60)) / 1000);

        setTrialTimeLeft({
          days: d.toString().padStart(2, "0"),
          hours: h.toString().padStart(2, "0"),
          minutes: m.toString().padStart(2, "0"),
          seconds: s.toString().padStart(2, "0"),
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // E Chat Adapter Depth State
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">(
    "advanced"
  );
  
  // Real-time Chat state
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "e"; text: string; time: string }>
  >([
    {
      sender: "e",
      text: "CONGRATS on spawning into the War Room. Your 5-Day Elite Free Trial is ACTIVE. All systems are paired. What are we scanning today? I've got my eyes on on-chain Cumberland stablecoin rotations.",
      time: "12:00:00",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

    // Load profile and start chat
    useEffect(() => {
      const savedProfile = localStorage.getItem("enigma_user_profile");
      let uId = "trial-user";
      if (savedProfile) {
        const p = JSON.parse(savedProfile);
        setProfile(p);
        if (p.experience_level) setDepth(p.experience_level);
        if (p.id) uId = p.id;
      }

      // Sync subscription data
      const syncSub = async () => {
        try {
          const { getSubscription } = await import("../../lib/api");
          const sub = await getSubscription(uId);
          if (sub.trial?.trial_ends_at) {
            const target = new Date(sub.trial.trial_ends_at).getTime();
            localStorage.setItem("enigma_trial_target", target.toString());
          }
        } catch (err) {
          console.error("Failed to sync sub:", err);
        }
      };
      syncSub();
    }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle send message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const timeStr = new Date().toTimeString().split(" ")[0];

    setMessages((prev) => [...prev, { sender: "user", text: userText, time: timeStr }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const { sendChatMessage } = await import("../../lib/api");
      const uId = profile?.id || "trial-user";
      const data = await sendChatMessage(uId, userText, depth);
      
      setMessages((prev) => [
        ...prev,
        { sender: "e", text: data.message, time: new Date().toTimeString().split(" ")[0] }
      ]);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { 
          sender: "e", 
          text: (err as Error).message.includes("limit") 
            ? "Yo, you hit your daily limit. Elite trials are unlimited, but the system is in protection mode. Upgrade for full access." 
            : "Connection dropped. E is offline. Try again.",
          time: new Date().toTimeString().split(" ")[0] 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // Live Whale alerts list
  const [whaleAlerts, setWhaleAlerts] = useState<WhaleAlert[]>([
    {
      id: "w1",
      time: "12:15:32",
      coin: "USDC",
      amount: "45,000,000",
      value: "$45,000,000",
      type: "deposit",
      from: "Cumberland Wallet (0x3d7e...9a41)",
      to: "Binance Exchange",
    },
    {
      id: "w2",
      time: "12:12:05",
      coin: "ETH",
      amount: "12,500",
      value: "$43,875,000",
      type: "transfer",
      from: "Unknown Wallet (0x8b2d...4a10)",
      to: "Cold Storage Ledger 3",
    },
    {
      id: "w3",
      time: "12:05:19",
      coin: "SOL",
      amount: "18,200",
      value: "$2,599,060",
      type: "withdrawal",
      from: "Coinbase Exchange",
      to: "Smart Money Wallet (0x5a9f...1f32)",
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      const coins = ["BTC", "ETH", "SOL", "USDT", "LINK"];
      const chosenCoin = coins[Math.floor(Math.random() * coins.length)];
      const types: Array<WhaleAlert["type"]> = ["deposit", "withdrawal", "transfer"];
      const chosenType = types[Math.floor(Math.random() * types.length)];
      
      let amt = 0;
      let val = 0;
      if (chosenCoin === "BTC") {
        amt = Math.floor(Math.random() * 200) + 10;
        val = amt * 67420;
      } else if (chosenCoin === "ETH") {
        amt = Math.floor(Math.random() * 5000) + 200;
        val = amt * 3510;
      } else if (chosenCoin === "SOL") {
        amt = Math.floor(Math.random() * 25000) + 1000;
        val = amt * 142.8;
      } else {
        amt = Math.floor(Math.random() * 5000000) + 500000;
        val = amt;
      }

      const newAlert: WhaleAlert = {
        id: `w-${Date.now()}`,
        time: new Date().toTimeString().split(" ")[0],
        coin: chosenCoin,
        amount: amt.toLocaleString(),
        value: `$${val.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        type: chosenType,
        from: chosenType === "withdrawal" ? "Binance Exchange" : "Whale Wallet (0x" + Math.random().toString(16).substr(2, 6) + "..." + Math.random().toString(16).substr(2, 4) + ")",
        to: chosenType === "deposit" ? "Coinbase Exchange" : "Cold Wallet Storage (0x" + Math.random().toString(16).substr(2, 6) + "..." + Math.random().toString(16).substr(2, 4) + ")",
      };

      setWhaleAlerts((prev) => [newAlert, ...prev.slice(0, 8)]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-enigma-bg text-enigma-text flex flex-col font-sans selection:bg-enigma-orange/30">
      <ScrollingTicker />
      
      {/* Top bar */}
      <div className="bg-[#08080a] border-b border-enigma-border py-3 px-6 flex items-center justify-between text-xs font-terminal relative z-50">
        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-enigma-green animate-pulse"></span>
            <span className="text-enigma-green font-bold">NODE: US-EAST-1 // SECURE</span>
          </div>
          <div className="hidden lg:flex items-center space-x-4 border-l border-enigma-border pl-8">
            <div className="flex items-center space-x-2">
              <span className="text-enigma-text-dim uppercase">CPU_USAGE:</span>
              <span className="text-white font-bold">12.4%</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-enigma-text-dim uppercase">MEM_LINK:</span>
              <span className="text-enigma-purple font-bold">ACTIVE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-8">
          <div className="flex items-center space-x-3 bg-black/40 border border-enigma-border p-1 rounded">
            <button 
              onClick={() => setTradingMode("live")}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${tradingMode === 'live' ? 'bg-enigma-orange text-white' : 'text-enigma-text-dim hover:text-white'}`}
            >
              Live Intel
            </button>
            <button 
              onClick={() => setTradingMode("paper")}
              className={`px-3 py-1 rounded text-[9px] font-bold uppercase transition-all ${tradingMode === 'paper' ? 'bg-enigma-purple text-white shadow-[0_0_10px_rgba(157,78,221,0.3)]' : 'text-enigma-text-dim hover:text-white'}`}
            >
              Paper Trading
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-enigma-orange font-bold uppercase tracking-tighter">ELITE_TRIAL</span>
            <div className="flex space-x-1">
              {[trialTimeLeft.days, trialTimeLeft.hours, trialTimeLeft.minutes, trialTimeLeft.seconds].map((unit, i) => (
                <span key={i} className="bg-enigma-panel border border-enigma-border px-1.5 py-0.5 rounded text-white font-bold min-w-[24px] text-center">
                  {unit}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-4 border-l border-enigma-border pl-8">
             <Link href="/" className="p-1.5 hover:bg-white/5 rounded transition-colors text-enigma-text-dim hover:text-white">
               <Globe className="w-4 h-4" />
             </Link>
             <button className="p-1.5 hover:bg-white/5 rounded transition-colors text-enigma-text-dim hover:text-white">
               <Sliders className="w-4 h-4" />
             </button>
             <Link href="/" className="p-1.5 hover:bg-white/5 rounded transition-colors text-enigma-text-dim hover:text-white">
               <LogOut className="w-4 h-4" />
             </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-80px)] overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-[#08080a] border-r border-enigma-border flex flex-col justify-between shrink-0">
          <div className="flex flex-col h-full">
            {/* Header branding */}
            <div className="p-6 flex items-center space-x-3 border-b border-enigma-border bg-[#0a0a0f]">
              <div className="w-9 h-9 rounded bg-gradient-to-br from-enigma-orange to-enigma-purple flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-enigma-orange/20">
                E
              </div>
              <div>
                <span className="font-terminal font-bold tracking-widest text-base text-white">
                  ENIGMA
                </span>
                <span className="font-sans font-light tracking-[0.2em] text-[8px] text-enigma-text-dim block uppercase">
                  Intelligence Core
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="flex-1 overflow-y-auto py-6 space-y-1 px-3">
              <div className="text-[9px] font-terminal text-enigma-muted mb-4 px-4 uppercase tracking-[0.2em]">War Room</div>
              <button
                onClick={() => setActiveTab("war-room")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "war-room"
                    ? "bg-white/5 border-r-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <MessageSquare className={`w-4 h-4 ${activeTab === "war-room" ? "text-enigma-orange" : "text-enigma-muted group-hover:text-white"}`} />
                <span>Command Terminal</span>
              </button>

              <button
                onClick={() => setActiveTab("whale-alerts")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "whale-alerts"
                    ? "bg-white/5 border-r-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <ShieldAlert className={`w-4 h-4 ${activeTab === "whale-alerts" ? "text-enigma-orange" : "text-enigma-muted group-hover:text-white"}`} />
                <span>Whale Telemetry</span>
              </button>

              <div className="text-[9px] font-terminal text-enigma-muted mt-8 mb-4 px-4 uppercase tracking-[0.2em]">Intelligence</div>
              <button
                onClick={() => setActiveTab("cycle-intel")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "cycle-intel"
                    ? "bg-white/5 border-r-2 border-enigma-purple text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <Compass className={`w-4 h-4 ${activeTab === "cycle-intel" ? "text-enigma-purple" : "text-enigma-muted group-hover:text-white"}`} />
                <span>Cycle Models</span>
              </button>

              <button
                onClick={() => setActiveTab("scanner")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "scanner"
                    ? "bg-white/5 border-r-2 border-enigma-purple text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Database className={`w-4 h-4 ${activeTab === "scanner" ? "text-enigma-purple" : "text-enigma-muted group-hover:text-white"}`} />
                  <span>Market Scanner</span>
                </div>
                {profile?.subscription_tier !== "Elite" && <Lock className="w-3 h-3 text-enigma-muted opacity-50" />}
              </button>

              <div className="text-[9px] font-terminal text-enigma-muted mt-8 mb-4 px-4 uppercase tracking-[0.2em]">Execution</div>
              <button
                onClick={() => setActiveTab("auto-trader")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "auto-trader"
                    ? "bg-white/5 border-r-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Zap className={`w-4 h-4 ${activeTab === "auto-trader" ? "text-enigma-orange" : "text-enigma-muted group-hover:text-white"}`} />
                  <span>Auto-Trader</span>
                </div>
                {profile?.subscription_tier !== "Elite" && <Lock className="w-3 h-3 text-enigma-muted opacity-50" />}
              </button>

              <button
                onClick={() => setActiveTab("portfolio")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all group ${
                  activeTab === "portfolio"
                    ? "bg-white/5 border-r-2 border-enigma-green text-white"
                    : "text-enigma-text-dim hover:bg-white/5 hover:text-white"
                }`}
              >
                <BarChart2 className={`w-4 h-4 ${activeTab === "portfolio" ? "text-enigma-green" : "text-enigma-muted group-hover:text-white"}`} />
                <span>Portfolio</span>
              </button>

              <div className="text-[9px] font-terminal text-enigma-muted mt-8 mb-4 px-4 uppercase tracking-[0.2em]">Resources</div>
              <Link
                href="/how-it-works"
                className="w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold text-enigma-text-dim hover:bg-white/5 hover:text-white transition-all"
              >
                <Globe className="w-4 h-4 text-enigma-muted" />
                <span>Marketing Hub</span>
              </Link>
            </div>

            <SystemMonitor />

            {/* User profile capsule */}
            <div className="m-3 p-3 bg-enigma-panel border border-enigma-border rounded flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center text-enigma-purple">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-[10px]">
                  <div className="text-white font-bold font-terminal leading-none">
                    {profile?.display_name || "TRIAL_USER"}
                  </div>
                  <div className="text-enigma-orange font-bold mt-1 text-[8px] uppercase tracking-wider">
                    Elite Trial
                  </div>
                </div>
              </div>
              <div className="w-2 h-2 rounded-full bg-enigma-green animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col bg-enigma-bg overflow-y-auto scrollbar-thin">
          
          {/* TAB 1: WAR ROOM / E CHAT */}
          {activeTab === "war-room" && (
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
              {tradingMode === "live" ? (
                <>
                  {/* Central Chat area */}
                  <div className="flex-1 flex flex-col h-full border-r border-enigma-border overflow-hidden">
                    {/* Header info */}
                    <div className="px-6 py-4 bg-[#0a0a0f] border-b border-enigma-border flex items-center justify-between">
                      <div>
                        <h2 className="text-xs font-bold text-white flex items-center space-x-2 uppercase tracking-widest">
                          <Cpu className="w-4 h-4 text-enigma-purple" />
                          <span>E_BRAIN TERMINAL V2.4</span>
                        </h2>
                        <p className="text-[9px] text-enigma-text-dim mt-1 font-terminal uppercase tracking-tighter">Direct encrypted tunnel // Secure WebSocket active</p>
                      </div>

                      {/* Adaptive adapter toggle */}
                      <div className="flex items-center bg-black/40 border border-enigma-border rounded p-1">
                        {["beginner", "intermediate", "advanced"].map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setDepth(lvl as any)}
                            className={`text-[9px] px-3 py-1 rounded-sm uppercase font-bold transition-all ${
                              depth === lvl ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Messages feed */}
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 font-terminal text-[11px] bg-[#060608] custom-scrollbar">
                      {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[85%] rounded border p-4 relative group ${
                            msg.sender === "user" 
                              ? "bg-[#0d0d12] text-white border-enigma-border" 
                              : "bg-[#0a0a0f] text-enigma-text border-purple-900/30 shadow-[0_0_20px_rgba(157,78,221,0.05)]"
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`font-bold uppercase tracking-widest text-[9px] ${msg.sender === "user" ? "text-enigma-orange" : "text-enigma-purple"}`}>
                                {msg.sender === "user" ? "USER_PROMPT" : "E_RESPONSE"}
                              </span>
                              <span className="text-[8px] text-enigma-muted">{msg.time}</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                            {msg.sender === "e" && idx === messages.length - 1 && !isTyping && (
                              <div className="mt-2 h-3 w-1 bg-enigma-purple terminal-cursor"></div>
                            )}
                          </div>
                        </div>
                      ))}
                      {isTyping && (
                        <div className="flex justify-start">
                          <div className="bg-[#0a0a0f] text-enigma-text border border-purple-900/30 rounded p-4">
                            <div className="flex space-x-1.5">
                              <div className="w-1.5 h-1.5 bg-enigma-purple rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-enigma-purple rounded-full animate-bounce [animation-delay:0.2s]"></div>
                              <div className="w-1.5 h-1.5 bg-enigma-purple rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                          </div>
                        </div>
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Terminal prompt input form */}
                    <div className="p-4 bg-[#0a0a0f] border-t border-enigma-border">
                      <div className="flex items-center space-x-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                        <span className="text-[8px] font-terminal text-enigma-muted uppercase whitespace-nowrap">Macro Triggers:</span>
                        <button onClick={() => setInputValue("Analyze Cumberland flows")} className="px-2 py-0.5 border border-enigma-border rounded text-[9px] text-enigma-text-dim hover:text-white hover:border-enigma-orange transition-colors">Cumberland Flows</button>
                        <button onClick={() => setInputValue("SOL bid zones")} className="px-2 py-0.5 border border-enigma-border rounded text-[9px] text-enigma-text-dim hover:text-white hover:border-enigma-orange transition-colors">SOL Bid Zones</button>
                        <button onClick={() => setInputValue("BTC Cycle Stage")} className="px-2 py-0.5 border border-enigma-border rounded text-[9px] text-enigma-text-dim hover:text-white hover:border-enigma-orange transition-colors">Cycle Stage</button>
                        <button onClick={() => setInputValue("Fear & Greed Impact")} className="px-2 py-0.5 border border-enigma-border rounded text-[9px] text-enigma-text-dim hover:text-white hover:border-enigma-orange transition-colors">Fear & Greed</button>
                      </div>
                      <form onSubmit={handleSendMessage} className="flex space-x-3">
                        <div className="flex-1 bg-black rounded border border-enigma-border flex items-center px-4 focus-within:border-enigma-orange transition-colors group">
                          <span className="text-enigma-purple font-terminal text-xs mr-3 group-focus-within:text-enigma-orange transition-colors">E:\&gt;</span>
                          <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="INPUT COMMAND..."
                            className="flex-1 bg-transparent py-3 text-xs font-terminal text-white focus:outline-none"
                          />
                        </div>
                        <button
                          type="submit"
                          className="px-6 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:scale-[1.02] active:scale-[0.98] text-white font-terminal text-xs rounded font-bold transition-all shadow-lg shadow-enigma-orange/10 uppercase tracking-widest"
                        >
                          Execute
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* Right Panel: Live Feed Sidebar */}
                  <div className="w-full lg:w-80 bg-[#08080a] flex flex-col h-full overflow-hidden shrink-0">
                    <div className="px-5 py-4 border-b border-enigma-border bg-[#0a0a0f] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white font-terminal tracking-[0.2em] uppercase">Whale_Stream</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-[8px] text-enigma-green font-terminal">LIVE</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-enigma-orange animate-ping"></span>
                      </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
                      {whaleAlerts.map((alert) => (
                        <div key={alert.id} className="p-3 bg-[#0c0c12] border border-enigma-border rounded font-terminal text-[10px] space-y-2 hover:border-enigma-orange/30 transition-colors group">
                          <div className="flex items-center justify-between">
                            <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] uppercase tracking-tighter ${
                              alert.type === "deposit"
                                ? "text-enigma-red bg-enigma-red/5"
                                : alert.type === "withdrawal"
                                ? "text-enigma-green bg-enigma-green/5"
                                : "text-enigma-purple bg-enigma-purple/5"
                            }`}>
                              {alert.type}
                            </span>
                            <span className="text-enigma-muted text-[8px]">{alert.time}</span>
                          </div>
                          <div className="text-white font-bold text-xs">
                            {alert.amount} <span className="text-enigma-text-dim">{alert.coin}</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px]">
                            <span className="text-enigma-orange font-bold">{alert.value}</span>
                            <ArrowUpRight className="w-2.5 h-2.5 text-enigma-muted group-hover:text-white transition-colors" />
                          </div>
                          <div className="pt-1.5 border-t border-enigma-border/30 flex flex-col space-y-1">
                             <div className="text-[8px] truncate text-enigma-muted uppercase">From: <span className="text-white font-mono">{alert.from}</span></div>
                             <div className="text-[8px] truncate text-enigma-muted uppercase">To: <span className="text-white font-mono">{alert.to}</span></div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-[#0a0a0f] border-t border-enigma-border font-terminal text-[9px] space-y-3">
                      <div className="flex justify-between items-center text-enigma-text-dim">
                        <span>WHALE_INDEX (24H)</span>
                        <span className="text-white font-bold">182 EVENTS</span>
                      </div>
                      <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div className="h-full bg-enigma-orange w-[45%]"></div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                         <button className="py-2 border border-enigma-border rounded text-white hover:bg-white/5 transition-colors uppercase font-bold text-[8px]">Export Logs</button>
                         <button className="py-2 border border-enigma-border rounded text-white hover:bg-white/5 transition-colors uppercase font-bold text-[8px]">Filters</button>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
                  <PaperTradingTerminal 
                    userId={profile?.id || "trial-user"} 
                    onCommentary={(text) => {
                      setMessages(prev => [
                        ...prev, 
                        { sender: "e", text, time: new Date().toTimeString().split(" ")[0] }
                      ]);
                    }}
                  />
                  {/* Right Panel: E Chat in Paper Mode */}
                  <div className="w-full lg:w-80 bg-[#08080a] border-l border-enigma-border flex flex-col h-full overflow-hidden shrink-0">
                    <div className="px-5 py-4 border-b border-enigma-border bg-[#0a0a0f] flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white font-terminal tracking-[0.2em] uppercase">E_COMMUNICATIONS</span>
                      <Gamepad2 className="w-4 h-4 text-enigma-purple" />
                    </div>
                    <div className="flex-1 p-4 overflow-y-auto space-y-4 font-terminal text-[10px] custom-scrollbar bg-black/20">
                      {messages.slice(-10).map((msg, idx) => (
                        <div key={idx} className={`p-3 rounded border ${msg.sender === 'e' ? 'bg-enigma-purple/5 border-enigma-purple/20 text-enigma-text' : 'bg-white/5 border-enigma-border text-enigma-text-dim'}`}>
                          <div className="flex justify-between mb-1">
                            <span className="font-bold uppercase tracking-tighter text-[8px]">{msg.sender === 'e' ? 'E' : 'YOU'}</span>
                            <span className="opacity-40 text-[7px]">{msg.time}</span>
                          </div>
                          <p>{msg.text}</p>
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    <div className="p-4 bg-[#0a0a0f] border-t border-enigma-border">
                       <p className="text-[8px] text-enigma-muted font-terminal leading-tight italic">
                         "Paper trading mode is for testing strategies. E's advice here is optimized for high-risk DEX environments."
                       </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CYCLE INTELLIGENCE */}
          {activeTab === "cycle-intel" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2 tracking-tight uppercase">
                    <Compass className="w-5 h-5 text-enigma-purple" />
                    <span>Cycle Intelligence Terminal</span>
                  </h2>
                  <p className="text-[10px] text-enigma-text-dim mt-1 font-terminal uppercase tracking-widest">Macro data aggregation // Halving profile synced</p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-enigma-purple font-bold font-terminal uppercase block">Current Phase</span>
                  <span className="text-lg font-bold text-white uppercase tracking-tighter">Late Bull Accumulation</span>
                </div>
              </div>

              {/* Precise Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                  { name: "MVRV Z-Score", val: "2.42", status: "Healthy", color: "text-enigma-green", desc: "Capitalization delta signal." },
                  { name: "Pi Cycle Top", val: "18.2%", status: "Pending", color: "text-enigma-orange", desc: "111d/350d SMA crossover." },
                  { name: "NUPL Metric", val: "0.54", status: "Belief", color: "text-enigma-purple", desc: "Net Unrealized Profit/Loss." },
                  { name: "SSR Index", val: "Low", status: "High Power", color: "text-enigma-green", desc: "Stablecoin Supply Ratio." },
                ].map((m, i) => (
                  <div key={i} className="bg-[#0d0d12] border border-enigma-border p-4 rounded-sm space-y-2 group hover:border-enigma-orange/50 transition-colors">
                    <div className="flex justify-between items-center text-[9px] font-terminal text-enigma-muted uppercase">
                      <span>{m.name}</span>
                      <Activity className="w-3 h-3" />
                    </div>
                    <div className="text-2xl font-bold text-white tracking-tighter">{m.val}</div>
                    <div className={`text-[9px] font-terminal uppercase font-bold ${m.color}`}>{m.status}</div>
                    <p className="text-[9px] text-enigma-muted leading-tight pt-1">{m.desc}</p>
                  </div>
                ))}
              </div>

              {/* Technical Chart Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-[#0d0d12] border border-enigma-border rounded-sm h-[400px] flex flex-col">
                   <div className="p-4 border-b border-enigma-border flex justify-between items-center bg-[#0a0a0f]">
                      <span className="text-[10px] font-bold text-white font-terminal uppercase">Historical Cycle Overlay</span>
                      <div className="flex space-x-2">
                        <button className="px-2 py-1 bg-black border border-enigma-border text-[9px] text-white rounded">1D</button>
                        <button className="px-2 py-1 bg-black border border-enigma-border text-[9px] text-white rounded">1W</button>
                        <button className="px-2 py-1 bg-enigma-orange border border-enigma-orange text-[9px] text-white rounded">MACRO</button>
                      </div>
                   </div>
                   <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                      {/* Visual representation of a chart using CSS */}
                      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]"></div>
                      <div className="w-full h-full p-8 flex items-end space-x-1">
                         {Array.from({length: 40}).map((_, i) => (
                           <div key={i} className="flex-1 bg-gradient-to-t from-enigma-purple/20 to-enigma-purple/40 border-t border-enigma-purple" style={{height: `${Math.sin(i/5)*30 + 50}%`}}></div>
                         ))}
                      </div>
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center z-10">
                         <div className="text-enigma-orange font-terminal font-bold text-xs uppercase animate-pulse mb-2">Streaming Real-time Telemetry</div>
                         <div className="text-enigma-muted text-[10px] uppercase tracking-[0.3em]">[Waiting for E_Soul Node Data]</div>
                      </div>
                   </div>
                </div>
                
                <div className="bg-[#0d0d12] border border-enigma-border rounded-sm p-6 flex flex-col">
                   <h3 className="text-xs font-bold text-white uppercase tracking-widest mb-6">E's Strategy Note</h3>
                   <div className="flex-1 space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                      <div className="space-y-2">
                        <div className="text-[9px] text-enigma-purple font-bold font-terminal uppercase tracking-tighter">Market Structure</div>
                        <p className="text-[11px] text-enigma-text leading-relaxed font-terminal">
                          We are currently in the 'belief' stage of the psych cycle. Net unrealized profit is high but hasn't reached 'euphoria' (&gt;0.75). Smart money is rotating out of stagnant L1s and into high-conviction ecosystem plays.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="text-[9px] text-enigma-orange font-bold font-terminal uppercase tracking-tighter">Action Plan</div>
                        <p className="text-[11px] text-enigma-text leading-relaxed font-terminal">
                          DCA into BTC between $62k-$65k. Maintain 20% dry powder for liquidation spikes. Avoid high-leverage longs until funding rates flip negative.
                        </p>
                      </div>
                      <button className="w-full py-3 bg-white/5 border border-enigma-border hover:border-enigma-orange transition-colors text-white text-[10px] font-bold uppercase tracking-widest mt-auto">
                        Download Full Macro Report
                      </button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKET SCANNER (LOCKED) */}
          {activeTab === "scanner" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto relative h-full">
              {/* Locking Overlay */}
              <div className="absolute inset-0 bg-[#060608]/60 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-16 h-16 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center mb-6 text-enigma-purple shadow-[0_0_30px_rgba(157,78,221,0.2)]">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Elite Market Scanner Locked</h3>
                <p className="text-sm text-enigma-text-dim max-w-xl mb-8 leading-relaxed font-terminal">
                  IDENTIFY VOLUME ANOMALIES AND RSI DIVERGENCES ACROSS 200+ ASSETS IN REAL-TIME. ACCESS FULL SECTOR ROTATION DATA AND WHALE INTENT CLASSIFICATION.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("war-room")}
                    className="px-8 py-3 bg-enigma-panel border border-enigma-border hover:bg-white/5 text-white font-bold text-xs rounded uppercase tracking-widest transition-all"
                  >
                    Return
                  </button>
                  <Link
                    href="/#pricing"
                    className="px-8 py-3 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:scale-105 text-white font-bold text-xs rounded uppercase tracking-widest transition-all shadow-xl shadow-enigma-purple/20"
                  >
                    Upgrade Now
                  </Link>
                </div>
              </div>

              {/* Blurred mockup under */}
              <div className="space-y-6 select-none opacity-20 pointer-events-none filter blur-sm">
                <div className="bg-enigma-panel border border-enigma-border rounded-lg p-8 h-[600px]"></div>
              </div>
            </div>
          )}

          {/* OTHER TABS (SIMILAR REFINEMENT) */}
          {/* ... Portfolio and Auto-Trader tabs would follow same precision pattern ... */}
          {activeTab === "portfolio" && (
             <div className="p-8 flex flex-col h-full max-w-[1200px] mx-auto w-full">
                <div className="flex justify-between items-end mb-8">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center space-x-2 tracking-tight uppercase">
                      <BarChart2 className="w-5 h-5 text-enigma-green" />
                      <span>{tradingMode === 'paper' ? 'Paper Portfolio' : 'Live Portfolio'}</span>
                    </h2>
                    <p className="text-[10px] text-enigma-text-dim mt-1 font-terminal uppercase tracking-widest">
                      {tradingMode === 'paper' ? 'DEX Simulation Environment' : 'Node Connectivity Pending'}
                    </p>
                  </div>
                  {tradingMode === 'paper' && (
                    <div className="px-4 py-2 bg-enigma-purple/10 border border-enigma-purple/30 rounded text-enigma-purple font-terminal text-[10px] font-bold">
                      MODE: SIMULATION
                    </div>
                  )}
                </div>

                {tradingMode === "paper" ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="bg-[#0d0d12] border border-enigma-border rounded p-6">
                        <h3 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em] mb-4">Asset Distribution</h3>
                        <div className="h-64 flex items-center justify-center border border-enigma-border/30 rounded bg-black/20">
                           <div className="text-center">
                             <Layers className="w-8 h-8 text-enigma-muted mx-auto mb-2 opacity-20" />
                             <span className="text-[9px] font-terminal text-enigma-muted uppercase">Visualizer Syncing...</span>
                           </div>
                        </div>
                      </div>
                      <div className="bg-[#0d0d12] border border-enigma-border rounded p-6">
                        <h3 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em] mb-4">Trade History</h3>
                        <div className="space-y-3">
                           {[1,2,3,4,5].map(i => (
                             <div key={i} className="flex items-center justify-between p-3 border border-enigma-border/30 rounded bg-black/10 opacity-40">
                               <div className="w-24 h-2 bg-white/5 rounded"></div>
                               <div className="w-32 h-2 bg-white/5 rounded"></div>
                               <div className="w-16 h-2 bg-white/5 rounded"></div>
                             </div>
                           ))}
                           <p className="text-center text-[9px] font-terminal text-enigma-muted uppercase pt-4">Connect to E_BRAIN for full logs</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-6">
                       <div className="bg-gradient-to-br from-[#0d0d12] to-[#16161d] border border-enigma-border rounded p-6">
                          <h3 className="text-[10px] font-bold text-enigma-orange uppercase tracking-[0.2em] mb-4">Performance Metrics</h3>
                          <div className="space-y-6">
                             <div>
                               <div className="text-[9px] text-enigma-muted uppercase mb-1">Win Rate</div>
                               <div className="text-2xl font-bold text-white font-terminal">64.2%</div>
                             </div>
                             <div>
                               <div className="text-[9px] text-enigma-muted uppercase mb-1">Profit Factor</div>
                               <div className="text-2xl font-bold text-enigma-green font-terminal">2.14</div>
                             </div>
                             <div>
                               <div className="text-[9px] text-enigma-muted uppercase mb-1">Max Drawdown</div>
                               <div className="text-2xl font-bold text-enigma-red font-terminal">8.4%</div>
                             </div>
                          </div>
                       </div>
                       <button className="w-full py-4 bg-enigma-orange/10 border border-enigma-orange/30 hover:bg-enigma-orange/20 text-enigma-orange font-bold text-[10px] uppercase tracking-widest rounded transition-all">
                         Reset Paper Account
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                       <BarChart2 className="w-12 h-12 text-enigma-green mx-auto opacity-50" />
                       <div className="text-enigma-text-dim font-terminal uppercase tracking-widest text-xs">Portfolio Sync Pending Node Connectivity</div>
                       <button onClick={() => setTradingMode("paper")} className="px-6 py-2 bg-enigma-purple text-white text-[10px] font-bold rounded uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-enigma-purple/20">
                         Switch to Paper Trading
                       </button>
                    </div>
                  </div>
                )}
             </div>
          )}
          
          {activeTab === "auto-trader" && (
             <div className="flex-1 flex flex-col overflow-hidden">
                <CoinbaseTerminal 
                  userId={profile?.id || "trial-user"} 
                  userTier={profile?.subscription_tier || "Elite"} 
                  onCommentary={(text) => {
                    setMessages(prev => [
                      ...prev, 
                      { sender: "e", text, time: new Date().toTimeString().split(" ")[0] }
                    ]);
                  }}
                />
             </div>
          )}

        </div>
      </div>
      
      {/* Footer / Status Bar */}
      <div className="bg-[#040406] border-t border-enigma-border py-1 px-6 flex items-center justify-between text-[9px] font-terminal text-enigma-muted">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
             <span>CLIENT_VER: 1.0.4-PROD</span>
          </div>
          <div className="flex items-center space-x-2">
             <span>API_LATENCY: 14ms</span>
          </div>
          <div className="flex items-center space-x-2">
             <span className="text-enigma-green font-bold">● BRIDGE_ACTIVE</span>
          </div>
        </div>
        <div className="flex items-center space-x-6">
          <span>&copy; 2026 ENIGMA INTELLIGENCE SYSTEMS</span>
          <span className="text-white">NON-CUSTODIAL TERMINAL</span>
        </div>
      </div>
    </div>
  );
}
