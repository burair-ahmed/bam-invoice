"use client";

import { useFormContext, Controller } from "react-hook-form";
import type { InvoiceFormValues } from "@/lib/schema";
import { t } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NumberField } from "@/components/invoice/NumberField";
import { SuggestionChips } from "@/components/invoice/SuggestionChips";
import { formatMoney, computeRowTotal } from "@/lib/calculations";
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

export function InvoiceRowForm({
  index,
  onRemove,
  canRemove,
  vehicles,
  cities,
  receivers,
}: {
  index: number;
  onRemove: () => void;
  canRemove: boolean;
  vehicles: string[];
  cities: string[];
  receivers: string[];
}) {
  const { register, control, watch, setValue } =
    useFormContext<InvoiceFormValues>();
  const item = watch(`items.${index}`);
  const total = computeRowTotal(item ?? {
    fare: 0,
    advance: 0,
    detention: 0,
    iTax: 0,
    unload: 0,
    exWeight: 0,
    other: 0,
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{t.tripN(index + 1)}</CardTitle>
        {canRemove ? (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" size="sm">
                {t.removeTrip}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t.removeTripTitle}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t.removeTripBody}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                <AlertDialogAction onClick={onRemove}>
                  {t.confirm}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`inv-${index}`}>{t.invoiceNo}</Label>
            <Input id={`inv-${index}`} {...register(`items.${index}.invoiceNo`)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`date-${index}`}>{t.date}</Label>
            <Input
              id={`date-${index}`}
              type="date"
              {...register(`items.${index}.date`)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["fare", t.fare],
              ["advance", t.advance],
              ["detention", t.detention],
              ["iTax", t.iTax],
              ["unload", t.unload],
              ["exWeight", t.exWeight],
              ["other", t.other],
            ] as const
          ).map(([key, label]) => (
            <Controller
              key={key}
              control={control}
              name={`items.${index}.${key}`}
              render={({ field }) => (
                <NumberField
                  id={`${key}-${index}`}
                  label={label}
                  value={Number(field.value) || 0}
                  onChange={field.onChange}
                />
              )}
            />
          ))}
        </div>

        <div className="rounded-xl bg-muted px-4 py-3 text-lg font-bold">
          {t.liveTotal}: {formatMoney(total)}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor={`veh-${index}`}>{t.vehicleNo}</Label>
            <Input
              id={`veh-${index}`}
              placeholder={t.vehicleHint}
              {...register(`items.${index}.vehicleNo`)}
            />
            <SuggestionChips
              values={vehicles}
              onPick={(v) => setValue(`items.${index}.vehicleNo`, v, { shouldDirty: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`city-${index}`}>{t.city}</Label>
            <Input id={`city-${index}`} {...register(`items.${index}.city`)} />
            <SuggestionChips
              values={cities}
              onPick={(v) => setValue(`items.${index}.city`, v, { shouldDirty: true })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`wt-${index}`}>{t.weight}</Label>
            <Input
              id={`wt-${index}`}
              placeholder={t.weightHint}
              {...register(`items.${index}.weight`)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor={`rec-${index}`}>{t.receiver}</Label>
            <Input
              id={`rec-${index}`}
              placeholder={t.receiverHint}
              {...register(`items.${index}.receiver`)}
            />
            <SuggestionChips
              values={receivers}
              onPick={(v) =>
                setValue(`items.${index}.receiver`, v, { shouldDirty: true })
              }
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
