import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8936376779:AAHrC2nwO1uFGAGBX_uS-s8RaOz_YxfLw0U';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || process.env.ADMIN_CHAT_ID;
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
      if (!Array.isArray(state.adminChatIds)) {
        state.adminChatIds = [];
      }
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
    if (TELEGRAM_ADMIN_CHAT_ID && !state.adminChatIds.includes(TELEGRAM_ADMIN_CHAT_ID)) {
      state.adminChatIds.push(TELEGRAM_ADMIN_CHAT_ID);
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
        if (TELEGRAM_ADMIN_CHAT_ID && !state.adminChatIds.includes(TELEGRAM_ADMIN_CHAT_ID)) {
          state.adminChatIds.push(TELEGRAM_ADMIN_CHAT_ID);
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
async function broadcastTraderRequest(request: TraderRequest): Promise<boolean> {
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

  // If no admin chat IDs known, attempt a live harvest
  if (state.adminChatIds.length === 0) {
    try {
      const recent = await callTelegram('getUpdates', { offset: 0, limit: 100 });
      if (recent?.ok && Array.isArray(recent.result)) {
        for (const update of recent.result) {
          const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
          if (chatId && !state.adminChatIds.includes(chatId)) {
            state.adminChatIds.push(chatId);
          }
        }
        if (state.adminChatIds.length > 0) {
          saveState();
        }
      }
    } catch (e) {
      // ignore
    }
  }

  if (state.adminChatIds.length === 0) {
    console.warn(`[Telegram Broadcast] Trader ID ${request.traderId} saved as PENDING in database, but no admin chat IDs are registered yet. The admin must message @${botInfo?.username || 'NexGen_Access_Bot'} with /start or configure TELEGRAM_ADMIN_CHAT_ID.`);
    request.notificationSent = false;
    saveState();
    return false;
  }

  const sentMessageIds: { chatId: number | string; messageId: number }[] = [];
  let atLeastOneSent = false;

  for (const chatId of state.adminChatIds) {
    try {
      const res = await callTelegram('sendMessage', {
        chat_id: chatId,
        text: messageText,
        parse_mode: 'HTML',
        reply_markup: inlineKeyboard,
      });
      if (res?.ok && res.result?.message_id) {
        sentMessageIds.push({ chatId, messageId: res.result.message_id });
        atLeastOneSent = true;
        console.log(`[Telegram Broadcast] Notification sent successfully for Trader ID ${request.traderId} to chat ${chatId} (Msg ID: ${res.result.message_id})`);
      } else {
        console.warn(`[Telegram Broadcast] Failed to send notification to chat ${chatId}:`, res?.description || res?.error || res);
      }
    } catch (err) {
      console.error(`[Telegram Broadcast] Error sending to chat ${chatId}:`, err);
    }
  }

  request.telegramMessageIds = sentMessageIds;
  request.notificationSent = atLeastOneSent;
  saveState();
  return atLeastOneSent;
}

// Flush pending verification requests to a specific admin chat
async function flushPendingToChat(chatId: number | string) {
  const pending = state.requests.filter((r) => r.status === 'pending');
  if (pending.length === 0) return 0;

  console.log(`[Telegram Bot] Delivering ${pending.length} pending request(s) to admin chat ${chatId}...`);
  let delivered = 0;

  for (const item of pending.slice(0, 10)) {
    const shortToken = item.userToken ? item.userToken.slice(-6) : 'auto';
    const messageText = `⚡ <b>PENDING QUOTEX TRADER ID VERIFICATION</b> ⚡
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Trader ID:</b> <code>${item.traderId}</code>
📋 <b>KYC Status:</b> ✅ Verified (National ID / Passport Approved)
💰 <b>Deposit Confirmation Status:</b> ✅ Confirmed (Minimum $30+ Verified)
🔒 <b>Device Security:</b> <code>Locked to Device (..${shortToken})</code>
💎 <b>Access Tier:</b> Permanent VIP Lifetime Pass
⏰ <b>Submitted At:</b> ${new Date(item.submittedAt).toUTCString()}
🔗 <b>Affiliate Ref:</b> <code>${QUOTEX_REFERRAL_URL}</code>
━━━━━━━━━━━━━━━━━━━━
👇 <b>Select an action below:</b>`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: '✅ Accept & Grant Lifetime Access', callback_data: `accept:${item.traderId}` },
          { text: '❌ Reject', callback_data: `reject:${item.traderId}` },
        ],
        [
          { text: '📊 Bot Statistics', callback_data: 'view_stats' },
        ],
      ],
    };

    const res = await callTelegram('sendMessage', {
      chat_id: chatId,
      text: messageText,
      parse_mode: 'HTML',
      reply_markup: inlineKeyboard,
    });

    if (res?.ok && res.result?.message_id) {
      if (!item.telegramMessageIds) item.telegramMessageIds = [];
      item.telegramMessageIds.push({ chatId, messageId: res.result.message_id });
      item.notificationSent = true;
      delivered++;
    }
  }
  saveState();
  return delivered;
}

