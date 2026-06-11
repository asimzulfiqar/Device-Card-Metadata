import { FieldType } from '@grafana/data';
import {
  compositeStatus,
  evaluateExpression,
  formatDateValue,
  formatMetadataValue,
  formatMetric,
  metricColor,
  parseTrendValues,
  relativeTime,
  safeActionUrl,
  selectMetadataRow,
  statusFor,
  substituteUrl,
  suggestMappings,
  timestampWarning,
  withCustomFields,
} from './utils';

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

  it('rejects unsafe action URLs', () => {
    expect(safeActionUrl('javascript:alert(1)')).toBeUndefined();
    expect(safeActionUrl('/d/device?var-id=1')).toBe('/d/device?var-id=1');
    expect(safeActionUrl('https://example.com/device/1')).toBe('https://example.com/device/1');
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

  it('applies metric value mappings and threshold colors', () => {
    expect(formatMetric(0, { field: 'state', valueMappings: [{ value: '0', text: 'Offline', color: 'red' }] })).toBe('Offline');
    expect(metricColor(81, { field: 'cpu', thresholds: [{ operator: 'gte', value: '80', color: 'red' }] })).toBe('red');
  });

  it('selects metadata rows by variable value before row index fallback', () => {
    const rows = [{ id: 'a', value: 1 }, { id: 'b', value: 2 }];
    expect(selectMetadataRow(rows, { rowIndex: 0, metadataSelectorField: 'id', metadataSelectorValue: '$asset' }, (value) => value.replace('$asset', 'b'))?.value).toBe(2);
    expect(selectMetadataRow(rows, { rowIndex: 1, metadataSelectorField: 'id', metadataSelectorValue: 'missing' }, (value) => value)?.value).toBe(2);
  });

  it('parses trend values from arrays and delimited strings', () => {
    expect(parseTrendValues('1, 2; 3 4')).toEqual([1, 2, 3, 4]);
    expect(parseTrendValues([1, '2', null, 'x'])).toEqual([1, 2, 0]);
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

  it('formats metadata suffixes and missing values', () => {
    expect(formatMetadataValue(246.7, { kind: 'field', field: 'level', label: 'Level', unit: 'm ü. NHN', decimals: 1 })).toBe('246.7 m ü. NHN');
    expect(formatMetadataValue(Number.NaN, { kind: 'field', field: 'battery', label: 'Battery', emptyText: '-' })).toBe('-');
  });
  it('formats all numeric values with the selected locale and grouping', () => {
    expect(formatMetric(1234.5, { field: 'value', decimals: 2 }, undefined, 'en-US')).toBe('1,234.50');
    expect(formatMetric(1234.5, { field: 'value', decimals: 2 }, undefined, 'de-DE')).toBe('1.234,50');
    expect(formatMetadataValue(1234.5, { kind: 'field', field: 'value', label: 'Value', decimals: 1 }, undefined, 'de-DE')).toBe('1.234,5');
  });

  it('formats dates as date, date-time, or a custom pattern', () => {
    const date = new Date(2026, 5, 11, 14, 5, 9);
    expect(formatDateValue(date, 'custom', 'DD.MM.YYYY HH:mm:ss', 'de-DE')).toBe('11.06.2026 14:05:09');
    expect(formatDateValue(date, 'date', undefined, 'de-DE')).toBe('11.06.2026');
    expect(formatMetadataValue(date, { kind: 'field', field: 'time', label: 'Time', dateDisplay: 'custom', dateFormat: 'YYYY-MM-DD' }, undefined, 'en-US')).toBe('2026-06-11');
  });
});
