import * as R from 'ramda';

// slugify
// Refer from @jmlweb/ramdu
// https://jmlweb.github.io/ramdu/slugify.js.html
const normalizer = R.invoker(1, 'normalize');
const wordRegexp = new RegExp(/[/\-_ ]/gi);
const deburr = R.pipe(
  normalizer('NFD'),
  R.replace(/[\u0300-\u036f]/g, ''),
);
export const slugify = R.pipe(
  R.toLower,
  deburr,
  R.split(wordRegexp),
  R.join('-'),
  R.replace(/[^a-zA-Z\d-]+/g, ''),
);

// 在中英文之間增加空白
let wordWordRegexp = new RegExp([
  /(?<![\s\p{P}\p{Emoji_Presentation}])/u, // not begin with space, punctuation, or emoji
  /\b/,
  /(?![\s\p{P}\p{Emoji_Presentation}])/u,  // not end with, also
].map(r => r.source).join(''), 'gu');
export const wordWord = R.pipe(R.replace(wordWordRegexp, ' '), R.trim);