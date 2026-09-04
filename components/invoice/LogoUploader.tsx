"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { getLogoDataUrl, setLogoDataUrl } from "@/lib/db";
import { cloudSaveLogoUrl } from "@/app/actions/cloud";
import { createBrowserSupabase } from "@/lib/supabase";
import { LOGO_BUCKET } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { LogoPreview } from "@/components/invoice/InvoiceHeader";
import {
  AppHeader,
  Screen,
  ScreenBody,
  StickyActions,
} from "@/components/app/AppShell";

export function LogoUploader() {
  const router = useRouter();
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getLogoDataUrl().then(setUrl);
  }, []);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    try {
      const dataUrl = await readFile(file);
      let stored = dataUrl;
      const sb = createBrowserSupabase();
      if (sb && process.env.NEXT_PUBLIC_SUPABASE_URL) {
        const path = `default/logo-${Date.now()}`;
        const { error } = await sb.storage.from(LOGO_BUCKET).upload(path, file, {
          upsert: true,
          contentType: file.type,
        });
        if (!error) {
          const { data } = sb.storage.from(LOGO_BUCKET).getPublicUrl(path);
          stored = data.publicUrl;
        }
      }
      await setLogoDataUrl(stored);
      await cloudSaveLogoUrl(stored);
      setUrl(stored);
      toast.success(t.saved);
    } catch {
      toast.error(t.error);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      <AppHeader title={t.logoPageTitle} backHref="/" backLabel={t.home} />
      <ScreenBody>
        <p className="text-lg text-muted-foreground">{t.logoPageHelp}</p>
        <LogoPreview url={url} />
        <label className="block">
          <span className="sr-only">{t.uploadLogo}</span>
          <input
            type="file"
            accept="image/*"
            className="block w-full text-base file:mr-4 file:rounded-xl file:border-0 file:bg-primary file:px-5 file:py-3 file:text-base file:font-semibold file:text-primary-foreground"
            disabled={busy}
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </label>
        {url ? (
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={async () => {
              await setLogoDataUrl(null);
              await cloudSaveLogoUrl(null);
              setUrl(null);
              toast.success(t.saved);
            }}
          >
            {t.removeLogo}
          </Button>
        ) : null}
      </ScreenBody>
      <StickyActions>
        <Button type="button" className="w-full" onClick={() => router.push("/")}>
          {t.logoDone}
        </Button>
      </StickyActions>
    </Screen>
  );
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
