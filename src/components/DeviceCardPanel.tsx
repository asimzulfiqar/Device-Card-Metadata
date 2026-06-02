import React, { Fragment, useMemo, useState } from 'react';
import { css, cx } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { Alert, Button, Combobox, Icon, Input, useStyles2, useTheme2 } from '@grafana/ui';
import { DeviceCardOptions } from '../types';
import {
  fieldByName,
  formatMetric,
  frameRows,
  iconNames,
  isTimeField,
  relativeTime,
  resolveColor,
  staleness,
  statusFor,
  substituteUrl,
  withCustomFields,
  CardValues,
  compositeStatus,
  severityForColor,
} from '../utils';

const getStyles = (theme: ReturnType<typeof useTheme2>) => ({
  wrapper: css`
    height: 100%;
    overflow: auto;
    padding: ${theme.spacing(1)};
  `,
  empty: css`
    display: grid;
    height: 100%;
    place-content: center;
    padding: ${theme.spacing(3)};
    text-align: center;
  `,
  grid: css`
    display: grid;
    gap: ${theme.spacing(1.5)};
  `,
  toolbar: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    margin-bottom: ${theme.spacing(1.5)};
  `,
  summary: css`
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(0.75)};
    margin-bottom: ${theme.spacing(1)};
  `,
  group: css`
    align-items: center;
    display: flex;
    font-weight: ${theme.typography.fontWeightMedium};
    grid-column: 1 / -1;
    justify-content: space-between;
    padding: ${theme.spacing(0.5, 0)};
  `,
  pagination: css`
    align-items: center;
    display: flex;
    gap: ${theme.spacing(1)};
    justify-content: center;
    padding: ${theme.spacing(1.5, 0)};
  `,
  card: css`
    display: flex;
    gap: ${theme.spacing(1.5)};
    min-height: 148px;
    padding: ${theme.spacing(1.5)};
  `,
  body: css`
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  `,
  heading: css`
    align-items: flex-start;
    display: flex;
    gap: ${theme.spacing(1)};
    justify-content: space-between;
  `,
  title: css`
    font-weight: ${theme.typography.fontWeightMedium};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  `,
  muted: css`
    color: ${theme.colors.text.secondary};
  `,
  description: css`
    color: ${theme.colors.text.secondary};
    display: -webkit-box;
    margin-top: ${theme.spacing(1)};
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  `,
  metrics: css`
    display: grid;
    gap: ${theme.spacing(1)};
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    margin-top: ${theme.spacing(1.5)};
  `,
  metricList: css`
    grid-template-columns: 1fr;
  `,
  metricListItem: css`
    align-items: center;
    display: flex;
    justify-content: space-between;
  `,
  metricTile: css`
    background: ${theme.colors.background.secondary};
    border-radius: ${theme.shape.radius.default};
    padding: ${theme.spacing(1)};
  `,
  metricValue: css`
    font-size: 1.15em;
    font-weight: ${theme.typography.fontWeightMedium};
  `,
  pill: css`
    align-items: center;
    border-radius: 12px;
    color: white;
    display: inline-flex;
    font-size: 11px;
    gap: 4px;
    padding: 2px 7px;
    white-space: nowrap;
  `,
  statusBelow: css`
    margin-top: ${theme.spacing(0.5)};
  `,
  logo: css`
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    height: 34px;
    justify-content: center;
    overflow: hidden;
    width: 34px;
  `,
  image: css`
    height: 100%;
    max-width: 100%;
    object-fit: contain;
  `,
  footer: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
    justify-content: space-between;
    margin-top: auto;
    padding-top: ${theme.spacing(1.5)};
  `,
  footerGroup: css`
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: ${theme.spacing(1)};
  `,
  staleDot: css`
    border-radius: 50%;
    display: inline-block;
    height: 8px;
    margin-right: ${theme.spacing(0.5)};
    width: 8px;
  `,
  link: css`
    color: ${theme.colors.text.link};
    font-size: 12px;
    text-decoration: none;
    &:hover { text-decoration: underline; }
  `,
});

const option = <T,>(value: T | undefined, fallback: T): T => value ?? fallback;
const text = (value: unknown) => (value === null || value === undefined ? '' : String(value));

