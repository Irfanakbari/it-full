import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "User Accounts",
  endpoint: "users",
  rowKey: "Id",
  breadcrumbs: ["Home", "System Administration", "User Accounts"],
  columns: [
    { key: "Name", label: "Name", filter: true },
    { key: "UserName", label: "Username", filter: true },
    { key: "Email", label: "Email" },
    { key: "Role.RoleName", label: "Local Role" },
    { key: "LastLogin", label: "Last Login", render: "date" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  canCreate: false,
  canUpdate: false,
  canDelete: true,
  deletePermission: "ITAM.USER_MANAGEMENT",
  archiveLabel: "Delete User",
  actions: [{
    label: "Authorization",
    path: "authorization",
    method: "PATCH",
    permission: "ITAM.USER_MANAGEMENT",
    fields: [
      { key: "RoleId", label: "Role", type: "remote", remote: { endpoint: "roles", labelKey: "RoleName", valueKey: "Id" } },
      { key: "IsActive", label: "Active", type: "boolean", required: true },
    ],
  }],
} satisfies ResourceConfig;

export default function UserAccountsPage() {
  return <ResourcePage config={config} />;
}
