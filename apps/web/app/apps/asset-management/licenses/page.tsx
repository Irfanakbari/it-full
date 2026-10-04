import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Licenses",
  endpoint: "licenses",
  rowKey: "Id",
  breadcrumbs: ["Home", "Transaction Data", "Licenses"],
  columns: [
    { key: "LicenseName", label: "License Name" },
    { key: "LicenseType", label: "Type" },
    { key: "Asset.AssetTag", label: "Asset Tag" },
    { key: "Asset.Name", label: "Asset Name" },
    { key: "LicenseKey", label: "License Key" },
    { key: "EndDate", label: "Expiry", render: "date" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "LicenseName", label: "License Name", required: true },
    { key: "LicenseType", label: "License Type", required: true },
    { key: "LicenseKey", label: "License Key" },
    { key: "AssetId", label: "Asset", type: "remote", remote: { endpoint: "assets", labelKey: "AssetTag", labelKeys: ["AssetTag", "Name"], valueKey: "Id" } },
    { key: "StartDate", label: "Start Date", type: "date" },
    { key: "EndDate", label: "End Date", type: "date" },
    { key: "SupportFile", label: "Support HTTPS URL" },
    { key: "LicenseRemark", label: "Remark", type: "textarea" },
    { key: "IsActive", label: "Active", render: "boolean", type: "boolean" },
  ],
  createPermission: "ITAM.LICENSE_MANAGE",
  canUpdate: false,
  deletePermission: "ITAM.LICENSE_MANAGE",
  actions: [{ label: "Reveal Key", path: "reveal", permission: "ITAM.LICENSE_SECRET_READ" }],
} satisfies ResourceConfig;

export default function LicensesPage() {
  return <ResourcePage config={config} />;
}
