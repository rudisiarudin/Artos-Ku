import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

// Helper to format IDR
function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

// Parse Indonesian shorthand amounts (e.g. 50k, 100rb, 1.5jt, Rp 35.000, 35000)
function parseAmount(text: string): number | null {
  const clean = text.toLowerCase().replace(/rp\s*/g, '').trim();

  // Handle "jt" or "juta" (e.g. 1.5jt -> 1500000)
  const jtMatch = clean.match(/^([\d.,]+)\s*(?:jt|juta)$/);
  if (jtMatch) {
    const num = parseFloat(jtMatch[1].replace(',', '.'));
    return isNaN(num) ? null : Math.round(num * 1000000);
  }

  // Handle "k" or "rb" or "ribu" (e.g. 35k -> 35000, 50rb -> 50000)
  const kMatch = clean.match(/^([\d.,]+)\s*(?:k|rb|ribu)$/);
  if (kMatch) {
    const num = parseFloat(kMatch[1].replace(',', '.'));
    return isNaN(num) ? null : Math.round(num * 1000);
  }

  // Pure digits or formatted with dots/commas
  const numericOnly = clean.replace(/[^0-9]/g, '');
  if (numericOnly) {
    const num = parseInt(numericOnly, 10);
    return isNaN(num) || num <= 0 ? null : num;
  }

  return null;
}

// Helper to send message back to Telegram
async function sendTelegramMessage(botToken: string, chatId: string | number, text: string) {
  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
      }),
    });
    return await res.json();
  } catch (err) {
    console.error('Failed to send Telegram message:', err);
    return null;
  }
}

