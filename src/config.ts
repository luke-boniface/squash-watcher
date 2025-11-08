import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  telegramBotToken: string;
  telegramChatId: string;
  targetUrl?: string;
  checkInterval: number;
  pageTimeout: number;
  // API monitoring configuration (optional)
  apiEnabled: boolean;
  facilityId?: string;
  courtIds: string[];
  targetTimes: string[];
  daysToCheck: number;
}

export function loadConfig(): Config {
  const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramChatId = process.env.TELEGRAM_CHAT_ID;
  const targetUrl = process.env.TARGET_URL;
  const checkInterval = parseInt(process.env.CHECK_INTERVAL || '300000', 10);
  const pageTimeout = parseInt(process.env.PAGE_TIMEOUT || '30000', 10);

  // API monitoring configuration
  const apiEnabled = process.env.API_ENABLED === 'true';
  const facilityId = process.env.FACILITY_ID;
  const courtIdsStr = process.env.COURT_IDS;
  const targetTimesStr = process.env.TARGET_TIMES;
  const daysToCheck = parseInt(process.env.DAYS_TO_CHECK || '7', 10);

  if (!telegramBotToken) {
    throw new Error('TELEGRAM_BOT_TOKEN is not set in environment variables');
  }

  if (!telegramChatId) {
    throw new Error('TELEGRAM_CHAT_ID is not set in environment variables');
  }

  // At least one monitoring mode must be enabled
  if (!targetUrl && !apiEnabled) {
    throw new Error('Either TARGET_URL or API_ENABLED must be set');
  }

  // If API monitoring is enabled, validate required fields
  if (apiEnabled) {
    if (!facilityId) {
      throw new Error('FACILITY_ID is required when API_ENABLED=true');
    }
    if (!courtIdsStr) {
      throw new Error('COURT_IDS is required when API_ENABLED=true');
    }
  }

  // Parse court IDs (comma-separated)
  const courtIds = courtIdsStr
    ? courtIdsStr.split(',').map(id => id.trim())
    : [];

  // Parse target times (comma-separated), default to evening slots
  const targetTimes = targetTimesStr
    ? targetTimesStr.split(',').map(t => t.trim())
    : ['1830', '1915', '2000', '2045'];

  return {
    telegramBotToken,
    telegramChatId,
    targetUrl,
    checkInterval,
    pageTimeout,
    apiEnabled,
    facilityId,
    courtIds,
    targetTimes,
    daysToCheck,
  };
}
