import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Department Mutations",
  endpoint: "asset-department-assignments",
  rowKey: "Id",
  breadcrumbs: ["Home", "Transaction Data", "Department Mutations"],
  columns: [
    { key: "Asset.AssetTag", label: "Asset Tag", filter: true, filterKey: "AssetTag" },
    { key: "DepartmentName", label: "Department", filter: true, filterKey: "DepartmentCode" },
    { key: "StartUsed", label: "Start Used", render: "date" },
    { key: "LastUsed", label: "Last Used", render: "date" },
    { key: "Notes", label: "Notes" },
    { key: "CreatedBy", label: "Actor" },
  ],
  form: [
    { key: "AssetId", label: "Asset", type: "remote", required: true, remote: { endpoint: "assets", labelKey: "AssetTag", labelKeys: ["AssetTag", "Name"], valueKey: "Id" } },
    { key: "DepartmentCode", label: "Department", type: "remote", required: true, remote: { endpoint: "departments", labelKey: "DisplayLabel", valueKey: "Code" } },
    { key: "StartUsed", label: "Start Used", type: "date", required: true },
    { key: "Notes", label: "Notes", type: "textarea", maxLength: 500 },
  ],
  createPermission: "ITAM.ASSET_ASSIGN",
  canUpdate: false,
  canDelete: false,
  showDetailToolbar: false,
} satisfies ResourceConfig;

export default function DepartmentMutationsPage() {
  return <ResourcePage config={config} />;
}
