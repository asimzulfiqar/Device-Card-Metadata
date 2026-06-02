import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Combobox, Field, Input, Switch } from '@grafana/ui';
import { CardAction, CompositeRule, CustomField, DeviceCardOptions, MetricMapping, StatusOperator, StatusRule } from '../types';

type EditorKind = 'metrics' | 'customFields' | 'statusRules' | 'compositeRules' | 'actions';
type EditorItem = MetricMapping | CustomField | StatusRule | CompositeRule | CardAction;
type Props = StandardEditorProps<EditorItem[], { kind: EditorKind }, DeviceCardOptions>;

const operators = [
  { label: 'Equals', value: 'equals' },
  { label: 'Contains', value: 'contains' },
  { label: 'Less than', value: 'lt' },
  { label: 'At most', value: 'lte' },
  { label: 'Greater than', value: 'gt' },
  { label: 'At least', value: 'gte' },
];

const newItem = (kind: EditorKind): EditorItem => {
  switch (kind) {
    case 'metrics':
      return { field: '', label: '' };
    case 'customFields':
      return { name: '', label: '', expression: '' };
    case 'statusRules':
      return { operator: 'equals', value: '', color: 'green' };
    case 'compositeRules':
      return { field: '', operator: 'gte', value: '', label: '', color: 'yellow' };
    case 'actions':
      return { label: '', url: '', newTab: true };
  }
};

export const ArrayEditor = ({ value = [], onChange, item, context }: Props) => {
  const kind = item.settings?.kind ?? 'metrics';
  const fields = context.data.flatMap((frame) => frame.fields.map((field) => field.name));
  const derived = context.options?.customFields?.map((field) => field.name) ?? [];
  const dataFieldOptions = Array.from(new Set([...fields, ...derived])).map((field) => ({ label: field, value: field }));
  const update = (index: number, patch: Partial<EditorItem>) => {
    onChange(value.map((entry, entryIndex) => (entryIndex === index ? { ...entry, ...patch } : entry)));
  };

  return (
    <div>
      {value.map((entry, index) => (
        <div key={index} style={{ borderBottom: '1px solid rgba(204, 204, 220, 0.2)', marginBottom: 8, paddingBottom: 8 }}>
          {kind === 'metrics' && (
            <>
              <Field label="Source field"><Combobox isClearable options={dataFieldOptions} value={(entry as MetricMapping).field} onChange={(option) => update(index, { field: option?.value ?? '' })} /></Field>
              <Field label="Label"><Input value={(entry as MetricMapping).label ?? ''} onChange={(event) => update(index, { label: event.currentTarget.value })} /></Field>
              <Field label="Unit override"><Input value={(entry as MetricMapping).unit ?? ''} placeholder="inherit" onChange={(event) => update(index, { unit: event.currentTarget.value })} /></Field>
              <Field label="Decimals"><Input type="number" value={(entry as MetricMapping).decimals ?? ''} onChange={(event) => update(index, { decimals: event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value) })} /></Field>
            </>
          )}
          {kind === 'customFields' && (
            <>
              <Field label="Name"><Input value={(entry as CustomField).name} onChange={(event) => update(index, { name: event.currentTarget.value })} /></Field>
              <Field label="Label"><Input value={(entry as CustomField).label ?? ''} onChange={(event) => update(index, { label: event.currentTarget.value })} /></Field>
              <Field label="Expression"><Input value={(entry as CustomField).expression} placeholder='coalesce(owner, "Unknown")' onChange={(event) => update(index, { expression: event.currentTarget.value })} /></Field>
            </>
          )}
          {kind === 'statusRules' && (
            <>
              <Field label="Operator"><Combobox options={operators} value={(entry as StatusRule).operator} onChange={(option) => update(index, { operator: option.value as StatusOperator })} /></Field>
              <Field label="Compare value"><Input value={(entry as StatusRule).value} onChange={(event) => update(index, { value: event.currentTarget.value })} /></Field>
              <Field label="Label override"><Input value={(entry as StatusRule).label ?? ''} onChange={(event) => update(index, { label: event.currentTarget.value })} /></Field>
              <Field label="Color"><Input value={(entry as StatusRule).color} placeholder="green, red, #5794f2..." onChange={(event) => update(index, { color: event.currentTarget.value })} /></Field>
            </>
          )}
          {kind === 'compositeRules' && (
            <>
              <Field label="Metric field"><Combobox isClearable options={dataFieldOptions} value={(entry as CompositeRule).field} onChange={(option) => update(index, { field: option?.value ?? '' })} /></Field>
              <Field label="Operator"><Combobox options={operators} value={(entry as CompositeRule).operator} onChange={(option) => update(index, { operator: option.value as StatusOperator })} /></Field>
              <Field label="Compare value"><Input value={(entry as CompositeRule).value} onChange={(event) => update(index, { value: event.currentTarget.value })} /></Field>
              <Field label="Failure reason"><Input value={(entry as CompositeRule).label ?? ''} placeholder="High temperature" onChange={(event) => update(index, { label: event.currentTarget.value })} /></Field>
              <Field label="Severity color"><Input value={(entry as CompositeRule).color} placeholder="yellow, red..." onChange={(event) => update(index, { color: event.currentTarget.value })} /></Field>
            </>
          )}
          {kind === 'actions' && (
            <>
              <Field label="Label"><Input value={(entry as CardAction).label} onChange={(event) => update(index, { label: event.currentTarget.value })} /></Field>
              <Field label="URL"><Input value={(entry as CardAction).url} placeholder="d/device?var-id={id}" onChange={(event) => update(index, { url: event.currentTarget.value })} /></Field>
              <Field label="Open in new tab"><Switch value={(entry as CardAction).newTab ?? false} onChange={(event) => update(index, { newTab: event.currentTarget.checked })} /></Field>
              <Field label="Include time range"><Switch value={(entry as CardAction).includeTimeRange ?? false} onChange={(event) => update(index, { includeTimeRange: event.currentTarget.checked })} /></Field>
            </>
          )}
          <Button variant="secondary" size="sm" icon="trash-alt" onClick={() => onChange(value.filter((_, entryIndex) => entryIndex !== index))}>
            Remove
          </Button>
        </div>
      ))}
      <Button variant="secondary" size="sm" icon="plus" onClick={() => onChange([...value, newItem(kind)])}>
        Add
      </Button>
    </div>
  );
};
