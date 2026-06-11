import { DataFrame, Field, FieldType, getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { BuiltInIcon, CompositeRule, CustomField, DeviceCardOptions, MetadataRow, MetadataSection, MetricMapping, NumberLocale, SetupProfile, StatusRule, ValueMapping } from './types';

export type CardValues = Record<string, unknown>;

export const iconNames: Record<BuiltInIcon, string> = {
  device: 'mobile-android',
  server: 'server',
  cloud: 'cloud',
  wifi: 'signal',
  battery: 'battery-4',
  database: 'database',
};

export function frameRows(frame?: DataFrame): CardValues[] {
  if (!frame) {
    return [];
  }
  return Array.from({ length: frame.length }, (_, index) =>
    Object.fromEntries(frame.fields.map((field) => [field.name, field.values[index]]))
  );
}

export function fieldByName(frame: DataFrame | undefined, name: string): Field | undefined {
  return frame?.fields.find((field) => field.name === name);
}

export function isTimeField(frame: DataFrame | undefined, name: string): boolean {
  return !name || fieldByName(frame, name)?.type === FieldType.time;
}

const mappingCandidates = {
  idField: ['device_id', 'entity_id', 'asset_id', 'service', 'host', 'hostname', 'id', 'name'],
  titleField: ['display_name', 'device_name', 'service_name', 'asset_name', 'hostname', 'name'],
  subtitleField: ['owner', 'team', 'type', 'category'],
  descriptionField: ['description', 'location', 'region', 'site'],
  statusField: ['status', 'health', 'state', 'severity'],
  lastSeenField: ['last_seen', 'last_updated', 'updated_at', 'timestamp', 'time'],
  logoField: ['logo', 'icon', 'image', 'image_url'],
} satisfies Partial<Record<keyof DeviceCardOptions, string[]>>;

export function suggestMappings(frame?: DataFrame): Partial<DeviceCardOptions> {
  if (!frame) {
    return {};
  }
  const names = new Map(frame.fields.map((field) => [field.name.toLowerCase(), field.name]));
  const suggested: Partial<DeviceCardOptions> = {};
  Object.entries(mappingCandidates).forEach(([role, candidates]) => {
    const field = candidates.map((candidate) => names.get(candidate)).find(Boolean);
    if (field) {
      (suggested as Record<string, unknown>)[role] = field;
    }
  });
  const mapped = new Set(Object.values(suggested));
  suggested.metrics = frame.fields
    .filter((field) => field.type === FieldType.number && !mapped.has(field.name))
    .slice(0, 4)
    .map((field) => ({ field: field.name, label: field.name.replace(/_/g, ' ') }));
  return suggested;
}

export function profileOptions(profile: SetupProfile): Partial<DeviceCardOptions> {
  const base: Partial<DeviceCardOptions> = { setupProfile: profile, mode: 'grid', showFleetToolbar: true, showFleetSummary: true };
  if (profile === 'service') {
    return { ...base, staticIcon: 'server', layout: 'compact', metricStyle: 'list', cardTheme: 'minimal', accentStyle: 'left', groupByField: 'team' };
  }
  if (profile === 'asset') {
    return { ...base, staticIcon: 'database', layout: 'detailed', metricStyle: 'grid', cardTheme: 'neutral', accentStyle: 'none', groupByField: 'location' };
  }
  return { ...base, staticIcon: 'device', layout: 'detailed', metricStyle: 'tiles', cardTheme: 'elevated', accentStyle: 'top', groupByField: 'owner' };
}

export function timestampWarning(value: unknown): string | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return undefined;
  }
  if (value > 0 && value < 100_000_000_000) {
    return 'Timestamp appears to use seconds. Grafana time fields should use milliseconds.';
  }
  if (value > 100_000_000_000_000) {
    return 'Timestamp is unusually large. Check whether it uses microseconds or nanoseconds.';
  }
  return undefined;
}

