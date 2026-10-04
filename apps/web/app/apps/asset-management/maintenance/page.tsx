import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Repairs",
  endpoint: "maintenance",
  rowKey: "Id",
  breadcrumbs: ["Home", "Transaction Data", "Repairs"],
  columns: [
    { key: "Asset.AssetTag", label: "Asset Tag" },
    { key: "Asset.Name", label: "Asset Name" },
    { key: "MaintenanceType", label: "Type" },
    { key: "MaintenanceDate", label: "Date", render: "date" },
    { key: "Problem", label: "Problem" },
    { key: "Vendor", label: "Vendor" },
    { key: "IsClosed", label: "Closed", render: "boolean" },
  ],
  form: [
    { key: "AssetId", label: "Asset", type: "remote", required: true, remote: { endpoint: "assets", labelKey: "AssetTag", labelKeys: ["AssetTag", "Name"], valueKey: "Id" } },
    { key: "MaintenanceDate", label: "Maintenance Date", type: "date", required: true },
    { key: "MaintenanceType", label: "Type", required: true },
    { key: "Problem", label: "Problem", type: "textarea" },
    { key: "Description", label: "Description", type: "textarea" },
    { key: "Vendor", label: "Vendor" },
    { key: "Cost", label: "Cost", type: "number" },
    { key: "IsInternal", label: "Internal", type: "boolean" },
    { key: "IsClosed", label: "Closed", type: "boolean" },
  ],
  createPermission: "ITAM.MAINTENANCE_MANAGE",
  updatePermission: "ITAM.MAINTENANCE_MANAGE",
  deletePermission: "ITAM.MAINTENANCE_MANAGE",
} satisfies ResourceConfig;

export default function MaintenancePage() {
  return <ResourcePage config={config} />;
}
