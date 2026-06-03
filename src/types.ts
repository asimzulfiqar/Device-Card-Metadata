export type LayoutMode = 'single' | 'grid';
export type PresentationMode = 'fleet' | 'metadata';
export type CardLayout = 'summary' | 'compact' | 'detailed' | 'metadata';
export type CardOrientation = 'vertical' | 'horizontal';
export type CardDensity = 'compact' | 'comfortable' | 'spacious';
export type CardTheme = 'neutral' | 'elevated' | 'tinted' | 'minimal' | 'light' | 'emphasis';
export type MetricStyle = 'grid' | 'list' | 'tiles';
export type LogoPlacement = 'header-left' | 'header-right';
export type StatusPlacement = 'header' | 'below-title' | 'footer';
export type AccentStyle = 'none' | 'top' | 'left';
export type BuiltInIcon = 'device' | 'server' | 'cloud' | 'wifi' | 'battery' | 'database';
export type StatusOperator = 'equals' | 'contains' | 'lt' | 'lte' | 'gt' | 'gte';
export type StatusMode = 'mapped' | 'composite' | 'staleness';
export type FleetSort = 'title' | 'status' | 'lastSeen' | 'metric';
export type SortDirection = 'asc' | 'desc';
export type SetupProfile = 'iot' | 'service' | 'asset';

export interface MetricMapping {
  field: string;
  label?: string;
  unit?: string;
  decimals?: number;
  thresholds?: MetricThreshold[];
  valueMappings?: ValueMapping[];
  trendField?: string;
  showTrend?: boolean;
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

export interface CompositeRule extends StatusRule {
  field: string;
}

export interface CardAction {
  label: string;
  url: string;
  newTab?: boolean;
  includeTimeRange?: boolean;
}

export interface MetricThreshold {
  operator: StatusOperator;
  value: string;
  color: string;
}

export interface ValueMapping {
  value: string;
  text: string;
  color?: string;
}

export interface MetadataRow {
  kind: 'field' | 'subheading';
  field?: string;
  label: string;
  unit?: string;
  decimals?: number;
  highlight?: boolean;
  emptyText?: string;
}

export interface MetadataSection {
  title: string;
  rows: MetadataRow[];
}

export interface DeviceCardOptions {
  presentationMode: PresentationMode;
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
  compositeRules: CompositeRule[];
  statusMode: StatusMode;
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
  density: CardDensity;
  metricStyle: MetricStyle;
  logoPlacement: LogoPlacement;
  statusPlacement: StatusPlacement;
  maxColumns: number;
  minCardWidth: number;
  actions: CardAction[];
  showFleetToolbar: boolean;
  showFleetSummary: boolean;
  groupByField: string;
  sortBy: FleetSort;
  sortDirection: SortDirection;
  sortMetricField: string;
  pageSize: number;
  maxEntities: number;
  metadataSelectorField: string;
  metadataSelectorValue: string;
  metadataSections: MetadataSection[];
  metadataColumns: number;
  setupProfile: SetupProfile;
  showDiagnostics: boolean;
  cardTheme: CardTheme;
  accentStyle: AccentStyle;
  background: 'default' | 'subtle' | 'none';
  border: 'none' | 'subtle' | 'strong';
  radius: 'small' | 'medium' | 'large';
  typography: 'small' | 'normal' | 'large';
}