export function relativeTime(value: unknown, now = Date.now()): string {
  const time = typeof value === 'number' ? value : new Date(String(value)).getTime();
  if (!Number.isFinite(time)) {
    return '';
  }
  const minutes = Math.max(0, Math.floor((now - time) / 60000));
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export function staleness(value: unknown, freshMinutes: number, staleMinutes: number, now = Date.now()) {
  const time = typeof value === 'number' ? value : new Date(String(value)).getTime();
  const age = (now - time) / 60000;
  if (!Number.isFinite(age)) {
    return undefined;
  }
  if (age < freshMinutes) {
    return { label: 'Fresh', color: 'green' };
  }
  if (age < staleMinutes) {
    return { label: 'Stale', color: 'yellow' };
  }
  return { label: 'Offline', color: 'red' };
}

export function statusFor(value: unknown, rules: StatusRule[]) {
  return rules.find((rule) => {
    const expected = rule.value;
    switch (rule.operator) {
      case 'equals':
        return String(value) === expected;
      case 'contains':
        return String(value).toLowerCase().includes(expected.toLowerCase());
      case 'lt':
        return Number(value) < Number(expected);
      case 'lte':
        return Number(value) <= Number(expected);
      case 'gt':
        return Number(value) > Number(expected);
      case 'gte':
        return Number(value) >= Number(expected);
    }
  });
}

export function severityForColor(color: string): number {
  return { gray: 0, green: 1, blue: 1, yellow: 2, orange: 2, red: 3 }[color.toLowerCase()] ?? 1;
}

export function compositeStatus(values: CardValues, rules: CompositeRule[]) {
  const matched = rules
    .filter((rule) => statusFor(values[rule.field], [rule]))
    .sort((left, right) => severityForColor(right.color) - severityForColor(left.color));
  const worst = matched[0];
  return worst ? { ...worst, reason: worst.label || `${worst.field} ${worst.operator} ${worst.value}` } : undefined;
}

function mappedValue(value: unknown, mappings: ValueMapping[] = []): ValueMapping | undefined {
  return mappings.find((mapping) => String(value) === mapping.value);
}

export function metricColor(value: unknown, mapping: MetricMapping): string | undefined {
  const mapped = mappedValue(value, mapping.valueMappings);
  if (mapped?.color) {
    return mapped.color;
  }
  const threshold = (mapping.thresholds ?? []).find((rule) => statusFor(value, [{ ...rule }]));
  return threshold?.color;
}

function numberFormatter(locale: NumberLocale, decimals?: number): Intl.NumberFormat {
  return new Intl.NumberFormat(locale, decimals === undefined
    ? { maximumFractionDigits: 20, useGrouping: true }
    : { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: true });
}

function localizeFormattedNumber(text: string, locale: NumberLocale): string {
  return text.replace(/-?\d+(?:\.\d+)?/, (numericText) => {
    const decimals = numericText.includes('.') ? numericText.split('.')[1].length : 0;
    return numberFormatter(locale, decimals).format(Number(numericText));
  });
}

function dateFromValue(value: unknown): Date | undefined {
  const date = value instanceof Date ? value : new Date(typeof value === 'number' ? value : String(value));
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function customDateFormat(date: Date, format: string): string {
  const parts: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  };
  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (token) => parts[token]);
}

export function formatDateValue(value: unknown, display: MetadataRow['dateDisplay'], format: string | undefined, locale: NumberLocale): string | undefined {
  const date = dateFromValue(value);
  if (!date) {
    return undefined;
  }
  if (display === 'custom') {
    return customDateFormat(date, format || 'YYYY-MM-DD HH:mm:ss');
  }
  return display === 'date'
    ? new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
    : new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
}

export function formatMetric(value: unknown, mapping: MetricMapping, field?: Field, locale: NumberLocale = 'en-US'): string {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return '-';
  }
  const mapped = mappedValue(value, mapping.valueMappings);
  if (mapped) {
    return mapped.text;
  }
  if (typeof value !== 'number') {
    return String(value);
  }
  const decimals = mapping.decimals ?? field?.config.decimals;
  const unit = mapping.unit || field?.config.unit;
  if (!mapping.unit && mapping.decimals === undefined && field?.display) {
    const display = field.display(value);
    return `${localizeFormattedNumber(display.text, locale)}${display.suffix ? ` ${display.suffix}` : ''}`;
  }
  return unit
    ? localizeFormattedNumber(getValueFormat(unit)(value, decimals).text, locale)
    : numberFormatter(locale, decimals ?? undefined).format(value);
}

export function formatMetadataValue(value: unknown, row: MetadataRow, field?: Field, locale: NumberLocale = 'en-US'): string {
  if (value === null || value === undefined || value === '' || (typeof value === 'number' && Number.isNaN(value))) {
    return row.emptyText || '-';
  }
  const timeFormat = row.unit?.match(/^time:(.*)$/i)?.[1].trim();
  if (timeFormat !== undefined || row.dateDisplay || field?.type === FieldType.time) {
    return formatDateValue(value, timeFormat !== undefined ? 'custom' : row.dateDisplay ?? 'datetime', timeFormat || row.dateFormat, locale) ?? row.emptyText ?? '-';
  }
  const formatted = formatMetric(value, { field: row.field ?? '', decimals: row.decimals }, field, locale);
  return row.unit ? `${formatted} ${row.unit}` : formatted;
}

