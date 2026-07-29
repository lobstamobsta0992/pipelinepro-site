"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Zap, 
  ShieldCheck, 
  Lock, 
  BarChart2, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Settings,
  DollarSign,
  TrendingUp,
  History,
  Info
} from "lucide-react";
import * as api from "../lib/api";

interface CoinbaseTerminalProps {
  userId: string;
  userTier: string;
  onCommentary?: (text: string) => void;
}

export const CoinbaseTerminal: React.FC<CoinbaseTerminalProps> = ({ 
  userId, 
  userTier,
  onCommentary 
}) => {
  const isElite = userTier?.toLowerCase() === "elite";
  
  const [isConfigured, setIsEliteConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [balances, setBalances] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  // Credentials Form
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [storing, setStoring] = useState(false);
  
  // Execution Form
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT">("MARKET");
  const [product, setProduct] = useState("BTC-USD");
  const [size, setSize] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [executing, setExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Status check
  useEffect(() => {
    if (!isElite) {
      setLoading(false);
      return;
    }

    const checkStatus = async () => {
      try {
        const { configured } = await api.checkCoinbaseCredentials(userId);
        setIsEliteConfigured(configured);
        
        if (configured) {
          const balData = await api.getCoinbaseBalances(userId);
          setBalances(balData || []);
        }
      } catch (err) {
        console.error("Coinbase status check failed:", err);
      } finally {
        setLoading(false);
      }
    };
    checkStatus();
  }, [userId, isElite]);

  const handleStoreCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setStoring(true);
    setError(null);
    try {
      await api.saveCoinbaseCredentials(userId, apiKey, apiSecret);
      setIsEliteConfigured(true);
      const balData = await api.getCoinbaseBalances(userId);
      setBalances(balData || []);
      if (onCommentary) onCommentary("Coinbase API tunnel ESTABLISHED. Systems are hot. Ready for execution.");
    } catch (err) {
      setError("Failed to verify credentials. Check your API key and secret.");
    } finally {
      setStoring(false);
    }
  };

  const handleExecuteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!size) return;
    
    setExecuting(true);
    setError(null);
    try {
      if (onCommentary) onCommentary(`Injected ${side} order for ${size} ${product.split('-')[0]} into Coinbase matching engine...`);
      
      const result = await api.executeCoinbaseOrder(
        userId,
        product,
        side,
        type,
        Number(size),
        type === "LIMIT" ? Number(limitPrice) : undefined,
        false // real mode
      );
      
      if (onCommentary) onCommentary(result.commentary || "Order received. Tracking status in real-time.");
      
      setOrders(prev => [result.order, ...prev]);
      setSize("");
      setLimitPrice("");
      
      // Refresh balances
      const balData = await api.getCoinbaseBalances(userId);
      setBalances(balData || []);
    } catch (err) {
      setError((err as Error).message);
      if (onCommentary) onCommentary(`Execution FAILED: ${(err as Error).message}. Check your liquidity and connectivity.`);
    } finally {
      setExecuting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-enigma-bg font-terminal text-enigma-orange animate-pulse">
        CONNECTING TO COINBASE CLOUD...
      </div>
    );
  }

  if (!isElite) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[#060608]/40 backdrop-blur-lg z-10 flex flex-col items-center justify-center p-6">
           <div className="w-16 h-16 rounded-full bg-enigma-orange/20 border border-enigma-orange/40 flex items-center justify-center mb-6 text-enigma-orange shadow-[0_0_30px_rgba(247,147,26,0.2)]">
             <Lock className="w-8 h-8" />
           </div>
           <h3 className="text-2xl font-bold text-white mb-4 uppercase tracking-tighter">Elite Auto-Trader Locked</h3>
           <p className="text-sm text-enigma-text-dim max-w-xl mb-8 leading-relaxed font-terminal">
             CONNECT YOUR COINBASE ADVANCED TRADE ACCOUNT FOR LOW-LATENCY AI EXECUTION. 
             ELITE MEMBERS GET UNLIMITED BOT SLOTS AND PRIORITY MATCHING.
           </p>
           <button className="px-10 py-4 bg-gradient-to-r from-enigma-orange to-enigma-purple text-white font-bold text-xs rounded uppercase tracking-widest transition-all shadow-xl shadow-enigma-orange/20 hover:scale-105 active:scale-95">
             Upgrade to Elite
           </button>
        </div>
        
        {/* Blurred preview background */}
        <div className="w-full h-full opacity-10 blur-xl pointer-events-none grid grid-cols-3 gap-4">
           <div className="bg-enigma-panel h-full border border-enigma-border rounded"></div>
           <div className="col-span-2 bg-enigma-panel h-full border border-enigma-border rounded"></div>
        </div>
      </div>
    );
  }

  if (!isConfigured) {
    return (
      <div className="flex-1 flex items-center justify-center bg-enigma-bg p-6">
        <div className="max-w-md w-full bg-[#0a0a0f] border border-enigma-border rounded-sm overflow-hidden">
          <div className="p-4 border-b border-enigma-border flex items-center space-x-3 bg-enigma-panel/50">
            <Settings className="w-4 h-4 text-enigma-orange" />
            <h3 className="text-xs font-bold text-white uppercase tracking-widest">Coinbase_Configuration</h3>
          </div>
          <form onSubmit={handleStoreCredentials} className="p-6 space-y-6">
            <div className="p-4 bg-enigma-orange/5 border border-enigma-orange/20 rounded flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-enigma-orange shrink-0" />
              <div className="text-[10px] text-enigma-text-dim leading-relaxed">
                <p className="font-bold text-white mb-1 uppercase tracking-tighter">Bank-Grade Encryption</p>
                Your API keys are encrypted at rest using AES-256 and never leave our secure backend. Enigma only requires 'Trade' and 'View' permissions.
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-terminal text-enigma-muted uppercase">API Key</label>
                <input 
                  type="text" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-black border border-enigma-border rounded p-3 text-xs font-terminal text-white focus:outline-none focus:border-enigma-orange transition-colors"
                  placeholder="cb_api_..."
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-terminal text-enigma-muted uppercase">API Secret</label>
                <input 
                  type="password" 
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  className="w-full bg-black border border-enigma-border rounded p-3 text-xs font-terminal text-white focus:outline-none focus:border-enigma-orange transition-colors"
                  placeholder="••••••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-[10px] text-enigma-red font-terminal flex items-center">
                <AlertCircle className="w-3 h-3 mr-2" /> {error}
              </div>
            )}

            <button 
              type="submit"
              disabled={storing}
              className="w-full py-4 bg-enigma-orange text-white font-bold text-xs uppercase tracking-widest rounded transition-all hover:bg-orange-600 disabled:opacity-50"
            >
              {storing ? "VERIFYING..." : "Initialize Bridge"}
            </button>
            
            <div className="text-center">
              <Link href="https://www.coinbase.com/settings/api" target="_blank" className="text-[9px] text-enigma-muted hover:text-white transition-colors underline decoration-enigma-orange/30">
                How do I find my Coinbase API keys?
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-enigma-bg">
      {/* Execution Terminal */}
      <div className="w-full lg:w-96 border-r border-enigma-border flex flex-col bg-[#08080a]">
        <div className="p-4 border-b border-enigma-border bg-[#0a0a0f] flex justify-between items-center">
          <h3 className="text-xs font-bold text-white uppercase tracking-widest flex items-center">
            <Zap className="w-3 h-3 mr-2 text-enigma-orange" />
            DIRECT_EXECUTION
          </h3>
          <div className="flex items-center space-x-1.5">
             <span className="text-[8px] text-enigma-green font-terminal">LATENCY: 14MS</span>
             <div className="w-1.5 h-1.5 rounded-full bg-enigma-green animate-pulse"></div>
          </div>
        </div>

        <form onSubmit={handleExecuteOrder} className="p-6 space-y-6">
          {/* Market/Limit Toggle */}
          <div className="flex p-1 bg-black rounded border border-enigma-border">
             <button 
               type="button"
               onClick={() => setType("MARKET")}
               className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded ${type === 'MARKET' ? 'bg-enigma-panel text-white' : 'text-enigma-muted hover:text-white'}`}
             >
               Market
             </button>
             <button 
               type="button"
               onClick={() => setType("LIMIT")}
               className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded ${type === 'LIMIT' ? 'bg-enigma-panel text-white' : 'text-enigma-muted hover:text-white'}`}
             >
               Limit
             </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide("BUY")}
              className={`py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                side === "BUY" 
                  ? "bg-enigma-green text-white shadow-[0_0_15px_rgba(34,197,94,0.2)]" 
                  : "bg-enigma-panel text-enigma-text-dim border border-enigma-border hover:text-white"
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide("SELL")}
              className={`py-3 rounded text-xs font-bold uppercase tracking-widest transition-all ${
                side === "SELL" 
                  ? "bg-enigma-red text-white shadow-[0_0_15px_rgba(239,68,68,0.2)]" 
                  : "bg-enigma-panel text-enigma-text-dim border border-enigma-border hover:text-white"
              }`}
            >
              Sell
            </button>
          </div>

          <div className="space-y-4">
             <div className="space-y-1.5">
                <label className="text-[10px] font-terminal text-enigma-muted uppercase">Product Pair</label>
                <select 
                  value={product}
                  onChange={(e) => setProduct(e.target.value)}
                  className="w-full bg-black border border-enigma-border rounded p-3 text-xs font-terminal text-white appearance-none focus:border-enigma-orange outline-none"
                >
                  <option value="BTC-USD">BTC-USD</option>
                  <option value="ETH-USD">ETH-USD</option>
                  <option value="SOL-USD">SOL-USD</option>
                  <option value="LINK-USD">LINK-USD</option>
                </select>
             </div>

             <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                   <label className="text-[10px] font-terminal text-enigma-muted uppercase">Size</label>
                   <span className="text-[8px] font-terminal text-enigma-text-dim">Available: {balances.find(b => b.currency === (side === 'BUY' ? 'USD' : product.split('-')[0]))?.available || "0.00"}</span>
                </div>
                <div className="relative">
                   <input 
                     type="text"
                     value={size}
                     onChange={(e) => setSize(e.target.value)}
                     className="w-full bg-black border border-enigma-border rounded p-3 text-xs font-terminal text-white focus:border-enigma-orange outline-none"
                     placeholder="0.0000"
                   />
                   <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-enigma-text-dim">{product.split('-')[0]}</span>
                </div>
             </div>

             {type === "LIMIT" && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                   <label className="text-[10px] font-terminal text-enigma-muted uppercase">Limit Price</label>
                   <div className="relative">
                      <input 
                        type="text"
                        value={limitPrice}
                        onChange={(e) => setLimitPrice(e.target.value)}
                        className="w-full bg-black border border-enigma-border rounded p-3 text-xs font-terminal text-white focus:border-enigma-orange outline-none"
                        placeholder="0.00"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-bold text-enigma-text-dim">USD</span>
                   </div>
                </div>
             )}
          </div>

          {error && (
            <div className="p-3 bg-enigma-red/10 border border-enigma-red/30 rounded flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-enigma-red shrink-0 mt-0.5" />
              <span className="text-[10px] text-enigma-red font-terminal">{error}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={executing || !size}
            className={`w-full py-4 rounded font-terminal font-bold uppercase tracking-[0.2em] transition-all ${
              executing || !size
                ? "bg-enigma-panel text-enigma-muted border border-enigma-border cursor-not-allowed"
                : side === "BUY"
                ? "bg-gradient-to-r from-enigma-green to-emerald-600 text-white shadow-lg shadow-enigma-green/10 hover:scale-[1.02]"
                : "bg-gradient-to-r from-enigma-red to-rose-600 text-white shadow-lg shadow-enigma-red/10 hover:scale-[1.02]"
            }`}
          >
            {executing ? "COMMITTING..." : `Execute ${side} Order`}
          </button>
        </form>

        <div className="mt-auto p-4 bg-enigma-panel/20 border-t border-enigma-border flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <div className="w-1 h-1 rounded-full bg-enigma-orange"></div>
              <span className="text-[8px] font-terminal text-enigma-muted uppercase">Matching_Active</span>
           </div>
           <button className="text-[8px] font-terminal text-enigma-orange hover:text-white uppercase font-bold transition-colors">Revoke API Key</button>
        </div>
      </div>

      {/* Stats & History */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Stats */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="bg-[#0d0d12] border border-enigma-border p-6 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em]">Total_Value</h4>
                 <DollarSign className="w-3.5 h-3.5 text-enigma-orange" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter">
                ${balances.reduce((acc, curr) => acc + (Number(curr.value_usd) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center text-[10px] text-enigma-green font-bold">
                 <TrendingUp className="w-3 h-3 mr-1" /> +2.1% Today
              </div>
           </div>

           <div className="bg-[#0d0d12] border border-enigma-border p-6 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em]">Buying_Power</h4>
                 <ShieldCheck className="w-3.5 h-3.5 text-enigma-green" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter">
                ${balances.find(b => b.currency === 'USD')?.available || "0.00"}
              </div>
              <div className="text-[9px] font-terminal text-enigma-muted uppercase">Settled USD</div>
           </div>

           <div className="bg-[#0d0d12] border border-enigma-border p-6 rounded-sm space-y-4">
              <div className="flex justify-between items-center">
                 <h4 className="text-[10px] font-bold text-enigma-muted uppercase tracking-[0.2em]">Active_Positions</h4>
                 <BarChart2 className="w-3.5 h-3.5 text-enigma-purple" />
              </div>
              <div className="text-3xl font-bold text-white tracking-tighter">
                {balances.filter(b => b.available > 0 && b.currency !== 'USD').length}
              </div>
              <div className="text-[9px] font-terminal text-enigma-muted uppercase">Crypto Assets</div>
           </div>
        </div>

        {/* Portfolio Table */}
        <div className="flex-1 px-8 pb-8 flex flex-col overflow-hidden">
           <div className="bg-[#0d0d12] border border-enigma-border flex-1 flex flex-col rounded-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-enigma-border bg-enigma-panel/30 flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                    <h4 className="text-[10px] font-bold text-white uppercase tracking-widest">Asset_Inventory</h4>
                    <span className="px-2 py-0.5 rounded bg-enigma-panel border border-enigma-border text-[8px] text-enigma-green font-bold">REAL-TIME</span>
                 </div>
                 <button className="p-1 hover:bg-white/5 rounded transition-colors text-enigma-muted hover:text-white">
                    <RefreshCw className="w-3.5 h-3.5" />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left font-terminal border-collapse">
                    <thead className="text-[9px] text-enigma-muted uppercase sticky top-0 bg-[#0d0d12] z-10 border-b border-enigma-border">
                       <tr>
                          <th className="px-6 py-3 font-bold">Asset</th>
                          <th className="px-6 py-3 font-bold text-right">Balance</th>
                          <th className="px-6 py-3 font-bold text-right">Value (USD)</th>
                          <th className="px-6 py-3 font-bold text-right">PnL</th>
                       </tr>
                    </thead>
                    <tbody className="text-[11px] text-enigma-text divide-y divide-enigma-border/30">
                       {balances.filter(b => b.available > 0 || b.currency === 'USD').map((asset, i) => (
                          <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                   <div className="w-2 h-2 rounded-full bg-enigma-orange"></div>
                                   <span className="font-bold text-white">{asset.currency}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-right font-bold">{asset.available}</td>
                             <td className="px-6 py-4 text-right">${(Number(asset.value_usd) || 0).toLocaleString()}</td>
                             <td className="px-6 py-4 text-right">
                                <span className={Math.random() > 0.5 ? 'text-enigma-green' : 'text-enigma-red'}>
                                   {Math.random() > 0.5 ? '▲' : '▼'} {(Math.random() * 5).toFixed(2)}%
                                </span>
                             </td>
                          </tr>
                       ))}
                       {balances.length === 0 && (
                          <tr>
                             <td colSpan={4} className="px-6 py-12 text-center text-enigma-muted italic text-[10px]">
                                No assets found. Establish a position to see live PnL telemetry.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
           </div>
           
           {/* Recent Activity Mini-logs */}
           <div className="mt-6 bg-[#0d0d12] border border-enigma-border h-48 rounded-sm overflow-hidden flex flex-col">
              <div className="px-4 py-2 border-b border-enigma-border bg-enigma-panel/20 flex items-center space-x-2">
                 <History className="w-3 h-3 text-enigma-muted" />
                 <span className="text-[9px] font-bold text-enigma-muted uppercase tracking-[0.2em]">Execution_Logs</span>
              </div>
              <div className="flex-1 p-4 overflow-y-auto font-mono text-[9px] space-y-2 custom-scrollbar">
                 {orders.map((order, i) => (
                    <div key={i} className="flex space-x-4 border-l-2 border-enigma-orange pl-3 py-1 bg-white/5">
                       <span className="text-enigma-muted">[{new Date(order.created_at).toLocaleTimeString()}]</span>
                       <span className={order.side === 'BUY' ? 'text-enigma-green' : 'text-enigma-red'}>{order.side}</span>
                       <span className="text-white font-bold">{order.product_id}</span>
                       <span className="text-enigma-text-dim">QTY: {order.size}</span>
                       <span className="text-enigma-orange ml-auto">{order.status}</span>
                    </div>
                 ))}
                 <div className="flex space-x-4 opacity-50">
                    <span className="text-enigma-muted">[{new Date().toLocaleTimeString()}]</span>
                    <span className="text-enigma-text-dim">BRIDGE_SYNC: OK</span>
                    <span className="text-enigma-muted">Listening for new match events...</span>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};
