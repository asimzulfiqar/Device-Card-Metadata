import { evaluateExpression, relativeTime, statusFor, substituteUrl, withCustomFields } from './utils';

describe('device card utilities', () => {
  it('evaluates safe derived expressions', () => {
    expect(evaluateExpression('round(battery * 100, 1)', { battery: 0.927 })).toBe(92.7);
    expect(evaluateExpression('concat(site, " - ", type)', { site: 'Berlin', type: 'pump' })).toBe('Berlin - pump');
    expect(evaluateExpression('coalesce(owner, "Unknown")', { owner: null })).toBe('Unknown');
  });

  it('evaluates custom fields in declaration order', () => {
    expect(withCustomFields({ battery: 0.5 }, [{ name: 'percent', expression: 'battery * 100' }, { name: 'label', expression: 'concat(percent, "%")' }]).values.label).toBe('50%');
  });

  it('matches status rules in order', () => {
    expect(statusFor(81, [{ operator: 'gte', value: '80', color: 'red' }])?.color).toBe('red');
  });

  it('substitutes encoded row values in URLs', () => {
    expect(substituteUrl('/device/{id}?site={site}', { id: 'pump 1', site: 'Berlin / north' })).toBe('/device/pump%201?site=Berlin%20%2F%20north');
  });

  it('formats relative times', () => {
    expect(relativeTime(Date.UTC(2026, 0, 1, 10), Date.UTC(2026, 0, 1, 12))).toBe('2h ago');
  });
});