export function substituteUrl(template: string, values: CardValues): string {
  return template.replace(/\{([^}]+)\}/g, (_, name) => encodeURIComponent(String(values[name] ?? '')));
}

export function safeActionUrl(url: string): string | undefined {
  const trimmed = url.trim();
  if (!trimmed) {
    return undefined;
  }
  if (/^(javascript|data|vbscript):/i.test(trimmed)) {
    return undefined;
  }
  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('/') || /^[A-Za-z0-9_.~-]/.test(trimmed)) {
    return trimmed;
  }
  return undefined;
}

export function selectMetadataRow(rows: CardValues[], options: Pick<DeviceCardOptions, 'rowIndex' | 'metadataSelectorField' | 'metadataSelectorValue'>, replaceVariables: (value: string) => string): CardValues | undefined {
  const selectorField = options.metadataSelectorField;
  const selectorValue = replaceVariables(options.metadataSelectorValue ?? '');
  if (selectorField && selectorValue) {
    const selected = rows.find((row) => String(row[selectorField]) === selectorValue);
    if (selected) {
      return selected;
    }
  }
  return rows[Math.max(0, options.rowIndex ?? 0)] ?? rows[0];
}

export function parseTrendValues(value: unknown): number[] {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }
  if (typeof value === 'string') {
    return value.split(/[,;\s]+/).map(Number).filter(Number.isFinite);
  }
  return [];
}

export const metadataTemplates: Record<string, MetadataSection[]> = {
  asset: [
    { title: 'Identification', rows: [
      { kind: 'field', field: 'asset_id', label: 'Asset ID', highlight: true },
      { kind: 'field', field: 'name', label: 'Name' },
      { kind: 'field', field: 'owner', label: 'Owner' },
      { kind: 'field', field: 'location', label: 'Location' },
    ] },
    { title: 'Lifecycle', rows: [
      { kind: 'field', field: 'status', label: 'Status', highlight: true },
      { kind: 'field', field: 'installed_at', label: 'Installed at' },
      { kind: 'field', field: 'serial_number', label: 'Serial number' },
    ] },
  ],
  iot: [
    { title: 'Device', rows: [
      { kind: 'field', field: 'device_id', label: 'Device ID', highlight: true },
      { kind: 'field', field: 'owner', label: 'Owner' },
      { kind: 'field', field: 'location', label: 'Location' },
      { kind: 'field', field: 'last_seen', label: 'Last seen' },
    ] },
    { title: 'Telemetry', rows: [
      { kind: 'field', field: 'battery', label: 'Battery', unit: '%', decimals: 0, highlight: true },
      { kind: 'field', field: 'temperature', label: 'Temperature', unit: 'celsius', decimals: 1 },
      { kind: 'field', field: 'rssi', label: 'RSSI', unit: 'dBm', decimals: 0 },
    ] },
  ],
  service: [
    { title: 'Service', rows: [
      { kind: 'field', field: 'service', label: 'Service', highlight: true },
      { kind: 'field', field: 'team', label: 'Team' },
      { kind: 'field', field: 'environment', label: 'Environment' },
      { kind: 'field', field: 'status', label: 'Status', highlight: true },
    ] },
    { title: 'SLO', rows: [
      { kind: 'field', field: 'latency_ms', label: 'Latency', unit: 'ms', decimals: 0 },
      { kind: 'field', field: 'error_rate', label: 'Error rate', unit: 'percentunit', decimals: 2 },
      { kind: 'field', field: 'availability', label: 'Availability', unit: 'percent', decimals: 2 },
    ] },
  ],
  water: [
    { title: 'Identifikation und Lage', rows: [
      { kind: 'field', field: 'objektkennzahl', label: 'Objektkennzahl' },
      { kind: 'field', field: 'brunnenbezeichnung', label: 'Brunnenbezeichnung', highlight: true },
      { kind: 'field', field: 'betreiber', label: 'Betreiber' },
      { kind: 'field', field: 'koordinaten', label: 'Koordinaten', highlight: true },
      { kind: 'field', field: 'landkreis', label: 'Landkreis' },
    ] },
    { title: 'Wasserzähler', rows: [
      { kind: 'field', field: 'zaehler_modell', label: 'Modell' },
      { kind: 'field', field: 'dn', label: 'Dn' },
      { kind: 'subheading', label: 'Letzte Messwerte' },
      { kind: 'field', field: 'entnahme_24h', label: 'Wasserentnahmen letzte 24h', unit: 'm³', decimals: 1 },
      { kind: 'field', field: 'erlaubte_entnahme', label: 'Erlaubte Gesamtentnahme', unit: 'm³', decimals: 0, highlight: true },
    ] },
    { title: 'Pegelsonde', rows: [
      { kind: 'field', field: 'tiefe', label: 'Tiefe', unit: 'm', decimals: 1 },
      { kind: 'field', field: 'pegelstand', label: 'Letzter Pegelstand', unit: 'm ü. NHN', decimals: 1, highlight: true },
    ] },
    { title: 'Funkeinheit', rows: [
      { kind: 'field', field: 'funk_modell', label: 'Modell' },
      { kind: 'field', field: 'funk_geraetenummer', label: 'Gerätenummer' },
      { kind: 'field', field: 'batteriestand', label: 'Batteriestand', unit: '%', decimals: 0, emptyText: '-' },
    ] },
  ],
};

