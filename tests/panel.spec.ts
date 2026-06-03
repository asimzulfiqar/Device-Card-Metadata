import { expect, test } from '@grafana/plugin-e2e';

test('shows a helpful empty state when panel data is empty', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '2' });
  await expect(panelEditPage.panel.locator).toContainText('Return a table with one row per entity');
});

test('renders provisioned device cards', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '1' });
  await expect(panelEditPage.panel.locator).toContainText('sensor-001');
  await expect(panelEditPage.panel.locator).toContainText('Battery');
  await expect(panelEditPage.panel.locator.locator('svg[aria-label="Battery trend"]').first()).toBeVisible();
  await expect(panelEditPage.panel.locator).toContainText('Data diagnostics');
});

test('renders the metadata detail example', async ({ gotoPanelEditPage, readProvisionedDashboard }) => {
  const dashboard = await readProvisionedDashboard({ fileName: 'dashboard.json' });
  const panelEditPage = await gotoPanelEditPage({ dashboard, id: '3' });
  await expect(panelEditPage.panel.locator).toContainText('Identifikation und Lage');
  await expect(panelEditPage.panel.locator).toContainText('Wasserzähler');
  await expect(panelEditPage.panel.locator).toContainText('246.7 m ü. NHN');
  await expect(panelEditPage.panel.locator).toContainText('Batteriestand');
});
