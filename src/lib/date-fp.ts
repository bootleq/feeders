import * as R from 'ramda';

import { zhTW } from 'date-fns/locale/zh-TW';

import {
  formatDistanceToNow as formatDistanceToNowOriginal,
} from 'date-fns';

import {
  subDays,
  addHours,
  formatWithOptions as format,
  formatISOWithOptions as formatISO,
} from 'date-fns/fp';

// this is NOT functional style
const formatDistanceToNow = (date: Date) => {
  const options = {
    locale: zhTW,
    addSuffix: true,
  };
  return formatDistanceToNowOriginal(date, options);
};

export {
  subDays,
  addHours,
  format,
  formatISO,
  formatDistanceToNow,
};
