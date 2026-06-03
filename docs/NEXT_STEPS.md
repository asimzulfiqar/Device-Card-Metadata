# Device Card Panel - Next Steps

Paused on 2026-06-02 after agreeing to implement the full professional-release improvement sprint.

## Current State

- The plugin has two top-level presentation modes:
  - `Fleet cards`
  - `Metadata detail`
- The editor hides settings that are irrelevant to the selected presentation mode.
- Existing saved metadata panels remain compatible through a legacy `layout: metadata` fallback.
- The provisioned dashboard is available at:
  - `http://localhost:3000/d/device-card-panel-examples/device-card-panel-examples`
- Last completed verification before this sprint:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test:ci` - 10 passed
  - `npm run build`
  - `npm run e2e` - 4 passed

## Agreed Sprint Status

Implemented in the next sprint:

1. Fixed UTF-8 text corruption in documentation, tests, and the provisioned German metadata example.
2. Added fleet-to-metadata drilldown support through card actions and documented the dashboard-variable workflow.
3. Added metadata row selection by entity field and value, including Grafana variable replacement, with row-index fallback.
4. Added action URL validation that rejects unsafe schemes such as `javascript:`.
5. Added fallback icon rendering when a dynamic logo image fails to load.
6. Added metric thresholds and value mappings.
7. Added optional metric sparklines / mini trends with a delimited table-data convention.
8. Added reusable metadata templates:
   - Generic asset
   - IoT device
   - Service or server
   - Water-monitoring asset
9. Improved the metadata section editor:
   - Duplicate sections and rows
   - Move sections and rows up or down
   - Collapse sections while editing
   - Confirm destructive removal
   - Import and export section JSON
10. Added large-fleet guardrails:
   - Configurable maximum rendered entities
   - Clear truncation notice
   - Consider virtualization only if pagination and limits are insufficient
11. Added catalog screenshots and listed them in `src/plugin.json`:
   - Fleet overview
   - Metadata detail
   - Focused options editor
   - Dark-theme example
12. Added and documented a Grafana compatibility matrix for `10.4.0`, `11.6.0`, and `12.4.0`.
13. Packaged the release ZIP.

Still requires Docker Desktop to be running:

- Run `npm run e2e` against `http://localhost:3000`.
- Run the Docker-based Grafana plugin validator.

## Files Inspected For The Sprint

- `src/components/ArrayEditor.tsx`
- `src/components/MetadataSectionsEditor.tsx`
- `src/components/DeviceCardPanel.tsx`
- `src/utils.ts`
- `src/utils.test.ts`
- `src/types.ts`
- `src/module.ts`
- `src/plugin.json`
- `docs/PUBLISHING.md`
- `.github/workflows/ci.yml`
- `.config/docker-compose-base.yaml`

## Important Findings

- UTF-8 corruption was visible in older tracked content and should stay fixed in user-facing files.
- `src/plugin.json` currently has an empty `screenshots` array.
- `substituteUrl()` currently substitutes values but does not validate URL schemes.
- Dynamic logos render an `<img>` but do not fall back when image loading fails.
- Metadata selection currently uses `rowIndex` only.
- Metric mappings currently support field, label, unit, and decimals only.
- Metadata section editing currently supports add and remove only.
- CI already builds a ZIP and invokes `grafana/plugin-validator-cli` for metadata validation.

## Suggested Implementation Order

1. UTF-8 fixes, safe URL utility, image fallback, and metadata entity selection.
2. Metadata templates and section-editor polish.
3. Metric thresholds, value mappings, trends, and fleet limits.
4. Documentation, screenshots, compatibility matrix, packaging, and validator run.
5. Run the full verification suite and restart Grafana.
