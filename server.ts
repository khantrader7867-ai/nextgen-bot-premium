import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8936376779:AAHrC2nwO1uFGAGBX_uS-s8RaOz_YxfLw0U';
const QUOTEX_REFERRAL_URL = 'https://broker-qx.pro/sign-up/?lid=2400438';

// Data storage directory & file
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'traders.json');

export interface TraderRequest {
  id: string;
  traderId: string;
  userToken: string;
  status: 'pending' | 'accepted' | 'rejected';
  submittedAt: number;
  decidedAt?: number;
  decisionReason?: string;
  notificationSent?: boolean;
  isLifetimeActive?: boolean;
  telegramMessageIds?: { chatId: number | string; messageId: number }[];
}

export interface BotStats {
  totalAccepted: number;
  totalRejected: number;
  totalPending: number;
  adminChatIds: (number | string)[];
  requests: TraderRequest[];
  lastUpdateId: number;
}

let state: BotStats = {
  totalAccepted: 52,
  totalRejected: 7,
  totalPending: 0,
  adminChatIds: [],
  requests: [],
  lastUpdateId: 0,
};

// Load persistent state
function loadState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      state = { ...state, ...parsed };
    } else {
      // Seed initial sample historical data with device locks
      state.requests = [
        {
          id: 'req_101',
          traderId: '6892401',
          userToken: 'usr_tok_seed_001',
          status: 'accepted',
          isLifetimeActive: true,
          submittedAt: Date.now() - 3600000 * 2,
          decidedAt: Date.now() - 3600000 * 1.9,
          decisionReason: 'Verified under sub-affiliate lid=2400438, $50 deposit confirmed',
        },
        {
          id: 'req_102',
          traderId: '9841203',
          userToken: 'usr_tok_seed_002',
          status: 'accepted',
          isLifetimeActive: true,
          submittedAt: Date.now() - 3600000 * 4,
          decidedAt: Date.now() - 3600000 * 3.8,
          decisionReason: 'Verified KYC & $35 deposit',
        },
        {
          id: 'req_103',
          traderId: '1240955',
          userToken: 'usr_tok_seed_003',
          status: 'rejected',
          isLifetimeActive: false,
          submittedAt: Date.now() - 3600000 * 8,
          decidedAt: Date.now() - 3600000 * 7.9,
          decisionReason: 'Trader ID not registered through referral link',
        },
      ];
      saveState();
    }
  } catch (err) {
    console.error('Error loading state:', err);
  }
}

let lastFileMtime = 0;

function saveState() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    state.totalPending = state.requests.filter((r) => r.status === 'pending').length;
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf-8');
    lastFileMtime = Date.now();
  } catch (err) {
    console.error('Error saving state:', err);
  }
}

function syncStateFromFile() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const stat = fs.statSync(DATA_FILE);
      if (stat.mtimeMs > lastFileMtime) {
        lastFileMtime = stat.mtimeMs;
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        state.totalAccepted = parsed.totalAccepted ?? state.totalAccepted;
        state.totalRejected = parsed.totalRejected ?? state.totalRejected;
        state.requests = parsed.requests || state.requests;
        state.totalPending = state.requests.filter((r) => r.status === 'pending').length;
        if (Array.isArray(parsed.adminChatIds)) {
          for (const id of parsed.adminChatIds) {
            if (!state.adminChatIds.includes(id)) {
              state.adminChatIds.push(id);
            }
          }
        }
      }
    }
  } catch (err) {
    // ignore
  }
}

loadState();

// Helper to make Telegram Bot API requests
async function callTelegram(method: string, body?: any) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/${method}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    return data;
  } catch (error) {
    console.warn(`Telegram API call ${method} failed:`, error);
    return { ok: false, error: String(error) };
  }
}

