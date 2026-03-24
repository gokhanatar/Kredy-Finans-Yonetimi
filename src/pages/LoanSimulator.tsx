import { useState, useMemo } from "react";
import { ArrowLeft, Calculator, Plus, TrendingUp, AlertTriangle, Clock, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoanCard } from "@/components/LoanCard";
import { LoanForm } from "@/components/LoanForm";
import { PaymentTimeline } from "@/components/PaymentTimeline";
import { OverdueAlert } from "@/components/OverdueAlert";
import { useLoans } from "@/hooks/useLoans";
import { useOverdueTracking } from "@/hooks/useOverdueTracking";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { CreditCard } from "@/types/finance";
import {
  Loan, 
  LoanType, 
  LOAN_TYPE_LABELS, 
  DEFAULT_INTEREST_RATES,
  LOAN_CONSTANTS 
} from "@/types/loan";
import { 
  generateAmortizationSchedule, 
  calculateDailyOverdueInterest,
  calculateEffectiveRate 
} from "@/lib/overdueUtils";
import { toast } from "@/hooks/use-toast";

const LoanSimulator = () => {
  const { t } = useTranslation(['loans', 'common']);
  const navigate = useNavigate();
  const { loans, addLoan, updateLoan, deleteLoan, markAsPaid } = useLoans();
  const [cards] = useLocalStorage<CreditCard[]>("kredi-pusula-cards", [] as CreditCard[]);
  
  // Gecikme takibi
  const overdueTracking = useOverdueTracking({
    cards,
    loans,
    onMarkLoanPaid: markAsPaid,
  });

  // Simülatör state
  const [loanType, setLoanType] = useState<LoanType>('ihtiyac');
  const [principal, setPrincipal] = useState(100000);
  const [interestRate, setInterestRate] = useState(DEFAULT_INTEREST_RATES['ihtiyac']);
  const [termMonths, setTermMonths] = useState(36);
  const [overdueDays, setOverdueDays] = useState(0);

  // Modal state
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | undefined>();
  const [showSchedule, setShowSchedule] = useState(false);

  // Hesaplama sonuçları
  const calculation = useMemo(() => {
    const effectiveRate = calculateEffectiveRate(interestRate);
    const result = generateAmortizationSchedule(principal, effectiveRate, termMonths);
    
    // Gecikme faizi simülasyonu
    const overdueCalc = overdueDays > 0
      ? calculateDailyOverdueInterest(result.monthlyPayment, interestRate * 1.3, overdueDays)
      : null;

    return {
      ...result,
      effectiveRate,
      overdueInterest: overdueCalc?.totalInterest || 0,
      totalWithOverdue: result.monthlyPayment + (overdueCalc?.totalInterest || 0),
    };
  }, [principal, interestRate, termMonths, overdueDays]);

  const handleLoanTypeChange = (type: LoanType) => {
    setLoanType(type);
    setInterestRate(DEFAULT_INTEREST_RATES[type]);
  };

  const handleAddLoan = (loan: Omit<Loan, 'id'>) => {
    addLoan(loan);
    setShowLoanForm(false);
    setEditingLoan(undefined);
    toast({
      title: t('myLoans.added'),
      description: t('myLoans.addedDesc', { name: loan.name }),
    });
  };

  const handleDeleteLoan = (id: string) => {
    deleteLoan(id);
    setShowLoanForm(false);
    setEditingLoan(undefined);
    toast({
      title: t('myLoans.deleted'),
      description: t('myLoans.deletedDesc'),
      variant: "destructive",
    });
  };

  const openEditForm = (loan: Loan) => {
    setEditingLoan(loan);
    setShowLoanForm(true);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('title')}</h1>
        </div>
      </div>

      <main className="p-4 pb-20 space-y-4">
        {/* Gecikme Uyarısı */}
        {overdueTracking.allOverdueItems.length > 0 && (
          <OverdueAlert
            overdueItems={overdueTracking.allOverdueItems}
            totalInterest={overdueTracking.totalOverdueInterest}
            todaysInterest={overdueTracking.todaysTotalInterest}
          />
        )}

        <Tabs defaultValue="simulator" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simulator">{t('tabs.calculate')}</TabsTrigger>
            <TabsTrigger value="loans">
              {t('tabs.myLoans')}
              {loans.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {loans.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Simülatör Tab */}
          <TabsContent value="simulator" className="space-y-4">
            {/* How It Works */}
            <Accordion type="single" collapsible>
              <AccordionItem value="info" className="border rounded-xl px-4">
                <AccordionTrigger className="text-sm font-medium py-3 hover:no-underline">
                  <span className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-primary" />
                    {t('loanSimInfo.howItWorks')}
                  </span>
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground space-y-3 pb-4">
                  <p>{t('loanSimInfo.description')}</p>
                  <div className="space-y-2">
                    <p className="font-medium text-card-foreground">{t('loanSimInfo.formulaTitle')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('loanSimInfo.formula1')}</li>
                      <li>{t('loanSimInfo.formula2')}</li>
                      <li>{t('loanSimInfo.formula3')}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-card-foreground">{t('loanSimInfo.ratesTitle')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('loanSimInfo.rate1')}</li>
                      <li>{t('loanSimInfo.rate2')}</li>
                      <li>{t('loanSimInfo.rate3')}</li>
                      <li>{t('loanSimInfo.rate4')}</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-card-foreground">{t('loanSimInfo.overdueTitle')}</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>{t('loanSimInfo.overdue1')}</li>
                      <li>{t('loanSimInfo.overdue2')}</li>
                    </ul>
                  </div>
                  <p className="text-xs italic">{t('loanSimInfo.disclaimer')}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calculator className="h-5 w-5 text-primary" />
                  {t('calculation.title')}
                </CardTitle>
                <CardDescription>
                  {t('calculation.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Kredi Türü */}
                <div className="space-y-2">
                  <Label>{t('calculation.loanType')}</Label>
                  <Select 
                    value={loanType} 
                    onValueChange={(v) => handleLoanTypeChange(v as LoanType)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(LOAN_TYPE_LABELS) as LoanType[]).map((type) => (
                        <SelectItem key={type} value={type}>
                          {LOAN_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Kredi Tutarı */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t('calculation.principal')}</Label>
                    <span className="text-lg font-bold text-primary">
                      {principal.toLocaleString('tr-TR')} ₺
                    </span>
                  </div>
                  <Slider
                    value={[principal]}
                    onValueChange={(v) => setPrincipal(v[0])}
                    min={10000}
                    max={2000000}
                    step={10000}
                  />
                  <Input
                    type="number"
                    value={principal}
                    onChange={(e) => setPrincipal(Number(e.target.value))}
                  />
                </div>

                {/* Faiz Oranı */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('calculation.interestRate')}</Label>
                    <span className="font-medium">%{interestRate}</span>
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    value={interestRate}
                    onChange={(e) => setInterestRate(Number(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('calculation.effectiveInterest')}: %{calculation.effectiveRate.toFixed(2)}
                  </p>
                </div>

                {/* Vade */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>{t('calculation.term')}</Label>
                    <span className="font-medium">{termMonths} {t('calculation.months')}</span>
                  </div>
                  <Slider
                    value={[termMonths]}
                    onValueChange={(v) => setTermMonths(v[0])}
                    min={LOAN_CONSTANTS.MIN_TERM_MONTHS}
                    max={LOAN_CONSTANTS.MAX_TERM_MONTHS}
                    step={6}
                  />
                  <div className="flex flex-wrap gap-2">
                    {[12, 24, 36, 60, 120].map((m) => (
                      <Button
                        key={m}
                        variant={termMonths === m ? "default" : "outline"}
                        size="sm"
                        onClick={() => setTermMonths(m)}
                      >
                        {m === 120 ? `120 (${t('calculation.tenYears')})` : m}
                      </Button>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Sonuçlar */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg bg-primary/10 p-4 text-center">
                    <p className="text-sm text-muted-foreground">{t('results.monthlyPayment')}</p>
                    <p className="text-2xl font-bold text-primary">
                      {calculation.monthlyPayment.toLocaleString('tr-TR', { 
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2 
                      })} ₺
                    </p>
                  </div>
                  <div className="rounded-lg bg-muted p-4 text-center">
                    <p className="text-sm text-muted-foreground">{t('results.totalPayment')}</p>
                    <p className="text-2xl font-bold">
                      {calculation.totalPayment.toLocaleString('tr-TR', { 
                        minimumFractionDigits: 0 
                      })} ₺
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-destructive" />
                    <span className="text-sm">{t('results.totalInterestCost')}</span>
                  </div>
                  <span className="font-bold text-destructive">
                    {calculation.totalInterest.toLocaleString('tr-TR', { 
                      minimumFractionDigits: 2 
                    })} ₺
                  </span>
                </div>

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowSchedule(true)}
                >
                  {t('calculation.viewPlan')}
                </Button>
              </CardContent>
            </Card>

            {/* Gecikme Simülasyonu */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  {t('overdueSimulation.title')}
                </CardTitle>
                <CardDescription>
                  {t('overdueSimulation.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('overdueSimulation.duration')}</Label>
                    <span className="font-medium">{overdueDays} {t('overdueSimulation.days')}</span>
                  </div>
                  <Slider
                    value={[overdueDays]}
                    onValueChange={(v) => setOverdueDays(v[0])}
                    min={0}
                    max={90}
                    step={1}
                  />
                </div>

                {overdueDays > 0 && (
                  <div className="space-y-3 rounded-lg bg-destructive/10 p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('overdueSimulation.dailyInterest')}</span>
                      <span className="font-medium">
                        {(calculation.overdueInterest / overdueDays).toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2 
                        })} ₺{t('common:time.perDay')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">{t('overdueSimulation.totalOverdueInterest')}</span>
                      <span className="font-bold text-destructive">
                        +{calculation.overdueInterest.toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2 
                        })} ₺
                      </span>
                    </div>
                    <Separator />
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{t('overdueSimulation.amountToPay')}</span>
                      <span className="text-lg font-bold">
                        {calculation.totalWithOverdue.toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2 
                        })} ₺
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Kredilerim Tab */}
          <TabsContent value="loans" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">{t('myLoans.title')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('myLoans.count', { count: loans.length })}
                </p>
              </div>
              <Button onClick={() => setShowLoanForm(true)} size="sm" className="gap-2">
                <Plus className="h-4 w-4" />
                {t('myLoans.addLoan')}
              </Button>
            </div>

            {loans.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl bg-secondary/30 py-12">
                <Clock className="h-12 w-12 text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">{t('myLoans.noLoans')}</p>
                <Button
                  onClick={() => setShowLoanForm(true)}
                  variant="link"
                  className="mt-2"
                >
                  {t('myLoans.addFirst')}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {loans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    onClick={() => openEditForm(loan)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Kredi Form Modal */}
      <Dialog 
        open={showLoanForm} 
        onOpenChange={(open) => {
          setShowLoanForm(open);
          if (!open) setEditingLoan(undefined);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-md overflow-y-auto p-0" onInteractOutside={(e) => e.preventDefault()} onPointerDownOutside={(e) => e.preventDefault()}>
          <VisuallyHidden>
            <DialogTitle>{editingLoan ? t('myLoans.editLoan') : t('myLoans.addNewLoan')}</DialogTitle>
          </VisuallyHidden>
          <LoanForm
            loan={editingLoan}
            onSubmit={handleAddLoan}
            onDelete={editingLoan ? handleDeleteLoan : undefined}
            onClose={() => {
              setShowLoanForm(false);
              setEditingLoan(undefined);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Ödeme Planı Modal */}
      <Dialog open={showSchedule} onOpenChange={setShowSchedule}>
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
          <DialogTitle>{t('results.paymentSchedule')}</DialogTitle>
          <PaymentTimeline schedule={calculation.schedule} />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoanSimulator;
