"use client";

import { AlertOutlined, AuditOutlined, CheckCircleFilled, ClockCircleOutlined, DesktopOutlined, EnvironmentOutlined, ReloadOutlined, SafetyCertificateOutlined, ToolOutlined, UserSwitchOutlined } from "@ant-design/icons";
import { Alert, Button, Card, Col, Empty, Progress, Row, Skeleton, Table, Tag, Tooltip as AntTooltip } from "antd";
import dayjs from "dayjs";
import { useEffect, useMemo } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchDashboard, type DashboardMaintenance } from "@/store/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const numberFormatter = new Intl.NumberFormat("en-US");
const chartColors = ["#4c6a85", "#6f8da4", "#93a8b8", "#b4c3cd", "#d0dbe1", "#3a4e61"];
const statusLabels: Record<string, string> = { OPEN: "Open", IN_PROGRESS: "In progress", VERIFIED: "Verified", APPROVED: "Approved", CLOSED: "Closed" };

function value(kpi: Record<string, number>, key: string) { return kpi[key] ?? 0; }
function StatusTag({ active }: { active: boolean }) { return <Tag color={active ? "success" : "default"}>{active ? "Active" : "Inactive"}</Tag>; }

function PriorityMetric({ icon, label, value: metricValue, detail, tone }: { icon: React.ReactNode; label: string; value: number; detail: string; tone: "danger" | "warning" | "neutral" }) {
  return <div className={`dashboard-priority dashboard-priority--${tone}`}>
    <span className="dashboard-priority__icon">{icon}</span>
    <div className="dashboard-priority__copy"><span>{label}</span><small>{detail}</small></div>
    <strong>{numberFormatter.format(metricValue)}</strong>
  </div>;
}

