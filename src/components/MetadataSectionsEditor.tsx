import React, { useState } from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Button, Combobox, Field, Input, Switch, TextArea } from '@grafana/ui';
import { DeviceCardOptions, MetadataRow, MetadataSection } from '../types';
import { metadataTemplates } from '../utils';

const newRow = (): MetadataRow => ({ kind: 'field', field: '', label: '' });
const newSection = (): MetadataSection => ({ title: 'Metadata section', rows: [newRow()] });

const cloneSections = (sections: MetadataSection[]) => JSON.parse(JSON.stringify(sections)) as MetadataSection[];
const move = <T,>(items: T[], from: number, to: number): T[] => {
  const copy = [...items];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
};

export const MetadataSectionsEditor = ({ value = [], onChange, context }: StandardEditorProps<MetadataSection[], undefined, DeviceCardOptions>) => {
  const [collapsed, setCollapsed] = useState<Record<number, boolean>>({});
  const [json, setJson] = useState('');
  const [draggedRow, setDraggedRow] = useState<{ sectionIndex: number; rowIndex: number }>();
  const fields = context.data.flatMap((frame) => frame.fields.map((field) => field.name));
  const derived = context.options?.customFields?.map((field) => field.name) ?? [];
  const fieldOptions = Array.from(new Set([...fields, ...derived])).map((field) => ({ label: field, value: field }));
  const updateSection = (sectionIndex: number, patch: Partial<MetadataSection>) => {
    onChange(value.map((section, index) => index === sectionIndex ? { ...section, ...patch } : section));
  };
  const updateRow = (sectionIndex: number, rowIndex: number, patch: Partial<MetadataRow>) => {
    updateSection(sectionIndex, { rows: value[sectionIndex].rows.map((row, index) => index === rowIndex ? { ...row, ...patch } : row) });
  };
  const removeSection = (sectionIndex: number) => {
    if (window.confirm('Remove this metadata section?')) {
      onChange(value.filter((_, index) => index !== sectionIndex));
    }
  };
  const removeRow = (sectionIndex: number, rowIndex: number) => {
    if (window.confirm('Remove this metadata row?')) {
      updateSection(sectionIndex, { rows: value[sectionIndex].rows.filter((_, index) => index !== rowIndex) });
    }
  };
  const importJson = () => {
    try {
      const parsed = JSON.parse(json) as MetadataSection[];
      if (!Array.isArray(parsed)) {
        throw new Error('Expected a JSON array of sections');
      }
      onChange(parsed);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  };

  return <div>
    <Field label="Template">
      <Combobox
        isClearable
        options={[
          { label: 'Generic asset', value: 'asset' },
          { label: 'IoT device', value: 'iot' },
          { label: 'Service or server', value: 'service' },
          { label: 'Water-monitoring asset', value: 'water' },
        ]}
        onChange={(selected) => {
          if (selected?.value && window.confirm('Replace current metadata sections with this template?')) {
            onChange(cloneSections(metadataTemplates[selected.value]));
          }
        }}
      />
    </Field>
    <Field label="Import / export JSON" description="Export keeps the current sections in a reusable dashboard-safe format. Import replaces all sections.">
      <div>
        <TextArea rows={5} value={json} placeholder="Paste metadataSections JSON here" onChange={(event) => setJson(event.currentTarget.value)} />
        <Button size="sm" variant="secondary" onClick={() => setJson(JSON.stringify(value, null, 2))}>Export current</Button>{' '}
        <Button size="sm" variant="secondary" onClick={importJson}>Import JSON</Button>
      </div>
    </Field>
    {value.map((section, sectionIndex) => <div key={sectionIndex} style={{ borderBottom: '1px solid rgba(204, 204, 220, 0.35)', marginBottom: 12, paddingBottom: 12 }}>
      <Field label="Section title"><Input value={section.title} onChange={(event) => updateSection(sectionIndex, { title: event.currentTarget.value })} /></Field>
      <Button size="sm" variant="secondary" onClick={() => setCollapsed((current) => ({ ...current, [sectionIndex]: !current[sectionIndex] }))}>{collapsed[sectionIndex] ? 'Expand' : 'Collapse'}</Button>{' '}
      <Button size="sm" variant="secondary" icon="copy" onClick={() => onChange([...value.slice(0, sectionIndex + 1), cloneSections([section])[0], ...value.slice(sectionIndex + 1)])}>Duplicate section</Button>{' '}
      <Button size="sm" variant="secondary" disabled={sectionIndex === 0} onClick={() => onChange(move(value, sectionIndex, sectionIndex - 1))}>Move up</Button>{' '}
      <Button size="sm" variant="secondary" disabled={sectionIndex === value.length - 1} onClick={() => onChange(move(value, sectionIndex, sectionIndex + 1))}>Move down</Button>{' '}
      <Button size="sm" variant="secondary" icon="trash-alt" onClick={() => removeSection(sectionIndex)}>Remove section</Button>
      {!collapsed[sectionIndex] && <>
        {section.rows.map((row, rowIndex) => <div
          key={rowIndex}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => {
            if (draggedRow?.sectionIndex === sectionIndex && draggedRow.rowIndex !== rowIndex) {
              updateSection(sectionIndex, { rows: move(section.rows, draggedRow.rowIndex, rowIndex) });
            }
            setDraggedRow(undefined);
          }}
          style={{ borderLeft: '2px solid rgba(204, 204, 220, 0.25)', margin: '8px 0', opacity: draggedRow?.sectionIndex === sectionIndex && draggedRow.rowIndex === rowIndex ? 0.55 : 1, paddingLeft: 8 }}
        >
          <div draggable onDragStart={() => setDraggedRow({ sectionIndex, rowIndex })} onDragEnd={() => setDraggedRow(undefined)} title="Drag this row to change its position" style={{ cursor: 'grab', fontSize: 12, marginBottom: 6, opacity: 0.7 }}>Drag to reorder</div>
          <Field label="Row type"><Combobox options={[{ label: 'Metadata field', value: 'field' }, { label: 'Subheading', value: 'subheading' }]} value={row.kind} onChange={(selected) => updateRow(sectionIndex, rowIndex, { kind: selected.value as MetadataRow['kind'] })} /></Field>
          <Field label={row.kind === 'subheading' ? 'Subheading text' : 'Display label'}><Input value={row.label} onChange={(event) => updateRow(sectionIndex, rowIndex, { label: event.currentTarget.value })} /></Field>
          {row.kind === 'field' && <>
            <Field label="Source field"><Combobox isClearable options={fieldOptions} value={row.field} onChange={(selected) => updateRow(sectionIndex, rowIndex, { field: selected?.value ?? '' })} /></Field>
            <Field label="Unit override" description="Use time: followed by a format for dates, for example time:DD.MM.YYYY or time:YYYY-MM-DD HH:mm.">
              <Input value={row.unit ?? ''} placeholder="inherit" onChange={(event) => updateRow(sectionIndex, rowIndex, { unit: event.currentTarget.value })} />
            </Field>
            <Field label="Decimals"><Input type="number" value={row.decimals ?? ''} onChange={(event) => updateRow(sectionIndex, rowIndex, { decimals: event.currentTarget.value === '' ? undefined : Number(event.currentTarget.value) })} /></Field>
            <Field label="Empty value text"><Input value={row.emptyText ?? ''} placeholder="-" onChange={(event) => updateRow(sectionIndex, rowIndex, { emptyText: event.currentTarget.value })} /></Field>
            <Field label="Highlight value"><Switch value={row.highlight ?? false} onChange={(event) => updateRow(sectionIndex, rowIndex, { highlight: event.currentTarget.checked })} /></Field>
          </>}
          <Button aria-label="Duplicate row" title="Duplicate row" size="sm" variant="secondary" icon="copy" onClick={() => updateSection(sectionIndex, { rows: [...section.rows.slice(0, rowIndex + 1), { ...row }, ...section.rows.slice(rowIndex + 1)] })} />{' '}
          <Button aria-label="Move row up" title="Move row up" size="sm" variant="secondary" icon="arrow-up" disabled={rowIndex === 0} onClick={() => updateSection(sectionIndex, { rows: move(section.rows, rowIndex, rowIndex - 1) })} />{' '}
          <Button aria-label="Move row down" title="Move row down" size="sm" variant="secondary" icon="arrow-down" disabled={rowIndex === section.rows.length - 1} onClick={() => updateSection(sectionIndex, { rows: move(section.rows, rowIndex, rowIndex + 1) })} />{' '}
          <Button aria-label="Remove row" title="Remove row" size="sm" variant="secondary" icon="trash-alt" onClick={() => removeRow(sectionIndex, rowIndex)} />
        </div>)}
        <Button size="sm" variant="secondary" icon="plus" onClick={() => updateSection(sectionIndex, { rows: [...section.rows, newRow()] })}>Add row</Button>
      </>}
    </div>)}
    <Button size="sm" variant="secondary" icon="plus" onClick={() => onChange([...value, newSection()])}>Add metadata section</Button>
  </div>;
};