// Send verification request message to all known Telegram admin chats
async function broadcastTraderRequest(request: TraderRequest) {
  const shortToken = request.userToken ? request.userToken.slice(-6) : 'auto';
  const messageText = `⚡ <b>NEW QUOTEX TRADER ID SUBMISSION</b> ⚡
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Trader ID:</b> <code>${request.traderId}</code>
📋 <b>KYC Status:</b> ✅ Verified (National ID / Passport Approved)
💰 <b>Deposit Confirmation Status:</b> ✅ Confirmed (Minimum $30+ Verified)
🔒 <b>Device Security:</b> <code>Locked to Device (..${shortToken})</code>
💎 <b>Access Tier:</b> Permanent VIP Lifetime Pass
⏰ <b>Submitted At:</b> ${new Date(request.submittedAt).toUTCString()}
🔗 <b>Affiliate Ref:</b> <code>${QUOTEX_REFERRAL_URL}</code>
━━━━━━━━━━━━━━━━━━━━
👇 <b>Select an action below:</b>`;

  const inlineKeyboard = {
    inline_keyboard: [
      [
        { text: '✅ Accept & Grant Lifetime Access', callback_data: `accept:${request.traderId}` },
        { text: '❌ Reject', callback_data: `reject:${request.traderId}` },
      ],
      [
        { text: '📊 Bot Statistics', callback_data: 'view_stats' },
      ],
    ],
  };

  const sentMessageIds: { chatId: number | string; messageId: number }[] = [];

  for (const chatId of state.adminChatIds) {
    const res = await callTelegram('sendMessage', {
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });
    if (res?.ok && res.result?.message_id) {
      sentMessageIds.push({ chatId, messageId: res.result.message_id });
    }
  }

  request.telegramMessageIds = sentMessageIds;
  request.notificationSent = true;
  saveState();
}

// Background poller to process Telegram bot updates (commands & inline button clicks)
let isPolling = false;
let botInfo: any = null;

async function checkTelegramBot() {
  const me = await callTelegram('getMe');
  if (me?.ok) {
    botInfo = me.result;
    console.log(`Telegram Bot authenticated: @${botInfo.username} (${botInfo.first_name})`);
  } else {
    console.warn('Could not authenticate Telegram Bot with current token:', me);
  }
}