export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);
  useEffect(() => { void dispatch(fetchDashboard()); }, [dispatch]);

  const trendData = useMemo(() => {
    if (!data) return [];
    const monthly = new Map<string, { Month: string; SortKey: string; Assets: number; Maintenance: number }>();
    data.AssetTrend.forEach((item) => {
      const key = dayjs(item.Month).format("YYYY-MM");
      monthly.set(key, { Month: dayjs(item.Month).format("MMM YY"), SortKey: key, Assets: item.Total, Maintenance: 0 });
    });
    data.MaintenanceTrend.forEach((item) => {
      const key = dayjs(item.Month).format("YYYY-MM");
      const current = monthly.get(key) ?? { Month: dayjs(item.Month).format("MMM YY"), SortKey: key, Assets: 0, Maintenance: 0 };
      current.Maintenance = item.Total;
      monthly.set(key, current);
    });
    return [...monthly.values()].sort((a, b) => a.SortKey.localeCompare(b.SortKey));
  }, [data]);

  if (loading && !data) return <div className="dashboard-loading"><Skeleton active paragraph={{ rows: 14 }} /></div>;
  if (error && !data) return <Alert type="error" showIcon title="Dashboard could not be loaded" description={error} />;
  if (!data) return <Empty description="Dashboard data is not available" />;

  const activeAssets = value(data.Kpi, "ActiveAssets");
  const inactiveAssets = value(data.Kpi, "InactiveAssets");
  const disposedAssets = value(data.Kpi, "DisposedAssets");
  const managedAssets = activeAssets + inactiveAssets;
  const utilization = managedAssets ? Math.round((activeAssets / managedAssets) * 100) : 0;
  const openIssues = value(data.Kpi, "OpenMaintenance") + value(data.Kpi, "ExpiredWarranty") + value(data.Kpi, "ExpiredLicenses");
  const categoryData = [...data.CategoryDistribution].sort((a, b) => b.Total - a.Total).slice(0, 6);
  const locationData = [...data.LocationDistribution].sort((a, b) => b.Total - a.Total).slice(0, 5);
  const topLocationTotal = Math.max(...locationData.map((item) => item.Total), 1);
  const stockCount = Number(data.ActiveStockOpname?._count?.Details ?? 0);
  const stockStatus = String(data.ActiveStockOpname?.Status ?? "");

  return <main className="dashboard-page">
    <header className="dashboard-heading">
      <div><h1>Asset operations overview</h1><p>Current inventory health, upcoming risk, and recent activity.</p></div>
      <AntTooltip title="Refresh dashboard data"><Button icon={<ReloadOutlined spin={loading} />} loading={loading} onClick={() => void dispatch(fetchDashboard())}>Refresh</Button></AntTooltip>
    </header>

    {error ? <Alert className="dashboard-inline-alert" type="warning" showIcon message="Showing the last available data" description={error} /> : null}

    <section className="dashboard-summary" aria-label="Asset portfolio summary">
      <div className="dashboard-summary__main"><span className="dashboard-summary__icon"><DesktopOutlined /></span><div><span className="dashboard-summary__label">Active assets</span><strong>{numberFormatter.format(activeAssets)}</strong><span className="dashboard-summary__caption">ready and in service</span></div></div>
      <div className="dashboard-summary__health"><div className="dashboard-summary__health-copy"><span>Operational availability</span><strong>{utilization}%</strong></div><Progress percent={utilization} showInfo={false} strokeColor="#4c6a85" trailColor="#dce5ea" /><small>{numberFormatter.format(inactiveAssets)} inactive assets need review</small></div>
      <div className="dashboard-summary__facts"><div><span>Managed portfolio</span><strong>{numberFormatter.format(managedAssets)}</strong></div><div><span>Disposed history</span><strong>{numberFormatter.format(disposedAssets)}</strong></div><div><span>Open risk items</span><strong className={openIssues ? "dashboard-text-danger" : ""}>{numberFormatter.format(openIssues)}</strong></div></div>
    </section>

    <section aria-labelledby="attention-heading">
      <div className="dashboard-section-heading"><div><h2 id="attention-heading">Needs attention</h2><p>Items with immediate operational or compliance impact.</p></div><span>{numberFormatter.format(openIssues)} open risk items</span></div>
      <div className="dashboard-priority-grid">
        <PriorityMetric icon={<SafetyCertificateOutlined />} label="Warranty expired" value={value(data.Kpi, "ExpiredWarranty")} detail="Past coverage date" tone="danger" />
        <PriorityMetric icon={<ClockCircleOutlined />} label="Warranty expiring" value={value(data.Kpi, "ExpiringWarranty")} detail="Within 30 days" tone="warning" />
        <PriorityMetric icon={<UserSwitchOutlined />} label="Unassigned assets" value={value(data.Kpi, "UnassignedAssets")} detail="Active without custodian" tone="neutral" />
        <PriorityMetric icon={<ToolOutlined />} label="Open repairs" value={value(data.Kpi, "OpenMaintenance")} detail="Work not yet closed" tone="warning" />
        <PriorityMetric icon={<AlertOutlined />} label="Licenses expired" value={value(data.Kpi, "ExpiredLicenses")} detail="Renewal overdue" tone="danger" />
        <PriorityMetric icon={<ClockCircleOutlined />} label="Licenses expiring" value={value(data.Kpi, "ExpiringLicenses")} detail="Within 30 days" tone="warning" />
      </div>
    </section>

    <Row gutter={[16, 16]}>
      <Col xs={24} xl={16}><Card className="dashboard-card" title={<div className="dashboard-card-title"><span>Portfolio activity</span><small>Assets added and maintenance records by month</small></div>}>
        {trendData.length ? <ResponsiveContainer width="100%" height={300}><AreaChart data={trendData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
          <defs><linearGradient id="assetFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#4c6a85" stopOpacity={0.28} /><stop offset="95%" stopColor="#4c6a85" stopOpacity={0.02} /></linearGradient><linearGradient id="maintenanceFill" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#d08b3e" stopOpacity={0.22} /><stop offset="95%" stopColor="#d08b3e" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid stroke="#e6ebee" vertical={false} /><XAxis dataKey="Month" tickLine={false} axisLine={false} fontSize={11} tickMargin={10} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={11} /><Tooltip contentStyle={{ borderRadius: 6, borderColor: "#d9dddf", boxShadow: "0 8px 24px rgba(38,53,69,.12)" }} /><Area type="monotone" name="Assets added" dataKey="Assets" stroke="#4c6a85" strokeWidth={2} fill="url(#assetFill)" /><Area type="monotone" name="Repairs" dataKey="Maintenance" stroke="#d08b3e" strokeWidth={2} fill="url(#maintenanceFill)" />
        </AreaChart></ResponsiveContainer> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No monthly activity yet" />}
        <div className="dashboard-chart-legend"><span><i className="dashboard-legend-assets" />Assets added</span><span><i className="dashboard-legend-maintenance" />Repairs</span></div>
      </Card></Col>
      <Col xs={24} xl={8}><Card className="dashboard-card" title={<div className="dashboard-card-title"><span>Asset mix</span><small>Largest categories in active inventory</small></div>}>
        {categoryData.length ? <ResponsiveContainer width="100%" height={300}><BarChart data={categoryData} layout="vertical" margin={{ top: 8, right: 18, left: 8, bottom: 0 }}><CartesianGrid stroke="#eef1f3" horizontal={false} /><XAxis type="number" hide /><YAxis type="category" dataKey="Name" width={92} tickLine={false} axisLine={false} fontSize={11} /><Tooltip cursor={{ fill: "#f3f6f7" }} contentStyle={{ borderRadius: 6, borderColor: "#d9dddf" }} /><Bar dataKey="Total" name="Assets" radius={[0, 3, 3, 0]} fill={chartColors[0]} maxBarSize={22} /></BarChart></ResponsiveContainer> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No category data" />}
      </Card></Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col xs={24} xl={9}><Card className="dashboard-card" title={<div className="dashboard-card-title"><span>Inventory control</span><small>Current stock opname and physical condition</small></div>}>
        {data.ActiveStockOpname ? <div className="dashboard-stock"><div className="dashboard-stock__top"><span className="dashboard-stock__icon"><AuditOutlined /></span><div><small>Active document</small><strong>{String(data.ActiveStockOpname.DocNumber)}</strong></div><Tag color="processing">{statusLabels[stockStatus] ?? stockStatus}</Tag></div><div className="dashboard-stock__meta"><span>Scope <strong>{numberFormatter.format(stockCount)} assets</strong></span><span>Opname date <strong>{data.ActiveStockOpname.OpnameDate ? dayjs(String(data.ActiveStockOpname.OpnameDate)).format("DD MMM YYYY") : "—"}</strong></span></div></div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active stock opname" />}
        <div className="dashboard-condition-grid"><div><span className="dashboard-condition dashboard-condition--danger"><AlertOutlined /></span><span>Lost</span><strong>{numberFormatter.format(data.Condition.LOST ?? 0)}</strong></div><div><span className="dashboard-condition dashboard-condition--warning"><ToolOutlined /></span><span>Damaged</span><strong>{numberFormatter.format(data.Condition.DAMAGED ?? 0)}</strong></div></div>
      </Card></Col>
      <Col xs={24} xl={15}><Card className="dashboard-card" title={<div className="dashboard-card-title"><span>Assets by location</span><small>Top locations by inventory volume</small></div>}>
        {locationData.length ? <div className="dashboard-locations">{locationData.map((item, index) => <div className="dashboard-location" key={item.Name}><span className="dashboard-location__rank">{index + 1}</span><EnvironmentOutlined /><div><span>{item.Name}</span><Progress percent={Math.round((item.Total / topLocationTotal) * 100)} showInfo={false} strokeColor={chartColors[index % chartColors.length]} trailColor="#edf1f3" size="small" /></div><strong>{numberFormatter.format(item.Total)}</strong></div>)}</div> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No location data" />}
      </Card></Col>
    </Row>

    <Row gutter={[16, 16]}>
      <Col xs={24} xl={12}><Card className="dashboard-card dashboard-table-card" title={<div className="dashboard-card-title"><span>Recently registered assets</span><small>Latest additions to the asset register</small></div>}>
        <Table size="small" pagination={false} rowKey={(row) => String(row.Id)} dataSource={data.RecentAssets.slice(0, 6)} locale={{ emptyText: "No recent assets" }} columns={[
          { title: "Asset", dataIndex: "AssetTag", width: 128, render: (tag, row) => <div className="dashboard-table-primary"><strong>{String(tag ?? "—")}</strong><small>{String(row.Category?.Name ?? "Uncategorized")}</small></div> },
          { title: "Name", dataIndex: "Name", ellipsis: true }, { title: "Location", render: (_, row) => String(row.Location?.Name ?? "Unassigned"), ellipsis: true }, { title: "Status", width: 84, render: (_, row) => <StatusTag active={Boolean(row.IsActive)} /> },
        ]} />
      </Card></Col>
      <Col xs={24} xl={12}><Card className="dashboard-card dashboard-table-card" title={<div className="dashboard-card-title"><span>Recent repairs</span><small>Latest service activity across the fleet</small></div>}>
        <Table<DashboardMaintenance> size="small" pagination={false} rowKey={(row) => String(row.Id)} dataSource={data.RecentMaintenance.slice(0, 6)} locale={{ emptyText: "No recent repairs" }} columns={[
          { title: "Asset", width: 145, render: (_, row) => <div className="dashboard-table-primary"><strong>{String(row.Asset?.AssetTag ?? "—")}</strong><small>{String(row.Asset?.Name ?? "Unknown asset")}</small></div> }, { title: "Service", dataIndex: "MaintenanceType", ellipsis: true }, { title: "Date", dataIndex: "MaintenanceDate", width: 104, render: (date) => date ? dayjs(String(date)).format("DD MMM YYYY") : "—" }, { title: "Status", width: 88, render: (_, row) => row.IsClosed ? <Tag icon={<CheckCircleFilled />} color="success">Closed</Tag> : <Tag icon={<ClockCircleOutlined />} color="warning">Open</Tag> },
        ]} />
      </Card></Col>
    </Row>
  </main>;
}
