import { FieldType } from '@grafana/data';
import { compositeStatus, evaluateExpression, formatMetric, relativeTime, statusFor, substituteUrl, suggestMappings, timestampWarning, withCustomFields } from './utils';

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

  it('selects the worst composite health check', () => {
    expect(compositeStatus({ battery: 20, temperature: 80 }, [
      { field: 'battery', operator: 'lt', value: '40', label: 'Low battery', color: 'yellow' },
      { field: 'temperature', operator: 'gte', value: '60', label: 'High temperature', color: 'red' },
    ])?.reason).toBe('High temperature');
  });

  it('uses the Grafana field display processor when no metric override is set', () => {
    expect(formatMetric(12, { field: 'temperature' }, { config: {}, display: () => ({ text: '12', suffix: '°C' }) } as never)).toBe('12 °C');
  });

  it('suggests common mappings and numeric metrics conservatively', () => {
    const mappings = suggestMappings({ fields: [
      { name: 'device_id', type: FieldType.string },
      { name: 'status', type: FieldType.string },
      { name: 'battery', type: FieldType.number },
    ] } as never);
    expect(mappings.idField).toBe('device_id');
    expect(mappings.statusField).toBe('status');
    expect(mappings.metrics).toEqual([{ field: 'battery', label: 'battery' }]);
  });

  it('detects second-based timestamps', () => {
    expect(timestampWarning(1760000000)).toContain('seconds');
    expect(timestampWarning(1760000000000)).toBeUndefined();
  });
});
