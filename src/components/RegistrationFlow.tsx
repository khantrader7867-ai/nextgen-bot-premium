import React, { useState } from 'react';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  Send,
  Wallet,
  FileCheck2,
  UserX,
  PlayCircle,
  Lock,
  Smartphone,
  Flame,
  KeyRound
} from 'lucide-react';
import { Language, TraderVerificationState } from '../types';
import { translations, QUOTEX_REFERRAL_URL } from '../constants/translations';
import { CyborgGoldLogo } from './CyborgGoldLogo';

interface RegistrationFlowProps {
  language: Language;
  verification: TraderVerificationState;
  onVerifySubmit: (traderId: string) => Promise<void>;
  onStartDashboard: () => void;
  onResetTrader: () => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
}

export const RegistrationFlow: React.FC<RegistrationFlowProps> = ({
  language,
  verification,
  onVerifySubmit,
  onStartDashboard,
  onResetTrader,
  isSubmitting,
  errorMessage,
}) => {
  const t = translations[language];
  const isUrdu = language === 'ur';

  const [inputTraderId, setInputTraderId] = useState(verification.traderId || '');
  const [copiedLink, setCopiedLink] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(QUOTEX_REFERRAL_URL);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    const clean = inputTraderId.trim();
    if (!clean) {
      setLocalError(isUrdu ? 'برائے مہربانی اپنا درست ٹریڈر آئی ڈی درج کریں۔' : 'Please enter your Quotex Trader ID.');
      return;
    }
    if (clean.length < 4) {
      setLocalError(isUrdu ? 'ٹریڈر آئی ڈی کم از کم 4 ہندسوں پر مشتمل ہونا چاہیے۔' : 'Trader ID must be at least 4 digits.');
      return;
    }
    await onVerifySubmit(clean);
  };

  const steps = [
    {
      num: 1,
      icon: UserX,
      title: t.step1Title,
      desc: t.step1Desc,
      glowColor: 'hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.15)]',
      badgeClass: 'border-rose-500/40 text-rose-400 bg-rose-500/10',
    },
    {
      num: 2,
      icon: ExternalLink,
      title: t.step2Title,
      desc: t.step2Desc,
      glowColor: 'hover:border-amber-400/60 hover:shadow-[0_0_25px_rgba(245,158,11,0.2)]',
      badgeClass: 'border-amber-400/50 text-amber-300 bg-amber-400/15',
      action: {
        text: t.step2Button,
        url: QUOTEX_REFERRAL_URL,
      },
    },
    {
      num: 3,
      icon: FileCheck2,
      title: t.step3Title,
      desc: t.step3Desc,
      glowColor: 'hover:border-cyan-400/50 hover:shadow-[0_0_20px_rgba(6,182,212,0.15)]',
      badgeClass: 'border-cyan-400/40 text-cyan-300 bg-cyan-400/10',
    },
    {
      num: 4,
      icon: Wallet,
      title: t.step4Title,
      desc: t.step4Desc,
      glowColor: 'hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]',
      badgeClass: 'border-amber-500/40 text-amber-400 bg-amber-500/10',
    },
    {
      num: 5,
      icon: Send,
      title: t.step5Title,
      desc: t.step5Desc,
      glowColor: 'hover:border-emerald-400/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)]',
      badgeClass: 'border-emerald-400/40 text-emerald-300 bg-emerald-400/10',
    },
  ];

  const activeError = localError || errorMessage;

  return (
    <div
      dir={isUrdu ? 'rtl' : 'ltr'}
      className={`max-w-4xl mx-auto px-4 py-6 sm:py-8 ${isUrdu ? 'font-urdu' : 'font-sans'}`}
    >
      {/* Welcome Hero Banner with Glowing Golden-White AI Cyborg Emblem */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center gap-3.5 mb-5 group">
          <CyborgGoldLogo size="lg" glow={true} />
          <div className="text-left">
            <span className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-wide block">
              NextGen Bot Premium
            </span>
            <span className="text-[11px] sm:text-xs font-mono text-amber-400 font-semibold tracking-wider uppercase block">
              Official Quotex VIP Signal Station
            </span>
          </div>
        </div>

        {/* VIP License Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-bold mb-4 tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>VIP ACCESS LIFETIME FOR FREE · OFFICIAL VERIFICATION</span>
        </div>

        {/* Welcome Header & Subtitle */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tight mb-3">
          {t.welcome}
        </h1>
        <p className="text-lg sm:text-xl text-amber-300/90 font-medium max-w-2xl mx-auto leading-relaxed">
          {t.subtitle}
        </p>
      </div>

      {/* Official Referral Link Quick Card */}
      <div className="mb-8 bg-[#090e1a]/90 border border-amber-400/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.08)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-sm">
            <span className="text-slate-400 block text-xs uppercase font-mono tracking-wider mb-1">
              Quotex Official Sub-Affiliate Link
            </span>
            <span className="font-mono text-amber-300 text-xs sm:text-sm break-all font-bold">
              {QUOTEX_REFERRAL_URL}
            </span>
          </div>
          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopyLink}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl transition-colors border border-slate-700 whitespace-nowrap"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-amber-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? t.copied : t.referralLinkCopy}</span>
            </button>
            <a
              href={QUOTEX_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl transition-all shadow-lg shadow-amber-500/25 whitespace-nowrap"
            >
              <span>Quotex Sign Up</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Unique Lifetime Pass Policy Notice */}
      <div className="mb-8 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs text-slate-300 flex items-center gap-3">
        <Lock className="w-4 h-4 text-amber-400 shrink-0" />
        <div className="flex-1 leading-relaxed">
          <strong className="text-white">Strict 1-User Device Security Lock:</strong> Each Quotex Trader ID is permanently locked to one user and device upon Telegram admin approval. Reusing or sharing the same Trader ID across multiple devices is strictly prohibited.
        </div>
      </div>

      {/* 5 Mandatory Steps Grid Styled with Cyberpunk Neon Glass Cards */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <span>{t.stepsTitle}</span>
          </h2>
          <span className="text-xs text-amber-400/80 font-mono hidden sm:inline">
            Required for Telegram Admin Approval
          </span>
        </div>

        <div className="space-y-3">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className={`bg-[#0a0f1d]/90 border border-slate-800/90 rounded-2xl p-4 sm:p-5 transition-all duration-300 backdrop-blur-sm ${step.glowColor}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border shadow-sm ${step.badgeClass}`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base font-bold text-slate-100 mb-1">
                      {step.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                      {step.desc}
                    </p>
                    {step.action && (
                      <div className="mt-3">
                        <a
                          href={step.action.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-400/40 rounded-xl transition-all shadow-sm"
                        >
                          <span>{step.action.text}</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Trader ID Verification Card / Dynamic Interactive State Box */}
      <div className="bg-[#090e1b]/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden">
        {/* Subtle Ambient Golden Glow Behind Form */}
        <div className="absolute top-0 right-1/2 translate-x-1/2 w-72 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* State 1: IDLE / FORM */}
        {verification.status === 'idle' && (
          <div className="relative z-10">
            <div className="text-center max-w-md mx-auto mb-6">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1.5">
                {isUrdu ? 'مرحلہ 5: اپنا کوٹیکس ٹریڈر آئی ڈی درج کریں' : 'Step 5: Send Your Quotex Trader ID'}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {isUrdu
                  ? 'آپ کا ٹریڈر آئی ڈی فوراً ٹیلیگرام ایڈمن بوٹ کو منظوری کے لیے موصول ہو جائے گا۔'
                  : 'Your submission instantly notifies the Telegram Admin Bot with [Accept] and [Reject] buttons.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputTraderId}
                    onChange={(e) => setInputTraderId(e.target.value)}
                    placeholder={t.inputPlaceholder}
                    className="w-full px-4 py-3.5 bg-slate-950/90 border border-amber-500/30 focus:border-amber-400 focus:shadow-[0_0_15px_rgba(245,158,11,0.25)] rounded-2xl text-white placeholder-slate-500 font-mono text-sm focus:outline-none transition-all"
                    disabled={isSubmitting}
                  />
                  <KeyRound className="w-4 h-4 text-amber-400/50 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-60 text-slate-950 font-black rounded-2xl transition-all shadow-lg shadow-amber-500/25 text-sm flex items-center justify-center gap-2 whitespace-nowrap active:scale-[0.99] cursor-pointer"
                >
                  {isSubmitting ? (
                    <span>{t.submitting}</span>
                  ) : (
                    <>
                      <span>{t.submitButton}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

              {activeError && (
                <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/50 border border-rose-500/30 text-xs text-rose-300 flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold text-rose-200 mb-0.5">Verification Alert:</p>
                    <p className="leading-relaxed">{activeError}</p>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}

        {/* State 2: PENDING / VERIFYING */}
        {verification.status === 'pending' && (
          <div className="text-center py-6 max-w-xl mx-auto relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-500/10 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Clock className="w-8 h-8 animate-spin" style={{ animationDuration: '6s' }} />
            </div>

            <span className="inline-block px-3.5 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-bold mb-3 border border-amber-400/30 shadow-sm">
              {t.pendingTitle}
            </span>

            <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
              Trader ID: <span className="font-mono text-amber-400">{verification.traderId}</span>
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {t.pendingMsg}
            </p>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="text-slate-300">Telegram Bot Admin Live Polling (Every 2s)...</span>
              </span>
              <span className="font-mono text-slate-400 text-[11px] flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                <span>Device Token: ..{(verification.userToken || '').slice(-6)}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onResetTrader}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-900/60 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
              >
                Change Trader ID
              </button>
            </div>
          </div>
        )}

        {/* State 3: ACCEPTED / UNLOCKED */}
        {verification.status === 'accepted' && (
          <div className="text-center py-6 max-w-xl mx-auto relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/15 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-bold mb-3 border border-emerald-400/30">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>LIFETIME VIP ACCESS ACTIVE · LOCKED TO THIS DEVICE</span>
            </div>

            <h3 className="text-2xl font-black text-white mb-2">
              Trader ID: <span className="font-mono text-emerald-400">{verification.traderId}</span>
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {t.acceptedMsg}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onStartDashboard}
                className="w-full sm:w-auto px-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-2xl transition-all shadow-xl shadow-emerald-500/30 text-base flex items-center justify-center gap-2 transform hover:scale-[1.02] cursor-pointer"
              >
                <PlayCircle className="w-5 h-5" />
                <span>{t.startBotButton}</span>
              </button>
            </div>
          </div>
        )}

        {/* State 4: REJECTED */}
        {verification.status === 'rejected' && (
          <div className="text-center py-6 max-w-xl mx-auto relative z-10">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
              <XCircle className="w-9 h-9" />
            </div>

            <span className="inline-block px-3.5 py-1 rounded-full bg-rose-500/15 text-rose-300 text-xs font-bold mb-3 border border-rose-500/30">
              {t.rejectedTitle}
            </span>

            <h3 className="text-xl font-bold text-white mb-2">
              Trader ID: <span className="font-mono text-rose-400">{verification.traderId}</span>
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed mb-6">
              {verification.message || t.rejectedMsg}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={onResetTrader}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-all text-sm cursor-pointer shadow-md"
              >
                {t.tryAgain}
              </button>
              <a
                href={QUOTEX_REFERRAL_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <span>Re-register on Quotex (lid=2400438)</span>
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
