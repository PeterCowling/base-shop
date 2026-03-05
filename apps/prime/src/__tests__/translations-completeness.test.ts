import path from 'node:path';

import {
  auditLocaleParity,
  formatLocaleParityIssues,
} from '~test/i18n/localeParityAudit';

describe('translations completeness', () => {
  test('TC-TRANS-01/02/03: non-EN locales match the EN filesystem baseline', () => {
    const issues = auditLocaleParity({
      baselineLocale: 'en',
      locales: ['en', 'it'],
      localesRoot: path.resolve(__dirname, '../../public/locales'),
      stubMarkers: ['[IT]'],
    });

    if (issues.length > 0) {
      throw new Error(formatLocaleParityIssues(issues));
    }
  });
});
