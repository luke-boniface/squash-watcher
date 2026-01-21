import { loadConfig } from './config';
import { TelegramNotifier } from './telegram';
import { WebsiteChecker } from './websiteChecker';
import { defaultConditionChecker } from './conditions';
import { StateManager } from './stateManager';
import { createCourtAvailabilityChecker } from './courtConditions';
import { createAlertChecker } from './alertManager';
import { DebugLogger } from './debugLogger';
import { getActiveAlerts } from '../lib/storage';

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
  const debugLogger = new DebugLogger();

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

      // Get current alert count for debug logging
      let alertCount = 0;
      let activeAlertCount = 0;
      try {
        const allAlerts = await import('../lib/storage').then(m => m.loadAlerts());
        const activeAlerts = await getActiveAlerts();
        alertCount = allAlerts.length;
        activeAlertCount = activeAlerts.length;
      } catch (error) {
        console.log('Could not load alerts for debug logging');
      }

      await debugLogger.logCheckStart(config, alertCount, activeAlertCount);

      let websiteResult: any = null;
      let apiResult: any = null;

      // Website monitoring (if enabled)
      if (config.targetUrl) {
        console.log('Checking website...');
        const result = await checker.checkWebsite(
          config.targetUrl,
          defaultConditionChecker,
          config.pageTimeout
        );

        websiteResult = {
          enabled: true,
          url: config.targetUrl,
          success: !result.error,
          conditionMet: result.conditionMet,
          message: result.message,
          error: result.error
        };

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

      // API monitoring (if enabled) - either legacy config or alert-based
      if (config.apiEnabled && config.facilityId) {
        console.log('Checking court availability...');

        // Use alert-based checker (reads from alerts.json)
        const alertChecker = createAlertChecker(config.facilityId, stateManager);

        const result = await checker.checkWebsite(
          'https://www.eversports.de', // Dummy URL, actual URLs built in checker
          alertChecker,
          config.pageTimeout
        );

        // Count slots found from the message
        let slotsFound = 0;
        if (result.conditionMet && result.message) {
          const matches = result.message.match(/🎾/g);
          slotsFound = matches ? matches.length : 0;
        }

        apiResult = {
          enabled: true,
          success: !result.error,
          conditionMet: result.conditionMet,
          slotsFound,
          message: result.message,
          error: result.error
        };

        if (result.error) {
          console.error('Alert check failed:', result.error);
        } else if (result.conditionMet && result.message) {
          console.log('✅ Court slots available! Sending notification...');
          await notifier.sendMessageWithMarkdown(result.message);
        } else {
          console.log('⏳', result.message || 'No new court slots available');
        }
      }

      // Log the check results for debug console
      await debugLogger.logCheckResults(
        websiteResult || { enabled: false, success: false, conditionMet: false },
        apiResult || { enabled: false, success: false, conditionMet: false, slotsFound: 0 }
      );
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
      await debugLogger.markStopped();
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
