import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';
import { load } from 'cheerio/slim';
import { normalizeFact } from '@/lib/build/ai/normalizeFact';
import { htmlToText } from '@/lib/ai/html';
import { ACT_ABBRS } from '@/app/laws/store';
import { APP_URL } from '@/lib/utils';

const FACTS_DIR = path.resolve('directus/build/cms/facts');
const FACTS_MD_DIR = path.resolve('directus/build/ai/facts');

const LAWS_JSON_PATH = path.resolve('directus/build/cms/laws.json');
const LAWS_MD_DIR = path.resolve('directus/build/ai/laws');

const TITLE_MAX_CHARS = 24;

// ---------- 共用小工具 ----------

// 用 Array.from 而不是直接 slice 字串，避免萬一標題含有 surrogate pair
// （罕見，但 emoji 等字元會是兩個 UTF-16 code unit）被從中間切斷。
function truncateTitle(title) {
  const chars = Array.from(title ?? '');
  if (chars.length <= TITLE_MAX_CHARS) return chars.join('');
  return chars.slice(0, TITLE_MAX_CHARS).join('') + '…';
}

function sanitizeFilenamePart(s) {
  return s.replace(/[\/\\:*?"<>|]/g, '_');
}

// 內容跟既有檔案一樣就跳過，不重寫、不列進 changed 計數。
function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content) return 'skipped';
  }
  fs.writeFileSync(filePath, content);
  return 'written';
}

// 幫一批項目同步 markdown 檔案：寫入/略過未變動/清掉標題變動後的舊檔名/
// 清掉來源已經不存在的孤兒檔案。Fact 跟 Law 共用這段邏輯，只是各自提供
// id/檔名/內容怎麼算。
function syncMarkdownFiles(dir, items, { idOf, filenameOf, contentOf, label }) {
  fs.mkdirSync(dir, { recursive: true });

  const currentFilenames = new Set();
  let written = 0;
  let skipped = 0;
  let failed = 0;

  for (const item of items) {
    try {
      const id = idOf(item);
      const filename = filenameOf(item);
      currentFilenames.add(filename);

      // 標題可能改變，檔名會跟著變——先清掉這個 id 底下、檔名不是目前
      // 這個的舊檔案，避免留下標題已過期的孤兒檔案。
      const prefix = `${id} `;
      for (const name of fs.readdirSync(dir)) {
        if (name !== filename && name.startsWith(prefix) && name.endsWith('.md')) {
          fs.unlinkSync(path.join(dir, name));
        }
      }

      const result = writeIfChanged(path.join(dir, filename), contentOf(item));
      if (result === 'written') written += 1;
      else skipped += 1;
    } catch (error) {
      failed += 1;
      console.error(chalk.yellow(`  [${label}] id=${idOf(item)} 處理失敗，略過：${error.message ?? error}`));
    }
  }

  let removedOrphans = 0;
  for (const name of fs.readdirSync(dir)) {
    if (name.endsWith('.md') && !currentFilenames.has(name)) {
      fs.unlinkSync(path.join(dir, name));
      removedOrphans += 1;
    }
  }

  return { written, skipped, failed, removedOrphans };
}

function printSummary(label, stats) {
  console.log(chalk.bold(`\n=== build_markdown（${label}）完成 ===`));
  console.log(chalk.green(`寫入：${stats.written}`));
  console.log(chalk.gray(`未變動略過：${stats.skipped}`));
  if (stats.failed) console.log(chalk.yellow(`失敗略過：${stats.failed}`));
  if (stats.removedOrphans) console.log(chalk.red(`清除孤兒檔案：${stats.removedOrphans}`));
}

// ---------- Facts ----------

function listFactFiles(factsDir) {
  return fs
    .readdirSync(factsDir)
    .filter((f) => /^\d+\.json$/.test(f))
    .map((f) => ({
      factId: parseInt(f, 10),
      filePath: path.join(factsDir, f),
    }));
}

