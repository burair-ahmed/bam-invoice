"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function AppHeader({
  title,
  backHref,
  backLabel,
  action,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  action?: ReactNode;
}) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-background/95 px-4 py-3 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl items-center gap-3">
        {backHref ? (
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={backHref}>{backLabel ?? t.back}</Link>
          </Button>
        ) : null}
        <h1 className={cn("min-w-0 flex-1 text-xl font-bold leading-tight")}>
          {title}
        </h1>
        {action}
      </div>
    </header>
  );
}

export function Screen({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-h-full flex-1 flex-col bg-background", className)}>
      {children}
    </div>
  );
}

export function ScreenBody({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "mx-auto flex w-full max-w-6xl flex-1 flex-col gap-5 px-4 py-5 pb-28",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function StickyActions({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-30 border-t-2 border-border bg-background px-4 py-3 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row">
        {children}
      </div>
    </div>
  );
}