// Resolve user by Telegram chat ID
async function resolveUserByChatId(chatId: string | number) {
  if (!supabase) return null;
  const strId = String(chatId);

  // 1. Try finding in profiles table by telegram_chat_id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('telegram_chat_id', strId)
    .single();

  if (profile) return profile;

  // 2. If single user database or only 1 profile exists, default to that profile
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .limit(2);

  if (allProfiles && allProfiles.length === 1) {
    // Auto-link chat ID to this profile for future calls
    await supabase
      .from('profiles')
      .update({ telegram_chat_id: strId })
      .eq('id', allProfiles[0].id);
    return allProfiles[0];
  }

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const queryToken = url.searchParams.get('token');
    const body = await req.json();

    // =========================================================================
    // CASE A: Outgoing notifications or Test connection from ArtosKu Settings UI
    // =========================================================================
    if (body.action === 'test_connection' || body.action === 'set_webhook') {
      const botToken = (body.botToken || queryToken || '').trim();
      const chatId = (body.chatId || '').trim();

      if (!botToken) {
        return NextResponse.json({ success: false, message: 'Bot Token wajib diisi.' }, { status: 400 });
      }

      // Handle Set Webhook action
      if (body.action === 'set_webhook') {
        const origin = url.origin;
        const webhookUrl = `${origin}/api/telegram?token=${encodeURIComponent(botToken)}`;
        const setHookRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook?url=${encodeURIComponent(webhookUrl)}`);
        const setHookData = await setHookRes.json();

        if (!setHookRes.ok || !setHookData.ok) {
          return NextResponse.json({
            success: false,
            message: setHookData.description || 'Gagal mendaftarkan webhook ke Telegram.',
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'Webhook bot berhasil diaktifkan! Anda sekarang bisa chat langsung ke bot.',
          data: setHookData,
        });
      }

      // Test Connection
      if (!chatId) {
        return NextResponse.json({ success: false, message: 'Chat ID wajib diisi.' }, { status: 400 });
      }

      const now = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(new Date());

      const welcomeMsg =
        `<b>🤖 ArtosKu — Uji Coba Bot Telegram</b>\n\n` +
        `✅ <b>Koneksi Berhasil!</b>\n` +
        `Bot Telegram Anda telah terhubung sempurna dengan aplikasi keuangan pribadi <b>ArtosKu</b>.\n\n` +
        `⏰ Waktu: ${now}\n` +
        `🔒 Status: Aktif & Terverifikasi\n\n` +
        `<b>Fitur Interaktif yang Bisa Anda Gunakan:</b>\n` +
        `• Ketik <code>/saldo</code> untuk cek semua saldo rekening & dompet\n` +
        `• Ketik <code>/catat makan siang 35000</code> untuk mencatat pengeluaran\n` +
        `• Ketik <code>/masuk gaji 5000000</code> untuk mencatat pemasukan\n` +
        `• Ketik <code>/piutang</code> untuk cek daftar piutang`;

      const sendRes = await sendTelegramMessage(botToken, chatId, welcomeMsg);
      if (!sendRes?.ok) {
        return NextResponse.json({
          success: false,
          message: sendRes?.description || 'Gagal mengirim pesan uji coba ke Telegram.',
        }, { status: 400 });
      }

      return NextResponse.json({
        success: true,
        message: 'Pesan uji coba berhasil dikirim ke Telegram!',
      });
    }

    // Direct generic message sending
    if (body.botToken && body.chatId && body.message) {
      const sendRes = await sendTelegramMessage(body.botToken.trim(), body.chatId.trim(), body.message);
      return NextResponse.json({ success: Boolean(sendRes?.ok), data: sendRes });
    }

    // =========================================================================
    // CASE B: Incoming Webhook from Telegram (User chatting with the bot)
    // =========================================================================
    const message = body.message || body.edited_message;
    if (!message || !message.text) {
      // Not a text message, acknowledge with 200 OK
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat?.id;
    const rawText = message.text.trim();
    const botToken = queryToken || process.env.TELEGRAM_BOT_TOKEN || '';

    if (!botToken || !chatId) {
      return NextResponse.json({ ok: true, notice: 'Missing bot token or chat ID' });
    }

    // 1. Resolve User from Supabase
    const userProfile = await resolveUserByChatId(chatId);

    // COMMAND: /link email@example.com
    if (rawText.toLowerCase().startsWith('/link')) {
      const email = rawText.replace(/\/link/i, '').trim();
      if (!email || !supabase) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `⚠️ <b>Format Perintah:</b>\nKetik <code>/link email_anda@example.com</code> untuk menghubungkan bot dengan akun ArtosKu Anda.`
        );
        return NextResponse.json({ ok: true });
      }

      const { data: foundProfile, error } = await supabase
        .from('profiles')
        .update({ telegram_chat_id: String(chatId) })
        .ilike('email', email)
        .select()
        .single();

      if (error || !foundProfile) {
        await sendTelegramMessage(
          botToken,
          chatId,
          `❌ Akun dengan email <code>${email}</code> tidak ditemukan di ArtosKu. Pastikan Anda sudah mendaftar terlebih dahulu.`
        );
      } else {
        await sendTelegramMessage(
          botToken,
          chatId,
          `✅ <b>Berhasil Terhubung!</b>\nAkun <b>${foundProfile.full_name || email}</b> telah terhubung dengan bot ini.\n\nSekarang Anda bisa ketik:\n• <code>/saldo</code> untuk cek saldo\n• <code>/catat makan 35000</code> untuk mencatat transaksi`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // Check if user is linked
    if (!userProfile) {
      await sendTelegramMessage(
        botToken,
        chatId,
        `👋 <b>Halo ${message.from?.first_name || 'Teman'}!</b>\n\n` +
          `Bot belum terhubung dengan akun ArtosKu Anda.\n\n` +
          `<b>Cara Menghubungkan:</b>\n` +
          `1. Ketik <code>/link email_anda@domain.com</code> di sini, ATAU\n` +
          `2. Buka menu <b>Pengaturan</b> di ArtosKu, masukkan Chat ID Anda: <code>${chatId}</code>, lalu simpan.`
      );
      return NextResponse.json({ ok: true });
    }

    const userId = userProfile.id;

    // 2. COMMAND: /start, /help, /bantuan
    if (rawText === '/start' || rawText === '/help' || rawText === '/bantuan') {
      const guideMsg =
        `🤖 <b>ArtosKu Assistant — Asisten Keuangan Pribadi</b>\n` +
        `Halo <b>${userProfile.full_name || 'Sobat'}</b>! Saya siap membantu mencatat dan memantau keuangan Anda.\n\n` +
        `<b>📋 Perintah yang Bisa Anda Gunakan:</b>\n\n` +
        `💳 <b>Cek Saldo:</b>\n` +
        `• <code>/saldo</code> atau <code>/wallet</code> — Lihat saldo semua rekening & kas\n\n` +
        `💸 <b>Catat Pengeluaran:</b>\n` +
        `• <code>/catat [keterangan] [nominal]</code>\n` +
        `  Contoh: <code>/catat makan siang 35000</code>\n` +
        `  Contoh: <code>/catat bensin 50000 bca</code>\n` +
        `  Contoh santai: <code>kopi 25k</code> atau <code>makan 30000</code>\n\n` +
        `💰 <b>Catat Pemasukan:</b>\n` +
        `• <code>/masuk [keterangan] [nominal]</code>\n` +
        `  Contoh: <code>/masuk gaji freelance 500000</code>\n\n` +
        `🤝 <b>Cek Piutang:</b>\n` +
        `• <code>/piutang</code> — Cek daftar uang yang sedang dipinjamkan\n\n` +
        `📜 <b>Riwayat Transaksi:</b>\n` +
        `• <code>/riwayat</code> — Lihat 5 transaksi terakhir Anda`;

      await sendTelegramMessage(botToken, chatId, guideMsg);
      return NextResponse.json({ ok: true });
    }

    // 3. COMMAND: /saldo, /wallet, /rekening, /cek (Cek Wallet / Saldo)
    if (
      rawText === '/saldo' ||
      rawText === '/wallet' ||
      rawText === '/rekening' ||
      rawText === '/cek' ||
      rawText.toLowerCase() === 'saldo' ||
      rawText.toLowerCase() === 'cek saldo'
    ) {
      if (!supabase) {
        await sendTelegramMessage(botToken, chatId, '⚠️ Layanan database Supabase belum terkonfigurasi.');
        return NextResponse.json({ ok: true });
      }

      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('name, type, current_balance')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('current_balance', { ascending: false });

      if (error || !accounts || accounts.length === 0) {
        await sendTelegramMessage(
          botToken,
          chatId,
          '💳 Belum ada rekening atau dompet yang tercatat di akun ArtosKu Anda.'
        );
        return NextResponse.json({ ok: true });
      }

      const totalBalance = accounts.reduce((sum, a) => sum + Number(a.current_balance || 0), 0);

      let walletMsg = `💳 <b>Saldo Rekening & Dompet Anda:</b>\n\n`;
      accounts.forEach((acc) => {
        const icon =
          acc.type === 'bank'
            ? '🏦'
            : acc.type === 'ewallet'
            ? '📱'
            : acc.type === 'brokerage'
            ? '📈'
            : '💵';
        walletMsg += `${icon} <b>${acc.name}:</b> ${formatIDR(Number(acc.current_balance))}\n`;
      });

      walletMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
      walletMsg += `💰 <b>Total Kas: ${formatIDR(totalBalance)}</b>\n\n`;
      walletMsg += `<i>Ketik <code>/catat makan 35000</code> untuk mencatat pengeluaran baru.</i>`;

      await sendTelegramMessage(botToken, chatId, walletMsg);
      return NextResponse.json({ ok: true });
    }

    // 4. COMMAND: /piutang (Cek Piutang)
    if (rawText === '/piutang' || rawText.toLowerCase() === 'piutang') {
      if (!supabase) return NextResponse.json({ ok: true });

      const { data: recs } = await supabase
        .from('receivables')
        .select('borrower_name, current_balance, due_date, status')
        .eq('user_id', userId)
        .neq('status', 'paid');

      if (!recs || recs.length === 0) {
        await sendTelegramMessage(
          botToken,
          chatId,
          '🤝 <b>Daftar Piutang:</b>\nTidak ada piutang aktif yang belum tertagih. Semua piutang Anda telah lunas!'
        );
        return NextResponse.json({ ok: true });
      }

      const totalRec = recs.reduce((sum, r) => sum + Number(r.current_balance || 0), 0);
      let recMsg = `🤝 <b>Daftar Piutang Belum Lunas:</b>\n\n`;
      recs.forEach((r) => {
        recMsg += `• <b>${r.borrower_name}:</b> ${formatIDR(Number(r.current_balance))} (Tempo: ${r.due_date})\n`;
      });
      recMsg += `━━━━━━━━━━━━━━━━━━━━\n`;
      recMsg += `💰 <b>Total Piutang: ${formatIDR(totalRec)}</b>`;

      await sendTelegramMessage(botToken, chatId, recMsg);
      return NextResponse.json({ ok: true });
    }

    // 5. COMMAND: /riwayat (Cek 5 Transaksi Terakhir)
    if (rawText === '/riwayat' || rawText === '/transaksi') {
      if (!supabase) return NextResponse.json({ ok: true });

      const { data: txs } = await supabase
        .from('transactions')
        .select('description, amount, type, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(5);

      if (!txs || txs.length === 0) {
        await sendTelegramMessage(botToken, chatId, '📜 Belum ada riwayat transaksi yang tercatat.');
        return NextResponse.json({ ok: true });
      }

      let histMsg = `📜 <b>5 Transaksi Terakhir Anda:</b>\n\n`;
      txs.forEach((t) => {
        const isInc = t.type === 'income';
        const sign = isInc ? '🟢 +' : '🔴 -';
        histMsg += `${sign}${formatIDR(Number(t.amount))} — ${t.description || 'Transaksi'}\n`;
      });

      await sendTelegramMessage(botToken, chatId, histMsg);
      return NextResponse.json({ ok: true });
    }

    // 6. RECORDING TRANSACTION: /catat, /keluar, /masuk, or Natural Text
    let txType: 'expense' | 'income' = 'expense';
    let textToParse = rawText;

    if (rawText.toLowerCase().startsWith('/masuk')) {
      txType = 'income';
      textToParse = rawText.replace(/\/masuk/i, '').trim();
    } else if (rawText.toLowerCase().startsWith('/catat')) {
      txType = 'expense';
      textToParse = rawText.replace(/\/catat/i, '').trim();
    } else if (rawText.toLowerCase().startsWith('/keluar')) {
      txType = 'expense';
      textToParse = rawText.replace(/\/keluar/i, '').trim();
    } else if (rawText.toLowerCase().startsWith('/bayar')) {
      txType = 'expense';
      textToParse = rawText.replace(/\/bayar/i, '').trim();
    }

    // Extract amount from tokens
    const tokens = textToParse.split(/\s+/);
    let detectedAmount: number | null = null;
    const descTokens: string[] = [];

    for (const token of tokens) {
      if (detectedAmount === null) {
        const parsed = parseAmount(token);
        if (parsed !== null && parsed > 0) {
          detectedAmount = parsed;
          continue;
        }
      }
      descTokens.push(token);
    }

    // If an amount was detected, we record the transaction!
    if (detectedAmount && detectedAmount > 0) {
      if (!supabase) {
        await sendTelegramMessage(botToken, chatId, '⚠️ Layanan database belum terhubung.');
        return NextResponse.json({ ok: true });
      }

      // Fetch user's active accounts to match or pick default
      const { data: accounts } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_archived', false);

      if (!accounts || accounts.length === 0) {
        await sendTelegramMessage(
          botToken,
          chatId,
          '❌ Anda belum memiliki rekening aktif di ArtosKu. Buat rekening terlebih dahulu di aplikasi.'
        );
        return NextResponse.json({ ok: true });
      }

      // Check if user mentioned an account name in description
      let selectedAccount = accounts[0];
      const remainingDescTokens: string[] = [];

      for (const word of descTokens) {
        const lowerWord = word.toLowerCase();
        const matched = accounts.find((a) => a.name.toLowerCase().includes(lowerWord));
        if (matched && !lowerWord.includes('makan') && !lowerWord.includes('beli')) {
          selectedAccount = matched;
        } else {
          remainingDescTokens.push(word);
        }
      }

      const description = remainingDescTokens.join(' ').trim() || (txType === 'income' ? 'Pemasukan' : 'Pengeluaran');

      // Update account balance in Supabase
      const oldBalance = Number(selectedAccount.current_balance || 0);
      const newBalance = txType === 'income' ? oldBalance + detectedAmount : oldBalance - detectedAmount;

      await supabase
        .from('accounts')
        .update({ current_balance: newBalance })
        .eq('id', selectedAccount.id);

      // Insert transaction into Supabase
      const txPayload = {
        user_id: userId,
        date: new Date().toISOString(),
        type: txType,
        kind: txType,
        amount: detectedAmount,
        description,
        source_account_id: selectedAccount.id,
        destination_account_id: null,
        category_id: null,
        payment_method: selectedAccount.type === 'bank' ? 'transfer' : 'cash',
        notes: 'Dicatat via Telegram Bot',
      };

      await supabase.from('transactions').insert(txPayload);

      // Confirm to Telegram user
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        timeStyle: 'short',
        dateStyle: 'medium',
      }).format(new Date());

      const confirmMsg =
        `✅ <b>Catatan ${txType === 'income' ? 'Pemasukan' : 'Pengeluaran'} Berhasil Disimpan!</b>\n\n` +
        `📝 <b>Keterangan:</b> ${description}\n` +
        `💵 <b>Nominal:</b> ${formatIDR(detectedAmount)}\n` +
        `💳 <b>Rekening:</b> ${selectedAccount.name}\n` +
        `💰 <b>Sisa Saldo:</b> ${formatIDR(newBalance)}\n` +
        `⏰ <b>Waktu:</b> ${timeStr}\n\n` +
        `<i>Data tersinkron otomatis ke aplikasi ArtosKu Anda.</i>`;

      await sendTelegramMessage(botToken, chatId, confirmMsg);
      return NextResponse.json({ ok: true });
    }

    // Default unrecognized message response with friendly help
    await sendTelegramMessage(
      botToken,
      chatId,
      `🤔 Saya belum mengenali format tersebut.\n\n` +
        `<b>Contoh penggunaan cepat:</b>\n` +
        `• <code>/saldo</code> — Cek saldo rekening\n` +
        `• <code>/catat makan siang 35000</code> — Catat pengeluaran\n` +
        `• <code>/masuk freelance 500000</code> — Catat pemasukan\n` +
        `• Atau ketik: <code>bensin 50k</code>\n\n` +
        `Ketik <code>/help</code> untuk panduan lengkap.`
    );

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    console.error('Error in /api/telegram handler:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