type Token = { type: 'number' | 'string' | 'identifier' | 'punctuation'; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  const pattern = /\s*(?:(\d+(?:\.\d+)?)|("(?:[^"\\]|\\.)*")|([A-Za-z_][A-Za-z0-9_]*)|([()+\-*/,]))/gy;
  let offset = 0;
  while (offset < expression.length) {
    pattern.lastIndex = offset;
    const match = pattern.exec(expression);
    if (!match) {
      throw new Error(`Unexpected token near "${expression.slice(offset, offset + 12)}"`);
    }
    const [, number, string, identifier, punctuation] = match;
    tokens.push({
      type: number ? 'number' : string ? 'string' : identifier ? 'identifier' : 'punctuation',
      value: number || string || identifier || punctuation,
    });
    offset = pattern.lastIndex;
  }
  return tokens;
}

export function evaluateExpression(expression: string, values: CardValues): unknown {
  const tokens = tokenize(expression);
  let index = 0;
  const peek = () => tokens[index];
  const take = () => tokens[index++];
  const functions: Record<string, (...args: unknown[]) => unknown> = {
    coalesce: (...args) => args.find((value) => value !== null && value !== undefined && value !== ''),
    concat: (...args) => args.map((value) => String(value ?? '')).join(''),
    lower: (value) => String(value ?? '').toLowerCase(),
    upper: (value) => String(value ?? '').toUpperCase(),
    round: (value, decimals = 0) => Number(Number(value).toFixed(Number(decimals))),
  };
  const primary = (): unknown => {
    const token = take();
    if (!token) {
      throw new Error('Expression ended unexpectedly');
    }
    if (token.type === 'number') {
      return Number(token.value);
    }
    if (token.type === 'string') {
      return JSON.parse(token.value);
    }
    if (token.value === '(') {
      const value = additive();
      if (take()?.value !== ')') {
        throw new Error('Expected ")"');
      }
      return value;
    }
    if (token.value === '-') {
      return -Number(primary());
    }
    if (token.type === 'identifier' && peek()?.value === '(') {
      take();
      const args: unknown[] = [];
      while (peek() && peek().value !== ')') {
        args.push(additive());
        if (peek()?.value === ',') {
          take();
        } else {
          break;
        }
      }
      if (take()?.value !== ')') {
        throw new Error('Expected ")" after function arguments');
      }
      const fn = functions[token.value];
      if (!fn) {
        throw new Error(`Unknown function "${token.value}"`);
      }
      return fn(...args);
    }
    if (token.type === 'identifier') {
      return values[token.value];
    }
    throw new Error(`Unexpected token "${token.value}"`);
  };
  const multiplicative = (): unknown => {
    let value = primary();
    while (peek() && ['*', '/'].includes(peek().value)) {
      const operator = take().value;
      const right = primary();
      value = operator === '*' ? Number(value) * Number(right) : Number(value) / Number(right);
    }
    return value;
  };
  const additive = (): unknown => {
    let value = multiplicative();
    while (peek() && ['+', '-'].includes(peek().value)) {
      const operator = take().value;
      const right = multiplicative();
      value = operator === '+' ? Number(value) + Number(right) : Number(value) - Number(right);
    }
    return value;
  };
  const result = additive();
  if (peek()) {
    throw new Error(`Unexpected token "${peek().value}"`);
  }
  return result;
}

export function withCustomFields(values: CardValues, fields: CustomField[]) {
  const enriched = { ...values };
  const errors: string[] = [];
  fields.forEach((field) => {
    try {
      enriched[field.name] = evaluateExpression(field.expression, enriched);
    } catch (error) {
      errors.push(`${field.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
  return { values: enriched, errors };
}

export function resolveColor(color: string, theme: GrafanaTheme2): string {
  const palette: Record<string, string> = {
    green: theme.colors.success.main,
    yellow: theme.colors.warning.main,
    red: theme.colors.error.main,
    blue: theme.colors.info.main,
    gray: theme.colors.text.secondary,
  };
  return palette[color] || color;
}
