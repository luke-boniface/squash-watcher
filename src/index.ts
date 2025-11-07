import { loadConfig } from './config';
import { TelegramNotifier } from './telegram';
import { WebsiteChecker } from './websiteChecker';
import { defaultConditionChecker } from './conditions';

async function main() {
  console.log('Starting Squash Watcher...');

  // Load configuration
  let config;
  try {
    config = loadConfig();
  } catch (error) {
    console.error('Configuration error:', error);
    process.exit(1);
  }

  // Initialize services
  const notifier = new TelegramNotifier(config.telegramBotToken, config.telegramChatId);
  const checker = new WebsiteChecker();

  try {
    await checker.initialize();
    
    // Send startup notification
    await notifier.sendMessage('🚀 Squash Watcher started and monitoring...');

    // Main monitoring loop
    const checkWebsite = async () => {
      console.log(`\n[${new Date().toISOString()}] Checking website...`);
      
      const result = await checker.checkWebsite(config.targetUrl, defaultConditionChecker);
      
      if (result.error) {
        console.error('Check failed:', result.error);
        return;
      }
      
      console.log('Check result:', result);
      
      if (result.conditionMet && result.message) {
        console.log('✅ Condition met! Sending notification...');
        await notifier.sendMessageWithMarkdown(
          `✅ *Condition Met!*\n\n${result.message}\n\nURL: ${config.targetUrl}`
        );
      } else {
        console.log('⏳ Condition not met yet');
      }
    };

    // Run initial check
    await checkWebsite();

    // Schedule periodic checks
    const intervalId = setInterval(checkWebsite, config.checkInterval);
    
    console.log(`Checking every ${config.checkInterval / 1000} seconds...`);

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down...');
      clearInterval(intervalId);
      await checker.close();
      await notifier.sendMessage('🛑 Squash Watcher stopped');
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

  } catch (error) {
    console.error('Fatal error:', error);
    await checker.close();
    process.exit(1);
  }
}

// Run the application
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
