import { type ReactNode } from "react";

interface TheadProps {
  children: ReactNode;
  className?: string;
}

export function Thead({ children, className = "" }: TheadProps) {
  return (
    <thead>
      <tr className={`border-b border-border bg-table-header-bg ${className}`}>{children}</tr>
    </thead>
  );
}
