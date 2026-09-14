import { LogOut } from "lucide-react";
import { PURPLE, PURPLE_DARK, DARKEST } from "@/config/theme";
import { Role } from "@/types/declaration";

export function TopBar({
  userName,
  role,
  onSignOut,
}: {
  userName: string;
  role: Role;
  onSignOut: () => void;
}) {
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const headerText = "Travel Request System";

  return (
    <header
      className="relative z-20 flex min-h-16 items-center justify-between gap-2 border-b border-white/10 px-3 sm:gap-3 sm:px-6"
      style={{ background: `linear-gradient(90deg, ${DARKEST} 0%, ${PURPLE_DARK} 50%, ${PURPLE} 100%)` }}
    >
      {/* Left — title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden lg:px-8">
          <span className="hidden sm:block w-2.5 h-2.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_rgba(248,215,74,0.6)] flex-shrink-0" />
          <div className="hidden min-w-0 flex-1 xl:flex xl:justify-center">
            <span className="text-[11px] font-black uppercase tracking-wide text-white whitespace-nowrap sm:text-xs lg:text-sm lg:tracking-widest">
              {headerText}
            </span>
          </div>
          <div className="header-carousel-mask flex min-w-0 flex-1 xl:hidden">
            <div className="header-carousel-track">
              <span className="header-carousel-copy text-[11px] font-black uppercase tracking-wide text-white sm:text-xs lg:text-sm lg:tracking-widest">
                {headerText}
              </span>
              <span aria-hidden className="header-carousel-copy text-[11px] font-black uppercase tracking-wide text-white sm:text-xs lg:text-sm lg:tracking-widest">
                {headerText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — user + sign out */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden sm:block h-6 w-px bg-white/20" />
        <div className="group flex items-center gap-2 rounded-full border border-white/20 bg-white/10 py-1.5 pl-1.5 pr-1.5 shadow-sm transition-colors hover:bg-white/20 md:gap-3 md:pr-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #F8D74A, #e6b800)", color: "#1E1E2D" }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white leading-none">{userName}</p>
            <p className="text-[10px] font-semibold text-accent mt-0.5 uppercase tracking-wider">
              {role === "teamMember" ? "Team Member" : role === "admin" ? "Administrator" : "Approver"}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 shadow-sm hover:shadow-md hover:bg-red-500/20 hover:text-red-300 hover:border-red-300/40 transition-all text-white/70"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
