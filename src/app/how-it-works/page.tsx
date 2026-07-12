import React from 'react';
import Link from 'next/link';

export default function HowItWorks() {
  return (
    <div className="min-h-screen bg-[#060608] text-gray-300 font-mono">
      {/* Navigation */}
      <nav className="border-b border-gray-800 p-4 sticky top-0 bg-[#060608]/80 backdrop-blur-md z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-purple-600 rounded flex items-center justify-center text-white font-bold">E</div>
            <span className="text-xl font-bold tracking-tighter text-white">ENIGMA <span className="text-gray-500 font-light">INTELLIGENCE</span></span>
          </Link>
          <div className="hidden md:flex space-x-8 text-sm uppercase tracking-widest">
            <Link href="/how-it-works" className="text-orange-500 hover:text-orange-400 transition-colors">How it Works</Link>
            <Link href="/methodology" className="hover:text-white transition-colors">Methodology</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Launch App</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-24 px-4 border-b border-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
            THE ENGINE BEHIND <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-purple-600">E</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Enigma Intelligence isn't just another bot. It's a vertically integrated intelligence layer that monitors blockchain telemetry, social sentiment, and macro cycles in real-time.
          </p>
        </div>
      </section>

      {/* Deep Breakdown */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-white mb-6 uppercase tracking-widest border-l-4 border-orange-500 pl-4">1. On-Chain Telemetry</h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              We track over 5,000 "Smart Money" wallets and exchange hot-wallets. When Cumberland rotates $50M in stables or a dormant whale wakes up, E doesn't just alert you—it analyzes the destination and potential market impact.
            </p>
            <ul className="space-y-4">
              <li className="flex items-start space-x-3 text-sm">
                <span className="text-orange-500">[LIVE]</span>
                <span>Real-time deposit/withdrawal monitoring across 6 major blockchains (BTC, ETH, SOL, MATIC, BSC, ARB).</span>
              </li>
              <li className="flex items-start space-x-3 text-sm">
                <span className="text-purple-500">[AI]</span>
                <span>Automated wallet labeling and intent classification.</span>
              </li>
              <li className="flex items-start space-x-3 text-sm">
                <span className="text-green-500">[SIGNAL]</span>
                <span>Liquidation delta tracking for high-leverage zones.</span>
              </li>
            </ul>
          </div>
          <div className="bg-[#0d0d12] border border-gray-800 p-2 rounded-lg shadow-2xl">
            <img src="/screenshots/dashboard-preview.png" alt="Dashboard Preview" className="rounded border border-gray-800 opacity-80" />
          </div>
        </div>
      </section>

      <section className="py-24 px-4 bg-[#08080a]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="order-2 md:order-1 bg-[#0d0d12] border border-gray-800 p-8 rounded-lg shadow-2xl font-mono text-xs">
            <div className="flex space-x-2 mb-4">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-2 text-gray-500">
              <p className="text-green-500">{" >> "} INITIALIZING E_BRAIN_V2...</p>
              <p>{" >> "} LOADING CYCLE_MODELS [MVRV, NUPL, PI_CYCLE]</p>
              <p>{" >> "} ANALYZING SOCIAL_SENTIMENT_CORE [X, TG, DISCORD]</p>
              <p className="text-orange-500">{" >> "} WARNING: WHALE_ALERT [ID: 0x3d...9a41] MOVED 45M USDC</p>
              <p className="text-white">{" >> "} E: "Yo, stables are hitting Binance. Expecting a volatility spike in the SOL/USD pair within 15 mins. Prepare the bid zones."</p>
            </div>
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-3xl font-bold text-white mb-6 uppercase tracking-widest border-l-4 border-purple-500 pl-4">2. Adaptive AI Soul</h2>
            <p className="text-lg text-gray-400 mb-8 leading-relaxed">
              Unlike generic LLMs, E is trained on historical cycle tops, bottom-formation telemetry, and "Crypto Twitter" linguistic patterns. E adapts its technical depth to your experience, ensuring you're never overwhelmed but always informed.
            </p>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="border border-gray-800 p-4 rounded bg-[#0d0d12]">
                <div className="text-orange-500 font-bold mb-1">STREET</div>
                <div className="text-[10px] uppercase text-gray-500 tracking-tighter">Smart Intuition</div>
              </div>
              <div className="border border-gray-800 p-4 rounded bg-[#0d0d12]">
                <div className="text-purple-500 font-bold mb-1">DATA</div>
                <div className="text-[10px] uppercase text-gray-500 tracking-tighter">Dense Metrics</div>
              </div>
              <div className="border border-gray-800 p-4 rounded bg-[#0d0d12]">
                <div className="text-green-500 font-bold mb-1">LOYAL</div>
                <div className="text-[10px] uppercase text-gray-500 tracking-tighter">Partner Core</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center border-t border-gray-900">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tighter uppercase">READY TO STEP INTO THE WAR ROOM?</h2>
        <Link href="/dashboard" className="inline-block bg-white text-black px-12 py-4 font-bold uppercase tracking-widest hover:bg-orange-500 hover:text-white transition-all transform hover:scale-105 active:scale-95">
          Activate 5-Day Elite Trial
        </Link>
        <p className="mt-6 text-sm text-gray-600 uppercase tracking-widest">#CryptoAI #WhaleWatcher #TradingAlpha</p>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-900 text-[10px] text-gray-700 uppercase tracking-[0.2em] text-center">
        &copy; 2026 ENIGMA INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED. NON-CUSTODIAL PLATFORM.
      </footer>
    </div>
  );
}
