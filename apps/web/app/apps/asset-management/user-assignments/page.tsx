import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "User Assignments",
  endpoint: "asset-user-assignments",
  rowKey: "Id",
  breadcrumbs: ["Home", "Asset Management", "User Assignments"],
  columns: [
    { key: "Asset.AssetTag", label: "Asset Tag" },
    { key: "Asset.Name", label: "Asset" },
    { key: "EmployeeNo", label: "Employee No" },
    { key: "EmployeeName", label: "Employee" },
    { key: "StartUsed", label: "Start Used", render: "date" },
    { key: "LastUsed", label: "Last Used", render: "date" },
  ],
  form: [
    { key: "AssetId", label: "Asset", type: "remote", required: true, remote: { endpoint: "assets", labelKey: "AssetTag", labelKeys: ["AssetTag", "Name"], valueKey: "Id" } },
    { key: "EmployeeNo", label: "Employee", type: "remote", required: true, remote: { endpoint: "employees", labelKey: "DisplayLabel", valueKey: "EmployeeNo", paginated: false } },
    { key: "StartUsed", label: "Start Used", type: "date" },
    { key: "Notes", label: "Notes", type: "textarea" },
  ],
  createPermission: "ITAM.ASSET_ASSIGN",
  canUpdate: false,
  canDelete: false,
} satisfies ResourceConfig;

export default function UserAssignmentsPage() {
  return <ResourcePage config={config} />;
}