function factUrl(f) {
  const anchor = `fact-${f.normalized.date}_${f.factId}`;
  const zoomPath = `facts/${anchor.replace('fact-', '')}/`;
  return `${APP_URL}${zoomPath}`;
}

function factToMarkdown(f) {
  const { title, date, year, tags, descText, summaryText } = f.normalized;

  const blocks = [`# ${date}: ${title ?? `Fact ${f.factId}`}`];

  if (summaryText) blocks.push(['## 摘要', '', summaryText].join('\n'));
  if (descText) blocks.push(['## 內容', '', descText].join('\n'));

  blocks.push(
    [
      '---',
      `year: ${JSON.stringify(year ?? null)}`,
      ...(tags && tags.length ? [`tags: ${JSON.stringify(tags)}`] : []),
      `url: ${factUrl(f)}`,
    ].join('\n')
  );

  return blocks.join('\n\n') + '\n';
}

function buildFactsMarkdown() {
  const files = listFactFiles(FACTS_DIR);
  const facts = [];
  const skippedOnError = [];

  for (const { factId, filePath } of files) {
    try {
      const raw = fs.readFileSync(filePath, 'utf8');
      const fact = JSON.parse(raw);
      facts.push({ factId, normalized: normalizeFact(fact) });
    } catch (error) {
      skippedOnError.push({ factId, error: error.message ?? String(error) });
    }
  }

  if (skippedOnError.length) {
    console.log(chalk.bgRed.white(`\n[facts] 有 ${skippedOnError.length} 筆解析失敗，已跳過：`));
    for (const { factId, error } of skippedOnError) {
      console.log(chalk.red(`  fact-${factId}: ${error}`));
    }
  }

  const stats = syncMarkdownFiles(FACTS_MD_DIR, facts, {
    idOf: (f) => f.factId,
    filenameOf: (f) => `${f.factId} ${sanitizeFilenamePart(truncateTitle(f.normalized.title))}.md`,
    contentOf: factToMarkdown,
    label: 'facts',
  });

  printSummary('facts', stats);
}

// ---------- Laws ----------

function listLawItems() {
  const raw = fs.readFileSync(LAWS_JSON_PATH, 'utf8');
  const { byAct } = JSON.parse(raw);
  return Object.values(byAct).flat();
}

function lawAnchor(law) {
  const abbr = ACT_ABBRS[law.act] ?? law.act;
  return `${abbr}_${law.article}`;
}

function lawUrl(law) {
  return `${APP_URL}laws/#${lawAnchor(law)}`;
}

function lawHeading(law) {
  return `${law.act} ${law.article} ${law.title}`;
}

function lawFilenameTitle(law) {
  const abbr = ACT_ABBRS[law.act] ?? law.act;
  return `${abbr} ${law.article} ${law.title}`;
}

// 案例清單裡的 <a href> 用 reference-style link（[文字][]，定義另外集中列出），
// 避免長網址混在內文中。同一個 label 重複但對應不同網址時，用「label N」編號
// 讓 label 唯一；同一組 (文字, 網址) 重複出現則重用既有 label。
function createLinkRegistry() {
  const urlByLabel = new Map();
  const labelByPair = new Map();
  const order = [];

  function referenceFor(text, href) {
    const base = text || href;
    const pairKey = `${base} ${href}`;
    if (labelByPair.has(pairKey)) return labelByPair.get(pairKey);

    let label = base;
    let n = 2;
    while (urlByLabel.has(label) && urlByLabel.get(label) !== href) {
      label = `${base} ${n}`;
      n += 1;
    }

    urlByLabel.set(label, href);
    labelByPair.set(pairKey, label);
    order.push({ label, href });
    return label;
  }

  function definitions() {
    return order.map(({ label, href }) => `[${label}]: ${href}`);
  }

  return { referenceFor, definitions };
}

