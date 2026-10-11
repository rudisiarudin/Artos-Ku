import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { botToken, chatId, message, action } = body;

    if (!botToken || !botToken.trim()) {
      return NextResponse.json(
        { success: false, message: 'Bot Token wajib diisi.' },
        { status: 400 }
      );
    }

    if (!chatId || !chatId.trim()) {
      return NextResponse.json(
        { success: false, message: 'Chat ID wajib diisi.' },
        { status: 400 }
      );
    }

    const cleanToken = botToken.trim();
    const cleanChatId = chatId.trim();

    let textToSend = message;
    if (action === 'test_connection' || !textToSend) {
      const now = new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'full',
        timeStyle: 'medium',
      }).format(new Date());

      textToSend = `<b>🤖 ArtosKu — Uji Coba Bot Telegram</b>\n\n` +
        `✅ <b>Koneksi Berhasil!</b>\n` +
        `Bot Telegram Anda telah terhubung sempurna dengan aplikasi keuangan pribadi <b>ArtosKu</b>.\n\n` +
        `⏰ Waktu: ${now}\n` +
        `🔒 Status: Aktif & Terverifikasi\n\n` +
        `<i>Anda akan menerima notifikasi cicilan jatuh tempo dan pengingat anggaran melalui bot ini.</i>`;
    }

    // Call Telegram Bot API
    const telegramApiUrl = `https://api.telegram.org/bot${cleanToken}/sendMessage`;
    const response = await fetch(telegramApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: cleanChatId,
        text: textToSend,
        parse_mode: 'HTML',
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.ok) {
      let errorMsg = result.description || 'Gagal mengirim pesan Telegram.';
      if (result.error_code === 401) {
        errorMsg = 'Bot Token tidak valid. Pastikan Anda menyalin token dari @BotFather dengan benar.';
      } else if (result.error_code === 400 && result.description?.includes('chat not found')) {
        errorMsg = 'Chat ID tidak ditemukan. Pastikan Anda sudah membuka bot Anda di Telegram dan menekan tombol /start terlebih dahulu.';
      }

      return NextResponse.json(
        { success: false, message: errorMsg, details: result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pesan berhasil dikirim ke Telegram!',
      data: result.result,
    });
  } catch (error: any) {
    console.error('Error in /api/telegram:', error);
    return NextResponse.json(
      {
        success: false,
        message: error?.message || 'Terjadi kesalahan internal pada server saat memproses Telegram.',
      },
      { status: 500 }
    );
  }
}
