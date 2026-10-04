"use client";

import { DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, PaperClipOutlined, PlusOutlined, ReloadOutlined, SearchOutlined, ToolOutlined, UploadOutlined } from "@ant-design/icons";
import { useVuteqSso } from "@vuteq/sso-client-react/react";
import { Alert, App, Breadcrumb, Button, Card, Col, Descriptions, Form, Input, InputNumber, Modal, Row, Select, Space, Switch, Table, Tag, Upload, type TableProps, type UploadFile } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import ButtonToolbar from "./ButtonToolbar";
import GoldenArrowAction from "./GoldenArrowAction";
import ToolbarWrapper from "./ToolbarWrapper";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchResource, mutateResource, patchQuery, selectResource } from "@/store/resourceSlice";
import { bffRequest } from "@/lib/client-api";

export type FieldConfig = { key: string; label: string; type?: "text" | "number" | "boolean" | "date" | "textarea" | "tags" | "remote"; required?: boolean; filter?: boolean; render?: "date" | "boolean" | "status"; maxLength?: number; uppercase?: boolean; remote?: { endpoint: string; labelKey: string; labelKeys?: string[]; valueKey: string; paginated?: boolean } };
export type ResourceAction = { label: string; path: string; permission: string; method?: "POST" | "PATCH"; fields?: FieldConfig[]; danger?: boolean };
export type ResourceConfig = { title: string; endpoint: string; rowKey: string; columns: FieldConfig[]; breadcrumbs?: string[]; form?: FieldConfig[]; createPermission?: string; updatePermission?: string; deletePermission?: string; readOnly?: boolean; canCreate?: boolean; canUpdate?: boolean; canDelete?: boolean; archiveLabel?: string; actions?: ResourceAction[]; attachments?: { readPermission: string; updatePermission: string } };

type AttachmentRow = { Id: number; OriginalFileName: string; FileSize: number; MimeType: string; CreatedAt: string; CreatedBy: string; IsLegacy?: boolean };

function nested(record: Record<string, unknown>, key: string): unknown { return key.split(".").reduce<unknown>((value, part) => value && typeof value === "object" ? (value as Record<string, unknown>)[part] : undefined, record); }

