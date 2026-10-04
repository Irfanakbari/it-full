import { expect, test, type Page } from "@playwright/test";

const session = { user: { sub: "visual-user", name: "Visual Reviewer", preferred_username: "reviewer", email: "reviewer@vuteq.co.id" }, permissions: ["ITAM.DASHBOARD_READ", "ITAM.MASTER_READ", "ITAM.ASSET_READ", "ITAM.ASSET_CREATE", "ITAM.ASSET_UPDATE", "ITAM.ASSET_ARCHIVE", "ITAM.ASSET_ASSIGN", "ITAM.ASSET_DISPOSE", "ITAM.LICENSE_READ", "ITAM.MAINTENANCE_READ", "ITAM.STOCK_OPNAME_READ", "ITAM.SYSTEM_LOG_READ", "ITAM.USER_MANAGEMENT"], roles: ["ADMIN_IT"], globalRoles: [], emailVerified: true, mfaVerified: true, expiresAt: Date.now() + 86_400_000 };
const envelope = (data: unknown, path: string) => ({ success: true, statusCode: 200, message: "OK", data, timestamp: new Date().toISOString(), path, requestId: "visual-request" });
async function authenticate(page: Page, currentSession = session) {
  await page.context().addCookies([{ name: "itam_session", value: "visual-session", domain: "127.0.0.1", path: "/" }]);
  await page.route("**/api/auth/session", (route) => route.fulfill({ json: currentSession }));
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
  await expect(page.getByText("Master Data", { exact: true })).toBeVisible();
  await expect(page.getByText("Transaction Data", { exact: true })).toBeVisible();
  await expect(page.getByText("System Administration", { exact: true })).toBeVisible();
  await expect(page.getByText("Device Loan", { exact: true })).toHaveCount(0);
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
  await expect(page.locator(".ant-breadcrumb")).toHaveText("Home/Master Data/Asset List");
  const row = page.locator(".ant-table-tbody > tr").filter({ hasText: "IT-0001" });
  await expect(page.locator(".ant-table-selection-column")).toHaveCount(0);
  await expect(row.locator("td").first().getByLabel("Open Asset List detail for IT-0001")).toBeVisible();
  await row.click();
  await expect(row).toHaveClass(/ant-table-row-selected/);
  await row.locator("td").first().getByLabel("Open Asset List detail for IT-0001").click();
  const detailModal = page.getByRole("dialog", { name: "Asset List Detail" });
  await expect(detailModal).toBeVisible();
  await expect(page.locator(".gradient-background").getByText("Update", { exact: true })).toHaveCount(0);
  await expect(page).toHaveScreenshot(`assets-${testInfo.project.name}.png`, { fullPage: true });
  await detailModal.locator(".ant-modal-footer").getByRole("button", { name: "Update" }).click();
  await expect(detailModal).toBeHidden();
  const updateModal = page.getByRole("dialog", { name: "Update Asset List" });
  await expect(updateModal).toBeVisible();
  await updateModal.getByRole("button", { name: "Cancel" }).click();
  await expect(updateModal).toBeHidden();
  await page.getByRole("button", { name: "Create" }).click();
  const createModal = page.getByRole("dialog", { name: "Create Asset List" });
  await expect(createModal).toBeVisible();
  await expect.poll(async () => (await createModal.boundingBox())?.width ?? 0).toBeGreaterThanOrEqual(880);
  const nameBox = await createModal.locator("#Name").boundingBox();
  const hostNameBox = await createModal.locator("#HostName").boundingBox();
  expect(Math.abs((nameBox?.y ?? 0) - (hostNameBox?.y ?? 0))).toBeLessThanOrEqual(2);
  expect(hostNameBox?.x ?? 0).toBeGreaterThan(nameBox?.x ?? 0);
  await expect(createModal.locator("#Notes")).toBeVisible();
  await expect(createModal.locator("#IsActive")).toBeVisible();
  await createModal.getByRole("button", { name: "Add Attribute" }).click();
  await expect(createModal.getByText("Search attribute")).toBeVisible();
  await expect(createModal.getByPlaceholder("Attribute value")).toBeVisible();
  await expect(createModal.getByRole("button", { name: "Remove attribute" })).toBeVisible();
  await expect(page).toHaveScreenshot(`asset-form-${testInfo.project.name}.png`, { fullPage: true });
  await createModal.getByRole("button", { name: "Cancel" }).click();
  await expect(createModal).toBeHidden();
  await page.getByRole("button", { name: "Dispose" }).click();
  await expect(page.getByRole("dialog", { name: "Dispose" })).toBeVisible();
  expect(formWarnings).toEqual([]);
});

