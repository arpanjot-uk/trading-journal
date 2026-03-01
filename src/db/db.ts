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
  notes: {
    emotion: string;
    technical: string;
    other: string;
  };
  duration: number; // Duration in minutes
}

export interface Settings {
  id?: number;
  pairs: string[];
  strategies: StrategyDefinition[];
}

const db = new Dexie('TradingJournalDB') as Dexie & {
  journals: EntityTable<Journal, 'id'>;
  trades: EntityTable<Trade, 'id'>;
  settings: EntityTable<Settings, 'id'>;
};

// Schema declaration
db.version(1).stores({
  journals: '++id, name, createdAt, updatedAt',
  trades: '++id, journalId, openDate, closeDate, pair, strategy, direction, result',
  settings: '++id, pairs, strategies'
});

export const initializeSettings = async () => {
  const existingSettings = await db.settings.toArray();
  if (existingSettings.length === 0) {
    await db.settings.add({
      pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'US30'],
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