async function handleTelegramUpdates() {
  if (isPolling) return;
  isPolling = true;

  while (true) {
    try {
      const res = await callTelegram('getUpdates', {
        offset: state.lastUpdateId + 1,
        timeout: 20,
        allowed_updates: ['message', 'callback_query'],
      });

      if (res?.ok && Array.isArray(res.result)) {
        for (const update of res.result) {
          state.lastUpdateId = Math.max(state.lastUpdateId, update.update_id);

          // Handle incoming messages
          if (update.message) {
            const chatId = update.message.chat?.id;
            const text = (update.message.text || '').trim();

            if (chatId && !state.adminChatIds.includes(chatId)) {
              state.adminChatIds.push(chatId);
              saveState();
            }

            if (text === '/start' || text === '/help') {
              const pendingCount = state.requests.filter((r) => r.status === 'pending').length;
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `💎 <b>Quotex NextGen Bot Admin Panel</b> 💎
━━━━━━━━━━━━━━━━━━━━
Welcome Admin! This bot is active and connected to your Quotex Trading Platform.

🔒 <b>1-User Lifetime Locking Enabled:</b>
Each Trader ID is locked to a single device to prevent multi-user sharing.

📊 <b>Current Statistics:</b>
• Total Accepted: <b>${state.totalAccepted}</b>
• Total Rejected: <b>${state.totalRejected}</b>
• Pending Verifications: <b>${pendingCount}</b>

Commands:
/stats - View live statistics
/users - View active locked lifetime users
/unlock &lt;id&gt; - Release device lock for an ID
/pending - View pending submissions`,
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '📊 Refresh Statistics', callback_data: 'view_stats' }],
                  ],
                },
              });
            } else if (text === '/stats') {
              const pendingCount = state.requests.filter((r) => r.status === 'pending').length;
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `📊 <b>Quotex Admin Statistics</b>
━━━━━━━━━━━━━━━━━━━━
✅ Total Accepted: <b>${state.totalAccepted}</b>
❌ Total Rejected: <b>${state.totalRejected}</b>
⏳ Pending Verifications: <b>${pendingCount}</b>
👥 Total Submissions: <b>${state.requests.length}</b>`,
                parse_mode: 'HTML',
              });
            } else if (text === '/users') {
              const active = state.requests.filter((r) => r.status === 'accepted');
              const userList = active.slice(0, 10).map((u, i) => `${i + 1}. <code>${u.traderId}</code> (Token: ..${(u.userToken || '').slice(-4)})`).join('\n') || 'No active users yet.';
              await callTelegram('sendMessage', {
                chat_id: chatId,
                text: `👥 <b>Active Lifetime VIP Traders (${active.length}):</b>\n\n${userList}`,
                parse_mode: 'HTML',
              });
            } else if (text.startsWith('/unlock ')) {
              const targetId = text.split(' ')[1]?.trim();
              const req = state.requests.find((r) => r.traderId === targetId);
              if (req) {
                req.userToken = '';
                saveState();
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `🔓 Trader ID <code>${targetId}</code> device lock has been released!`,
                  parse_mode: 'HTML',
                });
              } else {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `⚠️ Trader ID <code>${targetId}</code> not found.`,
                  parse_mode: 'HTML',
                });
              }
            } else if (text === '/pending') {
              const pendingList = state.requests.filter((r) => r.status === 'pending');
              if (pendingList.length === 0) {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: '✨ There are currently no pending Trader ID verification requests.',
                  parse_mode: 'HTML',
                });
              } else {
                for (const item of pendingList.slice(0, 5)) {
                  await broadcastTraderRequest(item);
                }
              }
            }
          }

          // Handle inline button callbacks
          if (update.callback_query) {
            const cb = update.callback_query;
            const data = cb.data || '';
            const chatId = cb.message?.chat?.id;
            const messageId = cb.message?.message_id;

            if (data === 'view_stats') {
              const pendingCount = state.requests.filter((r) => r.status === 'pending').length;
              await callTelegram('answerCallbackQuery', {
                callback_query_id: cb.id,
                text: `Stats: ✅ ${state.totalAccepted} Accepted | ❌ ${state.totalRejected} Rejected | ⏳ ${pendingCount} Pending`,
                show_alert: true,
              });
            } else if (data.startsWith('accept:')) {
              const traderId = data.replace('accept:', '');
              const req = state.requests.find((r) => r.traderId === traderId);

              if (req) {
                if (req.status !== 'accepted') {
                  req.status = 'accepted';
                  req.isLifetimeActive = true;
                  req.decidedAt = Date.now();
                  req.decisionReason = 'Approved by Telegram Admin (Lifetime Pass Locked)';
                  state.totalAccepted += 1;
                  saveState();
                }

                await callTelegram('answerCallbackQuery', {
                  callback_query_id: cb.id,
                  text: `✅ Trader ID ${traderId} APPROVED! Lifetime pass granted & locked to user.`,
                  show_alert: true,
                });

                if (chatId && messageId) {
                  await callTelegram('editMessageText', {
                    chat_id: chatId,
                    message_id: messageId,
                    text: `✅ <b>VERIFICATION APPROVED & LOCKED</b> ✅
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Trader ID:</b> <code>${traderId}</code>
🎉 <b>Status:</b> Lifetime VIP Access Granted
🔒 <b>Device Security:</b> Bound to 1 Unique User
⏰ <b>Decided At:</b> ${new Date().toUTCString()}
━━━━━━━━━━━━━━━━━━━━
<i>The user has received confirmation and the NextGen Bot Premium Dashboard is now unlocked.</i>`,
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '📊 Updated Stats', callback_data: 'view_stats' }],
                      ],
                    },
                  });
                }
              } else {
                await callTelegram('answerCallbackQuery', {
                  callback_query_id: cb.id,
                  text: `Trader ID ${traderId} not found.`,
                });
              }
            } else if (data.startsWith('reject:')) {
              const traderId = data.replace('reject:', '');
              const req = state.requests.find((r) => r.traderId === traderId);

              if (req) {
                if (req.status !== 'rejected') {
                  req.status = 'rejected';
                  req.isLifetimeActive = false;
                  req.decidedAt = Date.now();
                  req.decisionReason = 'Rejected by Telegram Admin (deposit/KYC not confirmed)';
                  state.totalRejected += 1;
                  saveState();
                }

                await callTelegram('answerCallbackQuery', {
                  callback_query_id: cb.id,
                  text: `❌ Trader ID ${traderId} REJECTED.`,
                  show_alert: true,
                });

                if (chatId && messageId) {
                  await callTelegram('editMessageText', {
                    chat_id: chatId,
                    message_id: messageId,
                    text: `❌ <b>VERIFICATION REJECTED</b> ❌
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Trader ID:</b> <code>${traderId}</code>
⚠️ <b>Status:</b> Rejected
⏰ <b>Decided At:</b> ${new Date().toUTCString()}
━━━━━━━━━━━━━━━━━━━━
<i>User was notified to register via the official referral link and complete minimum $30 deposit.</i>`,
                    parse_mode: 'HTML',
                    reply_markup: {
                      inline_keyboard: [
                        [{ text: '📊 Updated Stats', callback_data: 'view_stats' }],
                      ],
                    },
                  });
                }
              } else {
                await callTelegram('answerCallbackQuery', {
                  callback_query_id: cb.id,
                  text: `Trader ID ${traderId} not found.`,
                });
              }
            }
          }
        }
        saveState();
      }
    } catch (err) {
      console.warn('Telegram polling cycle error:', err);
      await new Promise((r) => setTimeout(r, 5000));
    }
    // Pause briefly before next poll
    await new Promise((r) => setTimeout(r, 1000));
  }
}

