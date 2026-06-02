import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Combobox, Field, Input, Switch } from '@grafana/ui';
import { DeviceCardOptions, MetadataRow, MetadataSection } from '../types';

const newRow = (): MetadataRow => ({ kind: 'field', field: '', label: '' });
const newSection = (): MetadataSection => ({ title: 'Metadata section', rows: [newRow()] });

export const MetadataSectionsEditor = ({ value = [], onChange, context }: StandardEditorProps<MetadataSection[], undefined, DeviceCardOptions>) => {
  const fields = context.data.flatMap((frame) => frame.fields.map((field) => field.name));
  const derived = context.options?.customFields?.map((field) => field.name) ?? [];
  const fieldOptions = Array.from(new Set([...fields, ...derived])).map((field) => ({ label: field, value: field }));
  const updateSection = (sectionIndex: number, patch: Partial<MetadataSection>) => {
    onChange(value.map((section, index) => index === sectionIndex ? { ...section, ...patch } : section));
  };
  const updateRow = (sectionIndex: number, rowIndex: number, patch: Partial<MetadataRow>) => {
    updateSection(sectionIndex, { rows: value[sectionIndex].rows.map((row, index) => index === rowIndex ? { ...row, ...patch } : row) });
  };

  return <div>
    {value.map((section, sectionIndex) => <div key={sectionIndex} style={{ borderBottom: '1px solid rgba(204, 204, 220, 0.35)', marginBottom: 12, paddingBottom: 12 }}>
      <Field label="Section title"><Input value={section.title} onChange={(event) => updateSection(sectionIndex, { title: event.currentTarget.value })} /></Field>
      {section.rows.map((row, rowIndex) => <div key={rowIndex} style={{ borderLeft: '2px solid rgba(204, 204, 220, 0.25)', margin: '8px 0', paddingLeft: 8 }}>
        <Field label="Row type"><Combobox options={[{ label: 'Metadata field', value: 'field' }, { label: 'Subheading', value: 'subheading' }]} value={row.kind} onChange={(selected) => updateRow(sectionIndex, rowIndex, { kind: selected.value as MetadataRow['kind'] })} /></Field>
        <Field label={row.kind === 'subheading' ? 'Subheading text' : 'Display label'}><Input value={row.label} onChange={(event) => updateRow(sectionIndex, rowIndex, { label: event.currentTarget.value })} /></Field>
        {row.kind === 'field' && <>
          <Field label="Source field"><Combobox isClearable options={fieldOptions} value={row.field} onChange={(selected) => updateRow(sectionIndex, rowIndex, { field: selected?.value ?? '' })} /></Field>
          <Field label="Unit override"><Input value={row.unit ?? ''} placeholder="inherit" onChange={(event) => updateRow(sectionIndex, rowIndex, { unit: event.currentTarget.value })} /></Field>
          <Field label="Decimals"><Input type="number" value={row.decimals ?? ''} onChange={(event) => updateRow(sectionIndex, rowIndex, { decimals: event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value) })} /></Field>
          <Field label="Empty value text"><Input value={row.emptyText ?? ''} placeholder="-" onChange={(event) => updateRow(sectionIndex, rowIndex, { emptyText: event.currentTarget.value })} /></Field>
          <Field label="Highlight value"><Switch value={row.highlight ?? false} onChange={(event) => updateRow(sectionIndex, rowIndex, { highlight: event.currentTarget.checked })} /></Field>
        </>}
        <Button size="sm" variant="secondary" icon="trash-alt" onClick={() => updateSection(sectionIndex, { rows: section.rows.filter((_, index) => index !== rowIndex) })}>Remove row</Button>
      </div>)}
      <Button size="sm" variant="secondary" icon="plus" onClick={() => updateSection(sectionIndex, { rows: [...section.rows, newRow()] })}>Add row</Button>{' '}
      <Button size="sm" variant="secondary" icon="trash-alt" onClick={() => onChange(value.filter((_, index) => index !== sectionIndex))}>Remove section</Button>
    </div>)}
    <Button size="sm" variant="secondary" icon="plus" onClick={() => onChange([...value, newSection()])}>Add metadata section</Button>
  </div>;
};
