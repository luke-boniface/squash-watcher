import { chromium, Browser, BrowserContext, Page } from 'playwright';

export interface CheckResult {
  conditionMet: boolean;
  message?: string;
  error?: string;
}

export type ConditionChecker = (page: Page) => Promise<CheckResult>;

export class WebsiteChecker {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;

  async initialize(): Promise<void> {
    // Launch browser with Cloudflare bypass configuration
    this.browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    // Create context with realistic browser fingerprint
    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      extraHTTPHeaders: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    });

    console.log('Browser initialized with Cloudflare bypass configuration');
  }

  async checkWebsite(url: string, conditionChecker: ConditionChecker, timeout: number = 30000): Promise<CheckResult> {
    if (!this.browser || !this.context) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.context.newPage();
    
    try {
      console.log(`Navigating to ${url}...`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      
      const result = await conditionChecker(page);
      return result;
    } catch (error) {
      console.error('Error checking website:', error);
      return {
        conditionMet: false,
        error: error instanceof Error ? error.message : String(error),
      };
    } finally {
      await page.close();
    }
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
      this.browser = null;
    }
  }
}
