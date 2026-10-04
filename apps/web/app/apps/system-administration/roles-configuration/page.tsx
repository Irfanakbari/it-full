import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Roles Configuration",
  endpoint: "roles",
  rowKey: "Id",
  breadcrumbs: ["Home", "System Administration", "Roles Configuration"],
  columns: [
    { key: "RoleName", label: "Role" },
    { key: "Description", label: "Description" },
    { key: "_count.Users", label: "Users" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "RoleName", label: "Role Name", required: true },
    { key: "Description", label: "Description" },
    { key: "IsActive", label: "Active", type: "boolean" },
    { key: "PermissionActions", label: "Permission Actions", type: "tags", required: true },
  ],
  createPermission: "ITAM.USER_MANAGEMENT",
  updatePermission: "ITAM.USER_MANAGEMENT",
  canDelete: false,
} satisfies ResourceConfig;

export default function RolesConfigurationPage() {
  return <ResourcePage config={config} />;
}