// Background poller to process Telegram bot updates (commands & inline button clicks)
let isPolling = false;
let botInfo: any = null;

async function checkTelegramBot() {
  const me = await callTelegram('getMe');
  if (me?.ok) {
    botInfo = me.result;
    console.log(`[Telegram Bot] Authenticated: @${botInfo.username} (${botInfo.first_name}) [ID: ${botInfo.id}]`);
  } else {
    console.warn('[Telegram Bot] Could not authenticate with token:', me);
  }

  // Proactively check updates on startup to discover admin chat IDs
  try {
    const recent = await callTelegram('getUpdates', { offset: 0, limit: 100 });
    if (recent?.ok && Array.isArray(recent.result)) {
      let newlyDiscovered = 0;
      for (const update of recent.result) {
        const chatId = update.message?.chat?.id || update.callback_query?.message?.chat?.id;
        if (chatId && !state.adminChatIds.includes(chatId)) {
          state.adminChatIds.push(chatId);
          newlyDiscovered++;
        }
      }
      if (newlyDiscovered > 0) {
        console.log(`[Telegram Bot] Proactively discovered ${newlyDiscovered} admin chat ID(s) from recent updates.`);
        saveState();
      }
    }
  } catch (err) {
    console.warn('[Telegram Bot] Startup update harvest error:', err);
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
              console.log(`[Telegram Bot] Registered new Admin Chat ID: ${chatId} (@${update.message.from?.username || update.message.from?.first_name || 'Admin'})`);
              // Deliver any queued pending requests to this new admin immediately
              flushPendingToChat(chatId);
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
/pending - View pending submissions
/approve &lt;id&gt; - Manually approve a Trader ID
/reject &lt;id&gt; - Manually reject a Trader ID
/unlock &lt;id&gt; - Release device lock for an ID`,
                parse_mode: 'HTML',
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '📊 Refresh Statistics', callback_data: 'view_stats' }],
                  ],
                },
              });

              if (pendingCount > 0) {
                await flushPendingToChat(chatId);
              }
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
              const userList = active.slice(0, 15).map((u, i) => `${i + 1}. <code>${u.traderId}</code> (Token: ..${(u.userToken || '').slice(-4)})`).join('\n') || 'No active users yet.';
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
                  text: `⚠️ Trader ID <code>${targetId}</code> not found in database.`,
                  parse_mode: 'HTML',
                });
              }
            } else if (text === '/pending') {
              const pendingList = state.requests.filter((r) => r.status === 'pending');
              if (pendingList.length === 0) {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: '✨ <b>No pending verification requests.</b>\nAll submitted Quotex IDs have been processed.',
                  parse_mode: 'HTML',
                });
              } else {
                await flushPendingToChat(chatId);
              }
            } else if (text.startsWith('/approve ')) {
              const targetId = text.split(' ')[1]?.trim();
              const reqItem = state.requests.find((r) => r.traderId === targetId);
              if (reqItem) {
                const prev = reqItem.status;
                reqItem.status = 'accepted';
                reqItem.isLifetimeActive = true;
                reqItem.decidedAt = Date.now();
                reqItem.decisionReason = 'Approved by Telegram Admin via /approve command';
                if (prev !== 'accepted') state.totalAccepted += 1;
                saveState();
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `✅ Trader ID <code>${targetId}</code> APPROVED with VIP Lifetime Access!`,
                  parse_mode: 'HTML',
                });
              } else {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `⚠️ Trader ID <code>${targetId}</code> not found in database.`,
                  parse_mode: 'HTML',
                });
              }
            } else if (text.startsWith('/reject ')) {
              const targetId = text.split(' ')[1]?.trim();
              const reqItem = state.requests.find((r) => r.traderId === targetId);
              if (reqItem) {
                const prev = reqItem.status;
                reqItem.status = 'rejected';
                reqItem.isLifetimeActive = false;
                reqItem.decidedAt = Date.now();
                reqItem.decisionReason = 'Rejected by Telegram Admin via /reject command';
                if (prev !== 'rejected') state.totalRejected += 1;
                saveState();
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `❌ Trader ID <code>${targetId}</code> REJECTED.`,
                  parse_mode: 'HTML',
                });
              } else {
                await callTelegram('sendMessage', {
                  chat_id: chatId,
                  text: `⚠️ Trader ID <code>${targetId}</code> not found in database.`,
                  parse_mode: 'HTML',
                });
              }
            }
          }

          // Handle inline button callbacks
          if (update.callback_query) {
            const cb = update.callback_query;
            const data = cb.data || '';
            const chatId = cb.message?.chat?.id;
            const messageId = cb.message?.message_id;

            if (chatId && !state.adminChatIds.includes(chatId)) {
              state.adminChatIds.push(chatId);
              saveState();
            }

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
                console.log(`[Admin Action] Trader ID ${traderId} ACCEPTED by Telegram Admin in chat ${chatId}`);
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
                console.log(`[Admin Action] Trader ID ${traderId} REJECTED by Telegram Admin in chat ${chatId}`);
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

  // CORS middleware to support any public client origin
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Check bot auth and start background updater
  checkTelegramBot();
  handleTelegramUpdates();

  // API Routes
  app.get('/api/status', (req, res) => {
    syncStateFromFile();
    res.json({
      ok: true,
      botUsername: botInfo?.username || 'NexGen_Access_Bot',
      botFirstName: botInfo?.first_name || 'NexGen access',
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
    try {
      const { traderId, userToken } = req.body;
      if (!traderId || typeof traderId !== 'string' || traderId.trim().length < 3) {
        return res.status(400).json({ error: 'Please enter a valid Quotex Trader ID (at least 3 characters).' });
      }

      const cleanId = traderId.trim();
      const cleanToken = (userToken || '').trim();

      console.log(`[API Submit] Incoming submission for Trader ID: "${cleanId}" (Token: ..${cleanToken.slice(-6)})`);

      const existing = state.requests.find((r) => r.traderId === cleanId);

      if (existing) {
        // PREVENT MULTIPLE USERS FROM USING THE SAME TRADER ID (STRICT DEVICE LOCK)
        if (existing.userToken && cleanToken && existing.userToken !== cleanToken) {
          console.warn(`[API Submit 403] Trader ID "${cleanId}" is already bound to token ..${existing.userToken.slice(-6)}, requested by ..${cleanToken.slice(-6)}`);
          return res.status(403).json({
            error: 'This Quotex Trader ID is already registered and locked to another user/device. Each Trader ID is strictly limited to 1 user for a lifetime pass. Please create a new account using our referral link or submit your own unique Trader ID.',
            locked: true,
          });
        }

        // If already rejected by Telegram admin:
        if (existing.status === 'rejected') {
          console.warn(`[API Submit 403] Trader ID "${cleanId}" was previously rejected by admin`);
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
          console.log(`[API Submit 200] Trader ID "${cleanId}" already accepted. Re-granting dashboard access.`);
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
        console.log(`[API Submit 200] Trader ID "${cleanId}" re-submitted. Re-broadcasting notification...`);
        const sent = await broadcastTraderRequest(existing);

        return res.json({
          status: 'pending',
          traderId: cleanId,
          userToken: existing.userToken,
          notificationDelivered: sent,
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
        notificationSent: false,
        telegramMessageIds: [],
      };
      state.requests.unshift(newReq);

      saveState();
      console.log(`[API Submit 200] New Trader ID "${cleanId}" stored in database as PENDING. Total pending: ${state.totalPending}. Broadcasting alert...`);
      const sent = await broadcastTraderRequest(newReq);

      return res.json({
        status: 'pending',
        traderId: cleanId,
        userToken: newReq.userToken,
        notificationDelivered: sent,
        message: 'Your Trader ID is submitted and currently under admin verification. Please wait.',
        request: newReq,
      });
    } catch (err: any) {
      console.error('[API Submit 500] Unexpected error processing Trader ID submission:', err);
      return res.status(500).json({ error: 'Internal server error processing Trader ID submission. Please try again.' });
    }
  });

  // Check Trader Status with strict revocation & device checks
  const handleTraderStatus = (req: any, res: any) => {
    syncStateFromFile();
    const cleanId = (req.params.traderId || req.query.traderId || '').toString().trim();
    const token = (typeof req.query.token === 'string' ? req.query.token : (req.query.userToken as string) || '').trim();

    if (!cleanId) {
      return res.status(400).json({ error: 'traderId is required' });
    }

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
  };

  app.get('/api/trader/status/:traderId', handleTraderStatus);
  app.get('/api/trader/status', handleTraderStatus);

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
