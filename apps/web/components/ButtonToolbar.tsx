import type { ReactNode } from "react";
export default function ButtonToolbar({ title, icon, onClick, enable = true, loading = false }: { title: string; icon?: ReactNode; onClick?: () => void; enable?: boolean; loading?: boolean }) {
  return <span role="button" aria-disabled={!enable || loading} className={`${enable && !loading ? "hover:cursor-pointer hover:bg-[#3A4E61]" : ""} p-1 text-xs flex flex-row items-center justify-center gap-1 transition-colors ${!enable || loading ? "text-[#93A8B8]" : "text-white"}`} onClick={enable && !loading ? onClick : undefined}>{loading ? <span className="animate-spin">◌</span> : icon}<span>{title}</span></span>;
}
