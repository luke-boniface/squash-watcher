import { chromium, Browser, Page } from 'playwright';

export interface CheckResult {
  conditionMet: boolean;
  message?: string;
  error?: string;
}

export type ConditionChecker = (page: Page) => Promise<CheckResult>;

export class WebsiteChecker {
  private browser: Browser | null = null;

  async initialize(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
    });
    console.log('Browser initialized');
  }

  async checkWebsite(url: string, conditionChecker: ConditionChecker, timeout: number = 30000): Promise<CheckResult> {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }

    const page = await this.browser.newPage();
    
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
    if (this.browser) {
      await this.browser.close();
      console.log('Browser closed');
      this.browser = null;
    }
  }
}
