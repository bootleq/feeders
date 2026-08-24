import { describe, it, expect } from 'vitest';
import { htmlToText } from './html';

describe('htmlToText', () => {
  it('空值回傳空字串', () => {
    expect(htmlToText(null)).toBe('');
    expect(htmlToText(undefined)).toBe('');
    expect(htmlToText('')).toBe('');
  });

  it('單一段落，去除標籤只留文字', () => {
    const input = '<p>台北市清潔處今起派車捕殺野犬</p>';
    expect(htmlToText(input)).toBe('台北市清潔處今起派車捕殺野犬');
  });

  it('多個段落之間用空行分隔', () => {
    const input = '<p>第一段</p><p>第二段</p>';
    expect(htmlToText(input)).toBe('第一段\n\n第二段');
  });

  it('<br> 轉成單一換行', () => {
    const input = '<p>第一行<br>第二行</p>';
    expect(htmlToText(input)).toBe('第一行\n第二行');
  });

  it('<a> 只保留錨點文字，捨棄 href', () => {
    const input = '<p>參考<a href="https://example.com">這篇報導</a>。</p>';
    expect(htmlToText(input)).toBe('參考這篇報導。');
  });

  it('單層清單，每個項目前面加上 "- "，不縮排', () => {
    const input = '<ul><li>項目一</li><li>項目二</li></ul>';
    expect(htmlToText(input)).toBe('- 項目一\n- 項目二');
  });

  it('兩層巢狀清單，子項目縮排兩格，保留層級語意', () => {
    const input =
      '<ul><li>台北市<ul><li>捕犬隊</li><li>收容所</li></ul></li><li>台中市</li></ul>';

    expect(htmlToText(input)).toBe(
      ['- 台北市', '  - 捕犬隊', '  - 收容所', '', '- 台中市'].join('\n')
    );
  });

  it('三層巢狀清單，縮排量隨深度遞增（每層多兩格）', () => {
    const input = '<ul><li>A<ul><li>A-1<ul><li>A-1-a</li></ul></li></ul></li></ul>';

    expect(htmlToText(input)).toBe(['- A', '  - A-1', '    - A-1-a'].join('\n'));
  });

  it('<table> 轉成 Markdown 表格', () => {
    const input =
      '<table><tr><th>年份</th><th>事件</th></tr>' +
      '<tr><td>1971</td><td>設立捕犬隊</td></tr></table>';

    expect(htmlToText(input)).toBe(
      ['| 年份 | 事件 |', '| --- | --- |', '| 1971 | 設立捕犬隊 |'].join('\n')
    );
  });

  it('表格儲存格內的 <a> 只保留錨點文字（單列會被當成 header，仍會有分隔線）', () => {
    const input =
      '<table><tr><td>參考</td><td><a href="https://example.com">報導連結</a></td></tr></table>';

    expect(htmlToText(input)).toBe(
      ['| 參考 | 報導連結 |', '| --- | --- |'].join('\n')
    );
  });

  it('表格儲存格內容裡的 | 會被跳脫，不會弄亂表格結構', () => {
    const input = '<table><tr><th>A</th><th>B</th></tr><tr><td>x|y</td><td>正常</td></tr></table>';

    expect(htmlToText(input)).toBe(
      ['| A | B |', '| --- | --- |', '| x\\|y | 正常 |'].join('\n')
    );
  });
});