export default function ResourcePage({ config }: { config: ResourceConfig }) {
  const dispatch = useAppDispatch();
  const state = useAppSelector((root) => root.resource);
  const { message, modal } = App.useApp();
  const { hasPermission } = useVuteqSso();
  const [selectedKey, setSelectedKey] = useState<React.Key>();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [operation, setOperation] = useState<ResourceAction | null>(null);
  const [remoteOptions, setRemoteOptions] = useState<Record<string, { label: string; value: string | number }[]>>({});
  const [remoteLoading, setRemoteLoading] = useState<Record<string, boolean>>({});
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const [attachments, setAttachments] = useState<AttachmentRow[]>([]);
  const [attachmentFiles, setAttachmentFiles] = useState<UploadFile[]>([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [form] = Form.useForm();
  const [actionForm] = Form.useForm();
  const isCurrentResource = state.key === config.endpoint;
  const query = useMemo(() => isCurrentResource ? state.query : { page: 1, limit: 50, filters: {} }, [isCurrentResource, state.query]);
  const resourceItems = isCurrentResource ? state.items : [];
  const selected = resourceItems.find((item) => String(item[config.rowKey]) === String(selectedKey));
  const load = useCallback(async () => { await dispatch(fetchResource({ endpoint: config.endpoint, query })).unwrap().catch(() => undefined); }, [config.endpoint, dispatch, query]);

  useEffect(() => { dispatch(selectResource({ key: config.endpoint })); }, [config.endpoint, dispatch]);
  useEffect(() => { if (state.key === config.endpoint) void load(); }, [config.endpoint, load, state.key]);

  const openCreate = () => { setEditing(null); form.resetFields(); form.setFieldsValue(Object.fromEntries((config.form ?? []).filter((field) => field.type === "boolean").map((field) => [field.key, field.key === "IsActive"]))); setFormOpen(true); };
  const openUpdate = () => { if (!selected) return; setEditing(selected); form.setFieldsValue(Object.fromEntries((config.form ?? []).map((field) => [field.key, field.key === "PermissionActions" && Array.isArray(selected.Permissions) ? selected.Permissions.map((permission) => String((permission as Record<string, unknown>).Action)) : nested(selected, field.key)]))); setFormOpen(true); };
  const save = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await dispatch(mutateResource({ endpoint: editing ? `${config.endpoint}/${editing[config.rowKey]}` : config.endpoint, method: editing ? "PATCH" : "POST", body: values })).unwrap();
      message.success(editing ? "Record updated successfully" : "Record created successfully");
      setFormOpen(false); setEditing(null); setSelectedKey(undefined); await load();
    } catch (error) { if (error instanceof Error) message.error(error.message); }
    finally { setSubmitting(false); }
  };
  const archive = () => { if (!selected) return; modal.confirm({ title: `${config.archiveLabel ?? "Archive"} selected record?`, content: "This action preserves history and removes the record from active lists.", okText: config.archiveLabel ?? "Archive", okButtonProps: { danger: true }, onOk: async () => { try { await dispatch(mutateResource({ endpoint: `${config.endpoint}/${selected[config.rowKey]}`, method: "DELETE" })).unwrap(); message.success("Record archived successfully"); setSelectedKey(undefined); await load(); } catch (error) { message.error(error instanceof Error ? error.message : "Request failed"); } } }); };
  const runOperation = async () => {
    if (!selected || !operation) return;
    try {
      const values = operation.fields?.length ? await actionForm.validateFields() : undefined;
      setSubmitting(true);
      const result = await dispatch(mutateResource({ endpoint: `${config.endpoint}/${selected[config.rowKey]}/${operation.path}`, method: operation.method ?? "POST", body: values })).unwrap();
      message.success(result.message);
      if (result.data && typeof result.data === "object") setDetail(result.data as Record<string, unknown>);
      setOperation(null); actionForm.resetFields(); await load();
    } catch (error) { if (error instanceof Error) message.error(error.message); }
    finally { setSubmitting(false); }
  };
  const loadRemote = async (field: FieldConfig, search = "") => {
    if (!field.remote) return;
    setRemoteLoading((current) => ({ ...current, [field.key]: true }));
    try {
      const params = new URLSearchParams();
      if (field.remote.paginated !== false) {
        params.set("page", "1");
        params.set("limit", "20");
      }
      if (search) params.set("search", search);
      const queryString = params.toString();
      const result = await bffRequest<{ data: Record<string, unknown>[] }>(`${field.remote.endpoint}${queryString ? `?${queryString}` : ""}`);
      setRemoteOptions((current) => ({ ...current, [field.key]: result.data.map((row) => ({
        label: (field.remote!.labelKeys ?? [field.remote!.labelKey]).map((key) => String(row[key])).join(" - "),
        value: row[field.remote!.valueKey] as string | number,
      })) }));
    } catch (error) { message.error(error instanceof Error ? error.message : "Option search failed"); }
    finally { setRemoteLoading((current) => ({ ...current, [field.key]: false })); }
  };

  const loadAttachments = async (record = selected) => {
    if (!record) return;
    setAttachmentsLoading(true);
    try {
      const result = await bffRequest<{ data: AttachmentRow[] }>(`${config.endpoint}/${record[config.rowKey]}/attachments`);
      setAttachments(result.data);
    } catch (error) { message.error(error instanceof Error ? error.message : "Attachment list failed"); }
    finally { setAttachmentsLoading(false); }
  };

  const openAttachments = () => {
    if (!selected) return;
    setAttachmentsOpen(true);
    setAttachmentFiles([]);
    void loadAttachments(selected);
  };

  const uploadAttachments = async () => {
    if (!selected || !attachmentFiles.length) return;
    setSubmitting(true);
    try {
      const body = new FormData();
      attachmentFiles.forEach((file) => { if (file.originFileObj) body.append("files", file.originFileObj); });
      const result = await bffRequest<{ message: string }>(`${config.endpoint}/${selected[config.rowKey]}/attachments`, { method: "POST", body });
      message.success(result.message);
      setAttachmentFiles([]);
      await loadAttachments(selected);
    } catch (error) { message.error(error instanceof Error ? error.message : "Upload failed"); }
    finally { setSubmitting(false); }
  };

  const downloadAttachment = async (attachment: AttachmentRow) => {
    if (!selected || attachment.IsLegacy) return;
    try {
      const response = await fetch(`/api/proxy/v1/${config.endpoint}/${selected[config.rowKey]}/attachments/${attachment.Id}/download`, { cache: "no-store" });
      if (!response.ok) {
        const error = await response.json().catch(() => null) as { message?: string } | null;
        throw new Error(error?.message ?? "Download failed");
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = attachment.OriginalFileName;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { message.error(error instanceof Error ? error.message : "Download failed"); }
  };

  const deleteAttachment = (attachment: AttachmentRow) => {
    if (!selected) return;
    modal.confirm({
      title: "Delete attachment?", content: attachment.OriginalFileName, okText: "Delete", okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const result = await bffRequest<{ message: string }>(`${config.endpoint}/${selected[config.rowKey]}/attachments/${attachment.Id}`, { method: "DELETE" });
          message.success(result.message);
          await loadAttachments(selected);
        } catch (error) { message.error(error instanceof Error ? error.message : "Delete failed"); }
      },
    });
  };

  const columns = useMemo<TableProps<Record<string, unknown>>["columns"]>(() => [
    ...config.columns.map((field, index) => ({
      title: field.label,
      dataIndex: field.key.includes(".") ? undefined : field.key,
      key: field.key,
      sorter: !field.key.includes("."),
      sortOrder: query.sortBy === field.key ? (query.sortOrder === "desc" ? "descend" as const : "ascend" as const) : null,
      filteredValue: query.filters[field.key] !== undefined ? [String(query.filters[field.key])] : null,
      filterDropdown: field.filter ? ({ close }: { close: () => void }) => <div className="filter-panel" onKeyDown={(event) => event.stopPropagation()}><Input autoFocus placeholder={`Search ${field.label}`} value={String(query.filters[field.key] ?? "")} onChange={(event) => dispatch(patchQuery({ page: 1, filters: { ...query.filters, [field.key]: event.target.value } }))} onPressEnter={() => close()} /><Space style={{ marginTop: 8 }}><Button size="small" type="primary" icon={<SearchOutlined />} onClick={() => close()}>Apply</Button><Button size="small" onClick={() => { const filters = { ...query.filters }; delete filters[field.key]; dispatch(patchQuery({ page: 1, filters })); close(); }}>Reset</Button></Space></div> : undefined,
      filterIcon: field.filter ? <SearchOutlined style={{ color: query.filters[field.key] ? "#4F46E5" : undefined }} /> : undefined,
      render: (_value: unknown, record: Record<string, unknown>) => {
        const value = nested(record, field.key);
        const content = field.render === "date"
          ? (value ? new Date(String(value)).toLocaleDateString("en-GB") : "—")
          : field.render === "boolean"
            ? <Tag color={value ? "green" : "default"}>{value ? "Yes" : "No"}</Tag>
            : field.render === "status"
              ? <Tag color={["ACTIVE", "OPEN", "IN_PROGRESS", "APPROVED"].includes(String(value)) ? "blue" : String(value) === "CLOSED" ? "green" : "default"}>{String(value ?? "—")}</Tag>
              : value === null || value === undefined || value === "" ? "—" : String(value);
        if (index !== 0) return content;
        return <Space size={4}>
          <GoldenArrowAction
            ariaLabel={`Open ${config.title} detail for ${String(value ?? "record")}`}
            tooltip="View detail"
            onClick={() => {
              setSelectedKey(String(record[config.rowKey]));
              setDetail(record);
            }}
          />
          {content}
        </Space>;
      },
    })),
  ], [config, dispatch, query.filters, query.sortBy, query.sortOrder]);

  const renderFieldControl = (field: FieldConfig) => field.type === "number"
    ? <InputNumber style={{ width: "100%" }} min={1} />
    : field.type === "boolean"
      ? <Switch />
      : field.type === "textarea"
        ? <Input.TextArea rows={3} />
        : field.type === "date"
          ? <Input type="date" />
          : field.type === "tags"
            ? <Select mode="tags" tokenSeparators={[","]} placeholder="Enter permission actions" />
            : field.type === "remote"
              ? <Select showSearch={{ filterOption: false, onSearch: (value) => void loadRemote(field, value) }} options={remoteOptions[field.key]} loading={remoteLoading[field.key]} onFocus={() => void loadRemote(field)} placeholder={`Search ${field.label}`} />
              : <Input maxLength={field.maxLength} showCount={Boolean(field.maxLength)} />;

  const renderFormFields = (fields: FieldConfig[] = []) => <Row gutter={[16, 0]}>
    {fields.map((field) => <Col key={field.key} xs={24} md={12}>
      <Form.Item
        name={field.key}
        label={field.label}
        valuePropName={field.type === "boolean" ? "checked" : "value"}
        normalize={field.uppercase ? (value) => typeof value === "string" ? value.toUpperCase() : value : undefined}
        rules={[
          { required: field.required, message: `${field.label} is required` },
          ...(field.maxLength ? [{ max: field.maxLength, message: `${field.label} must be at most ${field.maxLength} characters` }] : []),
        ]}
      >
        {renderFieldControl(field)}
      </Form.Item>
    </Col>)}
  </Row>;

  return <Card variant="borderless" styles={{ body: { padding: 0 } }}>
    <Breadcrumb style={{ marginBottom: 16 }} items={(config.breadcrumbs ?? ["Home", config.title]).map((title) => ({ title }))} />
    <ToolbarWrapper>
      <ButtonToolbar title="Refresh" icon={<ReloadOutlined />} onClick={() => void load()} loading={state.loading} />
      {!config.readOnly && config.canCreate !== false && <ButtonToolbar title="Create" icon={<PlusOutlined />} onClick={openCreate} enable={!config.createPermission || hasPermission(config.createPermission)} />}
      {!config.readOnly && config.canUpdate !== false && <ButtonToolbar title="Update" icon={<EditOutlined />} onClick={openUpdate} enable={Boolean(selected) && (!config.updatePermission || hasPermission(config.updatePermission))} />}
      {!config.readOnly && config.canDelete !== false && <ButtonToolbar title={config.archiveLabel ?? "Archive"} icon={<DeleteOutlined />} onClick={archive} enable={Boolean(selected) && (!config.deletePermission || hasPermission(config.deletePermission))} />}
      <ButtonToolbar title="Detail" icon={<EyeOutlined />} onClick={() => selected && setDetail(selected)} enable={Boolean(selected)} />
      {config.attachments && <ButtonToolbar title="Attachments" icon={<PaperClipOutlined />} onClick={openAttachments} enable={Boolean(selected) && hasPermission(config.attachments.readPermission)} />}
      {config.actions?.map((action) => <ButtonToolbar key={action.path} title={action.label} icon={<ToolOutlined />} onClick={() => { actionForm.resetFields(); actionForm.setFieldsValue(Object.fromEntries((action.fields ?? []).filter((field) => field.type === "boolean").map((field) => [field.key, false]))); setOperation(action); }} enable={Boolean(selected) && hasPermission(action.permission)} />)}
    </ToolbarWrapper>
    {isCurrentResource && state.error && <Alert type="error" showIcon title={state.error} action={<Button size="small" onClick={() => void load()}>Retry</Button>} style={{ marginBottom: 8 }} />}
    <Table<Record<string, unknown>> className="small-table" size="small" rowKey={(record) => String(record[config.rowKey])} columns={columns} dataSource={resourceItems} loading={isCurrentResource && state.loading} onRow={(record) => ({ onClick: () => setSelectedKey(String(record[config.rowKey])), onDoubleClick: () => { setSelectedKey(String(record[config.rowKey])); setDetail(record); } })} rowClassName={(record) => String(record[config.rowKey]) === String(selectedKey) ? "ant-table-row-selected" : ""} scroll={{ x: "max-content", y: "calc(100vh - 300px)" }} pagination={{ current: query.page, pageSize: query.limit, total: isCurrentResource ? state.totalItems : 0, showSizeChanger: true, pageSizeOptions: [20, 50, 100], showTotal: (total) => `${total} records` }} onChange={(pagination, filters, sorter) => { const currentSorter = Array.isArray(sorter) ? sorter[0] : sorter; const filterState = Object.fromEntries(Object.entries(filters).map(([key, value]) => [key, value?.[0] as string | undefined])); dispatch(patchQuery({ page: pagination.current ?? 1, limit: pagination.pageSize ?? 50, sortBy: currentSorter?.field ? String(currentSorter.field) : currentSorter?.columnKey ? String(currentSorter.columnKey) : undefined, sortOrder: currentSorter?.order === "descend" ? "desc" : "asc", filters: filterState })); }} />
    <Modal title={`${editing ? "Update" : "Create"} ${config.title}`} open={formOpen} centered width={920} styles={{ body: { maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingRight: 8 } }} onCancel={() => !submitting && setFormOpen(false)} onOk={() => void save()} confirmLoading={submitting} forceRender>
      <Form form={form} layout="vertical" disabled={submitting} scrollToFirstError={{ focus: true }}>{renderFormFields(config.form)}</Form>
    </Modal>
    <Modal title={operation?.label} open={Boolean(operation)} centered width={840} styles={{ body: { maxHeight: "calc(100vh - 220px)", overflowY: "auto", paddingRight: 8 } }} onCancel={() => !submitting && setOperation(null)} onOk={() => void runOperation()} confirmLoading={submitting} okButtonProps={{ danger: operation?.danger }} forceRender>
      <Form form={actionForm} layout="vertical" disabled={submitting} scrollToFirstError={{ focus: true }}>{operation?.fields?.length ? renderFormFields(operation.fields) : <p>Confirm this action for the selected record.</p>}</Form>
    </Modal>
    <Modal title={`${config.title} Detail`} open={Boolean(detail)} centered width={960} styles={{ body: { maxHeight: "calc(100vh - 200px)", overflowY: "auto" } }} footer={<Button type="primary" onClick={() => setDetail(null)}>Close</Button>} onCancel={() => setDetail(null)}>
      <Descriptions bordered size="small" column={{ xs: 1, sm: 1, md: 2 }} styles={{ content: { overflowWrap: "anywhere" } }}>{detail && config.columns.map((field) => <Descriptions.Item key={field.key} label={field.label}>{String(nested(detail, field.key) ?? "—")}</Descriptions.Item>)}</Descriptions>
    </Modal>
    <Modal
      title={`Attachments${selected ? ` — ${String(selected[config.rowKey])}` : ""}`}
      open={attachmentsOpen}
      centered
      width={900}
      onCancel={() => !submitting && setAttachmentsOpen(false)}
      footer={<Space><Button onClick={() => setAttachmentsOpen(false)} disabled={submitting}>Close</Button>{config.attachments && hasPermission(config.attachments.updatePermission) && <Button type="primary" icon={<UploadOutlined />} loading={submitting} disabled={!attachmentFiles.length} onClick={() => void uploadAttachments()}>Upload</Button>}</Space>}
    >
      <Alert type="info" showIcon title="Up to 10 files per upload; PDF, JPG, JPEG, PNG, GIF, or WEBP; maximum 10 MB each." style={{ marginBottom: 16 }} />
      {config.attachments && hasPermission(config.attachments.updatePermission) && <Upload
        multiple
        maxCount={10}
        accept=".pdf,.jpg,.jpeg,.png,.gif,.webp"
        fileList={attachmentFiles}
        beforeUpload={(file) => {
          const allowed = ["application/pdf", "image/jpeg", "image/png", "image/gif", "image/webp"].includes(file.type);
          if (!allowed) { message.error(`${file.name}: unsupported file type`); return Upload.LIST_IGNORE; }
          if (file.size > 10 * 1024 * 1024) { message.error(`${file.name}: maximum size is 10 MB`); return Upload.LIST_IGNORE; }
          return false;
        }}
        onChange={({ fileList }) => setAttachmentFiles(fileList)}
        disabled={submitting}
      >
        <Button icon={<PaperClipOutlined />}>Select files</Button>
      </Upload>}
      <Table<AttachmentRow>
        size="small"
        rowKey="Id"
        loading={attachmentsLoading}
        dataSource={attachments}
        pagination={false}
        style={{ marginTop: 20 }}
        columns={[
          { title: "File", dataIndex: "OriginalFileName", key: "OriginalFileName", render: (value, record) => <Space>{String(value)}{record.IsLegacy && <Tag>Legacy link</Tag>}</Space> },
          { title: "Size", dataIndex: "FileSize", key: "FileSize", width: 120, render: (value) => Number(value) ? `${(Number(value) / 1024 / 1024).toFixed(2)} MB` : "—" },
          { title: "Uploaded", dataIndex: "CreatedAt", key: "CreatedAt", width: 150, render: (value) => new Date(String(value)).toLocaleDateString("en-GB") },
          { title: "By", dataIndex: "CreatedBy", key: "CreatedBy", width: 150 },
          { title: "Actions", key: "actions", width: 150, render: (_, record) => <Space><Button size="small" icon={<DownloadOutlined />} disabled={record.IsLegacy} onClick={() => void downloadAttachment(record)}>Download</Button>{config.attachments && hasPermission(config.attachments.updatePermission) && <Button aria-label={`Delete ${record.OriginalFileName}`} size="small" danger icon={<DeleteOutlined />} onClick={() => deleteAttachment(record)} />}</Space> },
        ]}
      />
    </Modal>
  </Card>;
}
