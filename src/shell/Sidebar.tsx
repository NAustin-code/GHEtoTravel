import { Home, Plane, FileText, CheckSquare, Menu, ChevronLeft, Settings, Users, Activity, List, BarChart3, CheckCircle2, type LucideIcon } from "lucide-react";
import { ImageWithFallback } from "@/app/components/ImageWithFallback";
import logoImg from "@/assets/HB-Logo-NO-BG.png";
import { ORANGE, GRADIENT_SIDEBAR } from "@/config/theme";
import { Role, Screen, User } from "@/types/declaration";
import { canAccessScreen } from "@/app/auth/authService";

const APPROVER_BASE_LINKS: { screen: Screen; icon: LucideIcon; label: string }[] = [
  { screen: "approver-dashboard" as Screen, icon: Home,        label: "Dashboard" },
  { screen: "new-declaration"    as Screen, icon: Plane,       label: "New Travel Request" },
  { screen: "approval-queue"     as Screen, icon: CheckSquare, label: "Approval Queue" },
  { screen: "my-declarations"    as Screen, icon: FileText,    label: "All Travel Requests" },
  { screen: "travel-analysis"    as Screen, icon: BarChart3,  label: "Travel Analysis" },
];

export function Sidebar({
  role,
  screen,
  onNavigate,
  collapsed,
  onToggle,
  user,
}: {
  role: Role;
  screen: Screen;
  onNavigate: (s: Screen) => void;
  collapsed: boolean;
  onToggle: () => void;
  user?: User | null;
}) {
  const links =
    role === "admin"
      ? [
          { screen: "admin-dashboard" as Screen, icon: Home,     label: "Dashboard" },
          { screen: "admin-users"     as Screen, icon: Users,    label: "Users" },
          { screen: "admin-workflows" as Screen, icon: Activity, label: "Workflows" },
          { screen: "admin-dropdowns" as Screen, icon: List,     label: "Dropdowns" },
          { screen: "admin-config"    as Screen, icon: Settings, label: "Config" },
          { screen: "admin-reports"   as Screen, icon: FileText, label: "Reports" },
          { screen: "travel-analysis" as Screen, icon: BarChart3, label: "Travel Analysis" },
          { screen: "admin-approval-options" as Screen, icon: CheckCircle2, label: "Approval Options" },
        ]
      : role === "teamMember"
      ? [
          { screen: "new-declaration" as Screen, icon: Plane,        label: "New Travel Request" },
          { screen: "my-declarations"  as Screen, icon: FileText,   label: "My Travel Requests" },
        ]
      : [
          ...APPROVER_BASE_LINKS,
          ...(user && canAccessScreen(user, "admin-reports")
            ? [{ screen: "admin-reports" as Screen, icon: BarChart3, label: "Reports" }]
            : []),
        ];

  return (
    <>
    <aside
      className={`hidden md:flex flex-shrink-0 flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-56"}`}
      style={{ background: GRADIENT_SIDEBAR }}
    >
      <div
        className={`h-[72px] flex items-center border-b border-[#F2BD00] ${collapsed ? "justify-center px-0" : "justify-between px-3"}`}
        style={{ borderColor: ORANGE }}
      >
        {!collapsed && (
          <div className="flex-1 pr-3">
            <ImageWithFallback src={logoImg} alt="Hollywoodbets" className="h-11 w-full object-contain object-left" />
          </div>
        )}
        <button
          onClick={onToggle}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 transition-colors text-[#F2BD00] flex-shrink-0"
        >
          {collapsed ? <Menu size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2">
        {!collapsed && (
          <p
            className="px-3 pb-3 text-[10px] font-extrabold uppercase tracking-[0.12em]"
            style={{ color: ORANGE }}
          >
            {role === "admin" ? "Administrator" : role === "teamMember" ? "Team Member" : "Approver"}
          </p>
        )}
        <div className="space-y-0.5">
          {links.map((link) => {
            const active = screen === link.screen;
            return (
              <button
                key={link.screen}
                onClick={() => onNavigate(link.screen)}
                title={collapsed ? link.label : undefined}
                  className={`w-full flex items-center gap-3 rounded-md transition-all ${
                  collapsed ? "justify-center p-2.5 text-base" : "px-3 py-2.5 text-[13px]"
                } ${active ? "font-bold" : "text-white/90 hover:bg-white/10 font-medium"}`}
                style={active ? { background: `linear-gradient(90deg, #5125BD, #39127E)`, color: "#fff" } : {}}
              >
                <link.icon size={18} className={active ? "" : "opacity-90"} />
                {!collapsed && link.label}
              </button>
            );
          })}
        </div>
      </nav>

    </aside>
    <nav className="md:hidden fixed inset-x-3 bottom-3 z-40 rounded-2xl border border-white/15 bg-[#16062f]/95 p-2 shadow-[0_18px_50px_rgba(15,2,37,0.35)] backdrop-blur-xl">
      <div className="flex items-center justify-around gap-1">
        {links.map((link) => {
          const active = screen === link.screen;
          return (
            <button
              key={link.screen}
              onClick={() => onNavigate(link.screen)}
              className={`min-w-0 flex-1 rounded-xl px-2 py-2 text-sm font-semibold transition-all ${
                active ? "text-[#1E1E2D]" : "text-gray-100 hover:bg-white/10"
              }`}
              style={active ? { background: ORANGE } : {}}
            >
              <link.icon size={16} className="mx-auto mb-1" />
              <span className="block truncate">{link.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
    </>
  );
}
