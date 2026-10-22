import React, { useEffect, useRef } from 'react';
import { ExternalLink, TrendingUp, TrendingDown, Clock, ShieldCheck } from 'lucide-react';
import { QUOTEX_REFERRAL_URL } from '../constants/translations';

interface TradingViewChartProps {
  pair: string;
  symbol: string;
  flags?: string;
  payout: number;
  lastSignal?: {
    direction: 'CALL' | 'PUT';
    time: number;
    price: number;
    remainingSeconds?: number;
    expirySeconds?: number;
  } | null;
}

export const TradingViewChart: React.FC<TradingViewChartProps> = ({
  pair,
  symbol,
  flags = '🇪🇺 🇺🇸',
  payout,
  lastSignal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load and reload TradingView widget when symbol changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.innerHTML = '';

    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container__widget';
    widgetDiv.style.height = '100%';
    widgetDiv.style.width = '100%';
    container.appendChild(widgetDiv);

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol: symbol || 'FX:EURUSD',
      interval: '1',
      timezone: 'Etc/UTC',
      theme: 'dark',
      style: '1',
      locale: 'en',
      enable_publishing: false,
      allow_symbol_change: false,
      calendar: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      backgroundColor: 'rgba(6, 11, 19, 1)',
      gridColor: 'rgba(30, 41, 59, 0.4)',
      withdateranges: true,
      hide_side_toolbar: false,
      support_host: 'https://www.tradingview.com',
    });

    container.appendChild(script);

    return () => {
      if (container) {
        container.innerHTML = '';
      }
    };
  }, [symbol]);

  const isTradeActive = !!(lastSignal && (lastSignal.remainingSeconds || 0) > 0);

  return (
    <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-2xl relative overflow-hidden">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{flags}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wide">
                {pair}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 uppercase">
                TradingView Live Feed
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                +{payout}% Payout
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Live Institutional Liquidity · 1m Real Forex Candles
            </div>
          </div>
        </div>

        {/* Live Active Trade Overlay Badge */}
        {isTradeActive && lastSignal && (
          <div
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 animate-pulse ${
              lastSignal.direction === 'CALL'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-red-950/60 border-red-500 text-red-300'
            }`}
          >
            <span>TRADE ACTIVE: {lastSignal.direction}</span>
            <span>·</span>
            <span>STRIKE: {lastSignal.price.toFixed(5)}</span>
            <span>·</span>
            <span className="tabular-nums">EXPIRING IN {lastSignal.remainingSeconds}s</span>
          </div>
        )}
      </div>

      {/* TradingView Widget Container */}
      <div className="relative w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden border border-slate-900 bg-[#060b13]">
        <div
          ref={containerRef}
          className="tradingview-widget-container w-full h-full"
          style={{ height: '100%', width: '100%' }}
        />

        {/* Overlay Strike Price Tag if trade is active */}
        {isTradeActive && lastSignal && (
          <div className="absolute top-4 left-4 z-20 pointer-events-none">
            <div
              className={`p-2.5 rounded-xl border shadow-2xl backdrop-blur-md flex items-center gap-2 ${
                lastSignal.direction === 'CALL'
                  ? 'bg-emerald-950/85 border-emerald-500 text-emerald-200'
                  : 'bg-red-950/85 border-red-500 text-red-200'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${
                  lastSignal.direction === 'CALL' ? 'bg-emerald-500 text-slate-950' : 'bg-red-500 text-white'
                }`}
              >
                {lastSignal.direction === 'CALL' ? '▲' : '▼'}
              </div>
              <div className="text-xs font-mono">
                <span className="font-bold block">Quotex {lastSignal.direction} Active</span>
                <span className="text-[10px] text-slate-300">
                  Strike: {lastSignal.price.toFixed(5)} · Time Left: {lastSignal.remainingSeconds}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom status bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>TradingView Pro Live Market Widget</span>
          </span>
          <span>·</span>
          <span>FX Institutional Feed</span>
        </div>
        <a
          href={QUOTEX_REFERRAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1"
        >
          <span>Open on Quotex</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
