import ResourcePage, { type ResourceConfig } from "@/components/ResourcePage";

const config = {
  title: "Stock Opname",
  endpoint: "stock-opnames",
  rowKey: "Id",
  breadcrumbs: ["Home", "Inventory Control", "Stock Opname"],
  columns: [
    { key: "DocNumber", label: "Document Number" },
    { key: "OpnameDate", label: "Date", render: "date" },
    { key: "Period", label: "Period" },
    { key: "Status", label: "Status", filter: true, render: "status" },
    { key: "_count.Details", label: "Snapshot Items" },
  ],
  form: [
    { key: "DocNumber", label: "Document Number", required: true },
    { key: "OpnameDate", label: "Opname Date", type: "date", required: true },
    { key: "Period", label: "Period" },
    { key: "Remark", label: "Remark", type: "textarea" },
  ],
  createPermission: "ITAM.STOCK_OPNAME_CREATE",
  canUpdate: false,
  canDelete: false,
  actions: [
    {
      label: "Scan",
      path: "scan",
      permission: "ITAM.STOCK_OPNAME_SCAN",
      fields: [
        { key: "AssetId", label: "Asset", type: "remote", required: true, remote: { endpoint: "assets", labelKey: "AssetTag", labelKeys: ["AssetTag", "Name"], valueKey: "Id" } },
        { key: "IsPresent", label: "Present", type: "boolean" },
        { key: "Condition", label: "Condition (GOOD / DAMAGED / LOST)", required: true },
        { key: "Notes", label: "Notes", type: "textarea" },
        { key: "PictureUrl", label: "Picture HTTPS URL" },
      ],
    },
    { label: "Verify", path: "verify", permission: "ITAM.STOCK_OPNAME_VERIFY" },
    { label: "Approve", path: "approve", permission: "ITAM.STOCK_OPNAME_APPROVE" },
    { label: "Close", path: "close", permission: "ITAM.STOCK_OPNAME_CLOSE" },
    { label: "Cancel", path: "cancel", permission: "ITAM.STOCK_OPNAME_CANCEL", danger: true },
  ],
} satisfies ResourceConfig;

export default function StockOpnamePage() {
  return <ResourcePage config={config} />;
}
