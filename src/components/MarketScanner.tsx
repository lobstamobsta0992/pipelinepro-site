"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Zap, 
  Skull, 
  Eye, 
  Lock, 
  ArrowUpRight, 
  ArrowRight,
  Activity,
  RefreshCw,
  BarChart3,
  Flame,
  Snowflake,
  AlertCircle
} from "lucide-react";
import { 
  getScannerOverview, 
  getScannerHot, 
  getScannerDead, 
  getScannerTrending,
  searchScanner 
} from "../lib/api";

interface ScannerCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_1h_in_currency: number;
  price_change_percentage_24h_in_currency: number;
  price_change_percentage_7d_in_currency: number;
  total_volume: number;
  market_cap: number;
  momentum_score: number;
  zone: "Hot" | "Dead" | "Watching" | "Neutral";
  trend: "surging" | "breaking_up" | "rolling_over" | "free_falling" | "consolidating" | "volatile";
  commentary?: string;
}

interface MarketScannerProps {
  userId: string;
  userTier: string;
  onCommentary?: (text: string) => void;
}

export function MarketScanner({ userId, userTier, onCommentary }: MarketScannerProps) {
  const isElite = userTier === "Elite" || userTier === "elite";
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<any>(null);
  const [coins, setCoins] = useState<ScannerCoin[]>([]);
  const [activeZone, setActiveZone] = useState<"All" | "Hot" | "Dead" | "Watching">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const [ovData, hotData, deadData, trendingData] = await Promise.all([
        getScannerOverview(userId),
        getScannerHot(userId),
        getScannerDead(userId),
        getScannerTrending(userId)
      ]);

      setOverview(ovData);
      
      // Combine coins and deduplicate
      const allCoins = [...(hotData || []), ...(deadData || []), ...(trendingData || [])];
      const uniqueCoins = Array.from(new Map(allCoins.map(c => [c.id, c])).values());
      
      setCoins(uniqueCoins);
      
      if (ovData?.commentary && onCommentary && !overview) {
        onCommentary(ovData.commentary);
      }
      
      setError(null);
    } catch (err) {
      console.error("Failed to fetch scanner data:", err);
      setError("FAILED_TO_SYNC_SCANNER_NODE");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every 60s
    return () => clearInterval(interval);
  }, []);

  const filteredCoins = coins.filter(coin => {
    const matchesZone = activeZone === "All" || coin.zone === activeZone;
    const matchesSearch = coin.symbol.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          coin.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesZone && matchesSearch;
  });

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "surging": return <Zap className="w-3 h-3 text-enigma-green animate-pulse" />;
      case "breaking_up": return <TrendingUp className="w-3 h-3 text-enigma-green" />;
      case "rolling_over": return <TrendingDown className="w-3 h-3 text-enigma-orange" />;
      case "free_falling": return <Skull className="w-3 h-3 text-enigma-red animate-bounce" />;
      case "volatile": return <Activity className="w-3 h-3 text-enigma-purple" />;
      default: return <BarChart3 className="w-3 h-3 text-enigma-text-dim" />;
    }
  };

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-enigma-bg">
        <div className="text-center space-y-4">
          <RefreshCw className="w-12 h-12 text-enigma-purple animate-spin mx-auto opacity-50" />
          <div className="text-enigma-purple font-terminal text-[10px] uppercase tracking-[0.3em]">Initializing Market Pulse Node...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-enigma-bg overflow-hidden border-l border-enigma-border">
      {/* Scanner Header */}
      <div className="px-6 py-4 bg-[#0a0a0f] border-b border-enigma-border flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xs font-bold text-white flex items-center space-x-2 uppercase tracking-widest">
            <Zap className="w-4 h-4 text-enigma-orange" />
            <span>Market Scanner Terminal</span>
            <span className="ml-2 px-1.5 py-0.5 bg-enigma-orange/10 text-enigma-orange text-[8px] rounded border border-enigma-orange/20">LIVE</span>
          </h2>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-[9px] text-enigma-text-dim font-terminal uppercase tracking-tighter">Monitoring 250+ Assets // Multi-Timeframe Momentum</p>
            {overview?.last_update && (
              <span className="text-[8px] text-enigma-muted font-terminal uppercase tracking-tighter border-l border-enigma-border pl-4">
                Last Refresh: {new Date(overview.last_update).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="relative group">
            <Search className="w-3 h-3 absolute left-3 top-1/2 -translate-y-1/2 text-enigma-muted group-focus-within:text-enigma-orange transition-colors" />
            <input 
              type="text" 
              placeholder="SEARCH_COIN..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black border border-enigma-border rounded px-8 py-1.5 text-[10px] font-terminal text-white focus:outline-none focus:border-enigma-orange transition-all w-48"
            />
          </div>
          <button 
            onClick={fetchData}
            disabled={refreshing}
            className={`p-2 bg-enigma-panel border border-enigma-border rounded hover:border-enigma-purple transition-all ${refreshing ? 'opacity-50' : ''}`}
          >
            <RefreshCw className={`w-3 h-3 text-enigma-purple ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Market Pulse Dashboard */}
      <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 border-b border-enigma-border bg-black/20">
        {/* Hot Zone */}
        <div 
          onClick={() => setActiveZone("Hot")}
          className={`cursor-pointer p-4 rounded border transition-all ${activeZone === 'Hot' ? 'bg-enigma-green/5 border-enigma-green shadow-[0_0_15px_rgba(34,197,94,0.1)]' : 'bg-[#0d0d12] border-enigma-border hover:border-enigma-green/50'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-enigma-green" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Hot Zone</span>
            </div>
            <span className="text-enigma-green font-bold font-terminal text-xs">{coins.filter(c => c.zone === 'Hot').length}</span>
          </div>
          <div className="h-1 bg-gray-900 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-enigma-green transition-all duration-1000" 
              style={{ width: `${(coins.filter(c => c.zone === 'Hot').length / Math.max(1, coins.length)) * 100}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-enigma-text-dim font-terminal uppercase leading-tight italic">
            "High momentum, volume expansion. Bulls are aggressively bidding."
          </p>
        </div>

        {/* Dead Zone */}
        <div 
          onClick={() => setActiveZone("Dead")}
          className={`cursor-pointer p-4 rounded border transition-all ${activeZone === 'Dead' ? 'bg-enigma-red/5 border-enigma-red shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'bg-[#0d0d12] border-enigma-border hover:border-enigma-red/50'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Snowflake className="w-4 h-4 text-enigma-red" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Dead Zone</span>
            </div>
            <span className="text-enigma-red font-bold font-terminal text-xs">{coins.filter(c => c.zone === 'Dead').length}</span>
          </div>
          <div className="h-1 bg-gray-900 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-enigma-red transition-all duration-1000" 
              style={{ width: `${(coins.filter(c => c.zone === 'Dead').length / Math.max(1, coins.length)) * 100}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-enigma-text-dim font-terminal uppercase leading-tight italic">
            "Oversold, capitulation signals. Potential reversal zones for pros."
          </p>
        </div>

        {/* Watching */}
        <div 
          onClick={() => setActiveZone("Watching")}
          className={`cursor-pointer p-4 rounded border transition-all ${activeZone === 'Watching' ? 'bg-enigma-purple/5 border-enigma-purple shadow-[0_0_15px_rgba(157,78,221,0.1)]' : 'bg-[#0d0d12] border-enigma-border hover:border-enigma-purple/50'}`}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-enigma-purple" />
              <span className="text-[10px] font-bold text-white uppercase tracking-widest">Watching</span>
            </div>
            <span className="text-enigma-purple font-bold font-terminal text-xs">{coins.filter(c => c.zone === 'Watching').length}</span>
          </div>
          <div className="h-1 bg-gray-900 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-enigma-purple transition-all duration-1000" 
              style={{ width: `${(coins.filter(c => c.zone === 'Watching').length / Math.max(1, coins.length)) * 100}%` }}
            ></div>
          </div>
          <p className="text-[9px] text-enigma-text-dim font-terminal uppercase leading-tight italic">
            "Unusual activity, volatility spikes. Setups forming on our radar."
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* E's Hot Take Banner */}
        {overview?.commentary && (
          <div className="mx-6 mt-6 p-4 bg-enigma-purple/5 border border-enigma-purple/20 rounded-sm flex items-start space-x-4">
            <div className="w-8 h-8 rounded bg-enigma-purple flex-shrink-0 flex items-center justify-center font-bold text-white text-lg">E</div>
            <div className="flex-1">
              <div className="text-[9px] font-bold text-enigma-purple uppercase tracking-widest mb-1">E's Market Pulse Summary</div>
              <p className="text-[11px] text-enigma-text font-terminal leading-relaxed">{overview.commentary}</p>
            </div>
          </div>
        )}

        {/* Table Controls */}
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {["All", "Hot", "Dead", "Watching"].map(z => (
              <button 
                key={z}
                onClick={() => setActiveZone(z as any)}
                className={`px-3 py-1 text-[9px] font-bold uppercase rounded border transition-all ${activeZone === z ? 'bg-white text-black border-white' : 'text-enigma-text-dim border-enigma-border hover:text-white'}`}
              >
                {z}
              </button>
            ))}
          </div>
          <div className="text-[9px] font-terminal text-enigma-muted uppercase">
            Showing {filteredCoins.length} {activeZone !== 'All' ? activeZone : ''} Assets
          </div>
        </div>

        {/* Assets Table */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
          <div className="w-full border border-enigma-border rounded overflow-hidden">
            <table className="w-full text-left font-terminal text-[10px]">
              <thead className="bg-[#0a0a0f] border-b border-enigma-border sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">Asset</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">Price</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">1H %</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">24H %</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">Momentum</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">Trend</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold">Zone</th>
                  <th className="px-4 py-3 text-enigma-muted uppercase font-bold text-right">E's Take</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-enigma-border/50">
                {filteredCoins.map((coin, idx) => (
                  <tr key={coin.id} className={`group hover:bg-white/[0.02] transition-colors ${!isElite && idx >= 10 ? 'opacity-20 blur-[2px] pointer-events-none' : ''}`}>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-6 h-6 bg-black rounded border border-enigma-border flex items-center justify-center overflow-hidden">
                          {coin.image ? <img src={coin.image} alt={coin.symbol} className="w-4 h-4" /> : <div className="text-[8px] font-bold">{coin.symbol[0]}</div>}
                        </div>
                        <div>
                          <div className="text-white font-bold uppercase">{coin.symbol}</div>
                          <div className="text-enigma-muted text-[8px] uppercase truncate max-w-[80px]">{coin.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white font-bold">{formatPrice(coin.current_price)}</td>
                    <td className={`px-4 py-4 font-bold ${coin.price_change_percentage_1h_in_currency >= 0 ? 'text-enigma-green' : 'text-enigma-red'}`}>
                      {coin.price_change_percentage_1h_in_currency >= 0 ? '+' : ''}{coin.price_change_percentage_1h_in_currency.toFixed(2)}%
                    </td>
                    <td className={`px-4 py-4 font-bold ${coin.price_change_percentage_24h_in_currency >= 0 ? 'text-enigma-green' : 'text-enigma-red'}`}>
                      {coin.price_change_percentage_24h_in_currency >= 0 ? '+' : ''}{coin.price_change_percentage_24h_in_currency.toFixed(2)}%
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 h-1.5 bg-gray-900 rounded-full w-16 overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${coin.momentum_score >= 65 ? 'bg-enigma-green' : coin.momentum_score <= 35 ? 'bg-enigma-red' : 'bg-enigma-purple'}`}
                            style={{ width: `${coin.momentum_score}%` }}
                          ></div>
                        </div>
                        <span className="text-[9px] font-bold">{coin.momentum_score}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center space-x-1.5">
                        {getTrendIcon(coin.trend)}
                        <span className="uppercase text-[8px] font-bold">{coin.trend.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-1.5 py-0.5 rounded-[2px] text-[8px] font-bold uppercase ${
                        coin.zone === 'Hot' ? 'bg-enigma-green/10 text-enigma-green border border-enigma-green/20' :
                        coin.zone === 'Dead' ? 'bg-enigma-red/10 text-enigma-red border border-enigma-red/20' :
                        coin.zone === 'Watching' ? 'bg-enigma-purple/10 text-enigma-purple border border-enigma-purple/20' :
                        'bg-enigma-panel text-enigma-muted border border-enigma-border'
                      }`}>
                        {coin.zone}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="p-1.5 hover:bg-enigma-purple/10 rounded transition-colors text-enigma-muted hover:text-enigma-purple group/btn">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tier Gate Overlay */}
        {!isElite && coins.length > 10 && (
          <div className="absolute inset-x-0 bottom-0 top-[400px] z-20 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-[#060608] via-[#060608]/80 to-transparent"></div>
            <div className="relative z-30 pointer-events-auto bg-[#0d0d12] border border-enigma-border p-8 rounded shadow-2xl max-w-md">
              <div className="w-12 h-12 rounded-full bg-enigma-purple/20 border border-enigma-purple/40 flex items-center justify-center mx-auto mb-4 text-enigma-purple">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-tight">Full Scanner Access Restricted</h3>
              <p className="text-[10px] text-enigma-text-dim mb-6 font-terminal leading-relaxed">
                UPGRADE TO ELITE TO UNLOCK THE REMAINING {coins.length - 10} ASSETS, REAL-TIME VOLUME ANOMALY ALERTS, AND SECTOR-SPECIFIC ANALYSIS.
              </p>
              <button className="w-full py-3 bg-gradient-to-r from-enigma-orange to-enigma-purple text-white font-bold text-xs rounded uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-enigma-purple/20">
                Unlock Elite Terminal
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Status */}
      <div className="px-6 py-2 bg-black border-t border-enigma-border flex items-center justify-between text-[8px] font-terminal text-enigma-muted">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-enigma-green"></span>
            <span>NODE_SCANNER_01: ACTIVE</span>
          </div>
          <div className="flex items-center space-x-1.5">
            <BarChart3 className="w-3 h-3" />
            <span>THROUGHPUT: 250+ TPS</span>
          </div>
        </div>
        <div className="flex items-center space-x-1.5">
          <AlertCircle className="w-3 h-3" />
          <span>DATA_LAG: 420ms</span>
        </div>
      </div>
    </div>
  );
}
