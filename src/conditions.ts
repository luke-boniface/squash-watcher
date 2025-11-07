import { Page } from 'playwright';
import { CheckResult } from './websiteChecker';

/**
 * Default condition checker - IMPORTANT: This is a placeholder implementation.
 * 
 * ⚠️  This always returns false and must be customized for your use case.
 * 
 * To use this application, modify this function to implement your specific
 * condition checking logic. See examples below or in the README.
 * 
 * Expected signature: (page: Page) => Promise<CheckResult>
 */
export async function defaultConditionChecker(page: Page): Promise<CheckResult> {
  try {
    // Example: Check if page title contains specific text
    const title = await page.title();
    console.log(`Page title: ${title}`);
    
    // Example: Check if a specific element exists
    // const elementExists = await page.locator('selector').count() > 0;
    
    // ⚠️  PLACEHOLDER IMPLEMENTATION - Always returns false
    // TODO: Replace with your actual condition
    const conditionMet = false;
    
    return {
      conditionMet,
      message: conditionMet 
        ? `Condition met! Page title: ${title}` 
        : `Waiting for condition... (Page title: ${title})`,
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
