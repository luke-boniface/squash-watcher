import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
  targetUrl: string;
  checkInterval: number;
}

export function loadConfig(): Config {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const targetUrl = process.env.TARGET_URL || 'https://example.com';
  const checkInterval = parseInt(process.env.CHECK_INTERVAL || '300000', 10);

  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  }

  if (!telegramChatId) {
    throw new Error('TELEGRAM_CHAT_ID is not set in environment variables');
  }

  return {
    telegramBotToken,
    telegramChatId,
    targetUrl,
    checkInterval,
  };
}
