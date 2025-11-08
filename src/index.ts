import { loadConfig } from './config';
import { TelegramNotifier } from './telegram';
import { WebsiteChecker } from './websiteChecker';
import { defaultConditionChecker } from './conditions';
import { StateManager } from './stateManager';
import { createCourtAvailabilityChecker } from './courtConditions';

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
  const stateManager = new StateManager();

  try {
    await checker.initialize();

    // Send startup notification
    const monitoringModes = [];
    if (config.targetUrl) monitoringModes.push('website');
    if (config.apiEnabled) monitoringModes.push('court API');
    await notifier.sendMessage(
      `🚀 Squash Watcher started!\n\nMonitoring: ${monitoringModes.join(' + ')}\n` +
      `Check interval: ${config.checkInterval / 1000}s`
    );

    // Main monitoring loop
    const performChecks = async () => {
      console.log(`\n[${new Date().toISOString()}] Performing checks...`);

      // Website monitoring (if enabled)
      if (config.targetUrl) {
        console.log('Checking website...');
        const result = await checker.checkWebsite(
          config.targetUrl,
          defaultConditionChecker,
          config.pageTimeout
        );

        if (result.error) {
          console.error('Website check failed:', result.error);
        } else if (result.conditionMet && result.message) {
          console.log('✅ Website condition met! Sending notification...');
          await notifier.sendMessageWithMarkdown(
            `✅ *Condition Met!*\n\n${result.message}\n\nURL: ${config.targetUrl}`
          );
        } else {
          console.log('⏳ Website condition not met');
        }
      }

      // API monitoring (if enabled)
      if (config.apiEnabled && config.facilityId) {
        console.log('Checking court availability API...');
        const courtChecker = createCourtAvailabilityChecker(
          config.facilityId,
          config.courtIds,
          config.targetTimes,
          config.daysToCheck,
          stateManager
        );

        const result = await checker.checkWebsite(
          'https://www.eversports.de', // Dummy URL, actual URLs built in checker
          courtChecker,
          config.pageTimeout
        );

        if (result.error) {
          console.error('Court API check failed:', result.error);
        } else if (result.conditionMet && result.message) {
          console.log('✅ Court slots available! Sending notification...');
          await notifier.sendMessageWithMarkdown(result.message);
        } else {
          console.log('⏳ No new court slots available', result.message || '');
        }
      }
    };

    // Run initial check
    await performChecks();

    // Schedule periodic checks
    const intervalId = setInterval(performChecks, config.checkInterval);
    
    console.log(`Checking every ${config.checkInterval / 1000} seconds...`);

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('\nShutting down...');
      clearInterval(intervalId);
      await checker.close();
      try {
        await notifier.sendMessage('🛑 Squash Watcher stopped');
      } catch (error) {
        console.error('Failed to send shutdown notification:', error);
      }
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
