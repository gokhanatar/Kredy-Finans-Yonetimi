import { cn } from "@/lib/utils";
import { useCardInstallments } from "@/hooks/useCardInstallments";
import { CreditCard, Calendar } from "lucide-react";

interface InstallmentsContentProps {
  cards: any[];
}

export function InstallmentsContent({ cards }: InstallmentsContentProps) {
  const { installments, isLoading } = useCardInstallments(cards);

  if (isLoading) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Yükleniyor...
      </div>
    );
  }

  if (!installments || installments.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Aktif taksit planı yok.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {installments.map((inst: any) => {
        const paid = inst.paidCount ?? 0;
        const total = inst.totalCount ?? inst.installmentCount ?? 0;
        const remaining = total - paid;
        const progress = total > 0 ? (paid / total) * 100 : 0;

        return (
          <div
            key={inst.id}
            className="rounded-xl border bg-card p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <CreditCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{inst.description ?? inst.name ?? "Taksit"}</p>
                  <p className="text-xs text-muted-foreground">{inst.cardName ?? ""}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold">
                  {(inst.installmentAmount ?? 0).toLocaleString("tr-TR", {
                    style: "currency",
                    currency: "TRY",
                  })}
                  <span className="text-xs text-muted-foreground">/ay</span>
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {paid}/{total} taksit ödendi
                </span>
                <span>{remaining} kaldı</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Toplam tutar</span>
              <span className="font-medium">
                {(inst.totalAmount ?? 0).toLocaleString("tr-TR", {
                  style: "currency",
                  currency: "TRY",
                })}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export { CardStatementDrawer } from './CardStatementDrawer';
