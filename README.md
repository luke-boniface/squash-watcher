# Squash Watcher

An application that intermittently checks a website using Playwright and sends notifications to a Telegram channel when a specified condition is met.

## Features

- 🌐 **Website Monitoring**: Uses Playwright to check websites with full browser automation
- 💬 **Telegram Notifications**: Sends alerts to a Telegram channel when conditions are met
- ⏰ **Configurable Intervals**: Set custom check intervals via environment variables
- 🔧 **Extensible Conditions**: Easily define custom conditions to monitor
- 📝 **TypeScript**: Fully typed codebase for better development experience

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- A Telegram Bot Token (get one from [@BotFather](https://t.me/botfather))
- A Telegram Chat ID (your channel or group ID)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/luke-boniface/squash-watcher.git
cd squash-watcher
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright browsers:
```bash
npx playwright install chromium
```

## Configuration

1. Copy the example environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your configuration:
```env
TELEGRAM_BOT_TOKEN=your_telegram_bot_token_here
TELEGRAM_CHAT_ID=your_telegram_chat_id_here
TARGET_URL=https://example.com
CHECK_INTERVAL=300000  # 5 minutes in milliseconds
```

### Getting Telegram Credentials

**Bot Token:**
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the token provided

**Chat ID:**
1. Add your bot to a channel or group
2. Send a message in the channel/group
3. Visit `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
4. Look for the `chat` object and copy the `id` field

## Usage

### Development Mode

Run with TypeScript directly (no build required):
```bash
npm run dev
```

### Production Mode

1. Build the TypeScript code:
```bash
npm run build
```

2. Start the application:
```bash
npm start
```

## Customizing Conditions

The default condition checker is located in `src/conditions.ts`. You can modify it to check for your specific needs:

```typescript
export async function defaultConditionChecker(page: Page): Promise<CheckResult> {
  try {
    // Example: Check if specific text exists on the page
    const content = await page.content();
    const conditionMet = content.includes('Your text here');
    
    return {
      conditionMet,
      message: conditionMet 
        ? 'Found the text!' 
        : 'Text not found yet',
    };
  } catch (error) {
    return {
      conditionMet: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

### Example Condition Checks

**Check for specific element:**
```typescript
const elementExists = await page.locator('.my-element').count() > 0;
```

**Check page title:**
```typescript
const title = await page.title();
const conditionMet = title.includes('Expected Title');
```

**Check for button availability:**
```typescript
const button = page.locator('button:has-text("Book Now")');
const conditionMet = await button.isVisible();
```

**Check element text content:**
```typescript
const element = page.locator('#status');
const text = await element.textContent();
const conditionMet = text === 'Available';
```

## Project Structure

```
squash-watcher/
├── src/
│   ├── index.ts          # Main application entry point
│   ├── config.ts         # Configuration management
│   ├── telegram.ts       # Telegram notification service
│   ├── websiteChecker.ts # Playwright-based website checking
│   └── conditions.ts     # Condition checking logic
├── dist/                 # Compiled JavaScript (generated)
├── .env                  # Environment variables (not in git)
├── .env.example          # Example environment file
├── tsconfig.json         # TypeScript configuration
└── package.json          # Project dependencies
```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `TELEGRAM_BOT_TOKEN` | Your Telegram bot token | - | Yes |
| `TELEGRAM_CHAT_ID` | Your Telegram chat/channel ID | - | Yes |
| `TARGET_URL` | Website URL to monitor | `https://example.com` | No |
| `CHECK_INTERVAL` | Check interval in milliseconds | `300000` (5 min) | No |

## How It Works

1. **Initialization**: The app loads configuration and initializes Playwright and Telegram services
2. **Initial Check**: Performs an immediate website check on startup
3. **Scheduled Checks**: Runs checks at the configured interval
4. **Condition Evaluation**: Each check evaluates the custom condition against the website
5. **Notification**: When condition is met, sends a Telegram message with details
6. **Continuous Monitoring**: Keeps running until manually stopped (Ctrl+C)

## Error Handling

- Configuration errors cause immediate shutdown with clear error messages
- Network errors during checks are logged but don't stop the monitoring
- Telegram notification failures are logged for debugging
- Graceful shutdown on SIGINT/SIGTERM signals

## Graceful Shutdown

Press `Ctrl+C` to stop the application. It will:
1. Stop the monitoring interval
2. Close the browser instance
3. Send a shutdown notification to Telegram
4. Exit cleanly

## Troubleshooting

**Browser not installed:**
```bash
npx playwright install chromium
```

**Module not found errors:**
```bash
npm install
npm run build
```

**Telegram messages not sending:**
- Verify your bot token is correct
- Ensure the bot is added to your channel/group
- Check that the chat ID is correct (should be negative for groups/channels)

## License

ISC