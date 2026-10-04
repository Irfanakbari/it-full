import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Locations",
  endpoint: "locations",
  rowKey: "Id",
  breadcrumbs: ["Home", "Master Data", "Locations"],
  columns: [
    { key: "Code", label: "Code", filter: true },
    { key: "Name", label: "Name", filter: true },
    { key: "Address", label: "Address" },
    { key: "Floor", label: "Floor" },
    { key: "Room", label: "Room" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "Code", label: "Code", required: true, maxLength: 3, uppercase: true },
    { key: "Name", label: "Name", required: true },
    { key: "Address", label: "Address" },
    { key: "Floor", label: "Floor" },
    { key: "Room", label: "Room" },
    { key: "IsActive", label: "Active", render: "boolean", type: "boolean" },
  ],
  createPermission: "ITAM.MASTER_MANAGE",
  updatePermission: "ITAM.MASTER_MANAGE",
  deletePermission: "ITAM.MASTER_MANAGE",
} satisfies ResourceConfig;

export default function LocationsPage() {
  return <ResourcePage config={config} />;
}
