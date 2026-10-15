"use client";

import {
  BellOutlined,
  DatabaseOutlined,
  DashboardOutlined,
  InfoCircleOutlined,
  LogoutOutlined,
  SafetyCertificateOutlined,
  SettingOutlined,
  SwapOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useVuteqSso } from "@vuteq/sso-client-react/react";
import { App, Avatar, Badge, Button, Dropdown, Layout, Menu, Spin, Tooltip, type MenuProps } from "antd";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import CreditInformationModal from "@/components/CreditInformationModal";
import { withBasePath, withoutBasePath } from "@/lib/base-path";
import type { AppDispatch, RootState } from "@/store";
import { clearAuth, setAuthData } from "@/store/features/auth/authSlice";

const { Header, Content, Footer, Sider } = Layout;
const APP_VERSION = "1.0.0";
type NavigationItem = Required<MenuProps>["items"][number] & { permission?: string[]; children?: NavigationItem[] };

function item(label: React.ReactNode, key: string, icon?: React.ReactNode, children?: NavigationItem[], permission?: string[]): NavigationItem { return { label, key, icon, children, permission } as NavigationItem; }
const navigation: NavigationItem[] = [
  item(<Link href="/apps">Dashboard</Link>, "/apps", <DashboardOutlined />, undefined, ["ITAM.DASHBOARD_READ"]),
  item("Master Data", "master", <DatabaseOutlined />, [
    item(<Link href="/apps/master-data/categories">Categories</Link>, "/apps/master-data/categories", undefined, undefined, ["ITAM.MASTER_READ"]),
    item(<Link href="/apps/master-data/attributes">Attributes</Link>, "/apps/master-data/attributes", undefined, undefined, ["ITAM.MASTER_READ"]),
    item(<Link href="/apps/master-data/locations">Locations</Link>, "/apps/master-data/locations", undefined, undefined, ["ITAM.MASTER_READ"]),
    item(<Link href="/apps/asset-management/assets">Asset List</Link>, "/apps/asset-management/assets", undefined, undefined, ["ITAM.ASSET_READ"]),
  ]),
  item("Transaction Data", "transactions", <SwapOutlined />, [
    item(<Link href="/apps/asset-management/licenses">Licenses</Link>, "/apps/asset-management/licenses", undefined, undefined, ["ITAM.LICENSE_READ"]),
    item(<Link href="/apps/asset-management/maintenance">Repairs</Link>, "/apps/asset-management/maintenance", undefined, undefined, ["ITAM.MAINTENANCE_READ"]),
    item(<Link href="/apps/asset-management/user-assignments">User Mutations</Link>, "/apps/asset-management/user-assignments", undefined, undefined, ["ITAM.ASSET_READ"]),
    item(<Link href="/apps/transaction-data/department-mutations">Department Mutations</Link>, "/apps/transaction-data/department-mutations", undefined, undefined, ["ITAM.ASSET_READ"]),
    item(<Link href="/apps/asset-management/disposals">Asset Disposals</Link>, "/apps/asset-management/disposals", undefined, undefined, ["ITAM.ASSET_READ"]),
    item(<Link href="/apps/inventory-control/stock-opname">Stock Opname</Link>, "/apps/inventory-control/stock-opname", undefined, undefined, ["ITAM.STOCK_OPNAME_READ"]),
  ]),
  item("System Administration", "system", <SettingOutlined />, [
    item(<Link href="/apps/system-administration/user-accounts">User Accounts</Link>, "/apps/system-administration/user-accounts", undefined, undefined, ["ITAM.USER_MANAGEMENT"]),
    item(<Link href="/apps/system-administration/roles-configuration">Roles Configuration</Link>, "/apps/system-administration/roles-configuration", undefined, undefined, ["ITAM.USER_MANAGEMENT"]),
    item(<Link href="/apps/system-administration/permissions-setup">Permissions Setup</Link>, "/apps/system-administration/permissions-setup", undefined, undefined, ["ITAM.USER_MANAGEMENT"]),
    item(<Link href="/apps/system-administration/system-log">System Logs</Link>, "/apps/system-administration/system-log", undefined, undefined, ["ITAM.SYSTEM_LOG_READ"]),
  ]),
];

