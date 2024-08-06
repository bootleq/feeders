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

export const rejectFirst = R.curry((pred, list) => {
  const index = R.findIndex(pred, list);
  return index === -1 ? list : [...list.slice(0, index), ...list.slice(index + 1)];
});

export const parseFormData = (formData: FormData) => {
  const result = Object.fromEntries(formData);

  return R.map(v => v === '' ? null : v)(result);
}

export const sleep = (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};
