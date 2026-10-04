import { expect, test, type Page } from "@playwright/test";

const session = { user: { sub: "visual-user", name: "Visual Reviewer", preferred_username: "reviewer", email: "reviewer@vuteq.co.id" }, permissions: ["ITAM.DASHBOARD_READ", "ITAM.MASTER_READ", "ITAM.ASSET_READ", "ITAM.ASSET_CREATE", "ITAM.ASSET_UPDATE", "ITAM.ASSET_ARCHIVE", "ITAM.ASSET_DISPOSE", "ITAM.LICENSE_READ", "ITAM.MAINTENANCE_READ", "ITAM.STOCK_OPNAME_READ", "ITAM.SYSTEM_LOG_READ", "ITAM.USER_MANAGEMENT"], roles: ["ADMIN_IT"], globalRoles: [], emailVerified: true, mfaVerified: true, expiresAt: Date.now() + 86_400_000 };
const envelope = (data: unknown, path: string) => ({ success: true, statusCode: 200, message: "OK", data, timestamp: new Date().toISOString(), path, requestId: "visual-request" });
async function authenticate(page: Page) {
  await page.context().addCookies([{ name: "itam_session", value: "visual-session", url: "http://127.0.0.1:3200" }]);
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: session }));
}

test("signed-out request redirects seamlessly to SSO login", async ({ page }) => {
  await page.route("https://sso.vuteq.co.id/**", (route) => route.fulfill({ contentType: "text/html", body: "<title>Vuteq SSO</title>" }));
  await page.goto("/apps");
  await expect(page).toHaveURL(/^https:\/\/sso\.vuteq\.co\.id\/authorize\?/);
  await expect(page.getByRole("button", { name: "Sign in with Vuteq SSO" })).toHaveCount(0);
});

test("ANSEI-aligned shell and dashboard", async ({ page }, testInfo) => {
  await authenticate(page);
  await page.route("**/api/proxy/v1/dashboard", (route) => route.fulfill({ json: envelope({ Kpi: { ActiveAssets: 142, InactiveAssets: 8, DisposedAssets: 19, ExpiredWarranty: 4, ExpiringWarranty: 7, UnassignedAssets: 12, OpenMaintenance: 5, ExpiredLicenses: 2, ExpiringLicenses: 3 }, Condition: { LOST: 1, DAMAGED: 4 }, CategoryDistribution: [{ Name: "Laptop", Total: 72 }, { Name: "Desktop", Total: 45 }, { Name: "Network", Total: 25 }], LocationDistribution: [], RecentAssets: [{ Id: 1, AssetTag: "IT-0001", Name: "Engineering Laptop", IsActive: true }], RecentMaintenance: [], ActiveStockOpname: { DocNumber: "SO-2026-001", Status: "IN_PROGRESS" }, AssetTrend: [{ Month: "2026-08-01", Total: 11 }, { Month: "2026-09-01", Total: 14 }], MaintenanceTrend: [{ Month: "2026-08-01", Total: 3 }, { Month: "2026-09-01", Total: 5 }] }, "/v1/dashboard") }));
  await page.goto("/apps");
  await expect(page.getByText("IT Asset Management System").first()).toBeVisible();
  await expect(page.locator(".ansei-sider")).toHaveCSS("width", "300px");
  await expect(page.locator(".ansei-sider img")).toHaveAttribute("src", /ansei-white\.png/);
  const footer = page.locator("footer");
  await expect(footer).toContainText("IT Asset Management System ©");
  await expect(footer).toHaveCSS("color", "rgb(255, 255, 255)");
  await expect(footer).toHaveCSS("font-size", "14px");
  await expect(footer).toHaveCSS("font-weight", "400");
  await page.getByLabel("Open credits and information").click();
  await expect(page.getByText("Credits & Information", { exact: true })).toBeVisible();
  await expect(page).toHaveScreenshot(`shell-${testInfo.project.name}.png`, { fullPage: true });
});

test("server-side asset table and detail modal", async ({ page }, testInfo) => {
  const formWarnings: string[] = [];
  page.on("console", (message) => {
    if (["warning", "error"].includes(message.type()) && message.text().includes("useForm")) formWarnings.push(message.text());
  });
  await authenticate(page);
  await page.route("**/api/proxy/v1/assets**", (route) => route.fulfill({ json: { ...envelope([{ Id: 1, AssetTag: "IT-0001", Name: "Engineering Laptop", SerialNumber: "SN-001", Category: { Name: "Laptop" }, Location: { Name: "IT Room" }, WarrantyEnd: "2027-01-01", IsActive: true }], "/v1/assets"), meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 } } }));
  await page.goto("/apps/asset-management/assets");
  await expect(page.getByText("IT-0001")).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".ant-breadcrumb")).toHaveText("Home/Asset Management/Assets");
  const row = page.locator(".ant-table-tbody > tr").filter({ hasText: "IT-0001" });
  await expect(page.locator(".ant-table-selection-column")).toHaveCount(0);
  await expect(row.locator("td").first().getByLabel("Open Assets detail for IT-0001")).toBeVisible();
  await row.click();
  await expect(row).toHaveClass(/ant-table-row-selected/);
  await row.locator("td").first().getByLabel("Open Assets detail for IT-0001").click();
  const detailModal = page.getByRole("dialog", { name: "Assets Detail" });
  await expect(detailModal).toBeVisible();
  await expect(page).toHaveScreenshot(`assets-${testInfo.project.name}.png`, { fullPage: true });
  await detailModal.locator(".ant-modal-footer").getByRole("button", { name: "Close" }).click();
  await expect(detailModal).toBeHidden();
  await page.getByRole("button", { name: "Create" }).click();
  const createModal = page.getByRole("dialog", { name: "Create Assets" });
  await expect(createModal).toBeVisible();
  await expect.poll(async () => (await createModal.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(880);
  const assetTagBox = await createModal.locator("#AssetTag").boundingBox();
  const nameBox = await createModal.locator("#Name").boundingBox();
  expect(Math.abs((assetTagBox?.y ?? 0) - (nameBox?.y ?? 0))).toBeLessThanOrEqual(2);
  expect(nameBox?.x ?? 0).toBeGreaterThan(assetTagBox?.x ?? 0);
  const notesBox = await createModal.locator("#Notes").boundingBox();
  const activeBox = await createModal.locator("#IsActive").boundingBox();
  expect(Math.abs((notesBox?.y ?? 0) - (activeBox?.y ?? 0))).toBeLessThanOrEqual(8);
  await expect(page).toHaveScreenshot(`asset-form-${testInfo.project.name}.png`, { fullPage: true });
  await createModal.getByRole("button", { name: "Cancel" }).click();
  await expect(createModal).toBeHidden();
  await page.getByRole("button", { name: "Dispose" }).click();
  await expect(page.getByRole("dialog", { name: "Dispose" })).toBeVisible();
  expect(formWarnings).toEqual([]);
});
