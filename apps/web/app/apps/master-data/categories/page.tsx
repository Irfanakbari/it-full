import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Categories",
  endpoint: "categories",
  rowKey: "Id",
  breadcrumbs: ["Home", "Master Data", "Categories"],
  columns: [
    { key: "Code", label: "Code", filter: true },
    { key: "Name", label: "Name", filter: true },
    { key: "Description", label: "Description" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "Code", label: "Code", required: true, maxLength: 2, uppercase: true },
    { key: "Name", label: "Name", required: true },
    { key: "Description", label: "Description", type: "textarea" },
    { key: "IsActive", label: "Active", render: "boolean", type: "boolean" },
  ],
  createPermission: "ITAM.MASTER_MANAGE",
  updatePermission: "ITAM.MASTER_MANAGE",
  deletePermission: "ITAM.MASTER_MANAGE",
} satisfies ResourceConfig;

export default function CategoriesPage() {
  return <ResourcePage config={config} />;
}
