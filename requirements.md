# Device Card Panel – Requirements

## 1. Overview

The **Device Card Panel** is a Grafana panel plugin that displays one or more entities (devices, assets, services, hosts, etc.) as compact, configurable cards. Each card shows identifiers, metadata, key metrics, last values, and status information, without requiring users to write HTML, CSS, or JavaScript templates.[web:25][web:26]  

The panel is designed for:

- IoT device dashboards (device ID, owner, location, last readings, last seen).  
- Infrastructure and SRE dashboards (service/host name, team, status, key KPIs).  
- Business dashboards (customer/site cards with KPIs and health).

---

## 2. Problems this plugin solves

Existing solutions (Text panel, Business Text, dynamic text plugins) are powerful but have drawbacks:[web:26][web:28][web:38]  

- Require HTML/CSS/JS/Handlebars knowledge.  
- Boilerplate templates repeated across dashboards.  
- Hard to keep consistent styling and layout.  
- Fragile templates where small syntax mistakes break panels.  

**Device Card Panel** aims to:

- Provide a **UI‑driven** way to configure entity cards.  
- Support common use cases without custom markup.  
- Allow controlled, simple calculations and custom fields.  
- Make it trivial to reuse a card design across dashboards.

---

## 3. Scope

In scope:

- Frontend‑only panel plugin (no backend component).  
- Works with any data source that can return a table data frame.  
- Supports single‑card and multi‑card layouts.  
- Supports mapping query fields to card roles via UI.  
- Supports simple derived fields and conditional formatting rules.  

Out of scope (for initial versions):

- Arbitrary HTML/JS templating like Business Text.  
- Form input/interaction (this is visualization, not forms).[web:45]  
- Storing secrets or credentials in the panel (must never do this).[web:46]  

---

## 4. Data model and assumptions

The panel consumes a single table data frame with:

- One row per entity (e.g., device).  
- Columns may include:
  - Identifier (device_id / host / asset_id).  
  - Metadata fields (owner, location, type, tags).  
  - Numeric fields (battery, RSSI, temperature, error_rate, etc.).  
  - Status field (string/number).  
  - Time field (last_seen).  
  - URL or image path for logos/icons (optional).  

Assumptions:

- In **single‑card mode**, the plugin uses the first row by default (or a row index selection).  
- In **multi‑card mode**, the plugin renders one card per row.  
- Users can pre‑aggregate / pre‑filter data in queries and transformations; the panel does not fetch data itself.[web:41]  

---

## 5. Core user experience goals

1. **No HTML/JS required** for standard device cards.  
2. **Guided configuration** and clear empty states; users understand what fields are needed.[web:41]  
3. **Safe defaults** so cards look reasonable with minimal setup.  
4. **Simple but powerful field mapping** for base and custom fields.  
5. **Lightweight calculations** and derived fields without full scripting.  
6. **Easy styling and icons** through configuration, not code.

---

## 6. Features

### 6.1 Field mapping

Panel options must include a “Field mapping” section to bind frame fields to semantic roles:

Required:

- Device ID / Entity ID:
  - Type: field selector (string).  
  - Description: Primary identifier shown as title and used in links.  

Optional mappings:

- Title field:
  - Defaults to ID if not set.  
- Subtitle field:
  - For owner, type, or short description.  
- Description field:
  - Longer text, truncated in compact layouts.  
- Status field:
  - String or numeric; used for status pill and conditional formatting.  
- Last seen field:
  - Time field used for staleness and “Last seen X ago.”  
- Metric fields:
  - List of metric mappings:
    - Source field selector (numeric or string).  
    - Label override.  
    - Unit (inherit / explicit).  
    - Optional format (decimals).  
- Logo / icon field:
  - Field selector that contains:
    - URL to an image, or  
    - Short icon code (e.g., `battery`, `wifi`, `server`) mapped to built‑in icon set.  

Validation:

- If Device ID is not mapped, panel shows a clear message and guides user to mapping section.  
- If mapped field types are incompatible (e.g., non‑time field mapped as last_seen), show a warning.

### 6.2 Custom fields

Users can define **custom fields** derived from existing query fields via simple expressions and mapping:

- Custom fields configuration:
  - Name (internal key).  
  - Label (display name).  
  - Expression:
    - Uses a small expression language referencing fields by name:
      - Examples:
        - `battery_level * 100`  
        - `coalesce(owner, "Unknown")`  
        - `concat(location, " · ", type)`  
    - Only pure functions (no side effects, no loops).  
  - Type (string/number/bool/time) inferred when possible or set by user.  
  - Optional unit and decimals (for numbers).  

- Custom fields can be used:
  - As metrics in the metrics list.  
  - As title/subtitle/status fields.  
  - In status rules (see next section).  

Implementation detail: expression support can be incremental; Stage 1 may only support a small function set like arithmetic, `concat`, and null‑handling.

### 6.3 Status and conditional formatting

The plugin provides a UI to define **status rules** on a mapped field (raw or custom):

- Status field source:
  - Select existing field or custom field.  

- Rule types:
  - Value equals (string): `status == "OK"`.  
  - Value contains (string).  
  - Numeric thresholds: `<`, `<=`, `>`, `>=`.  

- For each rule, users can configure:
  - Status label override (optional).  
  - Color (using theme palette).  
  - Icon (from a predefined set).  

- Fallback status:
  - Default color/icon when no rule matches.  

Status is displayed as a small pill or chip on the card (e.g., top‑right).

