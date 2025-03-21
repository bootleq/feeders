import { readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { faker as faker, type AnimalModule } from '@faker-js/faker';

import { slugify, wordWord } from '@/lib/utils';
import * as srcSchema from '@/lib/schema';

export const getLocalDB = () => {
  const dbDir = '.wrangler/state/v3/d1/miniflare-D1DatabaseObject';
  const files = readdirSync(dbDir);
  const basename = files.find(f => f.endsWith('.sqlite'));

  if (!basename) {
    throw new Error(`Can find sqlite db in dir:\n  ${dbDir}`);
  }
  const file = join(dbDir, basename);
  const sqlite = new Database(file, { fileMustExist: true });
  return drizzle(sqlite, { schema });
};

export const schema = srcSchema;


interface KnownAnimal extends AnimalModule {
  [key: string]: any
}
const animalTypes = [
  'bear',
  'bird',
  'cetacean',
  'cow',
  'crocodilia',
  'fish',
  'horse',
  'insect',
  'lion',
  'rabbit',
  'rodent',
  'snake',
];

export const fakeAnimal = () => {
  const type = faker.helpers.arrayElement(animalTypes);
  const mod = faker.animal as KnownAnimal;
  const fn = mod[type];

  const adj = faker.word.adjective();
  const animal = fn();

  return slugify(`${adj} ${animal}`);
}

const fakeQuoteCollection = [
  '沒事我餵餵',
  '我……超有愛心',
  '先浪狗變少，再浪狗變少',
  '回收是垃圾，亂丟就是愛心',
  '流浪狗並不代表社會的文明或慈悲，相反地，牠們顯露了群眾的無知和遲鈍',
  '那你為什麼不養在家裡呢',
  '不愛他，也不要亂餵他',
  '可以不愛，但請不要餵食',
  '為尊重動物生命及保護動物、增進動物福利，特制定本法',
  '指犬、貓及其他人為飼養或管領之脊椎動物，包括經濟動物、實驗動物、寵物及其他動物',
];

const fakeImgSrcCollection = [
  'https://i.imgur.com/Sxfgtso.png', // 戶外墓、未紮母犬
  'https://i.imgur.com/kdRR92J.jpeg', // 標記怪手旁的位置
  'https://i.imgur.com/T6rKVGf.jpeg', // 雞冠
  'https://i.imgur.com/m0SQdri.jpeg', // 小巷菜園地面
  'https://i.imgur.com/JK8nW7X.jpeg', // 雞頭分離
  'https://i.imgur.com/T6rKVGf.jpeg', // 雞冠
  'https://i.imghippo.com/files/j6p1W1721814316.webp', // 戶外墓、爽吃
  'https://iili.io/dxz6PLJ.webp', // 私人墓、兩橫排
  'https://iili.io/dxz6sqv.webp', // 私人墓、台前
];

export const fakeQuote = () => {
  return faker.helpers.arrayElement(fakeQuoteCollection);
}

// Random (quote + animal name mixed within) x 2 + imgSrc
export const fakeText = () => {
  const parts = [0, 1].map(i => {
    const quote = fakeQuote();
    const animal = fakeAnimal();
    const insertAt = Math.floor(Math.random() * (quote.length + 1));
    const result = quote.slice(0, insertAt) + animal + quote.slice(insertAt);
    return result;
  });

  const imgSrc = faker.helpers.arrayElement(fakeImgSrcCollection);

  return wordWord(
    faker.helpers.shuffle([...parts, imgSrc]).join('')
  );
};
