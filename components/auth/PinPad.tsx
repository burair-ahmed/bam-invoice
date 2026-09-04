"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loginWithPin } from "@/app/actions/auth";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME_DISPLAY } from "@/lib/constants";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "del"];

export function PinPad() {
  const router = useRouter();
  const search = useSearchParams();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function tap(key: string) {
    setError("");
    if (key === "clear") {
      setPin("");
      return;
    }
    if (key === "del") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    setPin((p) => (p.length >= 6 ? p : p + key));
  }

  async function open() {
    setBusy(true);
    const res = await loginWithPin(pin);
    setBusy(false);
    if (!res.ok) {
      setError(t.loginWrong);
      setPin("");
      return;
    }
    router.push(search.get("next") || "/");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-6 px-4 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-black uppercase tracking-wide">
          {COMPANY_NAME_DISPLAY}
        </h1>
        <p className="mt-4 text-xl font-bold">{t.loginTitle}</p>
        <p className="mt-2 text-base text-muted-foreground">{t.loginHelp}</p>
      </div>
      <div className="flex justify-center gap-3" aria-hidden>
        {Array.from({ length: Math.max(4, pin.length) || 4 }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full border-2 border-foreground bg-foreground"
            style={{ opacity: i < pin.length ? 1 : 0.2 }}
          />
        ))}
      </div>
      {error ? (
        <p className="text-center text-base font-semibold text-destructive">
          {error}
        </p>
      ) : null}
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <Button
            key={key}
            type="button"
            variant={key === "clear" || key === "del" ? "outline" : "secondary"}
            className="h-16 text-2xl"
            onClick={() =>
              tap(key === "clear" ? "clear" : key === "del" ? "del" : key)
            }
          >
            {key === "clear" ? t.loginClear : key === "del" ? "←" : key}
          </Button>
        ))}
      </div>
      <Button
        type="button"
        size="lg"
        className="w-full"
        disabled={pin.length < 4 || busy}
        onClick={open}
      >
        {busy ? t.loading : t.loginOpen}
      </Button>
    </div>
  );
}