### 6.4 Last seen and staleness

If a **last_seen** field is mapped:

- Show human‑friendly “Last seen … ago” text.  
- Optional staleness configuration:
  - Fresh threshold (minutes).  
  - Stale threshold (minutes).  

Mapping:

- age < fresh → Fresh (green).  
- fresh ≤ age < stale → Stale (yellow).  
- age ≥ stale → Offline (red).  

These staleness statuses can be used:
- To color a “status dot” separately from the status field.  
- Or to inject into the status rules (implementation choice).

### 6.5 Logo and icon support

The panel must support:

- Displaying a **logo/icon** on the card, configured via:
  - Static icon:
    - Choose from a built‑in icon set (e.g., device, server, cloud).  
  - Dynamic icon:
    - Map a field that contains:
      - URL to an image (load via `<img>` or theme‑friendly image component).  
      - Or a short icon code mapped to built‑in icons.  

Optional:

- Fallback icon when the field is empty / URL fails.  

Logo placement:

- Top‑left or top‑right of card header.  
- Option to hide logo entirely.

### 6.6 Layouts and multi‑card support

The plugin supports:

- Single card mode:
  - Uses first row (or a configurable row index).  
- Multi‑card mode:
  - Renders all rows as cards in a responsive grid.  

Layout options:

- Layout type:
  - Compact (title, subtitle, status pill, 1–3 metrics, last seen).  
  - Detailed (title, subtitle, description, 3–6 metrics, last seen, links).  
- Card orientation:
  - Vertical (header on top, metrics below).  
  - Horizontal (logo and title left, metrics right).  
- Grid options (for multi‑card):
  - Max columns.  
  - Card min width.  

The layout should adapt to panel size and Grafana theme.

### 6.7 Links and actions

Each card can expose links:

- Options for up to N **card actions**:
  - Label.  
  - URL.  
  - Open in same tab / new tab.  
- URLs support variable substitution from fields:
  - `{id}`, `{owner}`, `{device_id}` etc., taken from the mapped fields.  

Example:

- `https://cmms.example.com/device/{device_id}`  
- `d/dashboard/abc123/device-detail?var-device_id={device_id}`  

These links appear as buttons or inline links at the bottom of the card.

---

## 7. Styling and formatting

The plugin aims to avoid CSS, but still offer meaningful styling controls:

- Card themes:
  - Light, Neutral, Emphasis (uses theme colors).[web:46]  
- Background:
  - Default / subtle / none.  
- Border:
  - None / subtle / strong.  
- Corner radius:
  - Small / medium / large.  
- Typography scale:
  - Small / normal / large.  

Metrics formatting:

- Use Grafana’s built‑in field configuration for units and decimals when possible.  
- Allow overriding per metric mapping (unit + decimals).

Optional future enhancement (later stage):

- “Custom CSS class” string that power users can hook into via global CSS injection, while keeping the plugin itself free of arbitrary CSS text fields.

---

## 8. Usability requirements

To address common plugin usability issues and to minimize “RTFM and guess the query,” the plugin must have:

- **Wizard / empty state:**  
  - If no data frame or no mapped ID:
    - Show a friendly message explaining required fields and a short example query.  
  - Provide a link to documentation and example dashboard.[web:41]  

- **Inline validation messages:**
  - Missing required field mappings.  
  - Incompatible field types for roles.  
  - Invalid expressions in custom fields (with error text).  

- **Preview behavior:**
  - If data is present but some fields unmapped, card should render with partial content rather than fail completely.

---

## 9. Non‑functional requirements

- Compatible with Grafana 10+; tested versions must be documented.[web:43]  
- Frontend‑only; no server‑side runtime or backend plugin.  
- No storage or handling of secrets/credentials in options.[web:46]  
- Efficient rendering for dozens of cards per panel (multi‑card mode).  
- Behavior consistent across light/dark themes via theme tokens.  

---

## 10. Plugin metadata and documentation

Comply with Grafana plugin publishing best practices for metadata, discoverability, and user experience.[web:4][web:43]  

- Plugin metadata (`plugin.json`):
  - Name: “Device Card Panel”.  
  - Id: e.g., `asimzulfiqar-device-card-panel`.  
  - Description: “Configurable entity cards for devices, assets, and services – no HTML or JS required.”  
  - Keywords: `device`, `card`, `metadata`, `overview`, `iot`, `asset`.  
  - Screenshots: single card, grid of cards, config panel.  
  - Links: GitHub repo, docs site, issue tracker.  

- README:
  - Problem statement and motivation.  
  - Quick start with:
    - Example SQL/PromQL.  
    - Step‑by‑step field mapping.  
  - Explanation of:
    - Field mapping.  
    - Custom fields and expressions.  
    - Status rules.  
    - Logo/icon configuration.  
  - Known limitations and roadmap.  

- Example dashboards:
  - JSON exports for:
    - “IoT device card” example.  
    - “Service card grid” example.  

---

## 11. Roadmap (high level)

- **Stage 1 (MVP):**
  - Single card mode.  
  - Basic field mapping (ID, title, subtitle, metrics, last_seen).  
  - Simple status rules and staleness.  
  - Static logo/icon.  

- **Stage 2:**
  - Multi‑card grid.  
  - Custom fields with basic expressions.  
  - Dynamic icons from field.  
  - Links/actions.  

- **Stage 3:**
  - Richer expression language.  
  - Mini trends inside cards.  
  - Optional “custom CSS class” hook.  