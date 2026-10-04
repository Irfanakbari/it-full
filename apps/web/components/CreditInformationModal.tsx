"use client";
import { DesktopOutlined, HeartOutlined, InfoCircleOutlined, SafetyCertificateOutlined, UserOutlined } from "@ant-design/icons";
import { Button, Modal, Timeline, Typography } from "antd";
import Image from "next/image";
import { useState } from "react";
import { withBasePath } from "@/lib/base-path";
const { Paragraph, Title } = Typography;

export default function CreditInformationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [techOpen, setTechOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const itTeam = ["Irfan Akbari Habibi", "Om Wissa", "Om Selpian", "Mas Sirojul Kahfi"];
  const operationsTeam = ["Pak Anggo", "Pak Rizky", "Om Andry"];
  return <>
    <Modal className="ansei-credit-modal" title={<div style={{ display: "flex", alignItems: "center", gap: 10 }}><span style={{ display: "inline-flex", padding: 8, borderRadius: 4, color: "white", background: "#4C6A85" }}><InfoCircleOutlined /></span><div><div>Credits & Information</div><div style={{ color: "#64748b", fontSize: 12, fontWeight: 400 }}>The people behind ITAM</div></div></div>} open={open} centered onCancel={onClose} width={820} footer={[<Button key="updates" onClick={() => setUpdatesOpen(true)}>Update Log</Button>, <Button key="tech" onClick={() => setTechOpen(true)}>Tech Stack</Button>, <Button key="privacy" onClick={() => setPrivacyOpen(true)}>Privacy Policy</Button>, <Button key="close" type="primary" onClick={onClose}>Close</Button>]}>
      <div className="credit-rise" style={{ padding: "12px 0 4px" }}>
        <div style={{ position: "relative", overflow: "hidden", textAlign: "center", marginBottom: 24, padding: "28px 24px", borderRadius: 6, color: "white", background: "#263545" }}><HeartOutlined style={{ fontSize: 28, color: "#fecaca" }} /><h2 style={{ margin: "12px 0 0", fontSize: 25, color: "white" }}>IT Asset Management System</h2><p style={{ margin: "8px 0 0", color: "rgba(255,255,255,.85)" }}>Crafted through the collaboration of IT and Production Teams</p></div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 20 }}>
          <div style={{ display: "grid", gap: 16 }}><div style={{ padding: "16px 18px", borderRadius: 6, background: "#EDF2F6" }}><div style={{ color: "#4C6A85", fontSize: 12, fontWeight: 700, letterSpacing: 1 }}>CORE DEVELOPER</div><div style={{ marginTop: 4, color: "#293241", fontSize: 20, fontWeight: 700 }}>Irfan Akbari Habibi</div><div style={{ marginTop: 6, color: "#475569", fontStyle: "italic" }}>“Precision in logic, excellence in execution — crafting digital tools that empower manufacturing every day.”</div></div><div style={{ padding: 16, background: "#304254", borderRadius: 6, color: "white" }}><h4 style={{ margin: "0 0 10px" }}>⭐ Project Advisors</h4>{["Nakajima-san", "Pak Supriadi", "Pak Abdillah", "Pak Hermanto"].map((name) => <div key={name}>• {name}</div>)}</div></div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}><div><h4><DesktopOutlined /> IT Department</h4>{itTeam.map((name) => <div key={name} style={{ padding: "4px 0" }}>● {name}</div>)}</div><div><h4><UserOutlined /> Production Dept</h4>{operationsTeam.map((name) => <div key={name} style={{ padding: "4px 0" }}>● {name}</div>)}</div></div>
        </div><div style={{ marginTop: 24, paddingTop: 16, textAlign: "center", color: "#999", fontSize: 12 }}>Developed with <HeartOutlined style={{ color: "#dc2626" }} /> by IT Teams</div>
      </div>
    </Modal>
    <Modal title="Technology Stack" open={techOpen} centered onCancel={() => setTechOpen(false)} footer={<Button type="primary" onClick={() => setTechOpen(false)}>Close</Button>}><div style={{ textAlign: "center" }}><p>Next.js 16 · React 19 · Ant Design 6 · NestJS 11 · Prisma 7 · PostgreSQL · Redis</p><SafetyCertificateOutlined style={{ fontSize: 30, color: "#4C6A85" }} /><div style={{ display: "flex", gap: 24, justifyContent: "center", marginTop: 12 }}><Image src={withBasePath("/images/ssl.png")} alt="SSL Secured" width={120} height={30} /><Image src={withBasePath("/images/aes.webp")} alt="AES 256 Encryption" width={60} height={60} /></div></div></Modal>
    <Modal title="Privacy Policy" open={privacyOpen} centered width={820} onCancel={() => setPrivacyOpen(false)} footer={<Button type="primary" onClick={() => setPrivacyOpen(false)}>Close</Button>} styles={{ body: { maxHeight: "70vh", overflowY: "auto" } }}><Title level={4}>Employee and IT Asset Data Protection Policy</Title><Paragraph>ITAM processes SSO identity, role, permission, employee assignment, device inventory, maintenance, licensing, and audit data for PT Vuteq Indonesia. Access follows least privilege and every sensitive action is attributable through a request ID and audit event.</Paragraph><Title level={5}>Security and retention</Title><Paragraph>Transport is encrypted, license keys use authenticated encryption, browser sessions do not expose OAuth tokens, and operational records are retained according to company governance.</Paragraph></Modal>
    <Modal title="Update Log" open={updatesOpen} centered width={760} onCancel={() => setUpdatesOpen(false)} footer={<Button type="primary" onClick={() => setUpdatesOpen(false)}>Close</Button>}><Timeline items={[{ children: "v1.0.0 — Initial ITAM monorepo, SSO BFF, RBAC, audit, and Stock Opname." }, { children: "Clean PascalCase database baseline and server-side tables." }]} /></Modal>
  </>;
}
