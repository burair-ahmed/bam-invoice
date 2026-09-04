"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { formatMoney } from "@/lib/calculations";
import { fuzzyMatch } from "@/lib/utils";
import {
  deleteInvoice,
  duplicateInvoice,
  listInvoices,
  type StoredInvoice,
} from "@/lib/db";
import { cloudDeleteInvoice, cloudListInvoices } from "@/app/actions/cloud";
import { logout } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  AppHeader,
  Screen,
  ScreenBody,
} from "@/components/app/AppShell";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { saveInvoice } from "@/lib/db";

export function InvoiceList() {
  const router = useRouter();
  const [rows, setRows] = useState<StoredInvoice[]>([]);
  const [q, setQ] = useState("");
  const [ready, setReady] = useState(false);

  async function reload() {
    const list = await listInvoices();
    setRows(list);
    setReady(true);

    try {
      const cloudItems = await cloudListInvoices();
      if (cloudItems.length > 0) {
        for (const item of cloudItems) {
          await saveInvoice(item.payload, { isDraft: item.isDraft });
        }
        const updatedList = await listInvoices();
        setRows(updatedList);
      }
    } catch {
      // cloud fetch optional fallback
    }
  }

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) =>
      fuzzyMatch(
        `${r.searchText} ${r.transporterName} ${r.periodFrom} ${r.periodTo}`,
        q,
      ),
    );
  }, [rows, q]);

  return (
    <Screen>
      <AppHeader
        title={t.listTitle}
        action={
          <form action={logout}>
            <Button type="submit" variant="ghost" size="sm">
              {t.lock}
            </Button>
          </form>
        }
      />
      <ScreenBody className="pb-8">
        <Button asChild size="lg" className="w-full">
          <Link href="/invoice/new">{t.makeInvoice}</Link>
        </Button>
        <Button asChild variant="outline" className="w-full">
          <Link href="/logo">{t.changeLogo}</Link>
        </Button>
        <div className="flex flex-col gap-2">
          <label htmlFor="search" className="text-base font-semibold">
            {t.searchLabel}
          </label>
          <Input
            id="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t.searchPlaceholder}
          />
        </div>
        {!ready ? (
          <p className="text-base text-muted-foreground">{t.loading}</p>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-lg font-semibold">{t.listEmpty}</p>
              <p className="mt-2 text-base text-muted-foreground">
                {t.listEmptyHint}
              </p>
            </CardContent>
          </Card>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((row) => (
              <li key={row.id}>
                <Card>
                  <CardContent className="space-y-3 py-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-lg font-bold">
                          {row.transporterName || t.dash}
                        </p>
                        <p className="text-base text-muted-foreground">
                          {t.periodLabel}: {formatDate(row.periodFrom)} –{" "}
                          {formatDate(row.periodTo)}
                        </p>
                        <p className="text-base">
                          {t.tripsCount(row.payload.items.length)} ·{" "}
                          {formatMoney(row.payload.totalFare)}
                        </p>
                      </div>
                      {row.isDraft ? (
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-900">
                          {t.draftBadge}
                        </span>
                      ) : null}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button asChild className="w-full">
                        <Link href={`/invoice/${row.id}`}>{t.openInvoice}</Link>
                      </Button>
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/invoice/${row.id}/edit`}>
                          {t.editInvoice}
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="w-full"
                        onClick={async () => {
                          const copy = await duplicateInvoice(row.id);
                          if (copy) {
                            toast.success(t.copied);
                            router.push(`/invoice/${copy.id}/edit`);
                          }
                        }}
                      >
                        {t.copyInvoice}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type="button"
                            variant="destructive"
                            className="w-full"
                          >
                            {t.deleteInvoice}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t.deleteTitle}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t.deleteBody}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={async () => {
                                await deleteInvoice(row.id);
                                await cloudDeleteInvoice(row.id);
                                toast.success(t.deleted);
                                reload();
                              }}
                            >
                              {t.confirm}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </ScreenBody>
    </Screen>
  );
}
