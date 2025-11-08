import { chromium, Browser, BrowserContext } from 'playwright';
import { loadConfig } from './config';

interface CourtSlot {
  date: string;
  start: string;
  court: number;
  booking: any;
}

interface ApiResponse {
  slots: CourtSlot[];
}

interface AvailableSlot {
  date: string;
  time: string;
  court: number;
}

function formatTime(timeStr: string): string {
  return `${timeStr.substring(0, 2)}:${timeStr.substring(2)}`;
}

function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

function generateDates(daysToCheck: number): string[] {
  const dates: string[] = [];
  const today = new Date();

  for (let i = 0; i < daysToCheck; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    dates.push(formatDate(date));
  }

  return dates;
}

function buildApiUrl(facilityId: string, courtIds: string[], startDate: string): string {
  const baseUrl = 'https://www.eversports.de/api/slot';
  const params = new URLSearchParams();
  params.append('facilityId', facilityId);
  params.append('startDate', startDate);

  courtIds.forEach(courtId => {
    params.append('courts[]', courtId);
  });

  return `${params.toString()}`;
}

async function main() {
  console.log('\n🎾 SQUASH WATCHER - DRY RUN\n');
  console.log('═'.repeat(80));
  console.log('\n');

  // Load configuration
  const config = loadConfig();

  if (!config.apiEnabled || !config.facilityId) {
    console.error('❌ API monitoring not enabled in configuration');
    console.error('   Please set API_ENABLED=true and FACILITY_ID in your .env file\n');
    process.exit(1);
  }

  console.log('Configuration:');
  console.log(`  Facility ID: ${config.facilityId}`);
  console.log(`  Courts: ${config.courtIds.join(', ')}`);
  console.log(`  Target Times: ${config.targetTimes.map(formatTime).join(', ')}`);
  console.log(`  Days to Check: ${config.daysToCheck}`);
  console.log('\n');

  let browser: Browser | null = null;
  let context: BrowserContext | null = null;

  try {
    // Initialize browser with Cloudflare bypass
    console.log('🌐 Initializing browser...');
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled']
    });

    context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
      locale: 'en-US',
      extraHTTPHeaders: {
        'Accept': 'application/json, text/plain, */*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
      }
    });

    const datesToCheck = generateDates(config.daysToCheck);
    const allAvailableSlots: AvailableSlot[] = [];

    console.log('🔍 Fetching availability data...\n');

    // Check each date
    for (const date of datesToCheck) {
      const url = `https://www.eversports.de/api/slot?${buildApiUrl(config.facilityId, config.courtIds, date)}`;

      const page = await context.newPage();

      try {
        const response = await page.goto(url, {
          waitUntil: 'networkidle',
          timeout: 45000
        });

        if (!response || response.status() !== 200) {
          console.error(`   ⚠️  Failed to fetch data for ${date}: ${response?.status()}`);
          continue;
        }

        await page.waitForTimeout(2000);

        const text = await page.textContent('body');
        if (!text) {
          console.error(`   ⚠️  No response for ${date}`);
          continue;
        }

        const data: ApiResponse = JSON.parse(text);

        // Find available slots at target times
        for (const slot of data.slots) {
          if (config.targetTimes.includes(slot.start) && slot.booking === null) {
            allAvailableSlots.push({
              date: slot.date,
              time: slot.start,
              court: slot.court
            });
          }
        }

        process.stdout.write('.');
      } catch (error) {
        console.error(`\n   ❌ Error checking ${date}:`, error instanceof Error ? error.message : String(error));
      } finally {
        await page.close();
      }
    }

    console.log(' Done!\n');
    console.log('═'.repeat(80));
    console.log('\n');

    if (allAvailableSlots.length === 0) {
      console.log('❌ No available slots found at target times\n');
      return;
    }

    // Group slots by date, deduplicating courts per time slot
    const slotsByDate = new Map<string, Map<string, Set<number>>>();

    for (const slot of allAvailableSlots) {
      if (!slotsByDate.has(slot.date)) {
        slotsByDate.set(slot.date, new Map());
      }
      const dateMap = slotsByDate.get(slot.date)!;

      if (!dateMap.has(slot.time)) {
        dateMap.set(slot.time, new Set());
      }
      dateMap.get(slot.time)!.add(slot.court);
    }

    // Display results grouped by date
    console.log(`✅ Found ${allAvailableSlots.length} available slots:\n`);

    const sortedDates = Array.from(slotsByDate.keys()).sort();

    for (const date of sortedDates) {
      const dayName = getDayName(date);
      const isToday = date === formatDate(new Date());
      const dateLabel = isToday ? `${date} (${dayName}) - TODAY` : `${date} (${dayName})`;

      console.log(`📅 ${dateLabel}`);
      console.log('─'.repeat(80));

      const timeMap = slotsByDate.get(date)!;
      const sortedTimes = Array.from(timeMap.keys()).sort();

      for (const time of sortedTimes) {
        const courtsSet = timeMap.get(time)!;
        const courts = Array.from(courtsSet).sort((a, b) => a - b);
        console.log(`   🕐 ${formatTime(time)} - ${courts.length} court${courts.length > 1 ? 's' : ''} available`);
        console.log(`      Courts: ${courts.join(', ')}`);
      }

      console.log('');
    }

    // Summary by time slot
    console.log('═'.repeat(80));
    console.log('\n📊 SUMMARY BY TIME SLOT\n');

    const slotsByTime = new Map<string, number>();
    for (const slot of allAvailableSlots) {
      slotsByTime.set(slot.time, (slotsByTime.get(slot.time) || 0) + 1);
    }

    const sortedTimes = config.targetTimes.sort();
    for (const time of sortedTimes) {
      const count = slotsByTime.get(time) || 0;
      const bar = '█'.repeat(Math.min(count, 50));
      console.log(`   ${formatTime(time)}: ${bar} ${count} slots`);
    }

    console.log('\n');
    console.log('═'.repeat(80));
    console.log(`\n✨ Total: ${allAvailableSlots.length} available slots across ${sortedDates.length} days\n`);

  } catch (error) {
    console.error('\n❌ Error:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    if (context) await context.close();
    if (browser) await browser.close();
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
