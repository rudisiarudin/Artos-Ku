export interface TelegramConfig {
  botToken: string;
  chatId: string;
  isEnabled: boolean;
  notifyDebts: boolean;
  notifyBudgets: boolean;
  notifyDailySummary: boolean;
  lastTestedAt?: string | null;
}

const STORAGE_KEY = 'artosku_telegram_config';

export const getTelegramConfig = (): TelegramConfig => {
  if (typeof window === 'undefined') {
    return {
      botToken: '',
      chatId: '',
      isEnabled: false,
      notifyDebts: true,
      notifyBudgets: true,
      notifyDailySummary: false,
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        botToken: '',
        chatId: '',
        isEnabled: false,
        notifyDebts: true,
        notifyBudgets: true,
        notifyDailySummary: false,
      };
    }
    return JSON.parse(raw);
  } catch {
    return {
      botToken: '',
      chatId: '',
      isEnabled: false,
      notifyDebts: true,
      notifyBudgets: true,
      notifyDailySummary: false,
    };
  }
};

export const saveTelegramConfig = (config: TelegramConfig): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Telegram config to localStorage:', err);
  }
};

export const sendTelegramNotification = async (
  botToken: string,
  chatId: string,
  message: string
): Promise<{ success: boolean; message: string }> => {
  try {
    const res = await fetch('/api/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        botToken,
        chatId,
        message,
        action: 'send_message',
      }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        message: data.message || 'Gagal mengirim pesan ke Telegram',
      };
    }

    return {
      success: true,
      message: 'Pesan berhasil dikirim ke Telegram!',
    };
  } catch (err: any) {
    return {
      success: false,
      message: err?.message || 'Terjadi kesalahan jaringan saat menghubungi server Telegram',
    };
  }
};
