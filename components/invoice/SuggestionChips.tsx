"use client";

import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

export function SuggestionChips({
  values,
  onPick,
}: {
  values: string[];
  onPick: (value: string) => void;
}) {
  if (!values.length) return null;
  const shown = values.slice(0, 8);
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted-foreground">{t.suggestions}</p>
      <div className="flex flex-wrap gap-2">
        {shown.map((v) => (
          <Button
            key={v}
            type="button"
            variant="secondary"
            size="sm"
            className="h-11 rounded-full"
            onClick={() => onPick(v)}
          >
            {v}
          </Button>
        ))}
      </div>
    </div>
  );
}