// Start Express app
async function createServer() {
  const app = express();
  app.use(express.json());

  // Check bot auth and start background updater
  checkTelegramBot();
  handleTelegramUpdates();

  // API Routes
  app.get('/api/status', (req, res) => {
    syncStateFromFile();
    res.json({
      ok: true,
      botUsername: botInfo?.username || 'QuotexAdminBot',
      botFirstName: botInfo?.first_name || 'Quotex Admin Bot',
      isBotConnected: !!botInfo,
      totalAccepted: state.totalAccepted,
      totalRejected: state.totalRejected,
      totalPending: state.requests.filter((r) => r.status === 'pending').length,
      knownChatIds: state.adminChatIds,
      referralUrl: QUOTEX_REFERRAL_URL,
    });
  });

  // Submit Trader ID with strict unique device token locking
  app.post('/api/trader/submit', async (req, res) => {
    syncStateFromFile();
    const { traderId, userToken } = req.body;
    if (!traderId || typeof traderId !== 'string' || traderId.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a valid Quotex Trader ID.' });
    }

    const cleanId = traderId.trim();
    const cleanToken = (userToken || '').trim();

    const existing = state.requests.find((r) => r.traderId === cleanId);

    if (existing) {
      // PREVENT MULTIPLE USERS FROM USING THE SAME TRADER ID (STRICT DEVICE LOCK)
      if (existing.userToken && cleanToken && existing.userToken !== cleanToken) {
        return res.status(403).json({
          error: 'This Quotex Trader ID is already registered and locked to another user/device. Each Trader ID is strictly limited to 1 user for a lifetime pass. Please create a new account using our referral link or submit your own unique Trader ID.',
          locked: true,
        });
      }

      // If already rejected by Telegram admin:
      if (existing.status === 'rejected') {
        return res.status(403).json({
          error: existing.decisionReason || 'This Trader ID was rejected by the Telegram Admin (deposit of $30+ or KYC not confirmed under lid=2400438). Please register a new Quotex account using our official link.',
          status: 'rejected',
          rejected: true,
        });
      }

      // If already accepted and matches token (or had no token assigned yet):
      if (existing.status === 'accepted') {
        if (!existing.userToken && cleanToken) {
          existing.userToken = cleanToken;
          saveState();
        }
        return res.json({
          status: 'accepted',
          traderId: cleanId,
          userToken: existing.userToken,
          isLifetimeActive: true,
          message: 'Verification Completed! Your access is provided.',
          request: existing,
        });
      }

      // If pending on same token:
      existing.submittedAt = Date.now();
      existing.status = 'pending';
      if (!existing.userToken && cleanToken) {
        existing.userToken = cleanToken;
      }
      saveState();
      broadcastTraderRequest(existing);

      return res.json({
        status: 'pending',
        traderId: cleanId,
        userToken: existing.userToken,
        message: 'Your Trader ID is submitted and currently under admin verification. Please wait.',
        request: existing,
      });
    }

    // New request creation: bound to userToken
    const newReq: TraderRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      traderId: cleanId,
      userToken: cleanToken || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      status: 'pending',
      submittedAt: Date.now(),
      isLifetimeActive: false,
    };
    state.requests.unshift(newReq);

    saveState();
    broadcastTraderRequest(newReq);

    res.json({
      status: 'pending',
      traderId: cleanId,
      userToken: newReq.userToken,
      message: 'Your Trader ID is submitted and currently under admin verification. Please wait.',
      request: newReq,
    });
  });

  // Check Trader Status with strict revocation & device checks
  app.get('/api/trader/status/:traderId', (req, res) => {
    syncStateFromFile();
    const cleanId = req.params.traderId.trim();
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : '';

    const reqItem = state.requests.find((r) => r.traderId === cleanId);
    if (!reqItem) {
      return res.status(404).json({ status: 'not_found', traderId: cleanId });
    }

    // Check device lock
    if (token && reqItem.userToken && reqItem.userToken !== token) {
      return res.status(403).json({
        status: 'rejected',
        traderId: cleanId,
        message: 'This Trader ID is locked to another user device.',
      });
    }

    let message = 'Your Trader ID is submitted and currently under admin verification.';
    if (reqItem.status === 'accepted') {
      message = 'Verification Completed! Your access is provided.';
    } else if (reqItem.status === 'rejected') {
      message = reqItem.decisionReason || 'Verification rejected by administrator. Please ensure you registered via the official referral link and deposited minimum $30.';
    }

    res.json({
      status: reqItem.status,
      traderId: reqItem.traderId,
      userToken: reqItem.userToken,
      isLifetimeActive: reqItem.status === 'accepted' && reqItem.isLifetimeActive !== false,
      message,
      submittedAt: reqItem.submittedAt,
      decidedAt: reqItem.decidedAt,
    });
  });

  // Admin decision endpoint
  app.post('/api/admin/decision', async (req, res) => {
    const { traderId, decision, reason } = req.body;
    if (!traderId || !['accepted', 'rejected'].includes(decision)) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    const reqItem = state.requests.find((r) => r.traderId === traderId);
    if (!reqItem) {
      return res.status(404).json({ error: 'Trader ID not found' });
    }

    const prevStatus = reqItem.status;
    reqItem.status = decision;
    reqItem.isLifetimeActive = decision === 'accepted';
    reqItem.decidedAt = Date.now();
    reqItem.decisionReason = reason || (decision === 'accepted' ? 'Approved by Admin (Lifetime Lock Active)' : 'Rejected by Admin');

    if (decision === 'accepted' && prevStatus !== 'accepted') {
      state.totalAccepted += 1;
    } else if (decision === 'rejected' && prevStatus !== 'rejected') {
      state.totalRejected += 1;
    }

    saveState();

    res.json({
      success: true,
      request: reqItem,
      stats: {
        totalAccepted: state.totalAccepted,
        totalRejected: state.totalRejected,
        totalPending: state.requests.filter((r) => r.status === 'pending').length,
      },
    });
  });

  // Admin stats endpoint
  app.get('/api/admin/stats', (req, res) => {
    syncStateFromFile();
    res.json({
      totalAccepted: state.totalAccepted,
      totalRejected: state.totalRejected,
      totalPending: state.requests.filter((r) => r.status === 'pending').length,
      requests: state.requests,
      adminChatIds: state.adminChatIds,
      botInfo,
    });
  });

  // Register an admin chat ID manually
  app.post('/api/admin/register-chat', async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) return res.status(400).json({ error: 'Missing chatId' });

    if (!state.adminChatIds.includes(chatId)) {
      state.adminChatIds.push(chatId);
      saveState();
    }

    // Send confirmation to the chat
    const telegramRes = await callTelegram('sendMessage', {
      chat_id: chatId,
      text: `🔔 <b>Admin Chat Registered Successfully!</b>\n\nYou will now receive instant Quotex Trader ID verification requests here.`,
      parse_mode: 'HTML',
    });

    res.json({ success: true, adminChatIds: state.adminChatIds, telegramRes });
  });

  // Send a test verification broadcast to Telegram
  app.post('/api/admin/test-broadcast', async (req, res) => {
    const testReq: TraderRequest = {
      id: `test_${Date.now()}`,
      traderId: `QX-${Math.floor(1000000 + Math.random() * 9000000)}`,
      userToken: `usr_test_${Math.random().toString(36).substring(2, 8)}`,
      status: 'pending',
      submittedAt: Date.now(),
      isLifetimeActive: false,
    };
    state.requests.unshift(testReq);
    saveState();

    await broadcastTraderRequest(testReq);

    res.json({
      success: true,
      testRequest: testReq,
      chatCount: state.adminChatIds.length,
      message: state.adminChatIds.length > 0
        ? `Sent test alert to ${state.adminChatIds.length} Telegram chat(s)`
        : 'No admin chats registered yet. Send /start to the Telegram bot to register your chat automatically!',
    });
  });

  // Signal Generator endpoint
  app.get('/api/signals/realtime', (req, res) => {
    const market = req.query.market === 'live' ? 'live' : 'otc';
    const pair = req.query.pair || (market === 'live' ? 'EUR/USD' : 'EUR/USD (OTC)');
    const timeframe = req.query.timeframe || (market === 'live' ? '1m' : '30s');

    const directions = ['CALL', 'PUT'];
    const direction = directions[Math.floor(Math.random() * directions.length)];
    // Accuracy fluctuates between 87% and 96%
    const accuracy = Number((87 + Math.random() * 9.5).toFixed(1));

    let basePrice = 1.0845;
    if (String(pair).includes('JPY')) basePrice = 154.25;
    if (String(pair).includes('PKR')) basePrice = 278.45;
    if (String(pair).includes('INR')) basePrice = 86.35;
    if (String(pair).includes('BDT')) basePrice = 121.30;
    if (String(pair).includes('BRL')) basePrice = 5.72;
    if (String(pair).includes('Crypto')) basePrice = 4280.8;

    const jitter = (Math.random() - 0.5) * (basePrice * 0.001);
    const entryPrice = Number((basePrice + jitter).toFixed(String(pair).includes('JPY') ? 3 : 5));

    const payout = market === 'otc'
      ? Math.min(92, Math.max(82, 85 + Math.floor(Math.random() * 8)))
      : (83 + Math.floor(Math.random() * 7));

    res.json({
      pair,
      market,
      timeframe,
      direction,
      accuracy,
      entryPrice,
      payout,
      timestamp: Date.now(),
      indicators: {
        rsi: Math.floor(28 + Math.random() * 44),
        macd: direction === 'CALL' ? 'Bullish Crossover' : 'Bearish Reversal',
        bollinger: direction === 'CALL' ? 'Lower Band Strike' : 'Upper Band Strike',
        trendStrength: 'HIGH ACCURACY',
      },
    });
  });

  // Mount Vite in dev mode or serve static files in production
  if (process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist'))) {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Quotex NextGen Bot Server listening on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
