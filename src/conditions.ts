import { Page } from 'playwright';
import { CheckResult } from './websiteChecker';

/**
 * Default condition checker - checks if a specific text exists on the page.
 * This is a placeholder that can be customized later.
 * 
 * To customize, modify this function or create a new condition checker
 * following the same signature: (page: Page) => Promise<CheckResult>
 */
export async function defaultConditionChecker(page: Page): Promise<CheckResult> {
  try {
    // Example: Check if page title contains specific text
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Example: Check if a specific element exists
    // const elementExists = await page.locator('selector').count() > 0;
    
    // Placeholder condition - always returns false
    // Replace with your actual condition
    const conditionMet = false;
    
    return {
      conditionMet,
      message: conditionMet 
        ? `Condition met! Page title: ${title}` 
        : 'Condition not met yet',
    };
  } catch (error) {
    return {
      conditionMet: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Example custom condition checker - checks for specific text on page
 */
export async function textExistsChecker(searchText: string) {
  return async (page: Page): Promise<CheckResult> => {
    try {
      const content = await page.content();
      const textExists = content.includes(searchText);
      
      return {
        conditionMet: textExists,
        message: textExists 
          ? `Found text "${searchText}" on the page!` 
          : `Text "${searchText}" not found yet`,
      };
    } catch (error) {
      return {
        conditionMet: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
