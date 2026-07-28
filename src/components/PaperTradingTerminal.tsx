"use client";

import React, { useState, useEffect } from "react";
import { 
  ArrowRight, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Zap, 
  BarChart2, 
  Clock,
  AlertCircle
} from "lucide-react";
import * as api from "../lib/api";

interface PaperTradingTerminalProps {
  userId: string;
  onTradeExecuted?: (trade: any) => void;
  onCommentary?: (text: string) => void;
}

export const PaperTradingTerminal: React.FC<PaperTradingTerminalProps> = ({ 
  userId, 
  onTradeExecuted,
  onCommentary 
}) => {
  const [account, setAccount] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [assets, setAssets] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [selectedAsset, setSelectedAsset] = useState("BTC");
  const [amount, setAmount] = useState("");
  const [slippage, setSlippage] = useState("1.0");
  const [trading, setTrading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch initial data
  useEffect(() => {
    const init = async () => {
      try {
        const [acc, port, hist, asts] = await Promise.all([
          api.getPaperAccount(userId),
          api.getPaperPortfolio(userId),
          api.getPaperHistory(userId, 10),
          api.getTradableAssets()
        ]);
        setAccount(acc);
        setPortfolio(port);
        setHistory(hist);
        setAssets(asts);
      } catch (err) {
        console.error("Failed to init paper trading:", err);
        setError("System offline. Could not connect to DEX simulator.");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [userId]);

  // Handle trade execution
  const handleTrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount))) return;
    
    setTrading(true);
    setError(null);
    
    try {
      if (onCommentary) {
        onCommentary(`Analyzing liquidity for ${side.toUpperCase()} ${amount} ${selectedAsset}...`);
      }
      
      const result = await api.executePaperTrade(
        userId,
        side,
        selectedAsset,
        Number(amount),
        Number(slippage) / 100
      );
      
      // Update local state
      const [port, hist] = await Promise.all([
        api.getPaperPortfolio(userId),
        api.getPaperHistory(userId, 10)
      ]);
      setPortfolio(port);
      setHistory(hist);
      setAmount("");
      
      if (onTradeExecuted) onTradeExecuted(result);
      if (onCommentary) {
        onCommentary(`Execution confirmed. ${side.toUpperCase()} ${result.quantity} ${result.asset} @ $${result.price.toLocaleString()}. Final slippage: ${(result.slippage * 100).toFixed(3)}%.`);
      }
    } catch (err) {
      setError((err as Error).message);
      if (onCommentary) {
        onCommentary(`Trade REJECTED: ${(err as Error).message}. Check your margin and liquidity.`);
      }
    } finally {
      setTrading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060608] font-terminal text-enigma-orange animate-pulse">
        INITIALIZING DEX SIMULATOR...
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-[#060608]">
      {/* Left Column: Trading Terminal */}
      <div className="w-full lg:w-96 border-r border-enigma-border flex flex-col bg-[#08080a]">
        <div className="p-4 border-b border-enigma-border bg-[#0a0a0f] flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <RefreshCw className="w-3 h-3 mr-2 text-enigma-orange" />
            SWAP_INTERFACE
          </h3>
          <span className="text-[10px] text-enigma-green font-terminal">DEX_LIVE</span>
        </div>

        <form onSubmit={handleTrade} className="p-6 space-y-6">
          {/* Side Toggle */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("buy")}
              className={`py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                side === "buy" 
                  ? "bg-enigma-green text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                  : "bg-enigma-panel text-enigma-text-dim border border-enigma-border hover:text-white"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("sell")}
              className={`py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                side === "sell" 
                  ? "bg-enigma-red text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                  : "bg-enigma-panel text-enigma-text-dim border border-enigma-border hover:text-white"
              }`}
            >
              Sell
            </button>
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <label className="text-[10px] font-terminal text-enigma-text-dim uppercase tracking-widest">Select Asset</label>
            <div className="grid grid-cols-3 gap-2">
              {assets?.supported_assets.filter((a: string) => a !== "USDC").map((asset: string) => (
                <button
                  key={asset}
                  type="button"
                  onClick={() => setSelectedAsset(asset)}
                  className={`py-2 rounded border text-[10px] font-bold transition-all ${
                    selectedAsset === asset
                      ? "border-enigma-orange text-white bg-enigma-orange/10"
                      : "border-enigma-border text-enigma-text-dim hover:border-white/30"
                  }`}
                >
                  {asset}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-[10px] font-terminal text-enigma-text-dim uppercase tracking-widest">Amount</label>
              <span className="text-[9px] font-terminal text-enigma-muted uppercase">
                Bal: {side === "buy" 
                  ? `$${portfolio?.balances?.USDC?.toLocaleString() || "0"}` 
                  : `${portfolio?.balances?.[selectedAsset]?.toLocaleString() || "0"} ${selectedAsset}`}
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-black border border-enigma-border rounded p-3 text-sm font-terminal text-white focus:outline-none focus:border-enigma-orange transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-enigma-text-dim">
                {selectedAsset}
              </span>
            </div>
          </div>

          {/* Slippage */}
          <div className="space-y-2">
            <label className="text-[10px] font-terminal text-enigma-text-dim uppercase tracking-widest">Max Slippage (%)</label>
            <div className="flex space-x-2">
              {["0.1", "0.5", "1.0", "3.0"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSlippage(s)}
                  className={`flex-1 py-1.5 rounded border text-[9px] font-bold transition-all ${
                    slippage === s
                      ? "border-enigma-purple text-white bg-enigma-purple/10"
                      : "border-enigma-border text-enigma-text-dim hover:border-white/30"
                  }`}
                >
                  {s}%
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-enigma-red/10 border border-enigma-red/30 rounded flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-enigma-red shrink-0 mt-0.5" />
              <span className="text-[10px] text-enigma-red font-terminal">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={trading || !amount}
            className={`w-full py-4 rounded font-terminal font-bold uppercase tracking-[0.2em] transition-all ${
              trading || !amount
                ? "bg-enigma-panel text-enigma-muted border border-enigma-border cursor-not-allowed"
                : side === "buy"
                ? "bg-gradient-to-r from-enigma-green to-emerald-600 text-white shadow-lg shadow-enigma-green/10 hover:scale-[1.02]"
                : "bg-gradient-to-r from-enigma-red to-rose-600 text-white shadow-lg shadow-enigma-red/10 hover:scale-[1.02]"
            }`}
          >
            {trading ? "EXECUTING..." : `Execute ${side.toUpperCase()}`}
          </button>
        </form>

        <div className="mt-auto p-4 border-t border-enigma-border font-terminal text-[9px] space-y-2">
           <div className="flex justify-between">
             <span className="text-enigma-muted">DEX_FEE</span>
             <span className="text-white">0.3%</span>
           </div>
           <div className="flex justify-between">
             <span className="text-enigma-muted">PRICE_IMPACT</span>
             <span className="text-enigma-green">&lt; 0.01%</span>
           </div>
        </div>
      </div>

      {/* Middle Column: Chart & Portfolio */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Chart Area */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex justify-between items-end mb-6">
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-2xl font-bold text-white tracking-tighter">{selectedAsset}/USDC</h2>
                <span className="px-2 py-0.5 rounded bg-enigma-panel border border-enigma-border text-[10px] text-enigma-green font-bold">+2.45%</span>
              </div>
              <p className="text-[10px] text-enigma-text-dim mt-1 font-terminal uppercase tracking-widest">Simulated Price Feed // 1s Latency</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-white font-terminal tracking-tighter">
                ${selectedAsset === "BTC" ? "67,420.50" : selectedAsset === "ETH" ? "3,510.15" : "142.80"}
              </div>
              <div className="text-[10px] text-enigma-muted font-terminal uppercase">Mark Price</div>
            </div>
          </div>

          <div className="flex-1 relative bg-[#07070a] border border-enigma-border rounded overflow-hidden flex items-end p-4">
             {/* Simple visual chart */}
             <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
             <div className="flex-1 h-full flex items-end space-x-1">
                {Array.from({length: 60}).map((_, i) => (
                  <div 
                    key={i} 
                    className={`flex-1 rounded-t-sm transition-all duration-500 ${i % 2 === 0 ? "bg-enigma-green/40 border-t border-enigma-green" : "bg-enigma-red/40 border-t border-enigma-red"}`} 
                    style={{height: `${30 + Math.random() * 50}%`}}
                  ></div>
                ))}
             </div>
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-[9px] font-terminal text-enigma-muted uppercase tracking-[0.4em] rotate-12 opacity-30">PAPER_TRADING_MODE</div>
             </div>
          </div>
        </div>

        {/* Portfolio Stats Area */}
        <div className="h-64 border-t border-enigma-border p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#08080a]">
           <div className="space-y-4">
             <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em] flex items-center">
               <DollarSign className="w-3 h-3 mr-1" /> Equity_Value
             </h4>
             <div className="text-3xl font-bold text-white tracking-tighter">
               ${portfolio?.equity?.toLocaleString() || "0.00"}
             </div>
             <div className="flex items-center text-[10px] text-enigma-green font-bold">
               <TrendingUp className="w-3 h-3 mr-1" /> +12.4% All Time
             </div>
           </div>

           <div className="space-y-4 border-l border-enigma-border pl-6">
             <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em] flex items-center">
               <Zap className="w-3 h-3 mr-1" /> Active_Assets
             </h4>
             <div className="flex flex-wrap gap-2">
               {portfolio?.balances && Object.entries(portfolio.balances).map(([asset, bal]: [any, any]) => (
                 bal > 0 && asset !== "USDC" && (
                   <div key={asset} className="px-2 py-1 rounded bg-enigma-panel border border-enigma-border flex items-center space-x-2">
                     <span className="text-[10px] font-bold text-white">{asset}</span>
                     <span className="text-[9px] text-enigma-text-dim">{bal.toFixed(4)}</span>
                   </div>
                 )
               ))}
               {(!portfolio?.balances || Object.keys(portfolio.balances).length <= 1) && (
                 <span className="text-[10px] text-enigma-muted italic font-terminal">All cash position.</span>
               )}
             </div>
           </div>

           <div className="space-y-4 border-l border-enigma-border pl-6">
             <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em] flex items-center">
               <Clock className="w-3 h-3 mr-1" /> Recent_Activity
             </h4>
             <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
               {history.slice(0, 3).map((trade, i) => (
                 <div key={i} className="flex justify-between items-center text-[9px] font-terminal">
                   <div className="flex items-center">
                     <span className={trade.side === "buy" ? "text-enigma-green" : "text-enigma-red"}>{trade.side.toUpperCase()}</span>
                     <span className="text-white ml-2">{trade.asset}</span>
                   </div>
                   <span className="text-enigma-muted">${trade.price.toLocaleString()}</span>
                 </div>
               ))}
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};
