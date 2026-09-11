import React, { FC, ReactElement, ReactNode } from "react";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "./ui/select";
import { inp } from "@/config/theme";

export interface SelProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
}

type OptionProps = {
  value?: string;
  children?: ReactNode;
};

// Radix Select.Item requires a non-empty value, so the conventional empty
// ("") placeholder option is mapped to a sentinel that translates back to ""
// on change. This keeps optional selects clearable.
const CLEAR_VALUE = "__none";

export const Sel: FC<SelProps> = ({
  value,
  onChange,
  className = "",
  children,
  placeholder,
  disabled,
}) => {
  const options = extractOptions(children);

  const placeholderText =
    placeholder ??
    options.find((o) => o.value === "")?.label ??
    "Select...";

  const items = options.map((o, i) => ({
    key: `${o.value || "none"}-${i}`,
    value: o.value === "" ? CLEAR_VALUE : o.value,
    label: o.label,
  }));

  return (
    <Select
      value={value === "" ? CLEAR_VALUE : value}
      onValueChange={(v) => onChange(v === CLEAR_VALUE ? "" : v)}
      disabled={disabled}
    >
      <SelectTrigger className={`${inp} data-[size=default]:h-11 data-[size=sm]:h-10 ${className}`}>
        <SelectValue placeholder={placeholderText} />
      </SelectTrigger>

      <SelectContent>
        {items.map((opt) => (
          <SelectItem key={opt.key} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

function extractOptions(
  children: ReactNode
): { value: string; label: string }[] {
  const opts: { value: string; label: string }[] = [];

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) return;

    const element = child as ReactElement<OptionProps>;

    const value =
      element.props.value !== undefined
        ? String(element.props.value)
        : extractText(element.props.children);

    const label = extractText(element.props.children);

    opts.push({
      value,
      label,
    });
  });

  return opts;
}

function extractText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(extractText).join("");
  }

  if (React.isValidElement(node)) {
    const element = node as ReactElement<{
      children?: ReactNode;
    }>;

    return extractText(element.props.children);
  }

  return "";
}