export default function AppsLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [creditsOpen, setCreditsOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const pathname = withoutBasePath(usePathname());
  const { modal } = App.useApp();
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const { session, loading: sessionLoadingSso } = useVuteqSso();
  const isSsoSuperAdmin =
    (session?.roles ?? []).includes("SUPER_ADMINISTRATOR") ||
    (session?.globalRoles ?? []).includes("SUPER_ADMINISTRATOR");

  useEffect(() => {
    if (sessionLoadingSso) return;

    if (session) {
      sessionStorage.removeItem("processing401");
      const profile = session.attributes as { AccessStatus?: string; RoleName?: string } | undefined;
      const isGlobalSuper =
        (session?.roles ?? []).includes("SUPER_ADMINISTRATOR") ||
        (session?.globalRoles ?? []).includes("SUPER_ADMINISTRATOR");

      const hasRole = Boolean(session.roles.length > 0 || profile?.RoleName);
      if (!isGlobalSuper && (profile?.AccessStatus === "PENDING" || !hasRole)) {
        router.replace("/auth/pending-account");
        return;
      }
      if (!isGlobalSuper && profile?.AccessStatus && profile.AccessStatus !== "ACTIVE") {
        router.replace("/auth/error");
        return;
      }

      dispatch(
        setAuthData({
          user: {
            UserId: session.user.sub,
            Name: session.user.name ?? session.user.preferred_username ?? session.user.sub,
            Email: session.user.email ?? "",
            LastLogin: "",
            DeptPermission: [],
            RoleName: isGlobalSuper
              ? "SUPER"
              : (session.roles[0] ?? profile?.RoleName ?? ""),
            Permission: session.permissions,
            GlobalRoles: session.globalRoles,
          },
          token: "",
        }),
      );
      setIsChecking(false);
      return;
    }

    if (sessionStorage.getItem("processing401") !== "true") {
      window.location.replace(withBasePath("/auth/login"));
    }
  }, [dispatch, router, session, sessionLoadingSso]);

  const handleLogout = () => {
    modal.confirm({
      centered: true,
      title: "Confirm Logout",
      content: "Are you sure you want to sign out of ITAM and your SSO account?",
      okText: "Logout",
      okButtonProps: { danger: true },
      cancelText: "Cancel",
      onOk: () => {
        dispatch(clearAuth());
        const form = document.createElement("form");
        form.method = "POST";
        form.action = withBasePath("/auth/logout");
        document.body.appendChild(form);
        form.submit();
      },
    });
  };

  const menu = useMemo(() => {
    const permissions = user?.Permission ?? [];
    const isSuper =
      isSsoSuperAdmin ||
      user?.RoleName === "SUPER" ||
      permissions.includes("SUPER") ||
      permissions.includes("*");
    const allow = (entry: NavigationItem) =>
      isSuper ||
      !entry.permission?.length ||
      entry.permission.some((permission) => permissions.includes(permission));
    return navigation.map((entry) => entry.children ? { ...entry, children: entry.children.filter(allow) } : entry).filter((entry) => entry.children ? entry.children.length > 0 : allow(entry));
  }, [isSsoSuperAdmin, user?.Permission, user?.RoleName]);
  const selected = [...navigation.flatMap((entry) => entry.children ?? [entry])].map((entry) => String(entry.key)).filter((key) => pathname === key || (key !== "/apps" && pathname.startsWith(`${key}/`))).sort((a, b) => b.length - a.length)[0] ?? "/apps";
  const selectedParent = navigation.find((entry) => entry.children?.some((child) => String(child.key) === selected));

  if (sessionLoadingSso || isChecking) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#020617" }}>
        <Image src={withBasePath("/images/ansei-white.png")} alt="ITAM logo" width={180} height={90} priority style={{ marginBottom: "24px" }} />
        <Spin size="large" />
        <div style={{ marginTop: "16px", fontSize: "16px", color: "#cbd5e1" }}>Memeriksa sesi akun Vuteq Anda...</div>
      </div>
    );
  }

  return <>
    <Layout style={{ minHeight: "100vh", display: "flex" }}>
      <Sider className="ansei-sider" collapsible collapsed={collapsed} collapsedWidth={80} onCollapse={setCollapsed} width={300} theme="dark" style={{ overflow: "auto", height: "100vh", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: 100, background: "#263545" }}>
        <div className="text-center justify-center flex p-1"><Image src={withBasePath("/images/ansei-white.png")} alt="ITAM logo" width={200} height={100} priority /></div>
        <Menu theme="dark" style={{ background: "transparent", padding: "4px 8px" }} selectedKeys={[selected]} defaultOpenKeys={selectedParent ? [String(selectedParent.key)] : []} mode="inline" items={menu} />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 300, transition: "margin-left .2s", display: "flex", flexDirection: "column", height: "100vh" }}>
        <Header className="batik-bg ansei-header-footer" style={{ padding: "0 16px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 1000, width: "100%", flexShrink: 0 }}>
          <h2 style={{ fontFamily: "Arial, Helvetica, sans-serif", fontSize: 20, fontWeight: 400, margin: 0, color: "white" }}>IT Asset Management System</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 8, height: 32 }}><span className="desktop-greeting" style={{ marginRight: 8, color: "white" }}>Hello, {user?.Name ?? "User"}</span><Tooltip title="Notifications"><span style={{ width: 32, height: 32, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><Badge count={0}><BellOutlined style={{ fontSize: 20, color: "white" }} /></Badge></span></Tooltip><Tooltip title="Credits & Information"><Button type="text" aria-label="Open credits and information" onClick={() => setCreditsOpen(true)} style={{ width: 32, height: 32, padding: 0 }} icon={<InfoCircleOutlined style={{ fontSize: 20, color: "white" }} />} /></Tooltip><Dropdown placement="bottomRight" menu={{ items: [{ key: "profile", icon: <UserOutlined />, label: user?.Email || "Profile", disabled: true }, { key: "role", icon: <SafetyCertificateOutlined />, label: user?.RoleName || "Role not assigned", disabled: true }, { type: "divider" }, { key: "logout", icon: <LogoutOutlined />, label: "Logout", onClick: handleLogout }] }}><Avatar icon={<UserOutlined />} size={32} style={{ cursor: "pointer" }} /></Dropdown></div>
        </Header>
        <Content style={{ margin: "20px 10px", overflow: "auto", flex: 1, minHeight: 0 }}><div className="ansei-content-surface" style={{ padding: 20, minHeight: "100%", background: "#FCFCFA", borderRadius: 6 }}>{children}</div></Content>
        <Footer className="batik-bg ansei-header-footer" style={{ textAlign: "center", color: "white", fontSize: 14, fontWeight: 400, position: "sticky", bottom: 0, left: 0, right: 0, zIndex: 999, flexShrink: 0 }}>
          <span>IT Asset Management System © {new Date().getFullYear()} PT Vuteq Indonesia</span>
          <span style={{ margin: "0 8px" }}>|</span>
          <span>v{APP_VERSION}</span>
        </Footer>
      </Layout>
    </Layout>
    <CreditInformationModal open={creditsOpen} onClose={() => setCreditsOpen(false)} />
  </>;
}
