import { load } from 'cheerio/slim'; // 用 slim 版本，跳過 parse5，只留 htmlparser2，縮小 bundle

export function htmlToText(html: string | null | undefined): string {
  if (!html) return '';

  const $ = load(html);

  // <table> 先整個攤平成 Markdown 表格文字，再處理其他元素——
  // 避免表格內如果剛好有 <li> 之類的元素，被下面的清單邏輯重複處理。
  $('table').each((_, el) => {
    const $table = $(el);
    const rows: string[][] = [];

    $table.find('tr').each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .find('th, td')
        .each((_, cell) => {
          const text = $(cell).text().replace(/\s+/g, ' ').trim();
          cells.push(text.replace(/\|/g, '\\|')); // 跳脫儲存格內容裡的 |，避免弄亂表格結構
        });
      if (cells.length) rows.push(cells);
    });

    if (rows.length === 0) {
      $table.remove();
      return;
    }

    const [header, ...body] = rows;
    const lines = [
      `| ${header.join(' | ')} |`,
      `| ${header.map(() => '---').join(' | ')} |`,
      ...body.map((row) => `| ${row.join(' | ')} |`),
    ];

    $table.replaceWith(`\n${lines.join('\n')}\n`);
  });

  $('br').replaceWith('\n');

  $('p').each((_, el) => {
    $(el).prepend('\n');
    $(el).append('\n');
  });

  // 巢狀清單：先讓每個 <ul>/<ol> 自己換行獨立成一段，
  // 再依照巢狀深度（有幾層祖先 ul/ol）決定縮排量。
  $('ul, ol').each((_, el) => {
    $(el).prepend('\n');
  });

  $('li').each((_, el) => {
    const depth = $(el).parents('ul, ol').length;
    const indent = '  '.repeat(Math.max(depth - 1, 0));
    $(el).prepend(`${indent}- `);
    $(el).append('\n');
  });

  return normalizeWhitespace($.root().text());
}

function normalizeWhitespace(text: string): string {
  // 逐行處理：只收斂「行內」多餘的空白，保留行首縮排
  // （巢狀清單靠這個縮排表示層級，不能被無腦壓成一個空白）。
  return text
    .split('\n')
    .map((line) => {
      const [, indent = '', rest = ''] = line.match(/^( *)(.*)$/) ?? [];
      return indent + rest.replace(/[ \t]+/g, ' ').trim();
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
