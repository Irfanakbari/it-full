"use client";
import { Alert, Card, Col, Empty, Row, Spin, Statistic, Table, Tag } from "antd";
import { useEffect } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchDashboard } from "@/store/dashboardSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

const labels: Record<string, string> = { ActiveAssets: "Active Assets", InactiveAssets: "Inactive Assets", DisposedAssets: "Disposed", ExpiredWarranty: "Warranty Expired", ExpiringWarranty: "Warranty ≤ 30 Days", UnassignedAssets: "Unassigned", OpenMaintenance: "Open Maintenance", ExpiredLicenses: "License Expired", ExpiringLicenses: "License ≤ 30 Days" };
const colors = ["#4F46E5", "#10B981", "#F59E0B", "#3B82F6", "#7C3AED", "#EC4899"];
export default function Dashboard() {
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);
  useEffect(() => { void dispatch(fetchDashboard()); }, [dispatch]);
  if (loading && !data) return <div style={{ minHeight: 400, display: "grid", placeItems: "center" }}><Spin size="large" /></div>;
  if (error && !data) return <Alert type="error" showIcon title={error} />;
  if (!data) return <Empty />;
  return <div><h1 className="page-title">Dashboard</h1>
    <Row gutter={[12, 12]}>{Object.entries(data.Kpi).map(([key, value]) => <Col xs={12} sm={8} lg={4} key={key}><Card size="small" variant="borderless"><Statistic title={labels[key] ?? key} value={value} styles={{ content: { fontSize: 24, color: key.includes("Expired") ? "#EF4444" : "#293241" } }} /></Card></Col>)}</Row>
    <Row gutter={[12, 12]} style={{ marginTop: 12 }}><Col xs={24} xl={16}><Card title="Asset and Maintenance Monthly Trend" size="small" variant="borderless"><ResponsiveContainer width="100%" height={280}><AreaChart data={data.AssetTrend.map((item, index) => ({ Month: new Date(item.Month).toLocaleDateString("en-US", { month: "short", year: "2-digit" }), Assets: item.Total, Maintenance: data.MaintenanceTrend[index]?.Total ?? 0 }))}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="Month" fontSize={11} /><YAxis fontSize={11} /><Tooltip /><Legend /><Area type="monotone" dataKey="Assets" stroke="#4F46E5" fill="#EEF2FF" /><Area type="monotone" dataKey="Maintenance" stroke="#F59E0B" fill="#FEF3C7" /></AreaChart></ResponsiveContainer></Card></Col><Col xs={24} xl={8}><Card title="Asset Distribution" size="small" variant="borderless"><ResponsiveContainer width="100%" height={280}><PieChart><Pie data={data.CategoryDistribution} dataKey="Total" nameKey="Name" outerRadius={95} label>{data.CategoryDistribution.map((_item, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></Card></Col></Row>
    <Row gutter={[12, 12]} style={{ marginTop: 12 }}><Col xs={24} xl={12}><Card title="Recent Assets" size="small" variant="borderless"><Table size="small" pagination={false} rowKey={(row) => String(row.Id)} dataSource={data.RecentAssets} columns={[{ title: "Asset Tag", dataIndex: "AssetTag" }, { title: "Name", dataIndex: "Name" }, { title: "Status", render: (_, row) => <Tag color={row.IsActive ? "green" : "default"}>{row.IsActive ? "Active" : "Inactive"}</Tag> }]} /></Card></Col><Col xs={24} xl={12}><Card title="Active Stock Opname" size="small" variant="borderless" style={{ marginBottom: 12 }}>{data.ActiveStockOpname ? <><b>{String(data.ActiveStockOpname.DocNumber)}</b><p>Status: <Tag color="blue">{String(data.ActiveStockOpname.Status)}</Tag></p></> : <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No active Stock Opname" />}</Card><Card title="Lost / Damaged" size="small" variant="borderless"><Row gutter={12}><Col span={12}><Statistic title="Lost" value={data.Condition.LOST ?? 0} styles={{ content: { color: "#EF4444" } }} /></Col><Col span={12}><Statistic title="Damaged" value={data.Condition.DAMAGED ?? 0} styles={{ content: { color: "#F59E0B" } }} /></Col></Row></Card></Col></Row>
  </div>;
}
