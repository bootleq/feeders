import { describe, expect, test } from 'vitest';

import { wordWord, jsonReviver } from './utils';

describe('wordWord', () => {
  test('simple case', () => {
    expect(wordWord('中文https://a.com/foo.png中文foo'))
      .toBe('中文 https://a.com/foo.png 中文 foo');
  });

  test.todo('english punctuations', () => {
    const input  = "Were,you.rushing;or?were(you)dragging! I'm upset...Louder~";
    const output = "Were, you. rushing; or? were (you) dragging! I'm upset... Louder~";
    expect(wordWord(input))
      .toBe(output);
  });

  test('emoji', () => {
    const input  = '1 🥦🥕Look👌ToMe可以😅';
    const output = '1 🥦🥕Look👌ToMe 可以😅';
    expect(wordWord(input))
      .toBe(output);
  });
});

describe('jsonReviver', () => {
  test('revives Date', () => {
    const dateStr = '2024-08-17T21:25:18.000Z';
    const obj = {
      foo: 'bar',
      addedAt: new Date(dateStr),
    };
    const json = JSON.stringify(obj);

    expect((JSON.parse(json, jsonReviver)))
      .toEqual(obj);
  });
});