test("department mutation uses Refresh/Create toolbar and GoldenArrow detail", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/proxy/v1/asset-department-assignments**", (route) => route.fulfill({ json: {
    ...envelope([{ Id: 11, AssetId: 1, Asset: { Id: 1, AssetTag: "IT-0001", Name: "Laptop" }, DepartmentCode: "IT", DepartmentName: "Information Technology", StartUsed: "2026-01-01", LastUsed: null, Notes: "Initial", CreatedBy: "admin" }], "/v1/asset-department-assignments"),
    meta: { page: 1, limit: 50, totalItems: 1, totalPages: 1 },
  } }));
  await page.goto("/apps/transaction-data/department-mutations");
  await expect(page.locator(".ant-breadcrumb")).toHaveText("Home/Transaction Data/Department Mutations");
  const toolbar = page.locator(".gradient-background");
  await expect(toolbar.getByText("Refresh", { exact: true })).toBeVisible();
  await expect(toolbar.getByText("Create", { exact: true })).toBeVisible();
  await expect(toolbar.getByText("Update", { exact: true })).toHaveCount(0);
  await expect(toolbar.getByText("Detail", { exact: true })).toHaveCount(0);
  await expect(page.locator(".ant-menu-item-selected")).toContainText("Department Mutations");
  await expect(page.getByText("Device Loan", { exact: true })).toHaveCount(0);
  await page.getByLabel("Open Department Mutations detail for IT-0001").click();
  await expect(page.getByRole("dialog", { name: "Department Mutations Detail" })).toBeVisible();
});

test("create asset supports dynamic attribute assignments", async ({ page }) => {
  await authenticate(page);
  await page.route("**/api/proxy/v1/assets**", (route) => route.fulfill({ json: { ...envelope([], "/v1/assets"), meta: { page: 1, limit: 50, totalItems: 0, totalPages: 0 } } }));
  await page.route("**/api/proxy/v1/attributes**", (route) => route.fulfill({ json: { ...envelope([{ Id: 3, Key: "RAM", Description: "Installed memory" }], "/v1/attributes"), meta: { page: 1, limit: 20, totalItems: 1, totalPages: 1 } } }));
  await page.goto("/apps/asset-management/assets");
  await page.getByRole("button", { name: "Create" }).click();
  const modal = page.getByRole("dialog", { name: "Create Asset List" });
  await modal.getByRole("button", { name: "Add Attribute" }).click();
  const attributeResponse = page.waitForResponse((response) => response.url().includes("/api/proxy/v1/attributes"));
  await modal.locator("#Attributes_0_AttributeDefinitionId").click();
  await attributeResponse;
  await modal.locator("#Attributes_0_AttributeDefinitionId").click();
  const attributeOption = page.locator(".ant-select-item-option-content", { hasText: "RAM - Installed memory" });
  await expect(attributeOption).toBeVisible();
  await attributeOption.click();
  await modal.getByPlaceholder("Attribute value").fill("16 GB");
  await expect(modal.getByRole("button", { name: "Remove attribute" })).toBeVisible();
});

test("navigation filters child menus by permission", async ({ page }) => {
  await authenticate(page, { ...session, permissions: ["ITAM.DASHBOARD_READ", "ITAM.ASSET_READ"] });
  await page.route("**/api/proxy/v1/dashboard", (route) => route.fulfill({ json: envelope({ Kpi: {}, Condition: {}, CategoryDistribution: [], LocationDistribution: [], RecentAssets: [], RecentMaintenance: [], ActiveStockOpname: null, AssetTrend: [], MaintenanceTrend: [] }, "/v1/dashboard") }));
  await page.goto("/apps");
  await page.getByText("Master Data", { exact: true }).click();
  await expect(page.getByRole("link", { name: "Departments" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Users" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Asset List" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Categories" })).toHaveCount(0);
  await page.getByText("Transaction Data", { exact: true }).click();
  await expect(page.getByRole("link", { name: "User Mutations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Department Mutations" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Asset Disposals" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Licenses" })).toHaveCount(0);
  await expect(page.getByText("System Administration", { exact: true })).toHaveCount(0);
});
