import { describe, it, expect } from 'vitest';
import { normalizeFact, parseYear, type RawFact } from './normalizeFact';

describe('parseYear', () => {
  it('解析標準 ISO 日期', () => {
    expect(parseYear('1971-05-01')).toBe(1971);
  });

  it('解析短數字日期', () => {
    expect(parseYear('0268')).toBe(268);
  });

  it('解析 BC 日期', () => {
    expect(parseYear('~2550 BC')).toBe(-2550);
  });
});

describe('normalizeFact', () => {
  const raw: RawFact = {
    id: 14,
    status: 'published',
    date: '1971-05-01',
    title: '台北市成立專屬捕犬隊',
    desc: '<p>台北市清潔處今起派車捕殺野犬</p><ul><li>項目一</li><li>項目二</li></ul>',
    summary: null,
    origin: '<ul><li><a href="https://example.com">來源</a></li></ul>',
    tags: ['台北市', '捕犬'],
    insights: [],
  };

  it('desc 轉成純文字，保留清單結構', () => {
    const result = normalizeFact(raw);
    expect(result.descText).toContain('台北市清潔處今起派車捕殺野犬');
    expect(result.descText).toContain('- 項目一');
    expect(result.descText).toContain('- 項目二');
  });

  it('summary 為 null 時，summaryText 是空字串', () => {
    const result = normalizeFact(raw);
    expect(result.summaryText).toBe('');
  });

  it('summary 有值時會轉成 summaryText', () => {
    const result = normalizeFact({ ...raw, summary: '<p>簡短摘要</p>' });
    expect(result.summaryText).toBe('簡短摘要');
  });

  it('從 date 解析出 year', () => {
    expect(normalizeFact(raw).year).toBe(1971);
  });

  it('保留 title/date/tags 原樣', () => {
    const result = normalizeFact(raw);
    expect(result.title).toBe('台北市成立專屬捕犬隊');
    expect(result.date).toBe('1971-05-01');
    expect(result.tags).toEqual(['台北市', '捕犬']);
  });
});
