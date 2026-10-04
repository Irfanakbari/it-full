import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Disposals",
  endpoint: "disposals",
  rowKey: "Id",
  breadcrumbs: ["Home", "Asset Management", "Disposals"],
  columns: [
    { key: "Asset.AssetTag", label: "Asset Tag" },
    { key: "Asset.Name", label: "Asset" },
    { key: "DisposalDate", label: "Disposal Date", render: "date" },
    { key: "Reason", label: "Reason" },
    { key: "CreatedBy", label: "Actor" },
  ],
  readOnly: true,
} satisfies ResourceConfig;

export default function DisposalsPage() {
  return <ResourcePage config={config} />;
}
