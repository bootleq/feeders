import { describe, expect, test } from 'vitest';

import { t } from './i18n';

describe('translate', () => {
  test('simple case', () => {
    expect(t('spotAction', 'investig')).toBe('調查');
  });
});
