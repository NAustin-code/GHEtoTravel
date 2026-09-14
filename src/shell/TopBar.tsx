import { LogOut } from "lucide-react";
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
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const headerText = "Travel Request System";

  return (
    <header
      className="relative z-20 flex min-h-[69px] items-center justify-between gap-2 border-b border-[#E4E7ED] bg-white px-3 sm:gap-3 sm:px-6"
    >
      {/* Left — title */}
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center justify-center gap-2 overflow-hidden lg:px-8">
          <span className="hidden sm:block h-2 w-2 flex-shrink-0 rounded-full bg-[#F2BD00]" />
          <div className="hidden min-w-0 flex-1 xl:flex xl:justify-start">
            <span className="text-[13px] font-extrabold uppercase tracking-wide text-[#35138D] whitespace-nowrap sm:text-sm">
              {headerText}
            </span>
          </div>
          <div className="header-carousel-mask flex min-w-0 flex-1 xl:hidden">
            <div className="header-carousel-track">
              <span className="header-carousel-copy text-[11px] font-black uppercase tracking-wide text-[#35138D] sm:text-xs lg:text-sm lg:tracking-widest">
                {headerText}
              </span>
              <span aria-hidden className="header-carousel-copy text-[11px] font-black uppercase tracking-wide text-[#35138D] sm:text-xs lg:text-sm lg:tracking-widest">
                {headerText}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right — user + sign out */}
      <div className="flex flex-shrink-0 items-center gap-2 sm:gap-4">
        <div className="hidden sm:block h-6 w-px bg-[#E4E7ED]" />
        <div className="group flex items-center gap-2 rounded-md border border-[#E4E7ED] bg-white py-1.5 pl-1.5 pr-1.5 shadow-sm transition-colors hover:border-[#35138D]/40 md:gap-3 md:pr-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md group-hover:scale-105 transition-transform"
            style={{ background: "linear-gradient(135deg, #F2BD00, #e6b800)", color: "#1E1E2D" }}
          >
            {initials}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-[#101426] leading-none">{userName}</p>
            <p className="text-[10px] font-semibold text-[#35138D] mt-0.5 uppercase tracking-wider">
              {role === "teamMember" ? "Team Member" : role === "admin" ? "Administrator" : "Approver"}
            </p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="w-9 h-9 flex items-center justify-center rounded-md bg-white border border-[#E4E7ED] shadow-sm hover:shadow-md hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all text-[#5D6371]"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}
