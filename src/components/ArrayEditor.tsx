import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Combobox, Field, Input, Switch } from '@grafana/ui';
import { CardAction, CompositeRule, CustomField, DeviceCardOptions, MetricMapping, MetricThreshold, StatusOperator, StatusRule, ValueMapping } from '../types';

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
  const updateMetricThreshold = (entry: MetricMapping, entryIndex: number, thresholdIndex: number, patch: Partial<MetricThreshold>) => {
    update(entryIndex, { thresholds: (entry.thresholds ?? []).map((threshold, index) => index === thresholdIndex ? { ...threshold, ...patch } : threshold) } as Partial<MetricMapping>);
  };
  const updateValueMapping = (entry: MetricMapping, entryIndex: number, mappingIndex: number, patch: Partial<ValueMapping>) => {
    update(entryIndex, { valueMappings: (entry.valueMappings ?? []).map((mapping, index) => index === mappingIndex ? { ...mapping, ...patch } : mapping) } as Partial<MetricMapping>);
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
              <Field label="Trend field"><Combobox isClearable options={dataFieldOptions} value={(entry as MetricMapping).trendField ?? ''} onChange={(option) => update(index, { trendField: option?.value ?? '' })} /></Field>
              <Field label="Show trend"><Switch value={(entry as MetricMapping).showTrend ?? false} onChange={(event) => update(index, { showTrend: event.currentTarget.checked })} /></Field>
              <Field label="Value mappings" description="Map exact raw values to display text and optional color.">
                <div>
                  {((entry as MetricMapping).valueMappings ?? []).map((mapping, mappingIndex) => <div key={mappingIndex} style={{ borderLeft: '2px solid rgba(204, 204, 220, 0.25)', margin: '6px 0', paddingLeft: 8 }}>
                    <Field label="Raw value"><Input value={mapping.value} onChange={(event) => updateValueMapping(entry as MetricMapping, index, mappingIndex, { value: event.currentTarget.value })} /></Field>
                    <Field label="Display text"><Input value={mapping.text} onChange={(event) => updateValueMapping(entry as MetricMapping, index, mappingIndex, { text: event.currentTarget.value })} /></Field>
                    <Field label="Color"><Input value={mapping.color ?? ''} placeholder="green, red, #5794f2..." onChange={(event) => updateValueMapping(entry as MetricMapping, index, mappingIndex, { color: event.currentTarget.value })} /></Field>
                    <Button size="sm" variant="secondary" icon="trash-alt" onClick={() => update(index, { valueMappings: ((entry as MetricMapping).valueMappings ?? []).filter((_, itemIndex) => itemIndex !== mappingIndex) } as Partial<MetricMapping>)}>Remove mapping</Button>
                  </div>)}
                  <Button size="sm" variant="secondary" icon="plus" onClick={() => update(index, { valueMappings: [...((entry as MetricMapping).valueMappings ?? []), { value: '', text: '' }] } as Partial<MetricMapping>)}>Add value mapping</Button>
                </div>
              </Field>
              <Field label="Thresholds" description="Color metric values when thresholds match.">
                <div>
                  {((entry as MetricMapping).thresholds ?? []).map((threshold, thresholdIndex) => <div key={thresholdIndex} style={{ borderLeft: '2px solid rgba(204, 204, 220, 0.25)', margin: '6px 0', paddingLeft: 8 }}>
                    <Field label="Operator"><Combobox options={operators} value={threshold.operator} onChange={(option) => updateMetricThreshold(entry as MetricMapping, index, thresholdIndex, { operator: option.value as StatusOperator })} /></Field>
                    <Field label="Compare value"><Input value={threshold.value} onChange={(event) => updateMetricThreshold(entry as MetricMapping, index, thresholdIndex, { value: event.currentTarget.value })} /></Field>
                    <Field label="Color"><Input value={threshold.color} placeholder="yellow, red..." onChange={(event) => updateMetricThreshold(entry as MetricMapping, index, thresholdIndex, { color: event.currentTarget.value })} /></Field>
                    <Button size="sm" variant="secondary" icon="trash-alt" onClick={() => update(index, { thresholds: ((entry as MetricMapping).thresholds ?? []).filter((_, itemIndex) => itemIndex !== thresholdIndex) } as Partial<MetricMapping>)}>Remove threshold</Button>
                  </div>)}
                  <Button size="sm" variant="secondary" icon="plus" onClick={() => update(index, { thresholds: [...((entry as MetricMapping).thresholds ?? []), { operator: 'gte', value: '', color: 'yellow' }] } as Partial<MetricMapping>)}>Add threshold</Button>
                </div>
              </Field>
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
              <Field label="URL" description="Relative links and http/https URLs are allowed. Unsafe schemes are ignored at render time."><Input value={(entry as CardAction).url} placeholder="d/device-detail?var-device_id={device_id}" onChange={(event) => update(index, { url: event.currentTarget.value })} /></Field>
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
