export type LayoutMode = 'single' | 'grid';
export type CardLayout = 'compact' | 'detailed';
export type CardOrientation = 'vertical' | 'horizontal';
export type BuiltInIcon = 'device' | 'server' | 'cloud' | 'wifi' | 'battery' | 'database';
export type StatusOperator = 'equals' | 'contains' | 'lt' | 'lte' | 'gt' | 'gte';

export interface MetricMapping {
  field: string;
  label?: string;
  unit?: string;
  decimals?: number;
}

export interface CustomField {
  name: string;
  label?: string;
  expression: string;
  type?: 'string' | 'number' | 'boolean' | 'time';
  unit?: string;
  decimals?: number;
}

export interface StatusRule {
  operator: StatusOperator;
  value: string;
  label?: string;
  color: string;
  icon?: BuiltInIcon;
}

export interface CardAction {
  label: string;
  url: string;
  newTab?: boolean;
}

export interface DeviceCardOptions {
  idField: string;
  titleField: string;
  subtitleField: string;
  descriptionField: string;
  statusField: string;
  lastSeenField: string;
  logoField: string;
  metrics: MetricMapping[];
  customFields: CustomField[];
  statusRules: StatusRule[];
  fallbackStatusColor: string;
  fallbackStatusIcon: BuiltInIcon;
  showStaleness: boolean;
  freshMinutes: number;
  staleMinutes: number;
  staticIcon: BuiltInIcon;
  showLogo: boolean;
  mode: LayoutMode;
  rowIndex: number;
  layout: CardLayout;
  orientation: CardOrientation;
  maxColumns: number;
  minCardWidth: number;
  actions: CardAction[];
  cardTheme: 'light' | 'neutral' | 'emphasis';
  background: 'default' | 'subtle' | 'none';
  border: 'none' | 'subtle' | 'strong';
  radius: 'small' | 'medium' | 'large';
  typography: 'small' | 'normal' | 'large';
}
