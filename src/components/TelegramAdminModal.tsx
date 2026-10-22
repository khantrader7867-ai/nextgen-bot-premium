import React, { useState } from 'react';
import {
  X,
  Bot,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  RefreshCw,
  ExternalLink,
  Code2,
  Check,
  Copy,
  AlertCircle
} from 'lucide-react';
import { AdminStats } from '../types';
import { TELEGRAM_BOT_TOKEN, QUOTEX_REFERRAL_URL } from '../constants/translations';

interface TelegramAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: AdminStats;
  onRefresh: () => void;
  onDecision: (traderId: string, decision: 'accepted' | 'rejected', reason?: string) => Promise<void>;
  onTestBroadcast: () => Promise<void>;
  onRegisterChat: (chatId: string) => Promise<void>;
}

export const TelegramAdminModal: React.FC<TelegramAdminModalProps> = ({
  isOpen,
  onClose,
  stats,
  onRefresh,
  onDecision,
  onTestBroadcast,
  onRegisterChat,
}) => {
  const [activeTab, setActiveTab] = useState<'requests' | 'stats' | 'python' | 'setup'>('requests');
  const [chatIdInput, setChatIdInput] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [copiedPython, setCopiedPython] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAction = async (traderId: string, decision: 'accepted' | 'rejected') => {
    setActionLoadingId(traderId);
    try {
      await onDecision(traderId, decision);
      setFeedbackMsg(`Trader ID ${traderId} marked as ${decision.toUpperCase()}`);
      setTimeout(() => setFeedbackMsg(null), 3000);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRegisterChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatIdInput.trim()) return;
    await onRegisterChat(chatIdInput.trim());
    setChatIdInput('');
    setFeedbackMsg('Admin Chat ID linked! A confirmation message was sent via Telegram.');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const pythonScript = `#!/usr/bin/env python3
# Quotex NextGen Bot - Telegram Admin Bot Daemon
# Token: ${TELEGRAM_BOT_TOKEN}
# Referral: ${QUOTEX_REFERRAL_URL}

import urllib.request, json, time, os

BOT_TOKEN = "${TELEGRAM_BOT_TOKEN}"
REFERRAL_URL = "${QUOTEX_REFERRAL_URL}"

def api_call(method, payload=None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/{method}"
    data = json.dumps(payload).encode('utf-8') if payload else None
    req = urllib.request.Request(url, data=data, headers={'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

print("Admin Bot starting for Quotex NextGen...")
print(api_call("getMe"))
`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#090f1d] border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Telegram Admin Control Panel</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  LIVE ENGINE
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Bot Token: {TELEGRAM_BOT_TOKEN.substring(0, 12)}...{TELEGRAM_BOT_TOKEN.substring(TELEGRAM_BOT_TOKEN.length - 6)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-slate-800 bg-[#070c17]">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#090f1d] text-sky-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Incoming Verifications ({stats.totalPending})</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'stats'
                ? 'bg-[#090f1d] text-sky-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Overall Statistics</span>
          </button>

          <button
            onClick={() => setActiveTab('setup')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'setup'
                ? 'bg-[#090f1d] text-sky-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>Telegram Link</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'python'
                ? 'bg-[#090f1d] text-sky-400 border-t border-x border-slate-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Python Script</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
          {feedbackMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
          )}

          {/* TAB 1: Incoming Requests Queue with [Accept] & [Reject] buttons */}
          {activeTab === 'requests' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-400">
                  Clicking [Accept] or [Reject] below mirrors the real Telegram Bot inline keyboard clicks.
                </span>
                <button
                  onClick={onTestBroadcast}
                  className="px-3 py-1.5 text-xs font-semibold bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Test Request</span>
                </button>
              </div>

              {(!stats.requests || stats.requests.length === 0) ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  No submissions yet. Submit a Trader ID on the home page or click &quot;Send Test Request&quot; above.
                </div>
              ) : (
                <div className="space-y-3">
                  {stats.requests.map((req) => (
                    <div
                      key={req.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-white text-sm">
                            ID: {req.traderId}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                              req.status === 'accepted'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {req.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Submitted: {new Date(req.submittedAt).toLocaleTimeString()}
                          {req.decisionReason && ` · ${req.decisionReason}`}
                        </div>
                      </div>

                      {/* Interactive Accept / Reject Actions */}
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        {req.status !== 'accepted' && (
                          <button
                            onClick={() => handleAction(req.traderId, 'accepted')}
                            disabled={actionLoadingId === req.traderId}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Accept</span>
                          </button>
                        )}

                        {req.status !== 'rejected' && (
                          <button
                            onClick={() => handleAction(req.traderId, 'rejected')}
                            disabled={actionLoadingId === req.traderId}
                            className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-red-600/80 hover:bg-red-600 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Overall Statistics */}
          {activeTab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Total Accepted</span>
                  <span className="text-3xl font-black font-mono text-emerald-400 tabular-nums">
                    {stats.totalAccepted}
                  </span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Total Rejected</span>
                  <span className="text-3xl font-black font-mono text-red-400 tabular-nums">
                    {stats.totalRejected}
                  </span>
                </div>
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center">
                  <span className="text-xs text-slate-400 block mb-1">Pending Verifications</span>
                  <span className="text-3xl font-black font-mono text-amber-400 tabular-nums">
                    {stats.totalPending}
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Total Submissions Processed:</span>
                  <span className="font-mono font-bold text-white">
                    {stats.totalAccepted + stats.totalRejected + stats.totalPending}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-850">
                  <span className="text-slate-400">Approval Ratio:</span>
                  <span className="font-mono font-bold text-emerald-400">
                    {stats.totalAccepted + stats.totalRejected > 0
                      ? `${((stats.totalAccepted / (stats.totalAccepted + stats.totalRejected)) * 100).toFixed(1)}%`
                      : '100%'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Connected Admin Chats:</span>
                  <span className="font-mono text-slate-200">
                    {stats.adminChatIds?.length || 0} active
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Telegram Setup & Chat Link */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-4 text-xs text-sky-300 leading-relaxed">
                <strong>How to receive instant alerts on your Telegram phone / PC:</strong>
                <ol className="list-decimal pl-4 mt-2 space-y-1 text-slate-300">
                  <li>Open Telegram and search for your bot or send <code>/start</code> to the bot.</li>
                  <li>Alternatively, paste your Telegram numeric Chat ID below to link it immediately.</li>
                  <li>Whenever a trader submits their ID on the web, you will receive an instant push notification with interactive <b>[Accept]</b> and <b>[Reject]</b> buttons!</li>
                </ol>
              </div>

              <form onSubmit={handleRegisterChat} className="flex gap-2">
                <input
                  type="text"
                  value={chatIdInput}
                  onChange={(e) => setChatIdInput(e.target.value)}
                  placeholder="Enter Telegram Chat ID (e.g. 123456789)"
                  className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Link Chat</span>
                </button>
              </form>

              {stats.adminChatIds && stats.adminChatIds.length > 0 && (
                <div className="text-xs">
                  <span className="text-slate-400 block mb-1">Registered Chat IDs:</span>
                  <div className="flex flex-wrap gap-1.5 font-mono">
                    {stats.adminChatIds.map((c) => (
                      <span key={c} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Standalone Python Script */}
          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  Created at project root: <code>telegram_admin_bot.py</code>
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(pythonScript);
                    setCopiedPython(true);
                    setTimeout(() => setCopiedPython(false), 2000);
                  }}
                  className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 flex items-center gap-1"
                >
                  {copiedPython ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedPython ? 'Copied' : 'Copy Python Code'}</span>
                </button>
              </div>

              <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-60 leading-relaxed">
                {pythonScript}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
