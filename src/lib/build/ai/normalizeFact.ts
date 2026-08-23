import crypto from 'node:crypto';
import { htmlToText } from '@/lib/ai/html';

export interface RawFact {
  id: number;
  status: string;
  date: string;
  title: string;
  desc: string;
  summary: string | null;
  origin: string;
  tags: string[];
  insights?: unknown; // 忽略不處理
}

export interface NormalizedFact {
  factId: number;
  title: string;
  date: string;
  year: number;
  tags: string[];
  descText: string;
  summaryText: string;
}

/**
 * 解析 date 欄位得到 year，支援：
 *   "1971-05-01" -> 1971
 *   "0268"       -> 268
 *   "~2550 BC"   -> -2550
 */
export function parseYear(date: string): number {
  const bcMatch = date.match(/(\d+)\s*BC/i);
  if (bcMatch) {
    return -parseInt(bcMatch[1], 10);
  }

  const yearMatch = date.match(/-?\d{1,4}/);
  if (yearMatch) {
    return parseInt(yearMatch[0], 10);
  }

  throw new Error(`無法解析 year，date = "${date}"`);
}

export function normalizeFact(raw: RawFact): NormalizedFact {
  const descText = htmlToText(raw.desc);
  const summaryText = htmlToText(raw.summary);
  const year = parseYear(raw.date);
  const tags = raw.tags ?? [];

  return {
    factId: raw.id,
    title: raw.title,
    date: raw.date,
    year,
    tags,
    descText,
    summaryText,
  };
}
