# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Squash-watcher is a hybrid monitoring application with two main components:
1. **Backend monitoring service** (`src/`) - Playwright-based court availability checker with Telegram notifications
2. **Frontend web interface** (`pages/`, `components/`) - Next.js app for managing alerts and viewing debug status

## Architecture

### Dual TypeScript Configuration
- `tsconfig.json` - Next.js frontend configuration
- `tsconfig.backend.json` - Backend monitoring service configuration
- Different compilation targets and module systems for each component

### Backend Monitoring (`src/`)
- `src/index.ts` - Main monitoring loop and orchestration
- `src/alertManager.ts` - Core logic for checking court availability via API
- `src/websiteChecker.ts` - Playwright wrapper for web scraping/API calls
- `src/stateManager.ts` - Tracks which slots have been notified to prevent duplicates
- `src/debugLogger.ts` - Writes real-time status to `data/debug-status.json` for web console
- `src/config.ts` - Environment variable configuration loading
- `src/telegram.ts` - Telegram Bot API integration for notifications

### Frontend Web App (`pages/`, `components/`)
- `pages/index.tsx` - Main dashboard for managing alerts
- `pages/api/alerts/` - REST API endpoints for CRUD operations on alerts
- `pages/api/debug/status.ts` - Provides real-time monitoring status to debug console
- `components/DebugConsole.tsx` - Sticky bottom console showing live monitoring status
- `lib/storage.ts` - File-based alert persistence (`data/alerts.json`)

### Data Flow
1. Backend reads alerts from `data/alerts.json`
2. Makes API calls to Eversports court booking system
3. Compares available slots against alert criteria
4. Sends Telegram notifications for new matches
5. Updates debug status in `data/debug-status.json`
6. Frontend polls debug API every 5 seconds to show live status

## Common Development Commands

### Frontend Development
```bash
npm run dev              # Start Next.js development server (port 3000)
```

### Backend Monitoring
```bash
npm run monitor          # Run monitoring service with ts-node (development)
npm run dry-run          # Single check run without continuous monitoring
npm run build            # Compile backend TypeScript to dist/
npm start                # Run compiled backend from dist/
```

### Production Deployment
Backend monitoring should run as a long-lived process:
```bash
npm run build && npm start
# Or for background execution:
nohup npm run monitor > squash-watcher.log 2>&1 &
```

## Environment Configuration

Required environment variables (see `.env.example`):
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID` - Required for notifications
- `API_ENABLED=true` - Enables court monitoring
- `FACILITY_ID` - Eversports facility identifier
- `CHECK_INTERVAL` - Polling frequency in milliseconds (default 300000 = 5min)
- `TARGET_URL` - Optional website monitoring (can be disabled)

## Key Implementation Details

### Eversports API Logic - CRITICAL UNDERSTANDING
**The Eversports API returns ALREADY BOOKED slots (unavailable times), NOT available slots.**

The monitoring logic works by:
1. Fetching all booked slots for target dates/courts from the API
2. Creating a map of booked time slots per court
3. Checking desired time slots against this map - any slot NOT in the booked list is available
4. Available slots (gaps in the booked schedule) trigger notifications

This inverse logic is crucial - the API endpoint `/api/slot` returns occupied slots, so available times are determined by absence from the response.

### API Response Handling
The Eversports API returns nested JSON structure `{"slots":{"slots":[]}}` that required special parsing logic in `alertManager.ts` to handle both flat and nested response formats.

### State Management
The `StateManager` uses a simple file-based approach to prevent duplicate notifications for the same court slot, persisting state between restarts.

### Debug Console Integration
The monitoring service writes real-time status to `data/debug-status.json` which is consumed by the web interface's debug console for live monitoring visibility.

### Alert-Based Monitoring
The system moved from hardcoded monitoring parameters to dynamic alert-based configuration, reading from `data/alerts.json` created through the web interface.