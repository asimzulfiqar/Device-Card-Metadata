import React from 'react';
import { StandardEditorProps } from '@grafana/data';
import { Combobox } from '@grafana/ui';
import { DeviceCardOptions } from '../types';

export const FieldSelectorEditor = ({ value, onChange, context }: StandardEditorProps<string, undefined, DeviceCardOptions>) => {
  const fields = context.data.flatMap((frame) => frame.fields.map((field) => field.name));
  const derived = context.options?.customFields?.map((field) => field.name) ?? [];
  const options = Array.from(new Set([...fields, ...derived, value].filter(Boolean))).map((field) => ({ label: field, value: field }));

  return <Combobox isClearable options={options} value={value} onChange={(selected) => onChange(selected?.value ?? '')} />;
};
