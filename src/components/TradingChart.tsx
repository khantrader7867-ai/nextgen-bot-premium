import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Eye, Activity, BarChart2, CheckCircle, Clock } from 'lucide-react';

interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface TradingChartProps {
  pair: string;
  market: 'live' | 'otc';
  basePrice: number;
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

export const TradingChart: React.FC<TradingChartProps> = ({
  pair,
  market,
  basePrice,
  flags = '🇪🇺 🇺🇸',
  payout,
  lastSignal,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [candles, setCandles] = useState<Candle[]>([]);
  const [priceChange, setPriceChange] = useState<number>(0);
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(true);

  // Generate initial candle series
  useEffect(() => {
    const list: Candle[] = [];
    let prevClose = basePrice;
    const now = Date.now();
    const count = 40;
    const stepMs = 3000;

    for (let i = count; i >= 0; i--) {
      const volatility = basePrice * 0.00045;
      const change = (Math.random() - 0.492) * volatility;
      const open = prevClose;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.7);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.7);
      list.push({
        time: now - i * stepMs,
        open,
        high,
        low,
        close,
      });
      prevClose = close;
    }

    setCandles(list);
    setCurrentPrice(prevClose);
  }, [pair, basePrice]);

  // When a new signal is generated, synchronize chart by pinning strike candle
  useEffect(() => {
    if (!lastSignal) return;
    setCandles((prev) => {
      if (!prev || prev.length === 0) return prev;
      const strikeCandle: Candle = {
        time: Date.now(),
        open: lastSignal.price,
        high: lastSignal.price + (lastSignal.direction === 'CALL' ? basePrice * 0.0002 : 0),
        low: lastSignal.price - (lastSignal.direction === 'PUT' ? basePrice * 0.0002 : 0),
        close: lastSignal.price + (lastSignal.direction === 'CALL' ? basePrice * 0.0001 : -basePrice * 0.0001),
      };
      return [...prev.slice(1), strikeCandle];
    });
  }, [lastSignal?.time, lastSignal?.direction]);

  // Live price tick engine - SYNCHRONIZED with signal direction & terminates on countdown 0!
  useEffect(() => {
    const interval = setInterval(() => {
      setCandles((prev) => {
        if (!prev || prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        const volatility = basePrice * 0.00035;

        // Synchronize direction: if CALL, pump upward with bullish green bias; if PUT, plunge downward
        let delta = (Math.random() - 0.496) * volatility;
        if (lastSignal && (lastSignal.remainingSeconds || 0) > 0) {
          if (lastSignal.direction === 'CALL') {
            // Strongly positive drift (bullish green candles)
            delta = (Math.random() * 0.78 - 0.18) * volatility;
          } else if (lastSignal.direction === 'PUT') {
            // Strongly negative drift (bearish red candles)
            delta = (Math.random() * 0.18 - 0.78) * volatility;
          }
        }

        const newClose = Number((last.close + delta).toFixed(basePrice > 100 ? 2 : 5));

        last.close = newClose;
        last.high = Math.max(last.high, newClose);
        last.low = Math.min(last.low, newClose);

        setCurrentPrice(newClose);
        setPriceChange(newClose - basePrice);

        // Every 5-6 ticks, start a new candle matching the synchronized momentum
        if (Math.random() > 0.76) {
          const newCandle: Candle = {
            time: Date.now(),
            open: newClose,
            high: newClose,
            low: newClose,
            close: newClose,
          };
          return [...prev.slice(1), newCandle];
        }

        return [...prev.slice(0, -1), last];
      });
    }, 550);

    return () => clearInterval(interval);
  }, [basePrice, lastSignal?.direction, lastSignal?.remainingSeconds]);

  // Canvas drawing for candlesticks, Bollinger bands, EMA 9/21, and Quotex strike line
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || candles.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    const height = (canvas.height = 260);

    ctx.clearRect(0, 0, width, height);

    // Compute min and max
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    for (const c of candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
    }

    if (lastSignal) {
      minPrice = Math.min(minPrice, lastSignal.price);
      maxPrice = Math.max(maxPrice, lastSignal.price);
    }

    const padding = (maxPrice - minPrice) * 0.16 || 0.0006;
    minPrice -= padding;
    maxPrice += padding;
    const priceRange = maxPrice - minPrice || 1;

    const getY = (price: number) => height - ((price - minPrice) / priceRange) * height;

    // Grid lines & Price Axis
    ctx.lineWidth = 1;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = 'rgba(148, 163, 184, 0.55)';

    for (let i = 1; i <= 4; i++) {
      const y = (height / 5) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width - 65, y);
      ctx.stroke();

      const priceAtY = maxPrice - (i / 5) * priceRange;
      ctx.fillText(priceAtY.toFixed(basePrice > 100 ? 2 : 5), width - 60, y + 3);
    }

    const candleWidth = (width - 70) / candles.length;

    // Bollinger Bands (14 periods, 2 std dev)
    if (showBollinger && candles.length >= 14) {
      const period = 14;
      const upperPoints: { x: number; y: number }[] = [];
      const lowerPoints: { x: number; y: number }[] = [];

      for (let i = period - 1; i < candles.length; i++) {
        const slice = candles.slice(i - period + 1, i + 1);
        const mean = slice.reduce((acc, c) => acc + c.close, 0) / period;
        const variance = slice.reduce((acc, c) => acc + Math.pow(c.close - mean, 2), 0) / period;
        const stdDev = Math.sqrt(variance);

        const x = i * candleWidth + candleWidth / 2;
        upperPoints.push({ x, y: getY(mean + stdDev * 2) });
        lowerPoints.push({ x, y: getY(mean - stdDev * 2) });
      }

      if (upperPoints.length > 1) {
        // Shaded Bollinger Cloud
        ctx.beginPath();
        ctx.moveTo(upperPoints[0].x, upperPoints[0].y);
        upperPoints.forEach((p) => ctx.lineTo(p.x, p.y));
        for (let i = lowerPoints.length - 1; i >= 0; i--) {
          ctx.lineTo(lowerPoints[i].x, lowerPoints[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.fill();

        // Upper & Lower boundary lines
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        upperPoints.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();

        ctx.beginPath();
        lowerPoints.forEach((p, idx) => (idx === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.stroke();
      }
    }

    // EMA 9 (cyan) & EMA 21 (amber)
    if (showEMA) {
      // EMA 9
      ctx.beginPath();
      ctx.lineWidth = 1.4;
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.75)';
      let ema9 = candles[0].close;
      const a9 = 2 / (9 + 1);
      candles.forEach((c, idx) => {
        ema9 = c.close * a9 + ema9 * (1 - a9);
        const x = idx * candleWidth + candleWidth / 2;
        const y = getY(ema9);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // EMA 21
      ctx.beginPath();
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.65)';
      let ema21 = candles[0].close;
      const a21 = 2 / (21 + 1);
      candles.forEach((c, idx) => {
        ema21 = c.close * a21 + ema21 * (1 - a21);
        const x = idx * candleWidth + candleWidth / 2;
        const y = getY(ema21);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
    }

    // Draw Candlesticks
    candles.forEach((c, idx) => {
      const isBullish = c.close >= c.open;
      const color = isBullish ? '#10b981' : '#ef4444';
      const x = idx * candleWidth + candleWidth / 2;
      const bodyWidth = Math.max(candleWidth * 0.68, 2);

      // Wick
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = color;
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      const openY = getY(c.open);
      const closeY = getY(c.close);
      const topY = Math.min(openY, closeY);
      const bodyHeight = Math.max(Math.abs(closeY - openY), 2);

      ctx.fillStyle = color;
      ctx.fillRect(x - bodyWidth / 2, topY, bodyWidth, bodyHeight);
    });

    // Current price dashed marker line
    const currentY = getY(currentPrice);
    const isBull = currentPrice >= basePrice;
    ctx.strokeStyle = isBull ? '#10b981' : '#ef4444';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(width - 65, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price tag badge on right axis
    ctx.fillStyle = isBull ? '#10b981' : '#ef4444';
    ctx.fillRect(width - 65, currentY - 10, 65, 20);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px JetBrains Mono, monospace';
    ctx.fillText(currentPrice.toFixed(basePrice > 100 ? 2 : 5), width - 62, currentY + 4);

    // Quotex Signal Strike Marker Line & Real-Time Direction Arrow
    if (lastSignal) {
      const signalY = getY(lastSignal.price);
      ctx.strokeStyle = lastSignal.direction === 'CALL' ? '#10b981' : '#ef4444';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([5, 3]);
      ctx.beginPath();
      ctx.moveTo(0, signalY);
      ctx.lineTo(width - 65, signalY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Signal Strike Label on left of chart
      ctx.fillStyle = lastSignal.direction === 'CALL' ? '#10b981' : '#ef4444';
      ctx.fillRect(16, signalY - 11, 95, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px JetBrains Mono, monospace';
      ctx.fillText(
        `${lastSignal.direction} @ ${lastSignal.price.toFixed(basePrice > 100 ? 2 : 5)}`,
        22,
        signalY + 3
      );
    }
  }, [candles, currentPrice, basePrice, lastSignal, showBollinger, showEMA]);

  const isPositive = priceChange >= 0;
  const isTradeActive = !!(lastSignal && (lastSignal.remainingSeconds || 0) > 0);
  const isTradeExpired = !!(lastSignal && lastSignal.remainingSeconds === 0);

  return (
    <div className="bg-[#0b1322]/90 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xl shrink-0">{flags}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-wide">
                {pair}
              </span>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 uppercase">
                {market} (Max {payout}%)
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Quotex Pro Feed · Synchronized Algorithmic Direction
            </div>
          </div>
        </div>

        {/* Live Trade Status Indicator Badge */}
        {isTradeActive && lastSignal && (
          <div
            className={`px-3 py-1 rounded-xl border text-xs font-mono font-bold flex items-center gap-2 animate-pulse ${
              lastSignal.direction === 'CALL'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300'
                : 'bg-red-950/60 border-red-500 text-red-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>TRADE ACTIVE: {lastSignal.direction}</span>
            <span>·</span>
            <span className="tabular-nums">TERMINATING IN {lastSignal.remainingSeconds}s</span>
          </div>
        )}

        {isTradeExpired && lastSignal && (
          <div className="px-3 py-1 rounded-xl border bg-emerald-950/60 border-emerald-500 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span>TRADE EXPIRED · PROFIT WON (+{payout}%)</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Indicator toggles */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-lg border border-slate-800 text-[10px] font-mono">
            <button
              onClick={() => setShowEMA(!showEMA)}
              className={`px-2 py-0.5 rounded transition-colors ${
                showEMA ? 'bg-cyan-600/30 text-cyan-300 font-bold' : 'text-slate-500'
              }`}
            >
              EMA
            </button>
            <button
              onClick={() => setShowBollinger(!showBollinger)}
              className={`px-2 py-0.5 rounded transition-colors ${
                showBollinger ? 'bg-amber-600/30 text-amber-300 font-bold' : 'text-slate-500'
              }`}
            >
              BB
            </button>
          </div>

          <div className="text-right font-mono">
            <span className="text-sm font-bold text-white tabular-nums mr-2">
              {currentPrice.toFixed(basePrice > 100 ? 2 : 5)}
            </span>
            <span
              className={`text-xs inline-flex items-center tabular-nums font-semibold ${
                isPositive ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {isPositive ? (
                <TrendingUp className="w-3 h-3 mr-0.5" />
              ) : (
                <TrendingDown className="w-3 h-3 mr-0.5" />
              )}
              {isPositive ? '+' : ''}
              {priceChange.toFixed(basePrice > 100 ? 2 : 5)}
            </span>
          </div>

          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" title="Real-Time Tick" />
        </div>
      </div>

      <div className="relative w-full h-[260px] overflow-hidden rounded-xl bg-[#060b13]/95 border border-slate-900 shadow-inner">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 text-[11px] text-slate-500 font-mono">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-400 rounded-full inline-block" />
            <span>EMA 9</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-amber-400 rounded-full inline-block" />
            <span>EMA 21</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-cyan-300/40 rounded-full inline-block" />
            <span>Bollinger Bands</span>
          </span>
        </div>
        <span className="text-slate-400">
          Quotex Sub-Affiliate Synchronized Feed (Auto-Settlement on 0s)
        </span>
      </div>
    </div>
  );
};
