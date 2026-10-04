import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Departments",
  endpoint: "departments",
  rowKey: "Code",
  breadcrumbs: ["Home", "Master Data", "Departments"],
  columns: [
    { key: "Code", label: "Department Code", filter: true },
    { key: "Name", label: "Department Name", filter: true },
  ],
  readOnly: true,
  showDetailToolbar: false,
} satisfies ResourceConfig;

export default function DepartmentsPage() {
  return <ResourcePage config={config} />;
}
