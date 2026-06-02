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
  const background =
    option(options.background, 'default') === 'none'
      ? 'transparent'
      : option(options.cardTheme, 'neutral') === 'emphasis'
        ? theme.colors.primary.transparent
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
          const metrics = (options.metrics ?? []).slice(0, option(options.layout, 'detailed') === 'compact' ? 3 : 6);
          return (
            <article
              className={cx(styles.card, css`
                background: ${background};
                border: ${borderWidth}px solid ${theme.colors.border.weak};
                border-radius: ${radius}px;
                flex-direction: ${option(options.orientation, 'vertical') === 'horizontal' ? 'row' : 'column'};
                font-size: ${{ small: 12, normal: 14, large: 16 }[option(options.typography, 'normal')]}px;
              `)}
              key={`${text(values[idField])}-${index}`}
            >
              <div className={styles.heading}>
                {option(options.showLogo, true) && <div className={styles.logo}>{logoIsUrl ? <img className={styles.image} src={dynamicLogo} alt="" /> : <Icon name={iconNames[logoIcon] as never} size="xl" />}</div>}
                <div className={styles.body}>
                  <div className={styles.title}>{text(values[options.titleField] || values[idField])}</div>
                  {options.subtitleField && <div className={styles.muted}>{text(values[options.subtitleField])}</div>}
                </div>
                {options.statusField && <span className={styles.pill} style={{ background: statusColor }}>{rule?.icon && <Icon name={iconNames[rule.icon] as never} size="xs" />}{rule?.label || text(statusValue) || 'Unknown'}</span>}
              </div>
              <div className={styles.body}>
                {option(options.layout, 'detailed') === 'detailed' && options.descriptionField && <div className={styles.description}>{text(values[options.descriptionField])}</div>}
                {metrics.length > 0 && <div className={styles.metrics}>{metrics.map((metric) => <div key={metric.field}><div className={styles.muted}>{metric.label || metric.field}</div><div className={styles.metricValue}>{formatMetric(values[metric.field], metric, fieldByName(frame, metric.field))}</div></div>)}</div>}
                <div className={styles.footer}>
                  <span className={styles.muted}>
                    {option(options.showStaleness, true) && stale && <span style={{ color: resolveColor(stale.color, theme) }}>● </span>}
                    {options.lastSeenField && <>Last seen {relativeTime(values[options.lastSeenField])}</>}
                  </span>
                  <span>{(options.actions ?? []).map((action) => <a className={styles.link} href={substituteUrl(action.url, values)} key={action.label} target={action.newTab ? '_blank' : '_self'} rel={action.newTab ? 'noreferrer' : undefined}>{action.label}</a>)}</span>
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
