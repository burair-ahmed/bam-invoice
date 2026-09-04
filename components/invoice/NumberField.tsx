"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function NumberField({
  id,
  label,
  value,
  onChange,
  className,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (n: number) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value === 0 ? "" : String(value)}
        placeholder="0"
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, "");
          if (raw === "" || raw === ".") {
            onChange(0);
            return;
          }
          const n = Number(raw);
          onChange(Number.isFinite(n) ? n : 0);
        }}
      />
    </div>
  );
}
