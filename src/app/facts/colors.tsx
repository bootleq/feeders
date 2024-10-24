import * as R from 'ramda';

const ensureTWClassNames = {
  colors: {
    'slate-5':   ['bg-slate-500',   'text-white'],
    'stone-3':   ['bg-stone-300',   'text-black'],
    'neutral-7': ['bg-neutral-700', 'text-white'],
    'red-3':     ['bg-red-300',     'text-black'],
    'red-8':     ['bg-red-800',     'text-white'],
    'orange-2':  ['bg-orange-200',  'text-black'],
    'orange-7':  ['bg-orange-700',  'text-white'],
    'amber-3':   ['bg-amber-300',   'text-black'],
    'yellow-2':  ['bg-yellow-200',  'text-black'],
    'yellow-6':  ['bg-yellow-600',  'text-black'],
    'lime-2':    ['bg-lime-200',    'text-black'],
    'green-2':   ['bg-green-200',   'text-black'],
    'green-8':   ['bg-green-800',   'text-white'],
    'teal-7':    ['bg-teal-700',   'text-white'],
    'cyan-3':    ['bg-cyan-300',    'text-black'],
    'sky-2':     ['bg-sky-200',     'text-black'],
    'indigo-2':  ['bg-indigo-200',  'text-black'],
    'violet-3':  ['bg-violet-300',  'text-black'],
    'fuchsia-3': ['bg-fuchsia-300', 'text-black'],
    'pink-3':    ['bg-pink-300',    'text-black'],
    'rose-2':    ['bg-rose-200',    'text-black'],
    'white':     ['bg-white',       'text-slate-500'],
    'fallback':  ['bg-slate-100',   'text-black'],
  },
};

const tagColors = {
  '狂犬病': 'pink-3',
  '人犬衝突': 'red-3',
  '人身': 'red-8',
  '源頭管理': 'green-2',
  '收容': 'lime-2',
  'TNR': 'amber-3',
  '毒殺': 'yellow-2',
  '餵食': 'neutral-7',
  '安樂死': 'sky-2',
  '捕犬': 'stone-3',
  '統計': 'fuchsia-3',
  '教育': 'orange-2',
  '立法': 'indigo-2',
  '虐待': 'cyan-3',
  '犬殺': 'orange-7',
  '新北市': 'rose-2',
  '台南市': 'green-8',
  '高雄市': 'violet-3',
  '民間狗場': 'teal-7',
  '犬獸衝突': 'slate-5',
  '社運': 'yellow-6',
  '': 'white',
};

export const getTagColor = (key: string) => {
  const colorName = R.propOr('fallback', key, tagColors) as keyof typeof ensureTWClassNames.colors;
  const value = ensureTWClassNames.colors[colorName];
  return value;
}
