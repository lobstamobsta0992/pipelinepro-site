"use client";

import React, { useState, useEffect } from "react";
import { 
  Zap, 
  Settings, 
  History, 
  ToggleLeft, 
  ToggleRight, 
  Clock,
  ShieldCheck,
  Lock,
  ArrowRight,
  RefreshCw,
  Activity,
  DollarSign,
  PieChart,
  AlertCircle
} from "lucide-react";
import * as api from "../lib/api";

interface AutoTradingDashboardProps {
  userId: string;
  userTier: string;
  onCommentary?: (text: string) => void;
}

export function AutoTradingDashboard({ userId, userTier, onCommentary }: AutoTradingDashboardProps) {
  const isElite = userTier?.toLowerCase() === "elite";
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [strategies, setStrategies] = useState<any[]>([]);
  const [sentiment, setSentiment] = useState<any>(null);
  const [executions, setExecutions] = useState<any[]>([]);
  const [isCoinbaseConfigured, setIsCoinbaseConfigured] = useState(false);
  
  // Strategy Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newStrat, setNewStrat] = useState({
    name: "Sentiment DCA",
    asset: "BTC",
    base_amount: 100,
    frequency: "weekly",
    max_multiplier: 2.0,
    min_cash_reserve: 500
  });

  const fetchData = async () => {
    if (!isElite) {
      setLoading(false);
      return;
    }

    try {
      setRefreshing(true);
      const [strats, sent, cbStatus] = await Promise.all([
        api.getStrategies(userId),
        api.getSentimentSnapshot(),
        api.checkCoinbaseCredentials(userId)
      ]);

      setStrategies(strats || []);
      setSentiment(sent);
      setIsCoinbaseConfigured(cbStatus.configured);

      // Fetch executions for strategies
      if (strats && strats.length > 0) {
        // Just fetch for the first one or combine them
        const allExecs = await Promise.all(
          strats.map((s: any) => api.getStrategyExecutions(s.id).catch(() => []))
        );
        const flattened = allExecs.flat().sort((a: any, b: any) => 
          new Date(b.executed_at || b.scheduled_at).getTime() - new Date(a.executed_at || a.scheduled_at).getTime()
        );
        setExecutions(flattened.slice(0, 20));
      }
    } catch (err) {
      console.error("Auto-Trading data fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [userId, isElite]);

  const handleSaveStrategy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveStrategy(userId, newStrat.name, {
        strategy: "dca",
        asset: newStrat.asset,
        base_amount: newStrat.base_amount,
        frequency: newStrat.frequency,
        max_multiplier: newStrat.max_multiplier,
        min_cash_reserve: newStrat.min_cash_reserve
      });
      setIsCreating(false);
      fetchData();
      if (onCommentary) onCommentary(`Strategy "${newStrat.name}" DEPLOYED. I'll watch the sentiment and strike when the time is right.`);
    } catch (err) {
      console.error("Failed to save strategy:", err);
    }
  };

  const toggleStrategy = async (strat: any) => {
    try {
      // Toggle logic
      const newActive = !strat.is_active;
      await api.saveStrategy(userId, strat.name, strat.config, newActive);
      fetchData();
      if (onCommentary) {
        onCommentary(newActive 
          ? `Engine RE-ENGAGED for ${strat.name}. Monitoring sentiment...` 
          : `Engine DISENGAGED for ${strat.name}. Automation suspended.`);
      }
    } catch (err) {
      console.error("Failed to toggle strategy:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-enigma-purple animate-spin" />
      </div>
    );
  }

  if (!isElite) {
    return (
      <div className="relative h-[600px] rounded-xl overflow-hidden border border-white/10 bg-[#060608]">
        {/* Blurred Background Preview */}
        <div className="absolute inset-0 filter blur-xl opacity-20 pointer-events-none p-8">
           <div className="space-y-6">
              <div className="h-12 w-1/3 bg-white/20 rounded-lg" />
              <div className="grid grid-cols-3 gap-4">
                <div className="h-32 bg-white/10 rounded-xl" />
                <div className="h-32 bg-white/10 rounded-xl" />
                <div className="h-32 bg-white/10 rounded-xl" />
              </div>
              <div className="h-64 bg-white/5 rounded-xl" />
           </div>
        </div>

        {/* Upgrade Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
          <div className="w-20 h-20 rounded-full bg-enigma-purple/20 flex items-center justify-center mb-6">
            <Lock className="w-10 h-10 text-enigma-purple" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2 italic tracking-tighter">ELITE ACCESS ONLY</h2>
          <p className="text-gray-400 text-center max-w-md px-6 mb-8 leading-relaxed">
            The Auto-Trading Engine is restricted to Enigma Elite partners. 
            Automate your DCA based on E's sentiment analysis and mirror whale activity.
          </p>
          <button className="px-8 py-3 bg-enigma-purple hover:bg-enigma-purple/80 text-white font-bold rounded-lg transition-all flex items-center gap-2 group">
            UPGRADE TO ELITE
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#0A0A0C] border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-2 font-mono">
            <Activity className="w-3 h-3" /> Engine Status
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${strategies.some(s => s.is_active) ? 'bg-enigma-green animate-pulse' : 'bg-gray-600'}`} />
            <span className="text-lg font-mono text-white">
              {strategies.some(s => s.is_active) ? 'OPERATIONAL' : 'IDLE'}
            </span>
          </div>
        </div>

        <div className="bg-[#0A0A0C] border border-white/5 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider mb-2 font-mono">
            <ShieldCheck className="w-3 h-3" /> Coinbase Link
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-mono ${isCoinbaseConfigured ? 'text-enigma-green' : 'text-enigma-red'}`}>
              {isCoinbaseConfigured ? 'ENCRYPTED' : 'NOT LINKED'}
            </span>
          </div>
        </div>

        <div className="bg-[#0A0A0C] border border-white/5 p-4 rounded-xl col-span-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-500 text-[10px] uppercase tracking-wider font-mono">
              <Zap className="w-3 h-3" /> Market Pulse
            </div>
            <span className="text-[10px] text-enigma-purple font-mono uppercase">Personality Score</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className={`text-lg font-bold italic ${sentiment?.fear_greed_index < 40 ? 'text-enigma-green' : sentiment?.fear_greed_index > 60 ? 'text-enigma-red' : 'text-orange-500'}`}>
                {sentiment?.fear_greed_label?.toUpperCase() || 'NEUTRAL'} ({sentiment?.fear_greed_index || 50})
              </span>
            </div>
            <div className="h-8 w-px bg-white/10" />
            <div className="text-xs text-gray-400 font-mono">
               DCA MULTIPLIER: <span className="text-white">{sentiment?.dca_multiplier || '1.0'}x</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: Strategies */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-enigma-purple" /> AUTOMATION PROFILES
              </h3>
              <button 
                onClick={() => setIsCreating(true)}
                className="text-[10px] bg-enigma-purple/20 hover:bg-enigma-purple/40 text-enigma-purple border border-enigma-purple/30 px-2 py-1 rounded transition-all"
              >
                + NEW STRATEGY
              </button>
            </div>

            <div className="p-0">
              {strategies.length === 0 && !isCreating ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500 text-sm italic mb-4 font-mono">No automated strategies deployed.</p>
                  <button 
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs rounded-lg transition-all font-mono"
                  >
                    Setup Sentiment DCA
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {isCreating && (
                    <div className="p-6 bg-enigma-purple/5 border-b border-enigma-purple/20 animate-in slide-in-from-top-2">
                       <form onSubmit={handleSaveStrategy} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-mono uppercase">Asset Pair</label>
                              <select 
                                value={newStrat.asset}
                                onChange={(e) => setNewStrat({...newStrat, asset: e.target.value})}
                                className="w-full bg-black border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-enigma-purple font-mono"
                              >
                                <option value="BTC">BTC-USD</option>
                                <option value="ETH">ETH-USD</option>
                                <option value="SOL">SOL-USD</option>
                                <option value="LINK">LINK-USD</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-mono uppercase">Frequency</label>
                              <select 
                                value={newStrat.frequency}
                                onChange={(e) => setNewStrat({...newStrat, frequency: e.target.value})}
                                className="w-full bg-black border border-white/10 rounded px-2 py-2 text-sm text-white focus:outline-none focus:border-enigma-purple font-mono"
                              >
                                <option value="daily">DAILY</option>
                                <option value="weekly">WEEKLY</option>
                                <option value="biweekly">BI-WEEKLY</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-mono uppercase">Base Amount (USD)</label>
                              <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 w-3 h-3 text-gray-500" />
                                <input 
                                  type="number"
                                  value={newStrat.base_amount}
                                  onChange={(e) => setNewStrat({...newStrat, base_amount: parseInt(e.target.value)})}
                                  className="w-full bg-black border border-white/10 rounded pl-7 pr-2 py-2 text-sm text-white focus:outline-none focus:border-enigma-purple font-mono"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="block text-[10px] text-gray-500 mb-1 font-mono uppercase">Max Sentiment Multiplier</label>
                              <div className="pt-2">
                                <input 
                                  type="range"
                                  min="1.0"
                                  max="5.0"
                                  step="0.5"
                                  value={newStrat.max_multiplier}
                                  onChange={(e) => setNewStrat({...newStrat, max_multiplier: parseFloat(e.target.value)})}
                                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-enigma-purple"
                                />
                                <div className="flex justify-between text-[9px] text-gray-600 font-mono mt-1">
                                  <span>1.0x</span>
                                  <span className="text-enigma-purple font-bold">{newStrat.max_multiplier}x</span>
                                  <span>5.0x</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-end gap-3 pt-2">
                             <button 
                               type="button"
                               onClick={() => setIsCreating(false)}
                               className="px-4 py-1.5 text-xs text-gray-400 hover:text-white font-mono"
                             >
                               CANCEL
                             </button>
                             <button 
                               type="submit"
                               className="px-4 py-1.5 bg-enigma-purple text-white text-xs font-bold rounded font-mono"
                             >
                               DEPLOY STRATEGY
                             </button>
                          </div>
                       </form>
                    </div>
                  )}

                  {strategies.map((strat) => (
                    <div key={strat.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-l-2 border-transparent hover:border-enigma-purple">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center font-bold text-enigma-purple border border-white/5">
                          {strat.asset.substring(0, 1)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white uppercase">{strat.name}</span>
                            <span className="text-[10px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded uppercase font-mono tracking-tighter">{strat.frequency}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                            BASE: ${strat.base_amount} | MAX: {strat.max_multiplier}x | RESERVE: ${strat.min_cash_reserve || 500}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right mr-2">
                          <div className={`text-[10px] font-bold ${strat.is_active ? 'text-enigma-green' : 'text-gray-500'} font-mono uppercase`}>
                            {strat.is_active ? 'ACTIVE' : 'PAUSED'}
                          </div>
                        </div>
                        <button 
                          onClick={() => toggleStrategy(strat)}
                          className="transition-transform active:scale-95"
                        >
                          {strat.is_active ? (
                            <ToggleRight className="w-7 h-7 text-enigma-green" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-gray-600" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Trade History / Execution Log */}
          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-tight">
                <History className="w-4 h-4 text-enigma-purple" /> Strategy Lifecycle Log
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                <PieChart className="w-3 h-3" /> REAL-TIME MONITORING
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-gray-500 uppercase tracking-widest border-b border-white/5 font-mono">
                    <th className="px-4 py-4 font-medium">Timestamp</th>
                    <th className="px-4 py-4 font-medium">Asset</th>
                    <th className="px-4 py-4 font-medium">Buy Vol.</th>
                    <th className="px-4 py-4 font-medium">Mult.</th>
                    <th className="px-4 py-4 font-medium">Sentiment</th>
                    <th className="px-4 py-4 font-medium">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {executions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-600 text-xs italic font-mono">
                        WAITING FOR MARKET VOLATILITY / SENTIMENT PIVOT...
                      </td>
                    </tr>
                  ) : (
                    executions.map((exec) => (
                      <React.Fragment key={exec.id}>
                        <tr className="text-xs hover:bg-white/[0.01] transition-colors border-l-2 border-transparent hover:border-enigma-purple group">
                          <td className="px-4 py-4 text-gray-500 font-mono whitespace-nowrap">
                            {new Date(exec.executed_at || exec.scheduled_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-4 font-bold text-white">{exec.asset}</td>
                          <td className="px-4 py-4 text-white font-mono">${exec.buy_amount?.toFixed(2)}</td>
                          <td className="px-4 py-4 text-enigma-purple font-mono font-bold">{exec.multiplier}x</td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className={`font-mono text-[10px] font-bold ${exec.fear_greed < 40 ? 'text-enigma-green' : exec.fear_greed > 60 ? 'text-enigma-red' : 'text-orange-500'}`}>
                                {exec.fear_greed} - {exec.fear_greed_label?.toUpperCase()}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            {exec.executed ? (
                              <span className="text-[9px] bg-enigma-green/10 text-enigma-green border border-enigma-green/20 px-2 py-0.5 rounded font-bold">FILLED</span>
                            ) : (
                              <span className="text-[9px] bg-enigma-red/10 text-enigma-red border border-enigma-red/20 px-2 py-0.5 rounded font-bold">SKIPPED</span>
                            )}
                          </td>
                        </tr>
                        {exec.commentary && (
                          <tr className="bg-white/[0.01]">
                            <td colSpan={6} className="px-4 py-3 text-[11px] text-enigma-purple italic font-medium leading-relaxed border-l-2 border-enigma-purple/30">
                              <div className="flex items-start gap-2">
                                <span className="text-lg leading-none">“</span>
                                <span>{exec.commentary}</span>
                                <span className="text-lg leading-none self-end">”</span>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Engine Rationale */}
        <div className="space-y-6">
          <div className="bg-enigma-purple/10 border border-enigma-purple/20 rounded-xl p-6 relative overflow-hidden group shadow-lg shadow-enigma-purple/5">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 transition-opacity">
              <Zap className="w-20 h-20 text-enigma-purple" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-enigma-purple text-[10px] font-bold uppercase tracking-[0.3em] mb-4 font-mono">
                <div className="w-1.5 h-1.5 bg-enigma-purple rounded-full animate-pulse" />
                Logic Core V.4
              </div>
              
              <h4 className="text-lg font-bold text-white italic mb-6 leading-tight tracking-tight">
                "{sentiment?.reasoning || "Analyzing the pulse of the market. Waiting for the right moment to build your legacy."}"
              </h4>
              
              <div className="space-y-5 pt-5 border-t border-enigma-purple/20">
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-gray-500 uppercase font-mono">News Sentiment</span>
                   <span className={`font-mono text-xs font-bold ${sentiment?.news_sentiment_score > 0 ? 'text-enigma-green' : 'text-enigma-red'}`}>
                     {(sentiment?.news_sentiment_score * 100).toFixed(0)}%
                   </span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-gray-500 uppercase font-mono">Scanner Intensity</span>
                   <span className="text-white font-mono text-xs font-bold">{sentiment?.hot_zone_pct}% HOT</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-[10px] text-gray-500 uppercase font-mono">Next Eval Cycle</span>
                   <span className="text-enigma-purple font-mono text-xs font-bold flex items-center gap-1">
                     <Clock className="w-3 h-3" /> ACTIVE
                   </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#0A0A0C] border border-white/10 rounded-xl p-6 shadow-xl">
             <h4 className="text-xs font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-tighter">
               <ShieldCheck className="w-4 h-4 text-enigma-green" /> Risk Safeguards
             </h4>
             
             <div className="space-y-6">
                <div>
                   <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">Min. Cash Reserve</span>
                      <span className="text-[10px] text-white font-mono">$500.00</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-enigma-green h-full w-full" />
                   </div>
                </div>
                
                <div>
                   <div className="flex justify-between mb-2">
                      <span className="text-[10px] text-gray-500 uppercase font-mono">Max Daily Slip</span>
                      <span className="text-[10px] text-white font-mono">0.5%</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="bg-enigma-purple h-full w-1/4" />
                   </div>
                </div>

                <div className="pt-4 flex items-start gap-3 bg-enigma-purple/5 border border-enigma-purple/10 p-4 rounded-xl">
                   <AlertCircle className="w-5 h-5 text-enigma-purple shrink-0 mt-0.5" />
                   <p className="text-[11px] text-gray-400 leading-relaxed italic">
                     "The engine is wired to your Coinbase Advanced Trade API. I only execute when liquidity and sentiment align. Safety first, always."
                   </p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
