# Device Card Panel for Grafana

Device Card Panel renders query rows as clean, reusable entity cards and metadata sheets for devices, assets, hosts, services, and business entities. It is configured entirely through the Grafana panel editor: no HTML, CSS, JavaScript, or Handlebars templates are required.

## Features

- Top-level presentation modes for **Fleet cards** and **Metadata detail**.
- Single-card and responsive grid layouts with summary, compact, and detailed cards.
- Guided field mapping for title, subtitle, description, status, last seen, and dynamic logo fields.
- Configurable metric rows with unit overrides, decimals, value mappings, threshold colors, and optional mini trends.
- Derived fields with a deliberately small expression language.
- Status pills, status rules, composite health checks, and independent freshness indicators.
- Built-in icons, dynamic image URLs with fallback icons, and field-aware card actions.
- Safe action URL rendering for relative dashboard links and `http`/`https` URLs.
- Theme-aware neutral, elevated, tinted, and minimal presets for Grafana light and dark modes.
- Viewer-friendly fleet search, health filters, sorting, grouping, pagination, and large-fleet render limits.
- Metadata-detail sheets with templates, localized labels, literal units, highlights, and JSON import/export.
- Setup profiles, conservative auto-mapping suggestions, and an in-panel data diagnostics drawer.

## Quick Start

Return one table row per entity. For example:

```sql
SELECT device_id, owner, location, status, battery, temperature, last_seen
FROM devices
ORDER BY device_id;
```

Add the panel, choose **Presentation mode**, open **Field mapping**, and set **Entity ID field** to `device_id`. Then add metric rows such as `battery` and `temperature`. Optional mappings progressively fill in richer card content.

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

Derived fields can be used as mapped fields, metrics, status sources, metadata rows, and action URL placeholders.

## Metrics

Metrics can inherit Grafana field formatting or override units and decimals per row. Optional value mappings turn exact raw values into user-facing labels, and thresholds color matching metric values.

Mini trends render from a configured trend field. The field may contain an array or delimited text:

```text
92,90,87,86,84
```

## Actions And Drilldowns

Card action URLs substitute encoded values from the row:

```text
/d/device-detail?var-device_id={device_id}
https://cmms.example.com/device/{id}
```

Action labels and URLs support Grafana dashboard variables. Enable **Include time range** on an action to preserve the source dashboard window during drilldown. Unsafe schemes such as `javascript:` are ignored at render time.

A common fleet-to-metadata workflow is:

```text
/d/device-card-panel-examples/device-card-panel-examples?viewPanel=3&var-device_id={device_id}
```

## Fleet Controls

Enable the viewer toolbar for larger result sets. Viewers can search across card values, filter by health color, and sort cards without dashboard edit access. Dashboard authors can group cards by fields such as `owner`, `site`, `team`, or `region`, limit the number of cards per page, and cap the total number of rendered entities to protect busy dashboards.

## Metadata Detail

Set **Presentation mode** to **Metadata detail** when a single selected asset needs a structured sheet rather than a fleet card. The editor hides fleet-only settings and shows metadata-specific controls.

Each section supports:

- Metadata rows with a source field and localized display label.
- Subsection headings such as `Letzte Messwerte`.
- Literal unit suffixes such as `m³` or `m ü. NHN`.
- Decimal formatting, highlighted values, and missing-value fallback text.
- Reusable templates, JSON import/export, duplicate controls, move controls, collapsible sections, and confirmation before destructive removal.

For drilldowns, configure **Selector field** and **Selector value**. For example, set selector field to `objektkennzahl` and selector value to `$device_id`. If no matching row is found, the panel falls back to the configured row index.

## Setup Assistant And Diagnostics

When a query returns rows but the required entity ID has not been mapped, the panel offers an **Apply suggested mappings** button. Suggestions only fill empty settings and look for common column names such as `device_id`, `asset_id`, `service`, `host`, `status`, and `last_seen`.

The diagnostics drawer shows frames, row counts, field names, field types, multi-frame guidance, and suspicious timestamp units.

## Development

```bash
npm install
npm run build
npm run server
```

Open `http://localhost:3000`. The provisioned dashboard demonstrates fleet cards, empty states, and a German water-monitoring metadata sheet using Grafana's TestData data source.

Importable dashboard exports are available in [examples/dashboards](examples/dashboards).

## Validation

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
npm run e2e
```

For catalog submission, package and validate the built plugin using Grafana's official publishing workflow. The GitHub Actions release workflow produces the archive from version tags.

See [docs/PUBLISHING.md](docs/PUBLISHING.md) for the release checklist.

See [docs/RUN_TEST_USE.md](docs/RUN_TEST_USE.md) for detailed local run, test, validation, and usage instructions.

## Compatibility

- Grafana `10.0.0` and later.
- Local verification currently uses Grafana `12.4.0`.
- CI includes Grafana image matrix coverage for `10.4.0`, `11.6.0`, and `12.4.0`, plus the latest frontend API compatibility check.
- Frontend-only panel plugin.
- No secrets or credentials are stored in panel options.

## Known Limitations

- The panel consumes the first returned data frame. Use Grafana transformations to join multiple query results.
- Derived expressions intentionally do not support arbitrary code, loops, or side effects.
- Large fleets should be filtered, grouped, capped, or paginated for readable dashboards.

## Roadmap

- Additional pure derived-field functions.
- Optional CSS class hook for controlled host-level styling.

## License

Apache License 2.0. See [LICENSE](LICENSE).
