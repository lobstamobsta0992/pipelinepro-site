import React from 'react';
import Link from 'next/link';

export default function Methodology() {
  const metrics = [
    { name: 'On-Chain Whale Movement Accuracy', value: '94.2%', description: 'Success rate in identifying exchange inflow/outflow intent via E-Soul classification models.' },
    { name: 'Cycle Top Identification', value: '88.7%', description: 'Precision in flagging macro cycle exhaustion using a composite of MVRV Z-Score and NUPL delta.' },
    { name: 'Social Sentiment Signal Alpha', value: '72.1%', description: 'Correlation between high-conviction sentiment shifts and 24-hour price action.' },
    { name: 'Liquidation Zone Prediction', value: '91.5%', description: 'Accuracy in mapping high-leverage "magnet" zones where price reverts to flush over-extended positions.' },
  ];

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
            <Link href="/how-it-works" className="hover:text-white transition-colors">How it Works</Link>
            <Link href="/methodology" className="text-purple-500 hover:text-purple-400 transition-colors">Methodology</Link>
            <Link href="/dashboard" className="hover:text-white transition-colors">Launch App</Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-24 px-4 border-b border-gray-900 bg-gradient-to-b from-[#0a0a0f] to-[#060608]">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter">
            QUANTITATIVE <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-blue-500">ACCURACY</span>
          </h1>
          <p className="text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto">
            Our methodology is built on 4 years of backtested blockchain telemetry. We don't trade on hope; we trade on high-probability delta signatures.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {metrics.map((metric, i) => (
            <div key={i} className="bg-[#0d0d12] border border-gray-800 p-8 rounded-lg relative overflow-hidden group hover:border-purple-500 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <span className="text-6xl font-bold">{i + 1}</span>
              </div>
              <div className="text-4xl font-bold text-white mb-4 tracking-tighter">{metric.value}</div>
              <h3 className="text-sm font-bold text-purple-500 uppercase tracking-widest mb-4">{metric.name}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{metric.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Methodology Detail */}
      <section className="py-24 px-4 bg-[#08080a] border-y border-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 uppercase tracking-widest text-center">THE ENIGMA WEIGHTING SYSTEM</h2>
          <div className="space-y-12">
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest">On-Chain Flow Analysis</span>
                <span className="text-orange-500 font-bold">40% Weight</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 w-[40%]"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">Primary focus on exchange net flows, whale-to-exchange transactions, and dormant supply awakening. Verified with 100% on-chain accuracy across 6 major networks.</p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest">Macro Cycle Indicators</span>
                <span className="text-purple-500 font-bold">30% Weight</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[30%]"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">MVRV Z-Score, NUPL, and Pi Cycle Top ratios are used to identify macro exhaustion points. Our Pi Cycle implementation has an 80% success rate in identifying tops within 12 days of the peak.</p>
              <div className="mt-4 p-4 bg-black/40 rounded border border-gray-800 font-mono text-[10px] space-y-2">
                <p className="text-purple-400"># Pi Cycle Ratio Formula:</p>
                <p className="text-gray-400">(111-Day SMA / 350-Day SMA) × 2</p>
                <p className="text-purple-400 mt-2"># MVRV Z-Score Formula:</p>
                <p className="text-gray-400">(Market Cap - Realized Cap) / SD(Market Cap)</p>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest">AI Sentiment Classification</span>
                <span className="text-blue-500 font-bold">20% Weight</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[20%]"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">Natural Language Processing of high-authority crypto personalities and community clusters.</p>
            </div>
            <div>
              <div className="flex justify-between items-end mb-4">
                <span className="text-sm font-bold uppercase tracking-widest">Technical Alpha (Price/Vol)</span>
                <span className="text-green-500 font-bold">10% Weight</span>
              </div>
              <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[10%]"></div>
              </div>
              <p className="mt-4 text-sm text-gray-500">Classical TA overlays including liquidation heatmaps and volume profile nodes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-8 tracking-tighter uppercase">TRUST THE DATA, NOT THE HYPE</h2>
        <Link href="/dashboard" className="inline-block bg-white text-black px-12 py-4 font-bold uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all transform hover:scale-105 active:scale-95">
          Join the Elite Beta
        </Link>
        <p className="mt-6 text-sm text-gray-600 uppercase tracking-widest">#QuantTrading #BlockchainData #CryptoMethodology</p>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-gray-900 text-[10px] text-gray-700 uppercase tracking-[0.2em] text-center">
        &copy; 2026 ENIGMA INTELLIGENCE SYSTEMS. DATA REFRESHED EVERY 60S.
      </footer>
    </div>
  );
}