// <li> 轉成一行 markdown，跟 htmlToText 不同的是刻意保留 <a href>——
// 案例的判決書/新聞連結是可查證的引用來源，丟掉連結會讓案例變得不可追溯。
function liToMarkdownLine($, li, registry) {
  const $li = $(li).clone();
  $li.find('a').each((_, a) => {
    const $a = $(a);
    const href = $a.attr('href');
    const text = $a.text().trim();
    if (!href) {
      $a.replaceWith(text);
      return;
    }
    const label = registry.referenceFor(text, href);
    $a.replaceWith(`[${label}][]`);
  });
  return $li.text().replace(/\s+/g, ' ').trim();
}

// judgements 有兩種形狀：
// (a) 單一 <ul> 案例列表，沒有成立/不成立的框架 -> 全部歸在 general
// (b) <p><strong>成立</strong></p><ul>...</ul><p><strong>不成立</strong></p><ul>...</ul>
//     -> 拆成 established / notEstablished
// 不強行把 (a) 套上「成立」標籤——原始資料沒有明確這樣講，用「成立」框
// 它是腦補，寧可維持中性的 general，渲染時才不會誤導。
function parseJudgements(html, registry) {
  const result = { established: [], notEstablished: [], general: [] };
  if (!html) return result;

  const $ = load(html);
  let bucket = result.general;

  $.root()
    .children()
    .each((_, el) => {
      const tag = el.tagName?.toLowerCase();

      if (tag === 'p') {
        const label = $(el).find('strong').first().text().trim();
        if (label === '成立') bucket = result.established;
        else if (label === '不成立') bucket = result.notEstablished;
        return;
      }

      if (tag === 'ul' || tag === 'ol') {
        $(el)
          .find('li')
          .each((_, li) => {
            bucket.push(liToMarkdownLine($, li, registry));
          });
      }
    });

  return result;
}

function lawToMarkdown(law) {
  const registry = createLinkRegistry();
  const blocks = [`# ${lawHeading(law)}`];

  const summaryText = htmlToText(law.summary);
  if (summaryText) blocks.push(['## 摘要', '', summaryText].join('\n'));

  const { established, notEstablished, general } = parseJudgements(law.judgements, registry);
  if (established.length || notEstablished.length || general.length) {
    const caseBlocks = ['## 案例'];
    if (general.length) caseBlocks.push(general.map((s) => `- ${s}`).join('\n'));
    if (established.length) {
      caseBlocks.push(['### 成立', established.map((s) => `- ${s}`).join('\n')].join('\n\n'));
    }
    if (notEstablished.length) {
      caseBlocks.push(['### 不成立', notEstablished.map((s) => `- ${s}`).join('\n')].join('\n\n'));
    }
    blocks.push(caseBlocks.join('\n\n'));
  }

  const refs = registry.definitions();
  if (refs.length) blocks.push(refs.join('\n'));

  const penaltyText = htmlToText(law.penalty);
  if (penaltyText) blocks.push(['## 罰則', '', penaltyText].join('\n'));

  const tags = (law.tags ?? []).filter(Boolean);
  const footerLines = ['---'];
  if (tags.length) footerLines.push(`tags: ${JSON.stringify(tags)}`);
  if (law.effectiveAt) footerLines.push(`effectiveAt: ${JSON.stringify(law.effectiveAt)}`);
  footerLines.push(`url: ${lawUrl(law)}`);
  blocks.push(footerLines.join('\n'));

  return blocks.join('\n\n') + '\n';
}

function buildLawsMarkdown() {
  const laws = listLawItems();

  const stats = syncMarkdownFiles(LAWS_MD_DIR, laws, {
    idOf: (law) => law.id,
    filenameOf: (law) => `${law.id} ${sanitizeFilenamePart(truncateTitle(lawFilenameTitle(law)))}.md`,
    contentOf: lawToMarkdown,
    label: 'laws',
  });

  printSummary('laws', stats);
}

// ---------- main ----------

buildFactsMarkdown();
buildLawsMarkdown();
