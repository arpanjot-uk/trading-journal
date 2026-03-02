import Dexie, { type EntityTable } from 'dexie';

export interface Journal {
  id?: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  startingBalance: number;
}

export type TradeResult = 'Win' | 'Loss' | 'Break Even';

export interface StrategyDefinition {
  name: string;
  checklist: {
    section: string;
    questions: string[];
  }[];
}

export interface Trade {
  id?: number;
  journalId: number;
  openDate: string; // ISO string 
  closeDate: string; // ISO string
  timeframe: string; // e.g. "5m", "15m", "1H"
  pair: string;
  strategy: string;
  checklistAnswers?: Record<string, string>; // e.g. "Conviction Level": "High"
  direction: 'Buy' | 'Sell';
  tradeNumber: number; // Trade number of the day
  lots: number;
  result: TradeResult;
  rr: number; // Risk-Reward ratio
  sl: number; // Stop Loss (pips/ticks)
  tp: number; // Take Profit (pips/ticks)
  pnl: number;
  netPnl: number;
  tvLink?: string; // TradingView link
  screenshotUrl?: string; // Additional or alternative chart screenshot link
  notes: {
    emotion: string;
    technical: string;
    other: string;
  };
  duration: number; // Duration in minutes
}

export interface DailyMood {
  id?: number;
  journalId: number;
  date: string; // "YYYY-MM-DD"
  moodScore: number; // 1 to 5
  energyLevel: number; // 1 to 100
  stressLevel: number; // 1 to 100
  sleepHours: number;
  dietScore: string; // e.g., "Clean", "Moderate", "Heavy Junk"
  caffeineIntake: string; // e.g., "None", "1-2 cups"
  exercised: boolean;
  screenTime?: number;
  notes?: string;
}

export interface Settings {
  id?: number;
  pairs: string[];
  strategies: StrategyDefinition[];
  enableMoodTracker: boolean;
}

const db = new Dexie('TradingJournalDB') as Dexie & {
  journals: EntityTable<Journal, 'id'>;
  trades: EntityTable<Trade, 'id'>;
  settings: EntityTable<Settings, 'id'>;
  dailyMoods: EntityTable<DailyMood, 'id'>;
};

// Schema declaration
db.version(2).stores({
  journals: '++id, name, createdAt, updatedAt',
  trades: '++id, journalId, openDate, closeDate, pair, strategy, direction, result',
  settings: '++id, pairs, strategies, enableMoodTracker',
  dailyMoods: '++id, journalId, date, moodScore'
});

export const initializeSettings = async () => {
  const existingSettings = await db.settings.toArray();
  if (existingSettings.length === 0) {
    await db.settings.add({
      pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30'],
      enableMoodTracker: true,
      strategies: [
        {
          name: 'Breakout',
          checklist: [
            {
              section: 'Market Context',
              questions: ['Is the overall trend aligning?', 'Are there any major news catalysts?']
            },
            {
              section: 'Execution',
              questions: ['Conviction Level (1-5)?', 'Did price close above the key level?']
            }
          ]
        },
        { name: 'Trend Following', checklist: [] },
        { name: 'Mean Reversion', checklist: [] },
        { name: 'SMC', checklist: [] }
      ]
    });
  }
};

export { db };
