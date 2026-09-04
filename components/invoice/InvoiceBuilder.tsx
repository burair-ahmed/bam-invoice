"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { invoiceFormSchema, type InvoiceFormValues } from "@/lib/schema";
import { formToStatement, statementToForm } from "@/lib/form-map";
import { computeTotals, deriveRows, formatMoney } from "@/lib/calculations";
import { emptyLineItem } from "@/lib/invoice-factory";
import { uid } from "@/lib/utils";
import {
  getLogoDataUrl,
  getInvoice,
  listSuggestions,
  saveInvoice,
} from "@/lib/db";
import { cloudSaveInvoice } from "@/app/actions/cloud";
import { useInvoiceStore } from "@/store/invoiceStore";
import { AUTOSAVE_MS, TOTALS_DEBOUNCE_MS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InvoiceRowForm } from "@/components/invoice/InvoiceRowForm";
import { SuggestionChips } from "@/components/invoice/SuggestionChips";
import { LogoPreview } from "@/components/invoice/InvoiceHeader";
import {
  AppHeader,
  Screen,
  ScreenBody,
  StickyActions,
} from "@/components/app/AppShell";

export function InvoiceBuilder({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const idRef = useRef(invoiceId);
  const logoRef = useRef<string | null>(null);
  const generatedAtRef = useRef(new Date().toISOString());
  const markSaved = useInvoiceStore((s) => s.markSaved);
  const hydrate = useInvoiceStore((s) => s.hydrate);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: statementToForm(useInvoiceStore.getState().statement),
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "items",
    keyName: "fieldId",
  });

  const watched = useWatch({ control: form.control });
  const totals = useDebouncedTotals(watched);

  const [transporters, setTransporters] = useState<string[]>([]);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [receivers, setReceivers] = useState<string[]>([]);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [logo, tr, ve, ci, re] = await Promise.all([
        getLogoDataUrl(),
        listSuggestions("transporter"),
        listSuggestions("vehicle"),
        listSuggestions("city"),
        listSuggestions("receiver"),
      ]);
      if (cancelled) return;
      logoRef.current = logo;
      setLogoUrl(logo);
      setTransporters(tr);
      setVehicles(ve);
      setCities(ci);
      setReceivers(re);

      if (invoiceId) {
        const existing = await getInvoice(invoiceId);
        if (existing && !cancelled) {
          idRef.current = existing.id;
          generatedAtRef.current = existing.generatedAt;
          logoRef.current = existing.logoUrl ?? logo;
          setLogoUrl(existing.logoUrl ?? logo);
          form.reset(statementToForm(existing));
          hydrate(existing);
        }
      } else {
        const store = useInvoiceStore.getState();
        store.resetNew(logo);
        idRef.current = store.statement.id;
        generatedAtRef.current = store.statement.generatedAt;
        form.reset(statementToForm(store.statement));
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceId]);

  useEffect(() => {
    const tmr = window.setTimeout(async () => {
      const values = form.getValues();
      if (!values.transporterName && !values.items?.[0]?.invoiceNo) return;
      const statement = formToStatement(values, {
        id: idRef.current || crypto.randomUUID(),
        logoUrl: logoRef.current,
        generatedAt: generatedAtRef.current,
      });
      idRef.current = statement.id;
      await saveInvoice(statement, { isDraft: true });
      cloudSaveInvoice(statement, true).catch(() => {});
      markSaved();
    }, AUTOSAVE_MS);
    return () => window.clearTimeout(tmr);
  }, [watched, form, markSaved]);

  async function persist(isDraft: boolean) {
    const ok = await form.trigger();
    if (!ok) {
      const err = form.formState.errors;
      toast.error(
        err.transporterName?.message ||
          err.items?.message ||
          err.items?.root?.message ||
          t.needInvoiceNo,
      );
      return null;
    }
    const statement = formToStatement(form.getValues(), {
      id: idRef.current || uid(),
      logoUrl: logoRef.current,
      generatedAt: generatedAtRef.current,
    });
    idRef.current = statement.id;
    const saved = await saveInvoice(statement, { isDraft });
    await cloudSaveInvoice(saved, isDraft);
    hydrate(saved);
    markSaved();
    return saved;
  }

  return (
    <Screen>
      <AppHeader
        title={invoiceId ? t.editTitle : t.builderTitle}
        backHref="/"
        backLabel={t.home}
      />
      <FormProvider {...form}>
        <form
          onSubmit={form.handleSubmit(async () => {
            const saved = await persist(false);
            if (!saved) return;
            toast.success(t.saved);
            router.push(`/invoice/${saved.id}`);
          })}
        >
          <ScreenBody>
            <Card>
              <CardHeader>
                <CardTitle>{t.stepHeader}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <LogoPreview url={logoUrl} />
                  <Button asChild variant="outline" type="button">
                    <Link href="/logo">{t.changeLogo}</Link>
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="transporter">{t.transporterName}</Label>
                  <Input
                    id="transporter"
                    autoComplete="off"
                    {...form.register("transporterName")}
                  />
                  <p className="text-sm text-muted-foreground">
                    {t.transporterHint}
                  </p>
                  <SuggestionChips
                    values={transporters}
                    onPick={(v) =>
                      form.setValue("transporterName", v, { shouldDirty: true })
                    }
                  />
                  {form.formState.errors.transporterName ? (
                    <p className="text-base font-medium text-destructive">
                      {form.formState.errors.transporterName.message}
                    </p>
                  ) : null}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="from">{t.periodFrom}</Label>
                    <Input
                      id="from"
                      type="date"
                      {...form.register("periodFrom")}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="to">{t.periodTo}</Label>
                    <Input id="to" type="date" {...form.register("periodTo")} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-bold">{t.stepTrips}</h2>
              <Button
                type="button"
                variant="secondary"
                onClick={() => append(emptyLineItem(fields.length + 1))}
              >
                {t.addTrip}
              </Button>
            </div>

            {fields.map((field, index) => (
              <InvoiceRowForm
                key={field.fieldId}
                index={index}
                canRemove={fields.length > 1}
                onRemove={() => remove(index)}
                vehicles={vehicles}
                cities={cities}
                receivers={receivers}
              />
            ))}

            <Card>
              <CardContent className="space-y-2 py-5 text-lg font-bold">
                <div>
                  {t.grandTotal}: {formatMoney(totals.totalFare)}
                </div>
                <div>
                  {t.totalRecFrom}: {formatMoney(totals.totalRecFrom)}
                </div>
                <div>
                  {t.netSettlement}:{" "}
                  {totals.netSettlement >= 0
                    ? `${t.netReceive} ${formatMoney(totals.netSettlement)}`
                    : `${t.netPay} ${formatMoney(-totals.netSettlement)}`}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t.stepNotes}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="notes">{t.notesLabel}</Label>
                  <Textarea id="notes" {...form.register("notes")} />
                  <p className="text-sm text-muted-foreground">{t.notesHint}</p>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="sign">{t.signatureLabel}</Label>
                  <Input id="sign" {...form.register("signatureLabel")} />
                  <p className="text-sm text-muted-foreground">
                    {t.signatureHint}
                  </p>
                </div>
              </CardContent>
            </Card>
          </ScreenBody>
          <StickyActions>
            <Button type="submit" className="w-full" size="lg">
              {t.saveAndView}
            </Button>
          </StickyActions>
        </form>
      </FormProvider>
    </Screen>
  );
}

function useDebouncedTotals(
  watched:
    | Partial<{
        items?: Array<Partial<InvoiceFormValues["items"][number]>>;
      }>
    | undefined,
) {
  const [totals, setTotals] = useState(() => computeTotals([]));
  useEffect(() => {
    const tmr = window.setTimeout(() => {
      const items = deriveRows(
        (watched?.items ?? []).map((it, i) => ({
          id: it?.id || String(i),
          sr: i + 1,
          invoiceNo: it?.invoiceNo || "",
          date: it?.date || "",
          fare: Number(it?.fare) || 0,
          advance: Number(it?.advance) || 0,
          detention: Number(it?.detention) || 0,
          iTax: Number(it?.iTax) || 0,
          unload: Number(it?.unload) || 0,
          exWeight: Number(it?.exWeight) || 0,
          other: Number(it?.other) || 0,
          vehicleNo: it?.vehicleNo || "",
          city: it?.city || "",
          weight: it?.weight || "",
          receiver: it?.receiver || "",
        })),
      );
      setTotals(computeTotals(items));
    }, TOTALS_DEBOUNCE_MS);
    return () => window.clearTimeout(tmr);
  }, [watched]);
  return totals;
}
