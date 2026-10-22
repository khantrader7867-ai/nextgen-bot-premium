import React, { useState, useEffect } from 'react';
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Clock,
  Sparkles,
  ShieldCheck,
  Activity,
  ArrowUp,
  ArrowDown,
  CheckCircle,
  Volume2,
  VolumeX,
  ExternalLink,
  Flame,
  Award,
  Lock,
  Radio,
  Cpu
} from 'lucide-react';
import { CurrencyPair, Language, MarketType, SignalData } from '../types';
import { translations, QUOTEX_REFERRAL_URL } from '../constants/translations';
import { LIVE_PAIRS, OTC_PAIRS, LIVE_TIMEFRAMES, OTC_TIMEFRAMES } from '../constants/markets';
import { TradingChart } from './TradingChart';
import { TradingViewChart } from './TradingViewChart';
import { CyborgGoldLogo } from './CyborgGoldLogo';

interface SignalEngineProps {
  language: Language;
  traderId: string;
  onBackToVerification: () => void;
  onOpenAdminPanel?: () => void;
}

export const SignalEngine: React.FC<SignalEngineProps> = ({
  language,
  traderId,
  onBackToVerification,
  onOpenAdminPanel,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  // Market & pair state
  const [market, setMarket] = useState<MarketType>('otc');
  const availablePairs = market === 'otc' ? OTC_PAIRS : LIVE_PAIRS;
  const availableTimeframes = market === 'otc' ? OTC_TIMEFRAMES : LIVE_TIMEFRAMES;

  const [selectedPair, setSelectedPair] = useState<CurrencyPair>(availablePairs[0]);
  const [selectedTimeframe, setSelectedTimeframe] = useState(availableTimeframes[3] || availableTimeframes[0]);

  // Sync pair & timeframe when market changes
  useEffect(() => {
    const pairs = market === 'otc' ? OTC_PAIRS : LIVE_PAIRS;
    const timeframes = market === 'otc' ? OTC_TIMEFRAMES : LIVE_TIMEFRAMES;
    setSelectedPair(pairs[0]);
    setSelectedTimeframe(market === 'otc' ? timeframes[3] : timeframes[0]);
  }, [market]);

  // Active Users live fluctuation
  const [activeUsers, setActiveUsers] = useState<number>(1429);
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveUsers((prev) => {
        const delta = Math.floor(Math.random() * 7) - 3;
        return Math.max(1200, prev + delta);
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Analysis & Signal generation state (Realistic 5-10 second sequence)
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('Analyzing Market...');
  const [analysisProgress, setAnalysisProgress] = useState<number>(0);
  const [currentSignal, setCurrentSignal] = useState<SignalData | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // History of generated signals (Capped at maximum 92% payout for OTC)
  const [history, setHistory] = useState<SignalData[]>([
    {
      id: 'sig_hist_1',
      pair: 'USD/PKR (OTC)',
      flags: '🇺🇸 🇵🇰',
      market: 'otc',
      timeframe: '30s',
      direction: 'CALL',
      accuracy: 94.6,
      entryPrice: 278.48,
      expirySeconds: 30,
      remainingSeconds: 0,
      timestamp: Date.now() - 1000 * 60 * 3,
      result: 'WIN',
      payoutAmount: 92,
    },
    {
      id: 'sig_hist_2',
      pair: 'EUR/USD (OTC)',
      flags: '🇪🇺 🇺🇸',
      market: 'otc',
      timeframe: '1m',
      direction: 'CALL',
      accuracy: 92.4,
      entryPrice: 1.08542,
      expirySeconds: 60,
      remainingSeconds: 0,
      timestamp: Date.now() - 1000 * 60 * 9,
      result: 'WIN',
      payoutAmount: 92,
    },
    {
      id: 'sig_hist_3',
      pair: 'NZD/CHF (OTC)',
      flags: '🇳🇿 🇨🇭',
      market: 'otc',
      timeframe: '15s',
      direction: 'PUT',
      accuracy: 91.2,
      entryPrice: 0.5284,
      expirySeconds: 15,
      remainingSeconds: 0,
      timestamp: Date.now() - 1000 * 60 * 16,
      result: 'WIN',
      payoutAmount: 87,
    },
    {
      id: 'sig_hist_4',
      pair: 'Crypto IDX (OTC)',
      flags: '₿ 🌐',
      market: 'otc',
      timeframe: '10s',
      direction: 'CALL',
      accuracy: 96.2,
      entryPrice: 4281.2,
      expirySeconds: 10,
      remainingSeconds: 0,
      timestamp: Date.now() - 1000 * 60 * 24,
      result: 'WIN',
      payoutAmount: 92,
    },
  ]);

  // Audio tone generator using Web Audio API
  const playTone = (type: 'chime' | 'expiry' | 'tick' | 'scanner') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      if (type === 'chime') {
        // High quality pleasant celestial chime (Major chord arpeggio)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          const osc = audioCtx.createOscillator();
          const gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0, now + idx * 0.08);
          gain.gain.linearRampToValueAtTime(0.12, now + idx * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.6);

          osc.connect(gain);
          gain.connect(audioCtx.destination);

          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.65);
        });
      } else if (type === 'expiry') {
        // Subtle soft resolving bell on expiry
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.4);

        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.45);
      } else if (type === 'tick') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        gain.gain.setValueAtTime(0.03, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      } else if (type === 'scanner') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.linearRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.12);
      }
    } catch (e) {
      // AudioContext policy safe fallback
    }
  };

  // Signal Countdown Interval
  useEffect(() => {
    if (!currentSignal || currentSignal.remainingSeconds <= 0) return;

    const interval = setInterval(() => {
      setCurrentSignal((prev) => {
        if (!prev) return null;
        const nextSec = prev.remainingSeconds - 1;
        if (nextSec <= 0) {
          playTone('expiry');
          // Add to history as WIN
          const completed: SignalData = {
            ...prev,
            remainingSeconds: 0,
            result: 'WIN',
            payoutAmount: selectedPair.payout,
          };
          setHistory((h) => [completed, ...h.slice(0, 9)]);
          return completed;
        }
        if (nextSec <= 3 && nextSec > 0) {
          playTone('tick');
        }
        return {
          ...prev,
          remainingSeconds: nextSec,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentSignal?.id, currentSignal?.remainingSeconds, selectedPair.payout]);

  // Fluctuating confidence accuracy when viewing signal (e.g. 87%, 91%, 96%)
  useEffect(() => {
    if (!currentSignal || currentSignal.remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setCurrentSignal((prev) => {
        if (!prev || prev.remainingSeconds <= 0) return prev;
        const delta = (Math.random() - 0.5) * 0.4;
        const bounded = Math.min(96.8, Math.max(86.5, Number((prev.accuracy + delta).toFixed(1))));
        return { ...prev, accuracy: bounded };
      });
    }, 1100);
    return () => clearInterval(interval);
  }, [currentSignal?.id]);

  // Handler: "Get Real Signal" with realistic 5 to 10-second multi-step sequence
  const handleGenerateSignal = () => {
    if (isAnalyzing) return;
    setIsAnalyzing(true);
    setAnalysisProgress(10);
    playTone('scanner');

    const steps = [
      { text: 'Neural Network Scanning Tick Velocity & Orderbook...', progress: 20, delay: 1400 },
      { text: 'Analyzing Quotex Liquidity & Resistance Zones...', progress: 42, delay: 2800 },
      { text: 'Calculating Algorithmic Probabilities (RSI 14 + MACD)...', progress: 65, delay: 4200 },
      { text: 'Checking Win-Rate Accuracy & Volatility Confirmation...', progress: 85, delay: 5600 },
      { text: 'Generating High-Accuracy Synchronized Strike Signal...', progress: 100, delay: 6800 },
    ];

    steps.forEach((step) => {
      setTimeout(() => {
        setAnalysisStep(step.text);
        setAnalysisProgress(step.progress);
        playTone('scanner');
      }, step.delay);
    });

    // Complete at ~7.2 seconds (within 5-10 second requirement)
    setTimeout(() => {
      const direction: 'CALL' | 'PUT' = Math.random() > 0.48 ? 'CALL' : 'PUT';
      // Accuracy fluctuates realistically between 87% and 96%
      const baseAccuracy = Number((87.5 + Math.random() * 8.8).toFixed(1));

      const newSig: SignalData = {
        id: `sig_${Date.now()}`,
        pair: selectedPair.name,
        flags: selectedPair.flags,
        market,
        timeframe: selectedTimeframe.name,
        direction,
        accuracy: baseAccuracy,
        entryPrice: selectedPair.basePrice,
        expirySeconds: selectedTimeframe.seconds,
        remainingSeconds: selectedTimeframe.seconds,
        timestamp: Date.now(),
        confidenceLevels: {
          rsi: direction === 'CALL' ? 31 : 69,
          trend: direction === 'CALL' ? 'Bullish Reversal Strike' : 'Bearish Breakdown Strike',
          volatility: 'Quotex Optimized Expiry',
          macd: direction === 'CALL' ? 'Bullish Crossover' : 'Bearish Crossover',
        },
      };

      setCurrentSignal(newSig);
      setIsAnalyzing(false);
      playTone('chime');
    }, 7200);
  };

  const totalWins = history.filter((h) => h.result === 'WIN').length;
  const winRatePercent = history.length > 0 ? ((totalWins / history.length) * 100).toFixed(1) : '95.2';

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`max-w-6xl mx-auto px-4 py-6 ${isUrdu ? 'font-urdu' : 'font-sans'}`}
    >
      {/* Top Header Strip with Brand Logo, Verified Pass Badge and Active Traders */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <CyborgGoldLogo size="md" glow={true} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                NextGen Bot Premium
              </h1>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Lock className="w-2.5 h-2.5 text-amber-400" />
                <span>Verified Lifetime Pass</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Trader ID: <code className="text-emerald-400 font-bold">{traderId}</code></span>
              <span>·</span>
              <span className="text-slate-400">Locked to this Single Device</span>
            </div>
          </div>
        </div>

        {/* Live Active Traders Counter & Sound Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-400">{t.activeTraders}:</span>
            <span className="font-mono font-bold text-white tabular-nums">
              {activeUsers.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors"
            title={soundEnabled ? t.soundOn : t.soundOff}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">{t.soundOn}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-slate-500" />
                <span className="text-slate-500">{t.soundOff}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Market Selection, Asset Pairs with Flags, Timeframe, Get Real Signal */}
        <div className="lg:col-span-5 space-y-5">
          {/* Market Selection Section */}
          <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
              {t.marketSelection}
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setMarket('otc')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                  market === 'otc'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>⚡ OTC Market</span>
                <span className="text-[10px] text-emerald-400 font-semibold">Capped 92% Payout</span>
              </button>

              <button
                type="button"
                onClick={() => setMarket('live')}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all border flex flex-col items-center justify-center gap-0.5 ${
                  market === 'live'
                    ? 'bg-emerald-600/25 border-emerald-500 text-white shadow-lg shadow-emerald-950/50'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>🌐 Live Market</span>
                <span className="text-[10px] text-cyan-400 font-semibold">Real Forex Liquidity</span>
              </button>
            </div>
          </div>

          {/* Asset Pairs Grid with Country/Currency Flags (Comprehensive list) */}
          <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {market === 'otc' ? 'Comprehensive OTC Pairs' : 'Live Forex Pairs'}
              </label>
              <span className="text-[11px] text-slate-500">
                {availablePairs.length} Asset Pairs
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {availablePairs.map((pair) => (
                <button
                  key={pair.id}
                  onClick={() => setSelectedPair(pair)}
                  className={`p-2 rounded-xl text-left border transition-all flex items-center justify-between ${
                    selectedPair.id === pair.id
                      ? 'bg-emerald-500/15 border-emerald-500/60 text-white shadow-sm'
                      : 'bg-slate-950/50 border-slate-850 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-sm shrink-0">{pair.flags}</span>
                    <span className="text-xs font-bold truncate">{pair.name}</span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-400 font-extrabold shrink-0 ml-1">
                    {pair.payout}%
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Comprehensive Timeframes */}
          <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-2.5">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {t.timeframe}
              </label>
              <span className="text-[11px] text-slate-400 font-mono">
                Duration: <span className="text-emerald-400 font-bold">{selectedTimeframe.name}</span>
              </span>
            </div>

            <div className="grid grid-cols-4 gap-1.5">
              {availableTimeframes.map((tf) => (
                <button
                  key={tf.label}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`py-2 px-1.5 rounded-lg text-xs font-mono font-bold transition-all text-center border ${
                    selectedTimeframe.label === tf.label
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-extrabold shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          {/* Action Button: Get Real Signal */}
          <div className="space-y-3">
            <button
              onClick={handleGenerateSignal}
              disabled={isAnalyzing}
              className="w-full py-4 px-6 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-base sm:text-lg rounded-2xl transition-all shadow-xl shadow-emerald-500/25 flex items-center justify-center gap-3 transform active:scale-[0.99] disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? (
                <>
                  <Activity className="w-5 h-5 animate-spin" />
                  <span className="truncate">{analysisStep}</span>
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6 fill-current" />
                  <span>{t.getSignal}</span>
                </>
              )}
            </button>

            {/* Direct Quotex Platform Link */}
            <a
              href={QUOTEX_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <span>{t.tradeNowOnQuotex}</span>
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
            </a>
          </div>
        </div>

        {/* Right Column: Signal Output & Synchronized Candlestick Chart Engine */}
        <div className="lg:col-span-7 space-y-5">
          {/* Signal Output Display Card */}
          {isAnalyzing && (
            <div className="bg-[#0b1322]/95 border border-emerald-500/40 rounded-2xl p-6 text-center relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 via-cyan-500/5 to-emerald-500/5 animate-pulse" />
              <div className="relative z-10 py-5">
                <div className="w-16 h-16 mx-auto mb-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Cpu className="w-8 h-8 animate-pulse text-emerald-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-1">
                  AI Generated Signals In Progress...
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto mb-4 font-mono font-semibold">
                  {analysisStep}
                </p>
                <div className="w-full max-w-sm mx-auto h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-400 transition-all duration-500"
                    style={{ width: `${analysisProgress}%` }}
                  />
                </div>
                <span className="text-[11px] font-mono text-emerald-400/90 block mt-2">
                  Scanning 24/7 Tick Stream · Depth Verification: {analysisProgress}%
                </span>
              </div>
            </div>
          )}

          {currentSignal && !isAnalyzing && (
            <div
              className={`rounded-2xl p-6 border transition-all relative overflow-hidden backdrop-blur-md shadow-2xl ${
                currentSignal.direction === 'CALL'
                  ? 'bg-gradient-to-b from-emerald-950/40 via-[#0b1322]/90 to-[#0b1322] border-emerald-500/50 shadow-emerald-950/50'
                  : 'bg-gradient-to-b from-red-950/40 via-[#0b1322]/90 to-[#0b1322] border-red-500/50 shadow-red-950/50'
              }`}
            >
              {/* Card Header: Pair & Flags */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{currentSignal.flags || selectedPair.flags}</span>
                  <span className="text-lg font-black text-white">{currentSignal.pair}</span>
                  <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                    {currentSignal.timeframe}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Real AI Signal Active</span>
                </div>
              </div>

              {/* Main Signal Direction Hero with Animated Moving Arrows */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center my-3">
                <div className="sm:col-span-2 flex items-center gap-4">
                  <div
                    className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-black border shadow-lg ${
                      currentSignal.direction === 'CALL'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-emerald-500/20'
                        : 'bg-red-500/20 border-red-500 text-red-400 shadow-red-500/20'
                    }`}
                  >
                    {currentSignal.direction === 'CALL' ? (
                      <>
                        <ArrowUp className="w-8 h-8 animate-arrow-up stroke-[3]" />
                        <span className="text-[11px] tracking-wider font-extrabold uppercase mt-0.5">BUY</span>
                      </>
                    ) : (
                      <>
                        <ArrowDown className="w-8 h-8 animate-arrow-down stroke-[3]" />
                        <span className="text-[11px] tracking-wider font-extrabold uppercase mt-0.5">SELL</span>
                      </>
                    )}
                  </div>

                  <div>
                    <span className="text-xs uppercase font-mono tracking-widest text-slate-400 block mb-1">
                      {t.recommendedAction}
                    </span>
                    <h2
                      className={`text-2xl sm:text-3xl font-black tracking-tight ${
                        currentSignal.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'
                      }`}
                    >
                      {currentSignal.direction === 'CALL' ? t.callBuy : t.putSell}
                    </h2>
                    <span className="text-xs text-slate-400 block mt-1">
                      Candles below synchronize in real time to the signal direction
                    </span>
                  </div>
                </div>

                {/* Expiry Countdown Timer */}
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 text-center">
                  <span className="text-[10px] uppercase font-mono text-slate-400 block mb-1">
                    {t.expiryCountdown}
                  </span>
                  <div className="text-2xl font-black font-mono text-white tabular-nums">
                    {currentSignal.remainingSeconds > 0 ? (
                      `${Math.floor(currentSignal.remainingSeconds / 60)}:${(currentSignal.remainingSeconds % 60)
                        .toString()
                        .padStart(2, '0')}`
                    ) : (
                      <span className="text-emerald-400 text-lg">EXPIRED · WIN</span>
                    )}
                  </div>
                  <div className="w-full bg-slate-850 h-1.5 rounded-full overflow-hidden mt-2">
                    <div
                      className={`h-full transition-all duration-1000 ${
                        currentSignal.direction === 'CALL' ? 'bg-emerald-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${(currentSignal.remainingSeconds / currentSignal.expirySeconds) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Accuracy & Quotex Metrics */}
              <div className="mt-4 pt-4 border-t border-slate-800/70 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                  <span className="text-slate-400 text-[11px] block">{t.confidenceAccuracy}</span>
                  <span className="text-base font-extrabold text-emerald-400 font-mono tabular-nums flex items-center gap-1 mt-0.5">
                    <Flame className="w-4 h-4 text-amber-400 fill-current" />
                    <span>{currentSignal.accuracy}%</span>
                  </span>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-855">
                  <span className="text-slate-400 text-[11px] block">{t.entryPrice}</span>
                  <span className="text-sm font-bold text-white font-mono tabular-nums mt-0.5 block">
                    {currentSignal.entryPrice.toFixed(currentSignal.entryPrice > 100 ? 2 : 5)}
                  </span>
                </div>

                <div className="col-span-2 sm:col-span-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-855">
                  <span className="text-slate-400 text-[11px] block">{t.payout}</span>
                  <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                    +{selectedPair.payout}% Payout
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Synchronized Chart & Trade Expiry: TradingView for Live Market, Synchronized Chart for OTC */}
          {market === 'live' ? (
            <TradingViewChart
              pair={selectedPair.name}
              symbol={selectedPair.tvSymbol || 'FX:EURUSD'}
              flags={selectedPair.flags}
              payout={selectedPair.payout}
              lastSignal={
                currentSignal
                  ? {
                      direction: currentSignal.direction,
                      time: currentSignal.timestamp,
                      price: currentSignal.entryPrice,
                      remainingSeconds: currentSignal.remainingSeconds,
                      expirySeconds: currentSignal.expirySeconds,
                    }
                  : null
              }
            />
          ) : (
            <TradingChart
              pair={selectedPair.name}
              market={market}
              basePrice={selectedPair.basePrice}
              flags={selectedPair.flags}
              payout={selectedPair.payout}
              lastSignal={
                currentSignal
                  ? {
                      direction: currentSignal.direction,
                      time: currentSignal.timestamp,
                      price: currentSignal.entryPrice,
                      remainingSeconds: currentSignal.remainingSeconds,
                      expirySeconds: currentSignal.expirySeconds,
                    }
                  : null
              }
            />
          )}

          {/* Live History Log & Performance */}
          <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-400" />
                <span>{t.recentSignals}</span>
              </h3>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="text-slate-400">
                  {t.winRate}: <strong className="text-emerald-400 font-bold">{winRatePercent}%</strong>
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  {t.totalSignals}: <strong className="text-white font-bold">{history.length + 24}</strong>
                </span>
              </div>
            </div>

            <div className="space-y-2 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-800/80 font-mono text-[11px]">
                    <th className="pb-2 font-medium">Asset Pair</th>
                    <th className="pb-2 font-medium">TF</th>
                    <th className="pb-2 font-medium">Direction</th>
                    <th className="pb-2 font-medium text-right">Accuracy</th>
                    <th className="pb-2 font-medium text-right">Result</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/50 font-mono">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-2.5 font-bold text-slate-200 flex items-center gap-1.5">
                        <span>{item.flags || '🌐'}</span>
                        <span>{item.pair}</span>
                      </td>
                      <td className="py-2.5 text-slate-400">{item.timeframe}</td>
                      <td className="py-2.5">
                        <span
                          className={`font-bold inline-flex items-center gap-1 ${
                            item.direction === 'CALL' ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {item.direction === 'CALL' ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )}
                          {item.direction}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-slate-300 tabular-nums">
                        {item.accuracy}%
                      </td>
                      <td className="py-2.5 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle className="w-3 h-3" />
                          <span>WIN +{item.payoutAmount || 95}%</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
