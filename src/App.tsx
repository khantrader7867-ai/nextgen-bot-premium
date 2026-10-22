import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  Bot,
  Zap,
  TrendingUp,
  ExternalLink,
  Layers,
  ArrowRight,
  Activity,
  Award,
  Lock
} from 'lucide-react';
import { Language, TraderVerificationState, AdminStats } from './types';
import { translations, QUOTEX_REFERRAL_URL, TELEGRAM_BOT_TOKEN } from './constants/translations';
import { LanguageSelector } from './components/LanguageSelector';
import { BackgroundEffect } from './components/BackgroundEffect';
import { RegistrationFlow } from './components/RegistrationFlow';
import { SignalEngine } from './components/SignalEngine';
import { TelegramAdminModal } from './components/TelegramAdminModal';
import { CyborgGoldLogo } from './components/CyborgGoldLogo';

// Get or generate persistent unique device token
function getOrCreateClientToken(): string {
  try {
    let tok = localStorage.getItem('quotex_device_token');
    if (!tok) {
      tok = `dev_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`;
      localStorage.setItem('quotex_device_token', tok);
    }
    return tok;
  } catch (e) {
    return `dev_fallback_${Date.now()}`;
  }
}

export default function App() {
  const [language, setLanguage] = useState<Language>('ur'); // Urdu default, easily switchable to English
  const [activeView, setActiveView] = useState<'flow' | 'dashboard'>('flow');
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const deviceToken = getOrCreateClientToken();

  // Trader Verification State
  const [verification, setVerification] = useState<TraderVerificationState>(() => {
    try {
      const saved = localStorage.getItem('quotex_trader_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          userToken: parsed.userToken || deviceToken,
        };
      }
    } catch (e) {
      // ignore
    }
    return {
      traderId: '',
      userToken: deviceToken,
      status: 'idle',
      isLifetimeActive: false,
    };
  });

  // Admin Stats
  const [adminStats, setAdminStats] = useState<AdminStats>({
    totalAccepted: 52,
    totalRejected: 7,
    totalPending: 0,
    adminChatIds: [],
  });

  // Save verification state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('quotex_trader_session', JSON.stringify(verification));
    } catch (e) {
      // ignore
    }
  }, [verification]);

  // Fetch admin stats
  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setAdminStats({
          totalAccepted: data.totalAccepted ?? 52,
          totalRejected: data.totalRejected ?? 7,
          totalPending: data.totalPending ?? 0,
          adminChatIds: data.adminChatIds ?? [],
          requests: data.requests ?? [],
          botInfo: data.botInfo,
        });
      }
    } catch (e) {
      // ignore network errors in sandbox
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // Hidden admin access for system operators (no public buttons in UI)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('admin=')) {
      setIsAdminModalOpen(true);
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && (e.key === 'a' || e.key === 'A')) {
        setIsAdminModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Real-time Status Poller: monitors both pending requests and active passes for instant approval / revocation
  useEffect(() => {
    if (!verification.traderId || verification.status === 'idle') return;

    const interval = setInterval(async () => {
      try {
        const tokenQuery = verification.userToken ? `?token=${encodeURIComponent(verification.userToken)}` : '';
        const res = await fetch(`/api/trader/status/${encodeURIComponent(verification.traderId)}${tokenQuery}`);
        if (res.ok) {
          const data = await res.json();
          const statusChanged = data.status !== verification.status;
          const lifetimeChanged = data.isLifetimeActive !== verification.isLifetimeActive;

          if (statusChanged || lifetimeChanged) {
            setVerification((prev) => ({
              ...prev,
              status: data.status,
              isLifetimeActive: data.status === 'accepted' && data.isLifetimeActive !== false,
              message: data.message,
              decidedAt: data.decidedAt,
            }));

            // INSTANT REVOCATION: If admin clicks [Reject] on Telegram, immediately kick user out of dashboard
            if (data.status === 'rejected') {
              setActiveView('flow');
            }
            fetchStats();
          }
        } else if (res.status === 403) {
          // Locked to another user or revoked
          const errData = await res.json().catch(() => ({}));
          setVerification((prev) => ({
            ...prev,
            status: 'rejected',
            isLifetimeActive: false,
            message: errData.message || errData.error || 'Access revoked: Trader ID is locked to another user or was rejected.',
          }));
          setActiveView('flow');
        }
      } catch (err) {
        // ignore network error in sandbox
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [verification.status, verification.traderId, verification.userToken, verification.isLifetimeActive, fetchStats]);

  // Submit Trader ID to backend & Telegram Bot
  const handleVerifySubmit = async (traderId: string) => {
    setIsSubmitting(true);
    setSubmissionError(null);
    try {
      const res = await fetch('/api/trader/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traderId,
          userToken: verification.userToken || deviceToken,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setVerification({
          traderId,
          userToken: data.userToken || verification.userToken || deviceToken,
          status: data.status,
          isLifetimeActive: data.status === 'accepted',
          message: data.message,
          submittedAt: Date.now(),
        });
        fetchStats();
      } else {
        setSubmissionError(data.error || 'This Trader ID could not be submitted.');
      }
    } catch (e) {
      // Fallback
      setVerification({
        traderId,
        userToken: deviceToken,
        status: 'pending',
        message: 'Your Trader ID is submitted and currently under admin verification.',
        submittedAt: Date.now(),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset Trader ID input
  const handleResetTrader = () => {
    setVerification({
      traderId: '',
      userToken: deviceToken,
      status: 'idle',
      isLifetimeActive: false,
    });
    setSubmissionError(null);
    setActiveView('flow');
  };

  // Admin decision callback
  const handleAdminDecision = async (
    traderId: string,
    decision: 'accepted' | 'rejected',
    reason?: string
  ) => {
    try {
      const res = await fetch('/api/admin/decision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ traderId, decision, reason }),
      });
      if (res.ok) {
        fetchStats();
        if (verification.traderId === traderId) {
          setVerification((prev) => ({
            ...prev,
            status: decision,
            isLifetimeActive: decision === 'accepted',
            decidedAt: Date.now(),
            message:
              decision === 'accepted'
                ? 'Verification Completed! Your access is provided.'
                : 'Verification rejected. Please ensure you registered via the referral link and deposited minimum $30.',
          }));
        }
      }
    } catch (e) {
      // ignore
    }
  };

  // Admin test broadcast
  const handleTestBroadcast = async () => {
    try {
      await fetch('/api/admin/test-broadcast', { method: 'POST' });
      fetchStats();
    } catch (e) {
      // ignore
    }
  };

  // Admin register chat
  const handleRegisterChat = async (chatId: string) => {
    try {
      await fetch('/api/admin/register-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId }),
      });
      fetchStats();
    } catch (e) {
      // ignore
    }
  };

  const isUrdu = language === 'ur';

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative selection:bg-emerald-500 selection:text-slate-950">
      {/* Dynamic Looping Background Simulation */}
      <BackgroundEffect />

      {/* Top Bar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-[#060b13]/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark with custom logo */}
          <button
            onClick={() => setActiveView(verification.status === 'accepted' ? 'dashboard' : 'flow')}
            className="flex items-center gap-2.5 text-left text-white whitespace-nowrap shrink-0 group cursor-pointer"
          >
            <CyborgGoldLogo size="sm" glow={true} />
            <span className="text-base sm:text-lg font-black tracking-tight text-white group-hover:text-amber-300 transition-colors">
              NextGen Bot Premium
            </span>
          </button>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setActiveView('flow')}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'flow' ? 'text-emerald-400' : ''
              }`}
            >
              {isUrdu ? 'مراحل اور تصدیق' : '5-Step Verification'}
            </button>
            <button
              onClick={() => {
                if (verification.status === 'accepted' && verification.isLifetimeActive) {
                  setActiveView('dashboard');
                } else if (verification.status === 'rejected') {
                  alert(isUrdu ? 'آپ کی درخواست ایڈمن کی طرف سے مسترد کر دی گئی ہے۔' : 'Your verification was rejected by the Telegram Admin.');
                } else {
                  alert(isUrdu ? 'ڈیش بورڈ کھولنے سے پہلے برائے مہربانی اپنا ٹریڈر آئی ڈی تصدیق کروائیں۔' : 'Please submit and verify your Quotex Trader ID first.');
                }
              }}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 ${
                activeView === 'dashboard' ? 'text-emerald-400' : ''
              }`}
            >
              {isUrdu ? 'نیکسٹ جن سگنل انجن' : 'Signal Engine'}
            </button>
            <a
              href={QUOTEX_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 text-slate-300"
            >
              <span>{isUrdu ? 'کوٹیکس بروکر لنک' : 'Quotex Official'}</span>
              <ExternalLink className="w-3 h-3 text-emerald-400" />
            </a>
          </nav>

          {/* Zone 3: Language Selector & Primary Action */}
          <div className="flex items-center gap-2.5 shrink-0">
            <LanguageSelector
              currentLanguage={language}
              onLanguageChange={(l) => setLanguage(l)}
            />

            {verification.status === 'accepted' && verification.isLifetimeActive && (
              <button
                onClick={() => setActiveView(activeView === 'flow' ? 'dashboard' : 'flow')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
              >
                <span>{activeView === 'flow' ? 'Open Dashboard' : 'Verification Steps'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Router - Strict Access Control */}
      <main className="flex-1 py-4">
        {activeView === 'dashboard' && verification.status === 'accepted' && verification.isLifetimeActive ? (
          <SignalEngine
            language={language}
            traderId={verification.traderId || 'DEMO-78601'}
            onBackToVerification={() => setActiveView('flow')}
          />
        ) : (
          <RegistrationFlow
            language={language}
            verification={verification}
            onVerifySubmit={handleVerifySubmit}
            onStartDashboard={() => {
              if (verification.status === 'accepted' && verification.isLifetimeActive) {
                setActiveView('dashboard');
              }
            }}
            onResetTrader={handleResetTrader}
            isSubmitting={isSubmitting}
            errorMessage={submissionError}
          />
        )}
      </main>

      {/* Footer - Clean public UI with no visible admin panel buttons */}
      <footer className="border-t border-slate-900 bg-[#04070e]/95 py-6 text-xs text-slate-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Quotex NextGen Bot Premium</span>
            <span>·</span>
            <span>Affiliate ID: lid=2400438</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <a
              href={QUOTEX_REFERRAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Quotex Official Sign Up</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </footer>

      {/* Telegram Admin Modal (Accessible only via secret dev parameter or shortcut, invisible to public) */}
      <TelegramAdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        stats={adminStats}
        onRefresh={fetchStats}
        onDecision={handleAdminDecision}
        onTestBroadcast={handleTestBroadcast}
        onRegisterChat={handleRegisterChat}
      />
    </div>
  );
}
