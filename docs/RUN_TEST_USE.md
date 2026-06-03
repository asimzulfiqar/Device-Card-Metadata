# Run, Test, And Use Device Card Panel

This guide is the practical checklist for local development, release validation, and dashboard usage.

## Prerequisites

- Node.js `22` or newer.
- npm `11` or compatible with the checked-in `package-lock.json`.
- Docker Desktop for Grafana, browser e2e tests, and plugin-validator checks.
- A browser for manual verification at `http://localhost:3000`.

## Install

```bash
npm ci
```

Use `npm ci` for repeatable release checks. Use `npm install` only when intentionally changing dependencies.

## Build The Plugin

```bash
npm run build
```

This writes the production plugin to `dist/`. Grafana loads this directory in the provided Docker environment.

## Run Grafana Locally

Start Docker Desktop first, then run:

```bash
docker compose up --build
```

Open:

```text
http://localhost:3000/d/device-card-panel-examples/device-card-panel-examples
```

Default local credentials are usually:

```text
admin / admin
```

The provisioned dashboard contains:

- `Device fleet`: fleet cards with thresholds, mini trends, grouping, filters, diagnostics, and drilldown action.
- `Empty-state example`: confirms the panel explains missing data.
- `Brunnen-Metadaten`: metadata-detail sheet with German labels and units.

## Fast Source Checks

Run these before opening Grafana:

```bash
npm run typecheck
npm run lint
npm run test:ci
npm run build
```

Expected result:

- TypeScript completes with no errors.
- ESLint completes with no errors.
- Jest reports all utility tests passing.
- Webpack compiles successfully and copies screenshots into `dist/img/screenshots/`.

## Browser E2E Tests

Docker/Grafana must already be running:

```bash
docker compose up --build
npm run e2e
```

The e2e tests verify:

- Empty data shows a helpful setup message.
- Fleet cards render the sample devices, metrics, mini trend, and diagnostics.
- Metadata detail renders the German water-monitoring sheet with correct UTF-8 labels and units.

If e2e fails with `ECONNREFUSED localhost:3000`, Grafana is not running yet or Docker Desktop is stopped.

## Manual Browser Test Checklist

Open the provisioned dashboard and check:

1. The `Device fleet` panel renders three cards.
2. Health summary buttons show `All`, plus status color counts.
3. Search filters cards.
4. Battery and temperature values render with colors and mini trend lines.
5. The `Open metadata` action link is visible and preserves the time range.
6. The diagnostics drawer shows frame and field details.
7. The `Brunnen-Metadaten` panel shows `Wasserzähler`, `m³`, and `m ü. NHN` correctly.
8. Edit the fleet panel and confirm **Presentation mode** is the first option.
9. Switch between **Fleet cards** and **Metadata detail** and confirm irrelevant side-menu options disappear.
10. In metadata mode, try **Template**, **Export current**, collapse, duplicate, and move controls in **Sections and rows**.

## Package For Release

Build first:

```bash
npm run build
```

Create a ZIP with the required top-level plugin directory:

```powershell
$releaseDir = Join-Path (Get-Location) 'release'
New-Item -ItemType Directory -Force $releaseDir | Out-Null
$staging = Join-Path $releaseDir 'asimzulfiqar-devicecard-panel'
if (Test-Path $staging) { Remove-Item -LiteralPath $staging -Recurse -Force }
Copy-Item -Path dist -Destination $staging -Recurse
$zip = Join-Path $releaseDir 'asimzulfiqar-devicecard-panel-1.0.0.zip'
if (Test-Path $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path $staging -DestinationPath $zip
```

The generated `release/` directory is ignored by Git.

## Validate Plugin Metadata

Docker Desktop must be running:

```powershell
docker run --pull=always -v "${PWD}/release/asimzulfiqar-devicecard-panel-1.0.0.zip:/archive.zip" grafana/plugin-validator-cli -analyzer=metadatavalid /archive.zip
```

Run the validator after every change to `src/plugin.json`, screenshots, README, license, or packaging.

## How To Use: Fleet Cards

Use **Fleet cards** when the query returns one row per device, service, host, site, or asset.

Minimum setup:

1. Set **Presentation mode** to **Fleet cards**.
2. Set **Entity ID field**.
3. Optionally set **Title field**, **Subtitle field**, **Status field**, and **Last seen field**.
4. Add one or more **Metrics**.

Useful options:

- **Status source**: mapped status, worst composite check, or last-seen staleness.
- **Fleet controls**: search, summary filters, grouping, sorting, pagination, and maximum rendered entities.
- **Actions**: add dashboard or external links using placeholders such as `{device_id}`.
- **Style**: visual preset, border, background, radius, typography, and status accent.

Example query shape:

```sql
SELECT device_id, owner, location, status, battery, temperature, last_seen
FROM devices;
```

## How To Use: Metadata Detail

Use **Metadata detail** when one selected asset needs a structured sheet.

Minimum setup:

1. Set **Presentation mode** to **Metadata detail**.
2. Set **Entity ID field**.
3. Add **Sections and rows**, or choose a **Template**.
4. Set **Maximum columns**.

Recommended drilldown setup:

1. In the fleet panel action URL, pass a variable:

   ```text
   /d/device-card-panel-examples/device-card-panel-examples?viewPanel=3&var-device_id={device_id}
   ```

2. In the metadata panel:

   ```text
   Selector field: objektkennzahl
   Selector value: $device_id
   ```

If the selector does not find a matching row, the panel uses **Row index fallback**.

## Safe Data And Security Notes

- The plugin is frontend-only.
- Do not put secrets in panel options or action URLs.
- Action URLs allow relative links and `http`/`https`; unsafe schemes are ignored.
- Derived fields use a small expression language only, not arbitrary JavaScript.

## Troubleshooting

- **Panel shows no cards**: confirm the query returns a table frame and **Entity ID field** points to an existing column.
- **Metadata shows configure message**: add sections and rows or apply a metadata template.
- **Last seen warning**: map a Grafana time field, not a string or second-based timestamp.
- **Trend does not appear**: enable **Show trend** and provide a trend field containing an array or delimited numeric text.
- **Docker commands fail**: start Docker Desktop and wait until the Docker engine is ready.

