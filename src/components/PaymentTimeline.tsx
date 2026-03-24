import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  cumulativeInterest: number;
  cumulativePayment: number;
}

interface PaymentTimelineProps {
  schedule: AmortizationRow[];
  paidInstallments?: number;
}

export function PaymentTimeline({ schedule, paidInstallments = 0 }: PaymentTimelineProps) {
  const { t } = useTranslation(['loans', 'common']);
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedRows = isExpanded ? schedule : schedule.slice(0, 6);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{t('loans:paymentTimeline.title')}</span>
          <Badge variant="outline">{t('loans:paymentTimeline.installmentCount', { count: schedule.length })}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">{t('loans:paymentTimeline.monthHeader')}</TableHead>
                <TableHead className="text-right">{t('loans:paymentTimeline.installmentHeader')}</TableHead>
                <TableHead className="text-right">{t('loans:paymentTimeline.principalHeader')}</TableHead>
                <TableHead className="text-right">{t('loans:paymentTimeline.interestHeader')}</TableHead>
                <TableHead className="text-right">{t('loans:paymentTimeline.remainingHeader')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedRows.map((row) => (
                <TableRow 
                  key={row.month}
                  className={row.month <= paidInstallments ? 'bg-green-500/10' : ''}
                >
                  <TableCell className="font-medium">
                    {row.month <= paidInstallments ? (
                      <span className="flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-green-500" />
                        {row.month}
                      </span>
                    ) : (
                      row.month
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {row.payment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.principal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {row.interest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                  </TableCell>
                  <TableCell className="text-right">
                    {row.balance.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {schedule.length > 6 && (
          <Button
            variant="ghost"
            className="mt-2 w-full gap-2"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                {t('loans:paymentTimeline.showLess')}
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                {t('loans:paymentTimeline.showAll', { count: schedule.length - 6 })}
              </>
            )}
          </Button>
        )}

        {/* Summary */}
        <div className="mt-4 grid grid-cols-2 gap-4 rounded-lg bg-muted/50 p-3">
          <div>
            <p className="text-xs text-muted-foreground">{t('loans:paymentTimeline.totalPayment')}</p>
            <p className="font-bold">
              {schedule[schedule.length - 1]?.cumulativePayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{t('loans:paymentTimeline.totalInterest')}</p>
            <p className="font-bold text-destructive">
              {schedule[schedule.length - 1]?.cumulativeInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
