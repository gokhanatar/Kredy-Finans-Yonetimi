import { Building2, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loan, LOAN_TYPE_LABELS } from "@/types/loan";
import { BANK_OPTIONS } from "@/types/finance";
import { getSeverityColor } from "@/lib/overdueUtils";

interface LoanCardProps {
  loan: Loan;
  onClick?: () => void;
}

export function LoanCard({ loan, onClick }: LoanCardProps) {
  const bank = BANK_OPTIONS.find(b => b.name === loan.bankName);
  const progress = ((loan.termMonths - loan.remainingInstallments) / loan.termMonths) * 100;
  
  const severity = loan.isOverdue
    ? loan.overdueDays > 30
      ? 'critical'
      : loan.overdueDays > 7
        ? 'danger'
        : 'warning'
    : 'none';

  return (
    <Card
      className={`cursor-pointer overflow-hidden transition-all hover:shadow-lg ${
        loan.isOverdue ? 'border-destructive/50' : ''
      }`}
      onClick={onClick}
    >
      <div className={`h-2 bg-gradient-to-r ${bank?.color || 'from-gray-500 to-gray-700'}`} />
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${bank?.color || 'from-gray-500 to-gray-700'}`}>
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold">{loan.name}</h3>
              <p className="text-sm text-muted-foreground">{loan.bankName}</p>
            </div>
          </div>
          
          <Badge variant={loan.isOverdue ? "destructive" : "secondary"}>
            {LOAN_TYPE_LABELS[loan.loanType]}
          </Badge>
        </div>

        {/* Gecikme Uyarısı */}
        {loan.isOverdue && (
          <div className={`mt-3 rounded-lg p-2 ${getSeverityColor(severity)}`}>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm font-medium">
                {loan.overdueDays} gündür gecikmiş
              </span>
              <span className="ml-auto text-sm font-bold">
                +{loan.totalOverdueInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
              </span>
            </div>
          </div>
        )}

        {/* Taksit ve Tutar Bilgileri */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Aylık Taksit</p>
            <p className="text-lg font-bold">
              {loan.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Kalan Anapara</p>
            <p className="text-lg font-bold">
              {loan.remainingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 0 })} ₺
            </p>
          </div>
        </div>

        {/* İlerleme */}
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {loan.termMonths - loan.remainingInstallments} / {loan.termMonths} taksit
            </span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Ödeme Günü */}
        <div className="mt-3 flex items-center justify-between text-sm">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            Ödeme günü: Her ayın {loan.dueDay}'i
          </span>
          <span className="text-muted-foreground">%{loan.interestRate} faiz</span>
        </div>
      </CardContent>
    </Card>
  );
}
