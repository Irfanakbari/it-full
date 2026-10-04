import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Permissions Setup",
  endpoint: "permissions",
  rowKey: "Id",
  breadcrumbs: ["Home", "System Administration", "Permissions Setup"],
  columns: [
    { key: "Action", label: "Permission Action", filter: true },
    { key: "Description", label: "Description" },
  ],
  readOnly: true,
} satisfies ResourceConfig;

export default function PermissionsSetupPage() {
  return <ResourcePage config={config} />;
}
