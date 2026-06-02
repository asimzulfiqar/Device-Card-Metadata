import { PanelPlugin } from '@grafana/data';
import { DeviceCardPanel } from './components/DeviceCardPanel';
import { ArrayEditor } from './components/ArrayEditor';
import { FieldSelectorEditor } from './components/FieldSelectorEditor';
import { MetadataSectionsEditor } from './components/MetadataSectionsEditor';
import { DeviceCardOptions } from './types';

const iconOptions = [
  { label: 'Device', value: 'device' },
  { label: 'Server', value: 'server' },
  { label: 'Cloud', value: 'cloud' },
  { label: 'WiFi', value: 'wifi' },
  { label: 'Battery', value: 'battery' },
  { label: 'Database', value: 'database' },
];

export const plugin = new PanelPlugin<DeviceCardOptions>(DeviceCardPanel)
  .setPanelOptions((builder) =>
    builder
    .addSelect({ path: 'setupProfile', name: 'Setup profile', category: ['Setup assistant'], defaultValue: 'iot', description: 'Used by the suggested-mapping button when a required ID field is missing.', settings: { options: [{ label: 'IoT device', value: 'iot' }, { label: 'Service health', value: 'service' }, { label: 'Asset inventory', value: 'asset' }] } })
    .addBooleanSwitch({ path: 'showDiagnostics', name: 'Open diagnostics by default', category: ['Setup assistant'], defaultValue: false })
    .addCustomEditor({ id: 'idField', path: 'idField', name: 'Entity ID field', category: ['Field mapping'], description: 'Required. Primary identifier used as the card title fallback and in links.', editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'titleField', path: 'titleField', name: 'Title field', category: ['Field mapping'], editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'subtitleField', path: 'subtitleField', name: 'Subtitle field', category: ['Field mapping'], editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'descriptionField', path: 'descriptionField', name: 'Description field', category: ['Field mapping'], editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'statusField', path: 'statusField', name: 'Status field', category: ['Field mapping'], editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'lastSeenField', path: 'lastSeenField', name: 'Last seen field', category: ['Field mapping'], description: 'Map a time field to show relative time and staleness.', editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'logoField', path: 'logoField', name: 'Dynamic logo/icon field', category: ['Field mapping'], description: 'Optional URL or built-in icon code.', editor: FieldSelectorEditor })
    .addCustomEditor({ id: 'metrics', path: 'metrics', name: 'Metrics', category: ['Metrics'], editor: ArrayEditor, defaultValue: [], settings: { kind: 'metrics' } })
    .addCustomEditor({ id: 'customFields', path: 'customFields', name: 'Derived fields', category: ['Derived fields'], editor: ArrayEditor, defaultValue: [], settings: { kind: 'customFields' } })
    .addCustomEditor({ id: 'statusRules', path: 'statusRules', name: 'Status rules', category: ['Status'], editor: ArrayEditor, defaultValue: [], settings: { kind: 'statusRules' } })
    .addSelect({ path: 'statusMode', name: 'Status source', category: ['Status'], defaultValue: 'mapped', settings: { options: [{ label: 'Mapped status field', value: 'mapped' }, { label: 'Worst composite check', value: 'composite' }, { label: 'Last-seen staleness', value: 'staleness' }] } })
    .addCustomEditor({ id: 'compositeRules', path: 'compositeRules', name: 'Composite health checks', category: ['Status'], editor: ArrayEditor, defaultValue: [], settings: { kind: 'compositeRules' } })
    .addTextInput({ path: 'fallbackStatusColor', name: 'Fallback color', category: ['Status'], defaultValue: 'gray' })
    .addSelect({ path: 'fallbackStatusIcon', name: 'Fallback icon', category: ['Status'], defaultValue: 'device', settings: { options: iconOptions } })
    .addBooleanSwitch({ path: 'showStaleness', name: 'Show staleness dot', category: ['Staleness'], defaultValue: true })
    .addNumberInput({ path: 'freshMinutes', name: 'Fresh threshold (minutes)', category: ['Staleness'], defaultValue: 15 })
    .addNumberInput({ path: 'staleMinutes', name: 'Offline threshold (minutes)', category: ['Staleness'], defaultValue: 60 })
    .addBooleanSwitch({ path: 'showLogo', name: 'Show logo/icon', category: ['Logo'], defaultValue: true })
    .addSelect({ path: 'staticIcon', name: 'Fallback icon', category: ['Logo'], defaultValue: 'device', settings: { options: iconOptions } })
    .addRadio({ path: 'mode', name: 'Card mode', category: ['Layout'], defaultValue: 'grid', settings: { options: [{ label: 'Grid', value: 'grid' }, { label: 'Single card', value: 'single' }] } })
    .addNumberInput({ path: 'rowIndex', name: 'Row index', category: ['Layout'], defaultValue: 0, showIf: (config) => config.mode === 'single' })
    .addRadio({ path: 'layout', name: 'Detail level', category: ['Layout'], defaultValue: 'detailed', settings: { options: [{ label: 'Summary', value: 'summary' }, { label: 'Compact', value: 'compact' }, { label: 'Detailed', value: 'detailed' }, { label: 'Metadata detail', value: 'metadata' }] } })
    .addRadio({ path: 'orientation', name: 'Orientation', category: ['Layout'], defaultValue: 'vertical', settings: { options: [{ label: 'Vertical', value: 'vertical' }, { label: 'Horizontal', value: 'horizontal' }] } })
    .addSelect({ path: 'density', name: 'Card density', category: ['Layout'], defaultValue: 'comfortable', settings: { options: [{ label: 'Compact', value: 'compact' }, { label: 'Comfortable', value: 'comfortable' }, { label: 'Spacious', value: 'spacious' }] } })
    .addSelect({ path: 'metricStyle', name: 'Metric presentation', category: ['Layout'], defaultValue: 'grid', settings: { options: [{ label: 'Grid', value: 'grid' }, { label: 'List', value: 'list' }, { label: 'Tiles', value: 'tiles' }] } })
    .addNumberInput({ path: 'maxColumns', name: 'Maximum columns', category: ['Layout'], defaultValue: 4 })
    .addNumberInput({ path: 'minCardWidth', name: 'Minimum card width', category: ['Layout'], defaultValue: 220 })
    .addBooleanSwitch({ path: 'showFleetToolbar', name: 'Show search and filters', category: ['Fleet controls'], defaultValue: true })
    .addBooleanSwitch({ path: 'showFleetSummary', name: 'Show health summary', category: ['Fleet controls'], defaultValue: true })
    .addCustomEditor({ id: 'groupByField', path: 'groupByField', name: 'Group cards by field', category: ['Fleet controls'], description: 'Optional. Creates collapsible fleet sections.', editor: FieldSelectorEditor })
    .addSelect({ path: 'sortBy', name: 'Default sort', category: ['Fleet controls'], defaultValue: 'status', settings: { options: [{ label: 'Status severity', value: 'status' }, { label: 'Title', value: 'title' }, { label: 'Last seen', value: 'lastSeen' }, { label: 'Metric value', value: 'metric' }] } })
    .addRadio({ path: 'sortDirection', name: 'Sort direction', category: ['Fleet controls'], defaultValue: 'desc', settings: { options: [{ label: 'Ascending', value: 'asc' }, { label: 'Descending', value: 'desc' }] } })
    .addCustomEditor({ id: 'sortMetricField', path: 'sortMetricField', name: 'Sort metric field', category: ['Fleet controls'], showIf: (config) => config.sortBy === 'metric', editor: FieldSelectorEditor })
    .addNumberInput({ path: 'pageSize', name: 'Cards per page', category: ['Fleet controls'], defaultValue: 24, settings: { min: 1, max: 500 } })
    .addNumberInput({ path: 'metadataColumns', name: 'Maximum columns', category: ['Metadata detail'], defaultValue: 4, settings: { min: 1, max: 6 } })
    .addCustomEditor({ id: 'metadataSections', path: 'metadataSections', name: 'Sections and rows', category: ['Metadata detail'], editor: MetadataSectionsEditor, defaultValue: [] })
    .addSelect({ path: 'logoPlacement', name: 'Logo placement', category: ['Logo'], defaultValue: 'header-left', settings: { options: [{ label: 'Header left', value: 'header-left' }, { label: 'Header right', value: 'header-right' }] } })
    .addSelect({ path: 'statusPlacement', name: 'Status placement', category: ['Status'], defaultValue: 'header', settings: { options: [{ label: 'Header', value: 'header' }, { label: 'Below title', value: 'below-title' }, { label: 'Footer', value: 'footer' }] } })
    .addCustomEditor({ id: 'actions', path: 'actions', name: 'Card actions', category: ['Actions'], editor: ArrayEditor, defaultValue: [], settings: { kind: 'actions' } })
    .addSelect({ path: 'cardTheme', name: 'Visual preset', category: ['Style'], defaultValue: 'neutral', settings: { options: [{ label: 'Neutral', value: 'neutral' }, { label: 'Elevated', value: 'elevated' }, { label: 'Tinted', value: 'tinted' }, { label: 'Minimal', value: 'minimal' }] } })
    .addSelect({ path: 'accentStyle', name: 'Status accent', category: ['Style'], defaultValue: 'none', settings: { options: [{ label: 'None', value: 'none' }, { label: 'Top bar', value: 'top' }, { label: 'Left bar', value: 'left' }] } })
    .addSelect({ path: 'background', name: 'Background', category: ['Style'], defaultValue: 'default', settings: { options: [{ label: 'Default', value: 'default' }, { label: 'Subtle', value: 'subtle' }, { label: 'None', value: 'none' }] } })
    .addSelect({ path: 'border', name: 'Border', category: ['Style'], defaultValue: 'subtle', settings: { options: [{ label: 'None', value: 'none' }, { label: 'Subtle', value: 'subtle' }, { label: 'Strong', value: 'strong' }] } })
    .addSelect({ path: 'radius', name: 'Corner radius', category: ['Style'], defaultValue: 'medium', settings: { options: [{ label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }] } })
    .addSelect({ path: 'typography', name: 'Typography scale', category: ['Style'], defaultValue: 'normal', settings: { options: [{ label: 'Small', value: 'small' }, { label: 'Normal', value: 'normal' }, { label: 'Large', value: 'large' }] } })
);
