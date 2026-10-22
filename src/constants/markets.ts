import { CurrencyPair } from '../types';

// OTC Market pairs: payout percentages strictly capped at maximum 92% (ranging 82% to 92%)
export const OTC_PAIRS: CurrencyPair[] = [
  { id: 'usdpkr_otc', name: 'USD/PKR (OTC)', payout: 92, market: 'otc', basePrice: 278.50, spread: 0.05, flags: '🇺🇸 🇵🇰', assetCategory: 'Forex' },
  { id: 'eurusd_otc', name: 'EUR/USD (OTC)', payout: 92, market: 'otc', basePrice: 1.0855, spread: 0.0001, flags: '🇪🇺 🇺🇸', assetCategory: 'Forex' },
  { id: 'gbpusd_otc', name: 'GBP/USD (OTC)', payout: 91, market: 'otc', basePrice: 1.2930, spread: 0.0001, flags: '🇬🇧 🇺🇸', assetCategory: 'Forex' },
  { id: 'cryptoidx_otc', name: 'Crypto IDX (OTC)', payout: 92, market: 'otc', basePrice: 4280.5, spread: 0.5, flags: '₿ 🌐', assetCategory: 'Crypto' },
  { id: 'usdinr_otc', name: 'USD/INR (OTC)', payout: 89, market: 'otc', basePrice: 86.42, spread: 0.02, flags: '🇺🇸 🇮🇳', assetCategory: 'Forex' },
  { id: 'eurjpy_otc', name: 'EUR/JPY (OTC)', payout: 90, market: 'otc', basePrice: 166.75, spread: 0.01, flags: '🇪🇺 🇯🇵', assetCategory: 'Forex' },
  { id: 'usdbdt_otc', name: 'USD/BDT (OTC)', payout: 88, market: 'otc', basePrice: 121.30, spread: 0.05, flags: '🇺🇸 🇧🇩', assetCategory: 'Forex' },
  { id: 'nzdchf_otc', name: 'NZD/CHF (OTC)', payout: 87, market: 'otc', basePrice: 0.5284, spread: 0.0001, flags: '🇳🇿 🇨🇭', assetCategory: 'Forex' },
  { id: 'usdbrl_otc', name: 'USD/BRL (OTC)', payout: 86, market: 'otc', basePrice: 5.72, spread: 0.01, flags: '🇺🇸 🇧🇷', assetCategory: 'Forex' },
  { id: 'audcad_otc', name: 'AUD/CAD (OTC)', payout: 85, market: 'otc', basePrice: 0.9085, spread: 0.0001, flags: '🇦🇺 🇨🇦', assetCategory: 'Forex' },
];

export const LIVE_PAIRS: CurrencyPair[] = [
  { id: 'eurusd_live', name: 'EUR/USD', payout: 88, market: 'live', basePrice: 1.0842, spread: 0.0001, flags: '🇪🇺 🇺🇸', assetCategory: 'Forex', tvSymbol: 'FX:EURUSD' },
  { id: 'gbpusd_live', name: 'GBP/USD', payout: 89, market: 'live', basePrice: 1.2915, spread: 0.0001, flags: '🇬🇧 🇺🇸', assetCategory: 'Forex', tvSymbol: 'FX:GBPUSD' },
  { id: 'usdjpy_live', name: 'USD/JPY', payout: 87, market: 'live', basePrice: 153.68, spread: 0.01, flags: '🇺🇸 🇯🇵', assetCategory: 'Forex', tvSymbol: 'FX:USDJPY' },
  { id: 'gbpjpy_live', name: 'GBP/JPY', payout: 88, market: 'live', basePrice: 198.42, spread: 0.01, flags: '🇬🇧 🇯🇵', assetCategory: 'Forex', tvSymbol: 'FX:GBPJPY' },
  { id: 'audusd_live', name: 'AUD/USD', payout: 86, market: 'live', basePrice: 0.6540, spread: 0.0001, flags: '🇦🇺 🇺🇸', assetCategory: 'Forex', tvSymbol: 'FX:AUDUSD' },
  { id: 'usdcad_live', name: 'USD/CAD', payout: 85, market: 'live', basePrice: 1.3892, spread: 0.0001, flags: '🇺🇸 🇨🇦', assetCategory: 'Forex', tvSymbol: 'FX:USDCAD' },
  { id: 'eurgbp_live', name: 'EUR/GBP', payout: 86, market: 'live', basePrice: 0.8394, spread: 0.0001, flags: '🇪🇺 🇬🇧', assetCategory: 'Forex', tvSymbol: 'FX:EURGBP' },
  { id: 'nzdusd_live', name: 'NZD/USD', payout: 84, market: 'live', basePrice: 0.5984, spread: 0.0001, flags: '🇳🇿 🇺🇸', assetCategory: 'Forex', tvSymbol: 'FX:NZDUSD' },
  { id: 'eurchf_live', name: 'EUR/CHF', payout: 83, market: 'live', basePrice: 0.9412, spread: 0.0001, flags: '🇪🇺 🇨🇭', assetCategory: 'Forex', tvSymbol: 'FX:EURCHF' },
];

export const LIVE_TIMEFRAMES = [
  { label: '1m', seconds: 60, name: '1 Minute' },
  { label: '2m', seconds: 120, name: '2 Minutes' },
  { label: '3m', seconds: 180, name: '3 Minutes' },
  { label: '5m', seconds: 300, name: '5 Minutes' },
  { label: '10m', seconds: 600, name: '10 Minutes' },
  { label: '15m', seconds: 900, name: '15 Minutes' },
];

export const OTC_TIMEFRAMES = [
  { label: '5s', seconds: 5, name: '5 Seconds' },
  { label: '10s', seconds: 10, name: '10 Seconds' },
  { label: '15s', seconds: 15, name: '15 Seconds' },
  { label: '30s', seconds: 30, name: '30 Seconds' },
  { label: '1m', seconds: 60, name: '1 Minute' },
  { label: '2m', seconds: 120, name: '2 Minutes' },
  { label: '5m', seconds: 300, name: '5 Minutes' },
  { label: '10m', seconds: 600, name: '10 Minutes' },
];
