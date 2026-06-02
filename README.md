# Device Card Panel for Grafana

Device Card Panel renders query rows as clean, reusable entity cards for devices, assets, hosts, and services. It is configured entirely through the Grafana panel editor: no HTML, CSS, JavaScript, or Handlebars templates are required.

## Features

- Single-card and responsive grid layouts.
- Guided field mapping for title, subtitle, description, status, last seen, and dynamic logo fields.
- Configurable metric rows with unit and decimal overrides.
- Derived fields with a deliberately small expression language.
- Status pills, threshold rules, and independent freshness indicators.
- Built-in icons, dynamic image URLs, and field-aware card actions.
- Theme-aware styling for Grafana light and dark modes.

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
