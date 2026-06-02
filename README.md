# Device Card Panel for Grafana

Device Card Panel renders query rows as clean, reusable entity cards for devices, assets, hosts, and services. It is configured entirely through the Grafana panel editor: no HTML, CSS, JavaScript, or Handlebars templates are required.

## Features

- Single-card and responsive grid layouts with summary, compact, and detailed cards.
- Guided field mapping for title, subtitle, description, status, last seen, and dynamic logo fields.
- Configurable metric rows with unit and decimal overrides.
- Derived fields with a deliberately small expression language.
- Status pills, threshold rules, and independent freshness indicators.
- Built-in icons, dynamic image URLs, and field-aware card actions.
- Theme-aware neutral, elevated, tinted, and minimal presets for Grafana light and dark modes.
- Compact, comfortable, and spacious density options with grid, list, or tile metrics.
- Configurable logo placement, status placement, and status-colored accent bars.
- Viewer-friendly fleet search, health filters, sorting, grouping, and pagination.
- Composite health checks that surface the worst failing metric and reason.
- Field selectors populated from live query columns and configured derived fields.
- Setup profiles, conservative auto-mapping suggestions, and an in-panel data diagnostics drawer.
- A separate metadata-detail presentation for grouped asset sheets with domain-specific labels and units.

## Quick Start

Return one table row per entity. For example:

```sql
SELECT device_id, owner, location, status, battery, temperature, last_seen
FROM devices
ORDER BY device_id;
```

Add the panel, open **Field mapping**, and set **Entity ID field** to `device_id`. Then add metric rows such as `battery` and `temperature`. Optional mappings progressively fill in the richer parts of each card.

For Prometheus data, use Grafana transformations to join labels and values into one table row per entity before passing data to this panel.

## Derived Fields

Derived fields support arithmetic and these pure functions:

```text
coalesce(owner, "Unknown")
concat(location, " - ", type)
battery_level * 100
round(error_rate * 100, 1)
lower(status)
upper(region)
```

Derived fields can be used as mapped fields, metrics, status sources, and action URL placeholders.

## Actions

Card action URLs substitute encoded values from the row:

```text
d/device-detail?var-device_id={device_id}
https://cmms.example.com/device/{id}
```

Action labels and URLs support Grafana dashboard variables. Enable **Include time range** on an action to preserve the source dashboard window during drilldown.

## Fleet Controls

Enable the viewer toolbar for larger result sets. Viewers can search across card values, filter by health color, and sort cards without dashboard edit access. Dashboard authors can group cards by fields such as `owner`, `site`, `team`, or `region`, and limit the number of cards rendered per page.

## Composite Health

Use **Worst composite check** when a card status should be derived from multiple metrics. For example:

```text
battery < 40       -> Low battery  (yellow)
temperature >= 60 -> High temperature (red)
```

If more than one check fails, the card uses the most severe matched color and exposes the failure reason as a status tooltip.

## Setup Assistant And Diagnostics

When a query returns rows but the required entity ID has not been mapped, the panel offers an **Apply suggested mappings** button. Suggestions only fill empty settings and look for common column names such as `device_id`, `asset_id`, `service`, `host`, `status`, and `last_seen`.

Choose an IoT device, service-health, or asset-inventory setup profile before applying suggestions. The diagnostics drawer remains available after setup and shows frames, row counts, field names, field types, multi-frame guidance, and suspicious timestamp units.

## Metadata Detail Layout

Set **Presentation mode** to **Metadata detail** when a single selected asset needs a structured detail sheet rather than a fleet card. The editor hides fleet-only settings and shows the section builder. Add responsive sections such as identification, meter, probe, and radio-unit details. Each section supports:

- Metadata rows with a source field and localized display label.
- Subsection headings such as `Letzte Messwerte`.
- Literal unit suffixes such as `m³` or `m ü. NHN`.
- Decimal formatting, highlighted values, and missing-value fallback text.

The provisioned dashboard includes a German water-monitoring example based on one query row.

## Layout And Styling

Use the top-level **Presentation mode** control to choose **Fleet cards** or **Metadata detail**. The two modes share the same table-row data model, but each mode exposes only its relevant panel settings.

The **Layout** options let dashboard authors choose summary, compact, or detailed cards; vertical or horizontal orientation; card density; and grid, list, or tile metrics.

The **Style** options include neutral, elevated, tinted, and minimal visual presets. A status-colored accent can be shown as a top or left bar. Logo and status placement remain configurable independently, which makes the same card useful for dense operations grids and larger overview panels.

## Development

```bash
npm install
npm run build
npm run server
```

Open `http://localhost:3000`. The provisioned dashboard demonstrates a service-card grid and a single IoT-device card using Grafana's TestData data source.

Importable dashboard exports are also available in [examples/dashboards](examples/dashboards).

## Validation

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

For catalog submission, package and validate the built plugin using Grafana's official publishing workflow. The GitHub Actions release workflow produces the archive from version tags.

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the release checklist.

## Compatibility

- Grafana `10.0.0` and later.
- Frontend-only panel plugin.
- No secrets or credentials are stored in panel options.

## Known Limitations

- The panel consumes the first returned data frame. Use Grafana transformations to join multiple query results.
- Derived expressions intentionally do not support arbitrary code, loops, or side effects.
- Screenshot assets should be added after capturing the final panel in your branded demo environment.

## Roadmap

- Mini trend visualizations.
- Additional pure derived-field functions.
- Optional CSS class hook for controlled host-level styling.

## License

Apache License 2.0. See [LICENSE](LICENSE).
