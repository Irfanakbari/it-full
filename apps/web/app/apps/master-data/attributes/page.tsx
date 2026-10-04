import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Attributes",
  endpoint: "attributes",
  rowKey: "Id",
  breadcrumbs: ["Home", "Master Data", "Attributes"],
  columns: [
    { key: "Key", label: "Key", filter: true },
    { key: "Description", label: "Description" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "Key", label: "Key", required: true },
    { key: "Description", label: "Description" },
    { key: "IsActive", label: "Active", render: "boolean", type: "boolean" },
  ],
  createPermission: "ITAM.MASTER_MANAGE",
  updatePermission: "ITAM.MASTER_MANAGE",
  deletePermission: "ITAM.MASTER_MANAGE",
} satisfies ResourceConfig;

export default function AttributesPage() {
  return <ResourcePage config={config} />;
}
