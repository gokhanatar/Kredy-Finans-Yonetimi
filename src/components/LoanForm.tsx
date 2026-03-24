import { useState, useMemo } from "react";
import { useTranslation } from 'react-i18next';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Loan, LoanType, BANK_LIST, LOAN_TYPE_LABELS, DEFAULT_INTEREST_RATES } from "@/types/loan";
import { calculateMonthlyPayment } from "@/lib/overdueUtils";
import { formatNumber, parseTurkishNumber } from "@/lib/financeUtils";

interface LoanFormProps {
  loan?: Loan;
  onSubmit: (loan: Omit<Loan, 'id'>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
}

export function LoanForm({ loan, onSubmit, onDelete, onClose }: LoanFormProps) {
  const { t } = useTranslation(['loans', 'common']);
  const [loanType, setLoanType] = useState<LoanType>(loan?.loanType || 'ihtiyac');

  const loanFormSchema = useMemo(() => z.object({
    name: z.string().min(1, t('loans:form.nameRequired')),
    bankName: z.string().min(1, t('loans:form.bankRequired')),
    loanType: z.enum(['konut', 'ihtiyac', 'tasit', 'kobi', 'diger']),
    principalAmount: z.number().min(1000, t('loans:form.minAmount')),
    interestRate: z.number().min(0.01, t('loans:form.interestRequired')).max(10, t('loans:form.maxInterest')),
    termMonths: z.number().min(6, t('loans:form.minTerm')).max(120, t('loans:form.maxTerm')),
    dueDay: z.number().min(1).max(31),
    remainingInstallments: z.number().min(1),
    overdueInterestRate: z.number().min(0.01).max(15),
  }), [t]);

  type LoanFormValues = z.infer<typeof loanFormSchema>;
  
  const form = useForm<LoanFormValues>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      name: loan?.name || '',
      bankName: loan?.bankName || '',
      loanType: loan?.loanType || 'ihtiyac',
      principalAmount: loan?.principalAmount || 100000,
      interestRate: loan?.interestRate || DEFAULT_INTEREST_RATES['ihtiyac'],
      termMonths: loan?.termMonths || 36,
      dueDay: loan?.dueDay || 15,
      remainingInstallments: loan?.remainingInstallments || 36,
      overdueInterestRate: loan?.overdueInterestRate || 4.55,
    },
  });

  const handleLoanTypeChange = (type: LoanType) => {
    setLoanType(type);
    form.setValue('loanType', type);
    form.setValue('interestRate', DEFAULT_INTEREST_RATES[type]);
  };

  const handleSubmit = (values: LoanFormValues) => {
    const monthlyPayment = calculateMonthlyPayment(
      values.principalAmount,
      values.interestRate,
      values.termMonths
    );

    const newLoan: Omit<Loan, 'id'> = {
      name: values.name,
      bankName: values.bankName,
      loanType: values.loanType,
      principalAmount: values.principalAmount,
      interestRate: values.interestRate,
      termMonths: values.termMonths,
      dueDay: values.dueDay,
      remainingInstallments: values.remainingInstallments,
      overdueInterestRate: values.overdueInterestRate,
      monthlyPayment,
      startDate: new Date().toISOString(),
      remainingBalance: values.principalAmount,
      lastPaymentDate: undefined,
      isOverdue: false,
      overdueDays: 0,
      totalOverdueInterest: 0,
      isPaid: false,
    };

    onSubmit(newLoan);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">
            {loan ? t('loans:myLoans.editLoan') : t('loans:myLoans.addNewLoan')}
          </h2>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('loans:form.loanName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('loans:form.loanNamePlaceholder')} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('loans:form.bank')}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('loans:form.bankPlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BANK_LIST.map((bank) => (
                      <SelectItem key={bank} value={bank}>
                        {bank}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="loanType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('loans:form.loanType')}</FormLabel>
                <Select
                  onValueChange={(val) => handleLoanTypeChange(val as LoanType)}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('loans:form.loanTypePlaceholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((type) => (
                      <SelectItem key={type} value={type}>
                        {LOAN_TYPE_LABELS[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="principalAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loans:form.loanAmount')}</FormLabel>
                  <FormControl>
                    <Input
                      type="text"
                      inputMode="decimal"
                      value={field.value ? formatNumber(field.value) : ''}
                      onChange={(e) => field.onChange(parseTurkishNumber(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loans:form.monthlyInterest')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="termMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loans:form.term')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={6}
                      max={120}
                      {...field}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        field.onChange(val);
                        form.setValue('remainingInstallments', val);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="dueDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('loans:form.paymentDay')}</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="overdueInterestRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('loans:form.overdueInterest')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Hesaplanan Taksit Gösterimi */}
          {form.watch('principalAmount') > 0 && form.watch('interestRate') > 0 && (
            <div className="rounded-lg bg-primary/10 p-4">
              <p className="text-sm text-muted-foreground">{t('loans:form.calculatedMonthly')}</p>
              <p className="text-2xl font-bold text-primary">
                {formatNumber(calculateMonthlyPayment(
                  form.watch('principalAmount'),
                  form.watch('interestRate'),
                  form.watch('termMonths')
                ))} ₺
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {loan && onDelete && (
              <Button
                type="button"
                variant="destructive"
                className="flex-1"
                onClick={() => onDelete(loan.id)}
              >
                {t('common:actions.delete')}
              </Button>
            )}
            <Button type="submit" className="flex-1">
              {loan ? t('common:actions.update') : t('loans:myLoans.addLoan')}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
