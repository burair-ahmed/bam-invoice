import { Suspense } from "react";
import { PinPad } from "@/components/auth/PinPad";
import { t } from "@/lib/i18n";

export default function LoginPage() {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <Suspense fallback={<p className="p-8 text-lg">{t.loading}</p>}>
        <PinPad />
      </Suspense>
    </div>
  );
}
