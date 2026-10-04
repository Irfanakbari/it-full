import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "System Logs",
  endpoint: "system-logs",
  rowKey: "ProcessId",
  breadcrumbs: ["Home", "System Administration", "System Logs"],
  columns: [
    { key: "FunctionName", label: "Process", filter: true },
    { key: "ProcessStatus", label: "Status", filter: true, render: "status" },
    { key: "ActorDisplayName", label: "Actor" },
    { key: "ProcessStart", label: "Started", render: "date" },
    { key: "ProcessEnd", label: "Ended", render: "date" },
  ],
  readOnly: true,
} satisfies ResourceConfig;

export default function SystemLogPage() {
  return <ResourcePage config={config} />;
}
