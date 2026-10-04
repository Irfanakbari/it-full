import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Asset List",
  endpoint: "assets",
  rowKey: "Id",
  breadcrumbs: ["Home", "Master Data", "Asset List"],
  columns: [
    { key: "AssetTag", label: "Asset Tag", filter: true },
    { key: "Name", label: "Name" },
    { key: "SerialNumber", label: "Serial Number", filter: true },
    { key: "Category.Name", label: "Category" },
    { key: "Location.Name", label: "Location" },
    { key: "DepartmentName", label: "Department" },
    { key: "CurrentEmployeeName", label: "Current User" },
    { key: "WarrantyEnd", label: "Warranty End", render: "date" },
    { key: "IsActive", label: "Active", render: "boolean" },
  ],
  form: [
    { key: "Name", label: "Name", required: true },
    { key: "HostName", label: "Host Name" },
    { key: "Brand", label: "Brand" },
    { key: "Model", label: "Model" },
    { key: "SerialNumber", label: "Serial Number" },
    { key: "CategoryId", label: "Category", type: "remote", required: true, remote: { endpoint: "categories", labelKey: "Name", labelKeys: ["Code", "Name"], valueKey: "Id" } },
    { key: "LocationId", label: "Location", type: "remote", required: true, remote: { endpoint: "locations", labelKey: "Name", labelKeys: ["Code", "Name"], valueKey: "Id" } },
    { key: "DepartmentCode", label: "Department", type: "remote", required: true, remote: { endpoint: "departments", labelKey: "DisplayLabel", valueKey: "Code" } },
    { key: "PurchaseDate", label: "Purchase Date", type: "date" },
    { key: "WarrantyStart", label: "Warranty Start", type: "date" },
    { key: "WarrantyEnd", label: "Warranty End", type: "date" },
    { key: "Notes", label: "Notes", type: "textarea" },
    { key: "IsActive", label: "Active", render: "boolean", type: "boolean" },
    { key: "Attributes", label: "Asset Attributes", type: "attributes", createOnly: true, remote: { endpoint: "attributes", labelKey: "Key", labelKeys: ["Key", "Description"], valueKey: "Id" } },
  ],
  createPermission: "ITAM.ASSET_CREATE",
  updatePermission: "ITAM.ASSET_UPDATE",
  updateFromDetailOnly: true,
  deletePermission: "ITAM.ASSET_ARCHIVE",
  attachments: { readPermission: "ITAM.ASSET_READ", updatePermission: "ITAM.ASSET_UPDATE" },
  actions: [{
    label: "Dispose",
    path: "dispose",
    permission: "ITAM.ASSET_DISPOSE",
    danger: true,
    fields: [
      { key: "DisposalDate", label: "Disposal Date", type: "date", required: true },
      { key: "Reason", label: "Reason", type: "textarea", required: true },
    ],
  }],
} satisfies ResourceConfig;

export default function AssetsPage() {
  return <ResourcePage config={config} />;
}
