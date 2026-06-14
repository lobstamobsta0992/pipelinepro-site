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
} from "lucide-react";

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

export default function Dashboard() {
  // Navigation active tab state
  const [activeTab, setActiveTab] = useState<
    "war-room" | "cycle-intel" | "scanner" | "auto-trader" | "portfolio" | "whale-alerts"
  >("war-room");

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
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Handle send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    const timeStr = new Date().toTimeString().split(" ")[0];

    setMessages((prev) => [...prev, { sender: "user", text: userText, time: timeStr }]);
    setInputValue("");
    setIsTyping(true);

    setTimeout(() => {
      let eResponse = "";
      const query = userText.toLowerCase();

      if (query.includes("cumberland") || query.includes("stable") || query.includes("rotation")) {
        if (depth === "beginner") {
          eResponse = "Cumberland is a massive market maker in crypto. When they transfer stablecoins (like USDC or USDT) onto exchanges, it means they are preparing to buy. Over the last 4 hours, they loaded in $45 Million—usually a strong sign that prices are about to bounce.";
        } else if (depth === "intermediate") {
          eResponse = "Cumberland OTC deposit patterns show a heavy cluster. Specifically, Cumberland cluster wallet 0x3d7... transferred 45M USDC to Binance and Coinbase. Historically, these OTC stables injections trigger a local market bottom with a 84% probability of a +4.2% bounce within 48 hours.";
        } else {
          eResponse = "NET STABLECOIN DEPOSIT INFLOWS: Cumberland (0x3d7e...9a41) has injected exactly 45,000,000 USDC into Tier-1 spot exchange orderbooks over a 4-hour window. Aggregate stablecoin reserves on-exchange increased by 0.35% during this period. Cross-referencing orderbook liquidity depth reveals a concurrent bid cluster between $63,800 and $64,200 BTC. Delta volume divergence supports a classic absorption bottom. Standard deviation is +1.8 from 14-day median.";
        }
      } else if (query.includes("sol") || query.includes("solana")) {
        if (depth === "beginner") {
          eResponse = "Solana is currently trading around $142. It has been down recently, but watch the $135 support level. If that holds, it's a good place to start buying slowly (DCA).";
        } else if (depth === "intermediate") {
          eResponse = "SOL is in a high-timeframe re-accumulation phase. We saw smart money wallet 0x5a9f swap $2.4M of USDC into high-beta SOL ecosystem tokens (JUP, PYTH) over the last 24 hours. Daily RSI is sitting at 38—very close to oversold conditions. Defending $138 is critical to keep the bullish structure intact.";
        } else {
          eResponse = "SOL/USD orderbook dynamics show heavy supply absorption at the $138-140 demand zone. The Jup-engine volume delta reveals high-beta ecosystem rotation (+8% net buyer delta for JUP/SOL pairings). On-chain transaction rates for smart-money wallets track a 3.2x multiplier in spot SOL accumulation. Liquidation heatmaps cluster heavily at $134.50—recommend trailing bids at $136.20 to frontrun the sweep.";
        }
      } else if (query.includes("cycle") || query.includes("macro")) {
        if (depth === "beginner") {
          eResponse = "We are currently in the 'Late Bull Accumulation' phase. This means the bull market is not over, but the easy money has been made. Big investors are quietly buying before the next retail wave.";
        } else if (depth === "intermediate") {
          eResponse = "The current cycle indicator shows we are in Phase 2: Late Bull Accumulation. The Pi Cycle Top indicator remains well below the trigger line, and the MVRV Z-Score is at a healthy 2.4. We've consolidated for 90+ days. This is structurally identical to the mid-cycle re-accumulation of 2020 before the expansion leg.";
        } else {
          eResponse = "MACRO CYCLE PROFILE: Late Bull Accumulation. MVRV Z-Score is currently 2.42 (historical top threshold &gt; 6.0). Net Unrealized Profit/Loss (NUPL) is consolidated at 0.54 ('Belief' zone). Stablecoin Supply Ratio (SSR) is at a historical low, implying high-power stablecoin dry powder on sidelines. Pi Cycle Top 350-day SMA ratio is currently cool (delta -18.2% from trigger). Wyckoff Phase D re-accumulation completed; volume profile indicates expansion is imminent.";
        }
      } else {
        if (depth === "beginner") {
          eResponse = "I'm analyzing that. Let me know if you want to focus on: 1) Stablecoin rotations, 2) Solana ecosystem, or 3) Current cycle phase.";
        } else if (depth === "intermediate") {
          eResponse = "Understood. The charts show volume is declining as we hit the lower support range. Expect a major breakout soon. Keep your stop-losses below the 20-week EMA.";
        } else {
          eResponse = "CRITICAL METRIC CONVERGENCE: Derivative funding rates have reset to baseline neutral across major exchanges. Open Interest has consolidated by $1.8B—completing the leverage wash. Volume Profile show high volume node (HVN) absorption. Ready to execute Coinbase triggers.";
        }
      }

      setMessages((prev) => [...prev, { sender: "e", text: eResponse, time: timeStr }]);
      setIsTyping(false);
    }, 1200);
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
    {
      id: "w4",
      time: "11:58:44",
      coin: "BTC",
      amount: "480",
      value: "$32,361,600",
      type: "deposit",
      from: "Whale Wallet (0x1e3a...8b9c)",
      to: "OKX Exchange",
    },
  ]);

  // Periodically add new mock whale alerts in real-time
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
        from: chosenType === "withdrawal" ? "Binance Exchange" : "Whale Wallet (0x" + Math.random().toString(16).substr(2, 6) + "... " + Math.random().toString(16).substr(2, 4) + ")",
        to: chosenType === "deposit" ? "Coinbase Exchange" : "Cold Wallet Storage (0x" + Math.random().toString(16).substr(2, 6) + "... " + Math.random().toString(16).substr(2, 4) + ")",
      };

      setWhaleAlerts((prev) => [newAlert, ...prev.slice(0, 8)]);
    }, 15000); // Add every 15s

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-enigma-bg text-enigma-text flex flex-col font-sans">
      {/* Top bar */}
      <div className="bg-[#0c0c12] border-b border-enigma-border py-2 px-6 flex items-center justify-between text-xs font-terminal relative z-50">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-enigma-green animate-pulse"></span>
            <span className="text-enigma-green font-bold">SYSTEM STATUS: ONLINE</span>
          </div>
          <div className="hidden md:flex items-center space-x-2">
            <span className="text-enigma-text-dim">COINBASE BRIDGE:</span>
            <span className="text-enigma-green font-bold">CONNECTED (SANDBOX)</span>
          </div>
        </div>

        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <span className="text-enigma-orange font-bold">ELITE TRIAL REMAINING:</span>
            <span className="bg-enigma-panel border border-enigma-border px-2 py-0.5 rounded text-white font-bold">
              {trialTimeLeft.days}d {trialTimeLeft.hours}h {trialTimeLeft.minutes}m {trialTimeLeft.seconds}s
            </span>
          </div>
          <Link href="/" className="text-enigma-text-dim hover:text-white flex items-center space-x-1.5 border-l border-enigma-border pl-6">
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Portal</span>
          </Link>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-37px)] overflow-hidden">
        
        {/* Left Navigation Sidebar */}
        <div className="w-full lg:w-64 bg-enigma-panel border-r border-enigma-border flex flex-col justify-between py-6 shrink-0">
          <div className="space-y-8">
            {/* Header branding */}
            <div className="px-6 flex items-center space-x-3">
              <div className="w-7 h-7 rounded bg-gradient-to-br from-enigma-orange to-enigma-purple flex items-center justify-center font-bold text-white">
                Ξ
              </div>
              <div>
                <span className="font-terminal font-bold tracking-widest text-sm bg-gradient-to-r from-enigma-orange to-white bg-clip-text text-transparent">
                  ENIGMA
                </span>
                <span className="font-sans font-light tracking-widest text-[9px] text-[#9ca3af] block">
                  INTELLIGENCE
                </span>
              </div>
            </div>

            {/* Menu Links */}
            <div className="space-y-1.5 px-3">
              <button
                onClick={() => setActiveTab("war-room")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "war-room"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span>E Chat & War Room</span>
              </button>

              <button
                onClick={() => setActiveTab("cycle-intel")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "cycle-intel"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <Compass className="w-4 h-4" />
                <span>Cycle Intelligence</span>
              </button>

              <button
                onClick={() => setActiveTab("scanner")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "scanner"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4" />
                  <span>Market Scanner</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-enigma-purple" />
              </button>

              <button
                onClick={() => setActiveTab("auto-trader")}
                className={`w-full flex items-center justify-between px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "auto-trader"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Zap className="w-4 h-4" />
                  <span>Auto-Trading Engine</span>
                </div>
                <Lock className="w-3.5 h-3.5 text-enigma-orange" />
              </button>

              <button
                onClick={() => setActiveTab("portfolio")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "portfolio"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <BarChart2 className="w-4 h-4" />
                <span>Portfolio Tracker</span>
              </button>

              <button
                onClick={() => setActiveTab("whale-alerts")}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded text-left text-xs font-semibold transition-all ${
                  activeTab === "whale-alerts"
                    ? "bg-gradient-to-r from-enigma-orange/20 to-enigma-purple/20 border-l-2 border-enigma-orange text-white"
                    : "text-enigma-text-dim hover:bg-enigma-bg hover:text-white"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Whale Activity Logs</span>
              </button>
            </div>
          </div>

          {/* User profile capsule */}
          <div className="mx-4 p-4 bg-[#07070a] border border-enigma-border rounded flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center text-enigma-purple">
                <User className="w-4 h-4" />
              </div>
              <div className="text-[10px]">
                <div className="text-white font-bold font-terminal leading-none">TRIAL_SLOT#1092</div>
                <div className="text-enigma-purple font-semibold mt-0.5 leading-none uppercase">Elite Free Trial</div>
              </div>
            </div>
            <div className="w-2.5 h-2.5 rounded-full bg-enigma-green"></div>
          </div>
        </div>

        {/* Content Pane */}
        <div className="flex-1 flex flex-col bg-enigma-bg overflow-y-auto">
          
          {/* TAB 1: WAR ROOM / E CHAT */}
          {activeTab === "war-room" && (
            <div className="flex-1 flex flex-col lg:flex-row h-full overflow-hidden">
              {/* Central Chat area */}
              <div className="flex-1 flex flex-col h-full border-r border-enigma-border overflow-hidden">
                {/* Header info */}
                <div className="px-6 py-4 bg-enigma-panel border-b border-enigma-border flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-white flex items-center space-x-2">
                      <MessageSquare className="w-4 h-4 text-enigma-purple" />
                      <span>E COMMAND CENTER</span>
                    </h2>
                    <p className="text-[10px] text-enigma-text-dim mt-0.5">Direct encrypted tunnel with E's adaptive intelligence brain.</p>
                  </div>

                  {/* Adaptive adapter toggle */}
                  <div className="flex items-center bg-enigma-bg border border-enigma-border rounded px-1 py-0.5">
                    <span className="text-[9px] text-enigma-text-dim px-2 hidden sm:inline">ADAPTER DEPTH:</span>
                    {["beginner", "intermediate", "advanced"].map((lvl) => (
                      <button
                        key={lvl}
                        onClick={() => setDepth(lvl as any)}
                        className={`text-[9px] px-2 py-0.5 rounded capitalize transition-all ${
                          depth === lvl ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Messages feed */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4 font-terminal text-xs">
                  {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] rounded p-3 relative group ${
                        msg.sender === "user" ? "bg-enigma-panel-light text-white border border-enigma-border" : "bg-enigma-panel text-enigma-text border border-enigma-border"
                      }`}>
                        <div className="flex items-center justify-between space-x-6 mb-1">
                          <span className={`font-bold ${msg.sender === "user" ? "text-enigma-orange" : "text-enigma-purple"}`}>
                            {msg.sender === "user" ? "TRADER" : "E"}
                          </span>
                          <span className="text-[9px] text-enigma-muted">{msg.time}</span>
                        </div>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-enigma-panel text-enigma-text border border-enigma-border rounded p-3">
                        <span className="inline-block w-1.5 h-3.5 bg-enigma-purple animate-pulse"></span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Suggestions triggers block */}
                <div className="px-6 py-2 bg-[#0c0c12] border-t border-enigma-border flex items-center space-x-2 overflow-x-auto whitespace-nowrap text-[9px]">
                  <span className="text-enigma-text-dim font-terminal font-bold">ANALYSIS PROTOCOLS:</span>
                  <button
                    onClick={() => setInputValue("Analyze the current Cumberland stablecoin rotation.")}
                    className="px-2 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
                  >
                    Stable Rotation
                  </button>
                  <button
                    onClick={() => setInputValue("What is the current SOL ecosystem and bid zone chart analysis?")}
                    className="px-2 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
                  >
                    SOL Liquidation Zones
                  </button>
                  <button
                    onClick={() => setInputValue("Run current Cycle Intelligence macro evaluation.")}
                    className="px-2 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
                  >
                    Macro Indicators NUPL
                  </button>
                </div>

                {/* Terminal prompt input form */}
                <form onSubmit={handleSendMessage} className="p-4 bg-enigma-panel border-t border-enigma-border flex space-x-3">
                  <div className="text-enigma-purple font-terminal flex items-center font-bold px-1 text-xs">E&gt;</div>
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Input command (e.g., 'scan stable rotations', 'BTC cycle top threshold')..."
                    className="flex-1 bg-enigma-bg border border-enigma-border rounded px-4 py-3 text-xs font-terminal text-white focus:outline-none focus:border-enigma-orange"
                  />
                  <button
                    type="submit"
                    className="px-5 py-2 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:opacity-95 text-white font-terminal text-xs rounded font-bold transition-all shadow-md shadow-enigma-orange/15"
                  >
                    EXECUTE
                  </button>
                </form>
              </div>

              {/* Right Panel: Live Feed Sidebar */}
              <div className="w-full lg:w-80 bg-enigma-panel flex flex-col h-full overflow-hidden shrink-0">
                <div className="px-5 py-4 border-b border-enigma-border bg-[#07070a] flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-terminal tracking-wider">LIVE WHALE INGESTION</span>
                  <span className="w-2 h-2 rounded-full bg-enigma-orange animate-ping"></span>
                </div>

                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {whaleAlerts.map((alert) => (
                    <div key={alert.id} className="p-3 bg-[#060608] border border-enigma-border/60 rounded font-terminal text-[10px] space-y-1.5 hover:border-enigma-border transition-colors">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded font-bold text-[8px] uppercase ${
                          alert.type === "deposit"
                            ? "bg-enigma-red/20 border border-enigma-red/30 text-enigma-red"
                            : alert.type === "withdrawal"
                            ? "bg-enigma-green/20 border border-enigma-green/30 text-enigma-green"
                            : "bg-enigma-purple/20 border border-enigma-purple/30 text-enigma-purple"
                        }`}>
                          {alert.type}
                        </span>
                        <span className="text-enigma-muted">{alert.time}</span>
                      </div>
                      <div className="text-white font-bold">
                        {alert.amount} {alert.coin} <span className="text-enigma-orange font-normal">({alert.value})</span>
                      </div>
                      <div className="text-enigma-text-dim text-[9px] truncate">
                        From: <span className="text-white font-mono">{alert.from}</span>
                      </div>
                      <div className="text-enigma-text-dim text-[9px] truncate">
                        To: <span className="text-white font-mono">{alert.to}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Sidebar footer metrics */}
                <div className="p-4 bg-[#07070a] border-t border-enigma-border font-terminal text-[9px] text-enigma-text-dim grid grid-cols-2 gap-2 text-center">
                  <div className="bg-enigma-bg p-2 border border-enigma-border rounded">
                    <div>AVG GAS PRICE</div>
                    <div className="font-bold text-white text-xs mt-0.5">34 Gwei</div>
                  </div>
                  <div className="bg-enigma-bg p-2 border border-enigma-border rounded">
                    <div>WHALE COUNT (24h)</div>
                    <div className="font-bold text-enigma-purple text-xs mt-0.5">182 Alerts</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CYCLE INTELLIGENCE */}
          {activeTab === "cycle-intel" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <Compass className="w-5 h-5 text-enigma-purple" />
                  <span>CYCLE INTELLIGENCE TERMINAL</span>
                </h2>
                <p className="text-xs text-enigma-text-dim mt-1">Real-time macro cycles and indicators synced with historical halving profiles.</p>
              </div>

              {/* Grid indicators */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-enigma-text-dim uppercase font-terminal font-bold">MVRV Z-Score</span>
                  <div className="text-2xl font-bold text-white">2.42</div>
                  <span className="text-[9px] text-enigma-green font-terminal bg-enigma-green/10 border border-enigma-green/20 px-1.5 py-0.5 rounded w-fit block">
                    Healthy Re-accumulation
                  </span>
                  <p className="text-[10px] text-enigma-text-dim leading-relaxed pt-2">
                    Measures market cap relative to realized cap. Historical tops trigger above 6.0. Current 2.42 indicates high expansion headroom.
                  </p>
                </div>

                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-enigma-text-dim uppercase font-terminal font-bold">Pi Cycle Top Ratio</span>
                  <div className="text-2xl font-bold text-[#ff6600]">18.2% Under</div>
                  <span className="text-[9px] text-enigma-orange font-terminal bg-enigma-orange/10 border border-enigma-orange/20 px-1.5 py-0.5 rounded w-fit block">
                    Expansion Pending
                  </span>
                  <p className="text-[10px] text-enigma-text-dim leading-relaxed pt-2">
                    Tracks the 111-day and 350-day SMA ratio. Crossing indicates a cycle peak. Currently sitting 18% below crossover.
                  </p>
                </div>

                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-enigma-text-dim uppercase font-terminal font-bold">NUPL Metric</span>
                  <div className="text-2xl font-bold text-white">0.54</div>
                  <span className="text-[9px] text-enigma-purple font-terminal bg-enigma-purple/10 border border-enigma-purple/20 px-1.5 py-0.5 rounded w-fit block">
                    Belief Range
                  </span>
                  <p className="text-[10px] text-enigma-text-dim leading-relaxed pt-2">
                    Net Unrealized Profit/Loss. Sits at 0.54, implying the market is consolidated inside the robust Belief channel.
                  </p>
                </div>

                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg space-y-1.5">
                  <span className="text-[10px] text-enigma-text-dim uppercase font-terminal font-bold">Stablecoin dry power</span>
                  <div className="text-2xl font-bold text-white">Very High</div>
                  <span className="text-[9px] text-enigma-green font-terminal bg-enigma-green/10 border border-enigma-green/20 px-1.5 py-0.5 rounded w-fit block">
                    SSR Multiplier
                  </span>
                  <p className="text-[10px] text-enigma-text-dim leading-relaxed pt-2">
                    Stablecoin Supply Ratio. Historically low values indicate huge stablecoin capacity waiting to absorb spot BTC on exchange lines.
                  </p>
                </div>
              </div>

              {/* Main Indicator Breakdown */}
              <div className="bg-enigma-panel border border-enigma-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-enigma-border bg-[#07070a] flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-terminal tracking-wider">CURRENT CYCLE EVALUATION SHEET</span>
                  <span className="text-[10px] text-enigma-orange font-bold font-terminal">ACTIVE STAGE: LATE BULL ACCUMULATION</span>
                </div>
                <div className="p-6 space-y-4 font-terminal text-xs leading-relaxed">
                  <p>
                    <strong className="text-white">Analysis summary:</strong> We are approximately 90 days post-Bitcoin Halving. Historical profiles dictate a prolonged 100-120 day consolidation range post-halving to flush leverage and shake out weak buyers before the secondary parabolic leg. On-chain metrics confirm aggressive institutional spot absorption (net exchange outflows reaching 14-month highs).
                  </p>
                  <p>
                    <strong className="text-enigma-orange">E's strategic advice:</strong> Do not fall for localized leverage shakeouts. Focus on spot asset accumulation between the 20-week and 50-week EMA averages. Leverage funding rates have reset to zero, completing the leverage purge. Prepare for volatility expansion.
                  </p>

                  <div className="pt-4 border-t border-enigma-border space-y-2">
                    <span className="text-[10px] text-[#9ca3af] block">MACRO TRIGGER MATRIX:</span>
                    <div className="grid grid-cols-3 gap-4 text-center text-[10px]">
                      <div className="bg-enigma-bg p-3 border border-enigma-border rounded">
                        <div className="text-[#9ca3af]">CYCLE FLOOR BIDS</div>
                        <div className="font-bold text-enigma-green text-xs mt-1">$58,500 - $61,200</div>
                      </div>
                      <div className="bg-enigma-bg p-3 border border-enigma-border rounded">
                        <div className="text-[#9ca3af]">TARGET ACCUMULATION ZONE</div>
                        <div className="font-bold text-enigma-orange text-xs mt-1">$63,800 - $65,500</div>
                      </div>
                      <div className="bg-enigma-bg p-3 border border-enigma-border rounded">
                        <div className="text-[#9ca3af]">CYCLE PEAK THRESHOLD</div>
                        <div className="font-bold text-enigma-red text-xs mt-1">$135,000 - $148,000</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MARKET SCANNER (LOCKED) */}
          {activeTab === "scanner" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto relative h-full">
              {/* Locking Overlay */}
              <div className="absolute inset-0 bg-[#060608]/40 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center mb-4 text-enigma-purple animate-bounce">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Unlock the 200-Coin Live Market Scanner</h3>
                <p className="text-xs text-enigma-text-dim max-w-xl mb-6 leading-relaxed">
                  Instantly filter volume momentum anomalies, RSI extremes, funding rate spikes, and orderbook pressure arrays in real-time across 200+ high-beta tokens. Connect with E triggers to receive automatic breakout notifications.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("war-room")}
                    className="px-5 py-2.5 bg-enigma-panel border border-enigma-border hover:bg-enigma-panel-light text-white font-semibold text-xs rounded transition-colors"
                  >
                    Back to War Room
                  </button>
                  <Link
                    href="/#pricing"
                    className="px-5 py-2.5 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:opacity-95 text-white font-semibold text-xs rounded transition-all shadow-lg shadow-enigma-purple/20"
                  >
                    Upgrade Tier / Check Plans
                  </Link>
                </div>
              </div>

              {/* Blurred mockup under */}
              <div className="space-y-6 select-none opacity-20 pointer-events-none">
                <div>
                  <h2 className="text-xl font-bold text-white">LIVE SCANNER MATRIX (ELITE ONLY)</h2>
                  <p className="text-xs text-enigma-text-dim">Real-time multi-exchange filter for funding, volume-delta, and RSI.</p>
                </div>
                <div className="bg-enigma-panel border border-enigma-border rounded-lg overflow-hidden">
                  <div className="p-4 border-b border-enigma-border flex space-x-3 bg-[#07070a]">
                    <div className="bg-enigma-bg border border-enigma-border px-3 py-1.5 rounded text-xs text-[#9ca3af] flex items-center space-x-2">
                      <Search className="w-3.5 h-3.5" />
                      <span>Search coins...</span>
                    </div>
                  </div>
                  <div className="p-6 font-terminal text-[11px] space-y-3">
                    <div className="grid grid-cols-7 border-b border-enigma-border pb-2 text-[#9ca3af]">
                      <span>TOKEN</span>
                      <span>SPOT PRICE</span>
                      <span>24H CHANGE</span>
                      <span>1H VOLUME DELTA</span>
                      <span>RSI (14)</span>
                      <span>FUNDING RATE</span>
                      <span>STRENGH STATE</span>
                    </div>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                      <div key={idx} className="grid grid-cols-7 border-b border-enigma-border/40 py-3">
                        <span className="font-bold text-white">BTC-USD</span>
                        <span>$67,420.50</span>
                        <span className="text-enigma-green">+1.4%</span>
                        <span>$12.4M Spot Buy</span>
                        <span>58.4</span>
                        <span>+0.010%</span>
                        <span className="text-enigma-orange">ACCUMULATION</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AUTO-TRADER (LOCKED) */}
          {activeTab === "auto-trader" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto relative h-full">
              {/* Locking Overlay */}
              <div className="absolute inset-0 bg-[#060608]/40 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center">
                <div className="w-14 h-14 rounded-full bg-enigma-orange/20 border border-enigma-orange/40 flex items-center justify-center mb-4 text-enigma-orange animate-pulse">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Unlock Coinbase Advanced Auto-Trading</h3>
                <p className="text-xs text-enigma-text-dim max-w-xl mb-6 leading-relaxed">
                  Seamlessly deploy E to execute live buy and sell orders on your secure Coinbase Advanced spot account. Program indicators (whale transactions, cycle exhaustion levels, volume delta spikes) as mechanical execution parameters.
                </p>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setActiveTab("war-room")}
                    className="px-5 py-2.5 bg-enigma-panel border border-enigma-border hover:bg-enigma-panel-light text-white font-semibold text-xs rounded transition-colors"
                  >
                    Back to War Room
                  </button>
                  <Link
                    href="/#pricing"
                    className="px-5 py-2.5 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:opacity-95 text-white font-semibold text-xs rounded transition-all shadow-lg shadow-enigma-orange/20"
                  >
                    Upgrade Tier / Check Plans
                  </Link>
                </div>
              </div>

              {/* Blurred mockup under */}
              <div className="space-y-6 select-none opacity-20 pointer-events-none">
                <div>
                  <h2 className="text-xl font-bold text-white">COINBASE AUTO-TRADING BRIDGE</h2>
                  <p className="text-xs text-enigma-text-dim">Pair API credentials to deploy AI trigger execution scripts.</p>
                </div>
                <div className="bg-enigma-panel border border-enigma-border p-6 rounded-lg space-y-4">
                  <div className="bg-[#07070a] p-4 rounded border border-enigma-border flex justify-between items-center">
                    <div>
                      <div className="text-[10px] text-enigma-text-dim">API KEY PARTNER STATUS</div>
                      <div className="font-bold text-enigma-green mt-1 text-sm">CONNECTED (API MOCK_PROD)</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-enigma-bg border border-enigma-border rounded space-y-3">
                      <span className="text-[10px] text-[#9ca3af] block font-bold font-terminal">DCA STRATEGY CONTROLS</span>
                    </div>
                    <div className="p-4 bg-enigma-bg border border-enigma-border rounded space-y-3">
                      <span className="text-[10px] text-[#9ca3af] block font-bold font-terminal">ENGINE RUN LOGS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: PORTFOLIO TRACKER */}
          {activeTab === "portfolio" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                    <BarChart2 className="w-5 h-5 text-enigma-green" />
                    <span>PORTFOLIO WAR ROOM</span>
                  </h2>
                  <p className="text-xs text-enigma-text-dim mt-1">Manual tracking paired with Coinbase spot sandbox bridge allocations.</p>
                </div>
                <button className="px-4 py-2 bg-enigma-panel border border-enigma-border rounded text-xs font-semibold hover:border-enigma-orange transition-colors flex items-center space-x-2 text-white">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Sync Balance</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg">
                  <span className="text-[10px] text-enigma-text-dim font-terminal">AGGREGATE PORTFOLIO VALUE</span>
                  <div className="text-3xl font-extrabold text-white mt-1">$124,520.18</div>
                  <div className="text-enigma-green text-[10px] font-terminal font-bold mt-1.5 flex items-center">
                    <span>+4.25% ($5,081.20) TODAY</span>
                  </div>
                </div>

                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg">
                  <span className="text-[10px] text-enigma-text-dim font-terminal">COINBASE API BALANCE</span>
                  <div className="text-2xl font-bold text-white mt-1">$45,000.00</div>
                  <span className="text-[9px] text-[#9ca3af] font-terminal bg-[#0c0c12] border border-enigma-border px-1.5 py-0.5 rounded w-fit block mt-1.5">
                    Bridged (Sandbox)
                  </span>
                </div>

                <div className="bg-enigma-panel border border-enigma-border p-5 rounded-lg">
                  <span className="text-[10px] text-enigma-text-dim font-terminal">ACTIVE STRATEGY ALLOCATION</span>
                  <div className="text-2xl font-bold text-enigma-purple mt-1">36% Stable / 64% Spot</div>
                  <span className="text-[9px] text-enigma-purple font-terminal bg-enigma-purple/10 border border-enigma-purple/20 px-1.5 py-0.5 rounded w-fit block mt-1.5">
                    Late Bull Profile
                  </span>
                </div>
              </div>

              {/* Allocation table */}
              <div className="bg-enigma-panel border border-enigma-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-enigma-border bg-[#07070a] flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-terminal tracking-wider">ASSET DISTRIBUTION ARRAY</span>
                </div>
                <div className="p-6 font-terminal text-xs space-y-3">
                  <div className="grid grid-cols-5 border-b border-enigma-border pb-2 text-[#9ca3af] text-[10px]">
                    <span>ASSET</span>
                    <span>BALANCE</span>
                    <span>ALLOCATION VALUE</span>
                    <span>% SHARE</span>
                    <span>24H PRICE INTEL</span>
                  </div>
                  {[
                    { asset: "BTC", bal: "1.18 BTC", val: "$79,556.19", share: "63.8%", price: "$67,420.50 (+1.4%)", color: "text-enigma-green" },
                    { asset: "ETH", bal: "10.40 ETH", val: "$36,505.56", share: "29.3%", price: "$3,510.15 (+0.8%)", color: "text-enigma-green" },
                    { asset: "SOL", bal: "59.20 SOL", val: "$8,453.76", share: "6.9%", price: "$142.80 (-1.2%)", color: "text-enigma-red" },
                  ].map((row, idx) => (
                    <div key={idx} className="grid grid-cols-5 border-b border-enigma-border/40 py-3 align-center">
                      <span className="font-bold text-white text-sm">{row.asset}</span>
                      <span>{row.bal}</span>
                      <span className="font-bold">{row.val}</span>
                      <span>{row.share}</span>
                      <span className={row.color}>{row.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: WHALE ACTIVITY LOGS */}
          {activeTab === "whale-alerts" && (
            <div className="p-8 space-y-8 max-w-[1200px] mx-auto">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <ShieldAlert className="w-5 h-5 text-enigma-orange" />
                  <span>DEEP WHALE WALLET ACTIVITY LOGS</span>
                </h2>
                <p className="text-xs text-enigma-text-dim mt-1">Real-time unfiltered ledger streams tracking transactions over $500,000 threshold.</p>
              </div>

              {/* Full alerts log */}
              <div className="bg-enigma-panel border border-enigma-border rounded-lg overflow-hidden">
                <div className="px-5 py-4 border-b border-enigma-border bg-[#07070a] flex items-center justify-between">
                  <span className="text-xs font-bold text-white font-terminal tracking-wider">ACTIVE BLOCKCHAIN MONITORS</span>
                  <div className="flex space-x-4 text-[10px] text-enigma-text-dim">
                    <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-enigma-green rounded-full"></span><span>BTC</span></span>
                    <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-enigma-green rounded-full"></span><span>ETH</span></span>
                    <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-enigma-green rounded-full"></span><span>SOL</span></span>
                    <span className="flex items-center space-x-1"><span className="w-1.5 h-1.5 bg-enigma-green rounded-full"></span><span>ERC-20</span></span>
                  </div>
                </div>
                <div className="p-6 font-terminal text-xs">
                  <div className="grid grid-cols-12 border-b border-enigma-border pb-2 text-[#9ca3af] text-[10px] mb-3">
                    <span className="col-span-2">TIMESTAMP</span>
                    <span className="col-span-2">ASSET VOLUME</span>
                    <span className="col-span-2">ESTIMATED VALUE</span>
                    <span className="col-span-2">TRANSACTION TYPE</span>
                    <span className="col-span-4">ROUTING ARRAY (FROM &gt; TO)</span>
                  </div>
                  <div className="space-y-3.5">
                    {whaleAlerts.map((alert) => (
                      <div key={alert.id} className="grid grid-cols-12 border-b border-enigma-border/30 pb-3 hover:bg-[#07070a]/50 p-2 rounded transition-all align-center">
                        <span className="col-span-2 text-enigma-muted">{alert.time}</span>
                        <span className="col-span-2 font-bold text-white">{alert.amount} {alert.coin}</span>
                        <span className="col-span-2 font-bold text-enigma-orange">{alert.value}</span>
                        <span className="col-span-2">
                          <span className={`px-2 py-0.5 rounded font-bold text-[9px] uppercase ${
                            alert.type === "deposit"
                              ? "bg-enigma-red/20 border border-enigma-red/30 text-enigma-red"
                              : alert.type === "withdrawal"
                              ? "bg-enigma-green/20 border border-enigma-green/30 text-enigma-green"
                              : "bg-enigma-purple/20 border border-enigma-purple/30 text-enigma-purple"
                          }`}>
                            {alert.type}
                          </span>
                        </span>
                        <span className="col-span-4 truncate text-[#9ca3af] text-[10px]">
                          <span className="text-white font-mono">{alert.from}</span>
                          <span className="text-enigma-orange mx-1.5">&gt;</span>
                          <span className="text-white font-mono">{alert.to}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
