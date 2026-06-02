import React from 'react';
import { css, cx } from '@emotion/css';
import { PanelProps } from '@grafana/data';
import { Alert, Icon, useStyles2, useTheme2 } from '@grafana/ui';
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

export const DeviceCardPanel = ({ options, data }: PanelProps<DeviceCardOptions>) => {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const frame = data.series[0];
  const rows = frameRows(frame);
  const idField = options.idField;
  const lastSeenWarning = options.lastSeenField && !isTimeField(frame, options.lastSeenField);
  const visibleRows = option(options.mode, 'grid') === 'single' ? rows.slice(option(options.rowIndex, 0), option(options.rowIndex, 0) + 1) : rows;
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

  if (!frame || rows.length === 0) {
    return <div className={styles.empty}><div><h3>Device Card Panel</h3><p>Return a table with one row per entity, then map an Entity ID field in panel options.</p><code>SELECT device_id, owner, status, battery, last_seen FROM devices</code></div></div>;
  }
  if (!idField || !fieldByName(frame, idField)) {
    return <div className={styles.empty}><Alert title="Map an Entity ID field" severity="info">Open Field mapping in the panel options and enter a column name such as <code>device_id</code>. Your query returned {rows.length} row(s).</Alert></div>;
  }

  return (
    <div className={styles.wrapper}>
      {lastSeenWarning && <Alert title="Last seen field is not a time field" severity="warning">Choose a Grafana time field for relative age and staleness.</Alert>}
      <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${option(options.maxColumns, 4)}, minmax(min(100%, ${option(options.minCardWidth, 220)}px), 1fr))` }}>
        {visibleRows.map((rawValues, index) => {
          const derived = withCustomFields(rawValues, options.customFields ?? []);
          const values: CardValues = { ...derived.values, id: derived.values[idField] };
          const statusValue = values[options.statusField];
          const rule = statusFor(statusValue, options.statusRules ?? []);
          const statusColor = resolveColor(rule?.color ?? option(options.fallbackStatusColor, 'gray'), theme);
          const stale = options.lastSeenField ? staleness(values[options.lastSeenField], option(options.freshMinutes, 15), option(options.staleMinutes, 60)) : undefined;
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
          const status = options.statusField && <span className={styles.pill} style={{ background: statusColor }}>{rule?.icon && <Icon name={iconNames[rule.icon] as never} size="xs" />}{rule?.label || text(statusValue) || 'Unknown'}</span>;
          return (
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
              key={`${text(values[idField])}-${index}`}
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
                  <span className={styles.footerGroup}>{(options.actions ?? []).map((action) => <a className={styles.link} href={substituteUrl(action.url, values)} key={action.label} target={action.newTab ? '_blank' : '_self'} rel={action.newTab ? 'noreferrer' : undefined}>{action.label}</a>)}</span>
                </div>
                {derived.errors.length > 0 && <span className={styles.muted} title={derived.errors.join('\n')}>Derived field warning</span>}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
