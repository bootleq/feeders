import type { Router } from 'express';

const commonCSS = `
  .mce-content-body {
    --table-border-color: #ccc;
    --extension-ring-color: rgba(200,90,90,.7);
    --extension-ring: 4px solid var(--extension-ring-color);
    --font-mono: 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', "Liberation Mono", "Courier New", monospace;

    text-autospace: normal;
  }

  h2, h3, h4 {
    font-weight: normal;
  }

  h2 {
    font-size: 1.5rem;
    line-height: 2rem;
  }

  p {
    font-size: 1rem;
    line-height: 1.5rem;
    padding-block: 0.25rem;
  }

  .text-left {
    text-align: left;
  }

  a[href] {
    color: #0c4a6e;
  }

  .font-mono {
    font-family: var(--font-mono);
  }

  .italic {
    font-style: italic;
  }

  .underline {
    text-decoration-line: underline;
  }

  .line-through {
    text-decoration-line: line-through
  }

  /* 冗長網址 */
  a.feeders-mce-lengthy {
    font-family: var(--font-mono);
    font-size: smaller;
    outline: var(--extension-ring);
    outline-width: 3px;
  }

  /* 冗長清單 */
  ol.feeders-mce-lengthy,
  ul.feeders-mce-lengthy {
    border-left: 2px solid var(--extension-ring-color);
  }
  ol.feeders-mce-lengthy li,
  ul.feeders-mce-lengthy li {
    margin-bottom: 0.5rem;
  }

  /* 表格 */
  .mce-content-body table {
    border-collapse: collapse;
    border-color: var(--table-border-color);
    margin-inline: auto;
    margin-block: 2em;
    outline: var(--extension-ring);
  }
  .mce-content-body thead {
    background-color: #cbd5e1;
  }
  .mce-content-body th {
    text-align: center;
    font-weight: bold;
    border-width: 1px;
    border-style: solid;
  }
  .mce-content-body tbody {
    border-windth: 1px;
  }
  .mce-content-body tbody td {
    border-width: 1px;
    border-style: solid;
  }
  .mce-content-body tr:nth-child(even) {
    background-color: #e2e8f0;
  }

  /* 數值表格 */
  .feeders-mce-digit td {
    font-family: var(--font-mono);
    text-align: right;
  }
  .feeders-mce-digit td.text-xs) {
    font-size: 0.825rem;
    line-height: 1rem;
  }
  .feeders-mce-digit td.feeders-mce-reset {
    text-align: revert;
    font-family: var(--font-space), var(--font-digits), 'Microsoft JhengHei', 'Noto Sans TC', 'PingFang', 'LiHei Pro', 'Meiryo', 'MS Gothic', sans-serif;
  }

`;

const articleCSS = `
  h2, h3, h4 {
    margin-inline: auto;
  }

  /* TinyMCE 自動加的暫時性 iframe 預覽容器 */
  .mce-object-iframe {
    display: block;
    margin-inline: auto;
  }
  .mce-object-iframe::before {
    content: 'IFRAME (naked)';
    font-size: x-small;
    padding: 2px 6px;
    background-color: var(--extension-ring-color);
    color: white;
    outline: var(--extension-ring);
  }
  .mce-object-iframe > iframe {
    outline: var(--extension-ring);
    max-width: 95vw;
    margin-inline: auto;
  }

  /* 圖說 */
  figure.feeders-mce-figure {
    max-width: 90%;
    outline: var(--extension-ring);
  }
  figure.feeders-mce-figure img {
    max-width: 100%;
    height: auto;
  }

  /* 內嵌容器 */
  .feeders-mce-iframe {
    padding: 0;
    position: relative;
    margin-inline: auto;
  }
  .feeders-mce-iframe::before {
    content: '內嵌容器';
    font-size: x-small;
    padding: 0;
    color: white;
    position: relative;
    top: 0;
    transform: translateY(-50%);
    outline: var(--extension-ring);
    background-color: var(--extension-ring-color);
  }
  .feeders-mce-iframe .mce-object-iframe > iframe {
  }
  .feeders-mce-iframe .mce-object-iframe::before {
    display: none;
  }

`;


export default {
  id: '',
  handler: (router: Router) => {
    router.get('/favicon.ico', (_req, res) => {
      return res.sendFile('/directus/public/favicon.ico', (err) => {
        if (err) {
          res.status(404).send('Favicon not found');
        }
      });
    });

    router.get('/tinymce/general.css', (_req, res) => {
      res.setHeader('Content-Type', 'text/css');
      return res.send(commonCSS);
    });

    router.get('/tinymce/article.css', (_req, res) => {
      res.setHeader('Content-Type', 'text/css');
      return res.send(commonCSS + articleCSS);
    });
  }
};