export const DeviceCardPanel = ({ options, data, replaceVariables, timeRange }: PanelProps<DeviceCardOptions>) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewerSort, setViewerSort] = useState(options.sortBy || 'status');
  const [page, setPage] = useState(0);
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const frame = data.series[0];
  const rows = frameRows(frame);
  const idField = options.idField;
  const lastSeenWarning = options.lastSeenField && !isTimeField(frame, options.lastSeenField);
  const radius = { small: 2, medium: 6, large: 12 }[option(options.radius, 'medium')];
  const borderWidth = { none: 0, subtle: 1, strong: 2 }[option(options.border, 'subtle')];
  const cardTheme = option(options.cardTheme, 'neutral');
  const background =
    option(options.background, 'default') === 'none'
      ? 'transparent'
      : cardTheme === 'tinted' || cardTheme === 'emphasis'
        ? theme.colors.primary.transparent
        : cardTheme === 'minimal'
          ? 'transparent'
        : option(options.background, 'default') === 'subtle'
          ? theme.colors.background.secondary
          : theme.colors.background.primary;
  const cards = useMemo(() => rows.map((rawValues) => {
    const derived = withCustomFields(rawValues, options.customFields ?? []);
    const values: CardValues = { ...derived.values, id: derived.values[idField] };
    const stale = options.lastSeenField ? staleness(values[options.lastSeenField], option(options.freshMinutes, 15), option(options.staleMinutes, 60)) : undefined;
    const mappedRule = statusFor(values[options.statusField], options.statusRules ?? []);
    const composite = compositeStatus(values, options.compositeRules ?? []);
    const mode = option(options.statusMode, 'mapped');
    const status = mode === 'composite'
      ? composite ?? { label: 'Healthy', color: 'green' }
      : mode === 'staleness'
        ? stale ?? { label: 'No data', color: 'gray' }
        : { label: mappedRule?.label || text(values[options.statusField]) || 'Unknown', color: mappedRule?.color ?? option(options.fallbackStatusColor, 'gray'), icon: mappedRule?.icon };
    return { values, derived, stale, status, severity: severityForColor(status.color), group: text(values[options.groupByField]) || 'Other' };
  }), [idField, options, rows]);
  const filteredCards = useMemo(() => cards
    .filter((card) => statusFilter === 'all' || card.status.color.toLowerCase() === statusFilter)
    .filter((card) => !search || Object.values(card.values).some((value) => text(value).toLowerCase().includes(search.toLowerCase())))
    .sort((left, right) => {
      if (options.groupByField && left.group !== right.group) {
        return left.group.localeCompare(right.group);
      }
      const sortBy = viewerSort;
      const leftValue = sortBy === 'title' ? text(left.values[options.titleField] || left.values[idField]) : sortBy === 'lastSeen' ? Number(left.values[options.lastSeenField]) : sortBy === 'metric' ? Number(left.values[options.sortMetricField]) : left.severity;
      const rightValue = sortBy === 'title' ? text(right.values[options.titleField] || right.values[idField]) : sortBy === 'lastSeen' ? Number(right.values[options.lastSeenField]) : sortBy === 'metric' ? Number(right.values[options.sortMetricField]) : right.severity;
      const comparison = typeof leftValue === 'string' ? leftValue.localeCompare(String(rightValue)) : Number(leftValue) - Number(rightValue);
      return option(options.sortDirection, 'desc') === 'asc' ? comparison : -comparison;
    }), [cards, idField, options, search, statusFilter, viewerSort]);
  const expandedCards = filteredCards.filter((card) => !options.groupByField || !collapsedGroups[card.group]);
  const pageSize = Math.max(1, option(options.pageSize, 24));
  const pageCount = Math.max(1, Math.ceil(expandedCards.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const pagedCards = option(options.mode, 'grid') === 'single'
    ? cards.slice(option(options.rowIndex, 0), option(options.rowIndex, 0) + 1)
    : expandedCards.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
  const summary = cards.reduce<Record<string, number>>((counts, card) => {
    const key = card.status.color.toLowerCase();
    counts[key] = (counts[key] ?? 0) + 1;
    return counts;
  }, {});

  if (!frame || rows.length === 0) {
    return <div className={styles.empty}><div><h3>Device Card Panel</h3><p>Return a table with one row per entity, then map an Entity ID field in panel options.</p><code>SELECT device_id, owner, status, battery, last_seen FROM devices</code></div></div>;
  }
  if (!idField || !fieldByName(frame, idField)) {
    return <div className={styles.empty}><Alert title="Map an Entity ID field" severity="info">Open Field mapping in the panel options and enter a column name such as <code>device_id</code>. Your query returned {rows.length} row(s).</Alert></div>;
  }

  return (
    <div className={styles.wrapper}>
      {lastSeenWarning && <Alert title="Last seen field is not a time field" severity="warning">Choose a Grafana time field for relative age and staleness.</Alert>}
      {option(options.showFleetSummary, true) && option(options.mode, 'grid') === 'grid' && <div className={styles.summary}>
        <Button size="sm" variant={statusFilter === 'all' ? 'primary' : 'secondary'} onClick={() => { setStatusFilter('all'); setPage(0); }}>All {cards.length}</Button>
        {Object.entries(summary).map(([color, count]) => <Button key={color} size="sm" variant={statusFilter === color ? 'primary' : 'secondary'} onClick={() => { setStatusFilter(color); setPage(0); }}>{color} {count}</Button>)}
      </div>}
      {option(options.showFleetToolbar, true) && option(options.mode, 'grid') === 'grid' && <div className={styles.toolbar}>
        <Input aria-label="Search cards" placeholder="Search cards..." value={search} onChange={(event) => { setSearch(event.currentTarget.value); setPage(0); }} width={28} />
        <Combobox options={[{ label: 'Severity', value: 'status' }, { label: 'Title', value: 'title' }, { label: 'Last seen', value: 'lastSeen' }, { label: 'Metric', value: 'metric' }]} value={viewerSort} onChange={(selected) => { setViewerSort(selected.value); setPage(0); }} width={18} />
        <span className={styles.muted}>{filteredCards.length} match(es)</span>
        {Object.entries(collapsedGroups).filter(([, collapsed]) => collapsed).map(([group]) => <Button key={group} size="sm" variant="secondary" onClick={() => setCollapsedGroups((current) => ({ ...current, [group]: false }))}>Show {group}</Button>)}
      </div>}
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${option(options.maxColumns, 4)}, minmax(min(100%, ${option(options.minCardWidth, 220)}px), 1fr))` }}>
        {pagedCards.map(({ values, derived, stale, status: statusInfo, group }, index) => {
          const statusColor = resolveColor(statusInfo.color, theme);
          const dynamicLogo = text(values[options.logoField]);
          const logoIsUrl = /^https?:\/\//i.test(dynamicLogo);
          const logoIcon = dynamicLogo in iconNames ? dynamicLogo as keyof typeof iconNames : option(options.staticIcon, 'device');
          const layout = option(options.layout, 'detailed');
          const density = option(options.density, 'comfortable');
          const metricStyle = option(options.metricStyle, 'grid');
          const statusPlacement = option(options.statusPlacement, 'header');
          const accentStyle = option(options.accentStyle, 'none');
          const metrics = (options.metrics ?? []).slice(0, layout === 'summary' ? 2 : layout === 'compact' ? 3 : 6);
          const shadows = [
            cardTheme === 'elevated' ? `0 4px 14px ${theme.colors.background.canvas}` : '',
            accentStyle === 'top' ? `inset 0 3px 0 ${statusColor}` : '',
            accentStyle === 'left' ? `inset 3px 0 0 ${statusColor}` : '',
          ].filter(Boolean).join(', ');
          const logo = option(options.showLogo, true) && <div className={styles.logo}>{logoIsUrl ? <img className={styles.image} src={dynamicLogo} alt="" /> : <Icon name={iconNames[logoIcon] as never} size="xl" />}</div>;
          const statusIcon = 'icon' in statusInfo ? statusInfo.icon : undefined;
          const status = <span className={styles.pill} style={{ background: statusColor }} title={'reason' in statusInfo ? statusInfo.reason : undefined}>{statusIcon && <Icon name={iconNames[statusIcon] as never} size="xs" />}{statusInfo.label}</span>;
          const showGroup = Boolean(options.groupByField) && (index === 0 || pagedCards[index - 1].group !== group);
          return (
            <Fragment key={`${text(values[idField])}-${index}`}>
            {showGroup && <div className={styles.group}><span>{group}</span><Button size="sm" variant="secondary" onClick={() => setCollapsedGroups((current) => ({ ...current, [group]: !current[group] }))}>Collapse</Button></div>}
            <article
              className={cx(styles.card, css`
                background: ${background};
                border: ${borderWidth}px solid ${theme.colors.border.weak};
                border-radius: ${radius}px;
                box-shadow: ${shadows || 'none'};
                flex-direction: ${option(options.orientation, 'vertical') === 'horizontal' ? 'row' : 'column'};
                font-size: ${{ small: 12, normal: 14, large: 16 }[option(options.typography, 'normal')]}px;
                gap: ${theme.spacing({ compact: 1, comfortable: 1.5, spacious: 2 }[density])};
                min-height: ${{ compact: 116, comfortable: 148, spacious: 184 }[density]}px;
                padding: ${theme.spacing({ compact: 1, comfortable: 1.5, spacious: 2 }[density])};
              `)}
            >
              <div className={styles.heading}>
                {option(options.logoPlacement, 'header-left') === 'header-left' && logo}
                <div className={styles.body}>
                  <div className={styles.title}>{text(values[options.titleField] || values[idField])}</div>
                  {options.subtitleField && <div className={styles.muted}>{text(values[options.subtitleField])}</div>}
                  {statusPlacement === 'below-title' && <div className={styles.statusBelow}>{status}</div>}
                </div>
                {statusPlacement === 'header' && status}
                {option(options.logoPlacement, 'header-left') === 'header-right' && logo}
              </div>
              <div className={styles.body}>
                {layout === 'detailed' && options.descriptionField && <div className={styles.description}>{text(values[options.descriptionField])}</div>}
                {metrics.length > 0 && <div className={cx(styles.metrics, metricStyle === 'list' && styles.metricList)}>{metrics.map((metric) => <div className={cx(metricStyle === 'list' && styles.metricListItem, metricStyle === 'tiles' && styles.metricTile)} key={metric.field}><div className={styles.muted}>{metric.label || metric.field}</div><div className={styles.metricValue}>{formatMetric(values[metric.field], metric, fieldByName(frame, metric.field))}</div></div>)}</div>}
                <div className={styles.footer}>
                  <span className={cx(styles.muted, styles.footerGroup)}>
                    {statusPlacement === 'footer' && status}
                    {option(options.showStaleness, true) && stale && <span className={styles.staleDot} style={{ background: resolveColor(stale.color, theme) }} />}
                    {options.lastSeenField && <span>Last seen {relativeTime(values[options.lastSeenField])}</span>}
                  </span>
                  <span className={styles.footerGroup}>{(options.actions ?? []).map((action) => {
                    const templated = replaceVariables(substituteUrl(action.url, values));
                    const separator = templated.includes('?') ? '&' : '?';
                    const href = action.includeTimeRange ? `${templated}${separator}from=${encodeURIComponent(String(timeRange.from.valueOf()))}&to=${encodeURIComponent(String(timeRange.to.valueOf()))}` : templated;
                    return <a className={styles.link} href={href} key={action.label} target={action.newTab ? '_blank' : '_self'} rel={action.newTab ? 'noreferrer' : undefined}>{replaceVariables(action.label)}</a>;
                  })}</span>
                </div>
                {derived.errors.length > 0 && <span className={styles.muted} title={derived.errors.join('\n')}>Derived field warning</span>}
              </div>
            </article>
            </Fragment>
          );
        })}
      </div>
      {option(options.mode, 'grid') === 'grid' && pageCount > 1 && <div className={styles.pagination}><Button size="sm" variant="secondary" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>Previous</Button><span>Page {currentPage + 1} of {pageCount}</span><Button size="sm" variant="secondary" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)}>Next</Button></div>}
    </div>
  );
};
