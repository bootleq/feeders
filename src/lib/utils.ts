import * as R from 'ramda';
import { z } from 'zod';
import { parseZonedDateTime } from '@internationalized/date';

export type AnyFunction = (...args: any[]) => any;

export const SITE_NAME = 'Feeders';
export const APP_URL = new URL(process.env.NEXT_PUBLIC_APP_URL!);
export const ACCESS_CTRL = process.env.NEXT_PUBLIC_ACCESS_CTRL || 'close';
export const ENABLE_ACTIVATE = process.env.NEXT_PUBLIC_ENABLE_ACTIVATE || 'off';

export const present = R.both(R.isNotNil, R.isNotEmpty);
export const blank = R.complement(present);

export const cmsBuiltURL = (path: string) => {
  const r2Path = process.env.NEXT_PUBLIC_R2_URL_PATH;
  const buildKey = process.env.NEXT_PUBLIC_CMS_BUILD_KEY;
  const url = `${r2Path}/cms/${path}?at${buildKey}`;
  return url;
}

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

export const parseSlug = (slug: string) => {
  const [head, tail] = slug.split('-', 2);
  const id = Number.parseInt(head, 10);
  return [id, tail] as [number, string];
};

export const removeFirst = (pred: (a: any) => boolean) => R.converge(
  (index: number, list: Array<any>) => {
    if (index > -1) {
      return R.remove(index, 1, list);
    }
    return list;
  },
  [
    R.findIndex(pred),
    R.identity
  ]
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

export const jsonReviver = (key: string, value: any) => {
  if (key.endsWith('At') && typeof value === 'string') {
    return new Date(value);
  }

  return value;
};

// (internationalized/date) ZondedDateTime => Date
// Example: '2024-08-10T20:24:29.444+08:00[Asia/Taipei]' => Date
export const zondedDateTimeSchema =
  z.string()
  .transform(v => v.replace(/\[\w+\/\w+]$/, ''))
  .pipe(z.string().datetime({ offset: true }))
  .pipe(z.coerce.date())
  .nullish();

export const sleep = (seconds: number) => {
  return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
};

// Workaround DatePicker loses timezond when value has once deleted
// https://github.com/adobe/react-spectrum/issues/6005
export const ariaDatePickerValueFix = (formData: FormData, fieldNames: string[]) => {
  fieldNames.forEach(k => {
    const v = formData.get(k);
    // e.g., convert 2024-08-07T00:00:00 to ZondedDateTime string
    if (typeof v === 'string' && v.match(/T[\d:]+$/)) {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const converted = parseZonedDateTime(`${v}[${tz}]`);
      formData.set(k, converted.toString());
    }
  });
};
