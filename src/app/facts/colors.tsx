import * as R from 'ramda';

const ensureTWClassNames = {
  colors: {
    'stone-3':   ['bg-stone-300',   'text-black'],
    'red-3':     ['bg-red-300',     'text-black'],
    'orange-2':  ['bg-orange-200',  'text-black'],
    'amber-3':   ['bg-amber-300',   'text-black'],
    'lime-2':    ['bg-lime-200',    'text-black'],
    'green-2':   ['bg-green-200',   'text-black'],
    'cyan-3':    ['bg-cyan-300',    'text-black'],
    'sky-4':     ['bg-sky-400',     'text-black'],
    'indigo-3':  ['bg-indigo-300',  'text-black'],
    'violet-3':  ['bg-violet-300',  'text-black'],
    'fuchsia-3': ['bg-fuchsia-300', 'text-black'],
    'pink-3':    ['bg-pink-300',    'text-black'],
    'rose-3':    ['bg-rose-300',    'text-black'],
    'fallback':  ['bg-slate-100',   'text-black'],
  },
};

const tagColors = {
  '狂犬病': 'red-3',
  '動保法': 'green-2',
};

export const getTagColor = (key: string) => {
  const colorName = R.propOr('fallback', key, tagColors) as keyof typeof ensureTWClassNames.colors;
  const value = ensureTWClassNames.colors[colorName];
  return value;
}
