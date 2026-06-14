"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MessageSquare,
  Compass,
  Zap,
  Lock,
  Database,
  ShieldAlert,
  BarChart2,
  LogOut,
  User,
  ArrowRight,
  Play,
  ArrowUpRight,
  Activity,
  Maximize2,
  Minimize2,
  Trash2,
} from "lucide-react";

export default function StandaloneChat() {
  const [depth, setDepth] = useState<"beginner" | "intermediate" | "advanced">("advanced");
  const [messages, setMessages] = useState<
    Array<{ sender: "user" | "e"; text: string; time: string }>
  >([
    {
      sender: "e",
      text: "Encrypted connection established. Dedicated E-Chat Tunnel active. You are running on the Elite Trial layer. Ask me anything about macro cycles, whale movements, or auto-trading configurations.",
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
          eResponse = "Cumberland is a massive OTC trading desk. When they deposit stablecoins like USDC to exchanges, it signals they are buying crypto. Recently they moved $45M USDC—which usually results in a market bounce.";
        } else if (depth === "intermediate") {
          eResponse = "Cumberland wallet (0x3d7e...) transferred 45M USDC to Binance and Coinbase. Historically, Cumberland deposits of this size have an 84% correlation with a local price bottom and a +4.2% rally within 48 hours.";
        } else {
          eResponse = "STABLES ROTATION REPORT: Cumberland (0x3d7e...9a41) injected 45,000,000 USDC into Coinbase/Binance spot markets over the last 4h. Exchange reserves increased by 0.35%. Orderbook bid depth clustered heavily at $63.8k-64.2k. MVRV Z-score remains cool at 2.42, signifying Wyckoff Phase D consolidation before the expansion wave.";
        }
      } else if (query.includes("sol") || query.includes("solana")) {
        if (depth === "beginner") {
          eResponse = "Solana (SOL) is defending support at $138. If this holds, it's a good spot to accumulate spot SOL using dollar-cost averaging (DCA).";
        } else if (depth === "intermediate") {
          eResponse = "SOL is in a healthy re-accumulation structure. On-chain wallet 0x5a9f swapped $2.4M stables into JUP/PYTH (SOL beta) over 24h. Daily RSI is at 38 (near oversold). Strong support cluster at $135-138.";
        } else {
          eResponse = "SOL/USD: Heavy absorption at the $138-140 HTF demand node. Jup-engine volume delta shows a positive +8% buyer skew. Liquidation clusters are packed at $134.50—recommending bid splits from $136.20 to capture the liquidity sweep.";
        }
      } else if (query.includes("cycle") || query.includes("macro") || query.includes("nupl")) {
        if (depth === "beginner") {
          eResponse = "We're in the 'Late Bull Accumulation' phase. Easy gains are behind us, but the massive parabolic phase is still ahead as smart money buys up the supply.";
        } else if (depth === "intermediate") {
          eResponse = "Cycle progress: Stage 2 (Late Bull Accumulation). MVRV Z-Score is at 2.4, and NUPL is in the 0.54 Belief range. We are in a typical mid-cycle re-accumulation consolidation, mirroring the mid-2020 structure before expansion.";
        } else {
          eResponse = "MACRO CYCLE RATIOS: Late Bull Accumulation. MVRV Z-Score sits at 2.42 (top peak threshold >6.0). NUPL is at 0.54 (Belief-Belief channel). SSR is near multi-year lows, implying massive dry powder on exchange sidelines. Pi Cycle Top 350-day SMA delta is -18.2%, signifying substantial run room before a structural blow-off peak.";
        }
      } else {
        if (depth === "beginner") {
          eResponse = "Analyzing. Let's look at stablecoin rotations, Solana bid levels, or cycle indicators. What's on your mind?";
        } else if (depth === "intermediate") {
          eResponse = "Acknowledged. Consolidation volume is tightening, suggesting an explosive expansion is forming. Keep stop-losses under the 20-week EMA.";
        } else {
          eResponse = "STRUCTURAL UPDATE: Aggregate open interest has retraced by $1.8B, completing the leverage purge. Volume profile shows high volume node (HVN) consolidation. Awaiting buy triggers.";
        }
      }

      setMessages((prev) => [...prev, { sender: "e", text: eResponse, time: timeStr }]);
      setIsTyping(false);
    }, 1200);
  };

  // Clear Chat function
  const clearChat = () => {
    setMessages([
      {
        sender: "e",
        text: "Terminal reset. New dedicated E-Chat session initiated. Send a command to begin.",
        time: new Date().toTimeString().split(" ")[0],
      },
    ]);
  };

  return (
    <div className="min-h-screen bg-enigma-bg text-enigma-text flex flex-col font-sans">
      {/* Top Banner Ticker */}
      <div className="bg-[#0c0c12] border-b border-enigma-border py-2 px-6 flex items-center justify-between text-xs font-terminal">
        <div className="flex items-center space-x-4">
          <span className="inline-block w-2 h-2 rounded-full bg-enigma-purple animate-pulse"></span>
          <span className="text-enigma-purple font-bold">E-TUNNEL SECURE #7102</span>
        </div>
        <div className="flex items-center space-x-6 text-enigma-text-dim">
          <span>LATENCY: <span className="text-enigma-green">14ms</span></span>
          <span className="hidden sm:inline">CYCLE STAGE: <span className="text-enigma-orange font-bold">ACCUMULATION</span></span>
          <Link href="/dashboard" className="text-white hover:text-enigma-orange flex items-center space-x-1.5 border-l border-enigma-border pl-6 font-semibold">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Dedicated Chat Window */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 md:p-8 flex flex-col h-[calc(100vh-37px)] overflow-hidden">
        
        {/* Terminal Wrapper */}
        <div className="flex-1 bg-enigma-panel border border-enigma-border rounded-lg shadow-2xl overflow-hidden flex flex-col">
          
          {/* Console Header */}
          <div className="bg-[#07070a] px-6 py-4 border-b border-enigma-border flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-enigma-red"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-enigma-orange"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-enigma-green"></div>
              <span className="font-terminal text-xs text-[#9ca3af] ml-2">E_STANDALONE_CHAT_LAYER_v1.09</span>
            </div>

            <div className="flex items-center space-x-4">
              {/* Depth Selector */}
              <div className="flex items-center bg-enigma-bg border border-enigma-border rounded px-1.5 py-1">
                <span className="text-[10px] text-enigma-text-dim px-2 hidden md:inline font-terminal font-bold">COGNITIVE ADAPTER:</span>
                {["beginner", "intermediate", "advanced"].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setDepth(lvl as any)}
                    className={`text-[9px] px-2.5 py-0.5 rounded capitalize font-terminal transition-all ${
                      depth === lvl ? "bg-enigma-orange text-white" : "text-enigma-text-dim hover:text-white"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              {/* Trash/Clear console */}
              <button
                onClick={clearChat}
                title="Reset Console"
                className="p-1.5 bg-enigma-bg hover:bg-enigma-panel-light border border-enigma-border rounded text-enigma-muted hover:text-enigma-red transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Dedicated chat logs */}
          <div className="flex-1 p-6 md:p-8 overflow-y-auto space-y-5 font-terminal text-xs leading-relaxed scrollbar-thin">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded p-4 border relative group ${
                  msg.sender === "user"
                    ? "bg-[#161622] border-enigma-border text-white"
                    : "bg-enigma-bg border-enigma-border text-enigma-text"
                }`}>
                  <div className="flex items-center justify-between space-x-8 mb-2 pb-1 border-b border-enigma-border/30">
                    <span className={`font-bold flex items-center space-x-1.5 ${msg.sender === "user" ? "text-enigma-orange" : "text-enigma-purple"}`}>
                      <span>{msg.sender === "user" ? "TRADER" : "E"}</span>
                      {msg.sender === "e" && (
                        <span className="text-[8px] px-1 bg-enigma-purple/10 border border-enigma-purple/30 rounded text-enigma-purple font-normal uppercase">
                          AI Partner
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] text-enigma-muted">{msg.time}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-enigma-bg border border-enigma-border rounded p-4">
                  <span className="inline-block w-1.5 h-3 bg-enigma-purple animate-pulse"></span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Command Suggestions strip */}
          <div className="px-6 py-3 bg-[#08080c] border-t border-enigma-border flex items-center space-x-2 overflow-x-auto whitespace-nowrap text-[10px] shrink-0">
            <span className="text-enigma-text-dim font-terminal font-bold uppercase">PROMPTS:</span>
            <button
              onClick={() => setInputValue("Analyze the current Cumberland stablecoin rotation.")}
              className="px-2.5 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
            >
              Analyze Cumberland
            </button>
            <button
              onClick={() => setInputValue("What is the current SOL ecosystem and bid zone chart analysis?")}
              className="px-2.5 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
            >
              SOL Bid Zones
            </button>
            <button
              onClick={() => setInputValue("Run current Cycle Intelligence macro evaluation.")}
              className="px-2.5 py-1 bg-enigma-panel border border-enigma-border rounded text-white hover:border-enigma-orange transition-colors"
            >
              Cycle Macro NUPL
            </button>
          </div>

          {/* Command execution input prompt */}
          <form onSubmit={handleSendMessage} className="p-5 bg-[#07070a] border-t border-enigma-border flex space-x-4 shrink-0">
            <div className="text-enigma-purple font-terminal flex items-center font-bold text-sm select-none">E&gt;</div>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask E anything (e.g., 'Analyze SOL', 'Cumberland stable rotation')..."
              className="flex-1 bg-enigma-bg border border-enigma-border rounded px-4 py-3.5 text-xs font-terminal text-white focus:outline-none focus:border-enigma-orange"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-enigma-orange to-enigma-purple hover:opacity-95 text-white font-terminal text-xs font-bold rounded transition-all shadow-md shadow-enigma-orange/15"
            >
              EXECUTE
            </button>
          </form>

        </div>
        
        {/* Portal back link */}
        <div className="py-4 text-center font-terminal text-[10px] text-enigma-text-dim">
          <span>SECURED AI CHANNEL • ENIGMA INTELLIGENCE PLATFORM v1.09 • </span>
          <Link href="/dashboard" className="text-enigma-orange hover:underline font-bold">EXIT CHAT</Link>
        </div>
      </div>
    </div>
  );
}
