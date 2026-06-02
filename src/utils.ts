import { DataFrame, Field, FieldType, getValueFormat, GrafanaTheme2 } from '@grafana/data';
import { BuiltInIcon, CustomField, MetricMapping, StatusRule } from './types';

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

export function formatMetric(value: unknown, mapping: MetricMapping, field?: Field): string {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value !== 'number') {
    return String(value);
  }
  const decimals = mapping.decimals ?? field?.config.decimals;
  const unit = mapping.unit || field?.config.unit;
  return unit ? getValueFormat(unit)(value, decimals).text : value.toFixed(decimals ?? 2).replace(/\.?0+$/, '');
}

export function substituteUrl(template: string, values: CardValues): string {
  return template.replace(/\{([^}]+)\}/g, (_, name) => encodeURIComponent(String(values[name] ?? '')));
}

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
