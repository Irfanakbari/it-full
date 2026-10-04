import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Users",
  endpoint: "employees",
  rowKey: "EmployeeNo",
  breadcrumbs: ["Home", "Master Data", "Users"],
  columns: [
    { key: "EmployeeNo", label: "Employee No", filter: true },
    { key: "EmployeeName", label: "Employee Name", filter: true },
  ],
  readOnly: true,
  showDetailToolbar: false,
} satisfies ResourceConfig;

export default function UsersPage() {
  return <ResourcePage config={config} />;
}
