import { useState, useMemo } from "react";
import { ArrowLeft, HelpCircle, Mail, Phone, Clock, MessageSquare, Search } from "lucide-react";
import { CategoryIcon } from '@/components/ui/category-icon';
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";
import { FAQ_CATEGORIES, GUIDE_SECTIONS, CONTACT_INFO, APP_INFO } from "@/data/faqData";

const HelpSupport = () => {
  const { t } = useTranslation(['faq', 'common']);
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [guideSearchQuery, setGuideSearchQuery] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Build FAQ data from translation keys
  const faqData = useMemo(() => {
    return FAQ_CATEGORIES.map((cat) => {
      const questions = [];
      for (let i = 1; i <= cat.questionCount; i++) {
        questions.push({
          question: t(`categories.${cat.id}.q${i}`),
          answer: t(`categories.${cat.id}.a${i}`),
        });
      }
      return {
        id: cat.id,
        icon: cat.icon,
        title: t(`categories.${cat.id}.title`),
        questions,
      };
    });
  }, [t]);

  // Build Guide data from translation keys
  const guideData = useMemo(() => {
    return GUIDE_SECTIONS.map((section) => {
      const items = [];
      for (let i = 1; i <= section.itemCount; i++) {
        items.push({
          title: t(`guide.sections.${section.id}.item${i}.title`),
          desc: t(`guide.sections.${section.id}.item${i}.desc`),
        });
      }
      return {
        id: section.id,
        icon: section.icon,
        title: t(`guide.sections.${section.id}.title`),
        desc: t(`guide.sections.${section.id}.desc`),
        items,
      };
    });
  }, [t]);

  const filteredFAQ = faqData.map((category) => ({
    ...category,
    questions: category.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.questions.length > 0);

  const filteredGuide = guideData.map((section) => ({
    ...section,
    items: section.items.filter(
      (item) =>
        item.title.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(guideSearchQuery.toLowerCase()) ||
        section.title.toLowerCase().includes(guideSearchQuery.toLowerCase())
    ),
  })).filter((section) => guideSearchQuery === "" || section.items.length > 0);

  const handleSendFeedback = () => {
    if (!feedbackMessage.trim()) {
      toast({
        title: t('common:status.error'),
        description: t('help.feedback.errorEmpty'),
        variant: "destructive",
      });
      return;
    }

    toast({
      title: t('help.feedback.sent'),
      description: t('help.feedback.thanks'),
    });
    setFeedbackMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">{t('help.title')}</h1>
        </div>
      </div>

      <main className="p-4 pb-20">
        <Tabs defaultValue="faq" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="faq">{t('help.tabs.faq')}</TabsTrigger>
            <TabsTrigger value="guide">{t('help.tabs.guide')}</TabsTrigger>
            <TabsTrigger value="contact">{t('help.tabs.contact')}</TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="space-y-4">
            <div className="relative">
              <Input
                placeholder={t('help.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <HelpCircle className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {filteredFAQ.map((category) => (
              <Card key={category.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CategoryIcon name={category.icon} size={18} />
                    {category.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.questions.map((item, index) => (
                      <AccordionItem key={index} value={`${category.id}-${index}`}>
                        <AccordionTrigger className="text-left text-sm">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {filteredFAQ.length === 0 && searchQuery && (
              <div className="py-8 text-center text-muted-foreground">
                <HelpCircle className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">{t('help.noResults', { query: searchQuery })}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            {/* Guide search */}
            <div className="relative">
              <Input
                placeholder={t('guide.searchPlaceholder', { defaultValue: 'Kılavuzda ara...' })}
                value={guideSearchQuery}
                onChange={(e) => setGuideSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>

            {/* Guide sections */}
            {filteredGuide.map((section) => (
              <Card key={section.id}>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CategoryIcon name={section.icon} size={18} />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {section.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {section.items.map((item, index) => (
                      <AccordionItem key={index} value={`${section.id}-${index}`}>
                        <AccordionTrigger className="text-left text-sm">
                          {item.title}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground whitespace-pre-line">
                          {item.desc}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}

            {filteredGuide.length === 0 && guideSearchQuery && (
              <div className="py-8 text-center text-muted-foreground">
                <Search className="mx-auto h-12 w-12 opacity-50" />
                <p className="mt-2">{t('guide.noResults', { query: guideSearchQuery, defaultValue: `"${guideSearchQuery}" için sonuç bulunamadı` })}</p>
              </div>
            )}

            {/* Formulas card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('help.formulas.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{t('help.formulas.dailyOverdue')}</p>
                  <p className="font-mono text-muted-foreground">
                    {t('help.formulas.dailyOverdueFormula')}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{t('help.formulas.monthlyInstallment')}</p>
                  <p className="font-mono text-muted-foreground">
                    {t('help.formulas.monthlyInstallmentFormula')}
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="font-medium">{t('help.formulas.effectiveInterest')}</p>
                  <p className="font-mono text-muted-foreground">
                    {t('help.formulas.effectiveInterestFormula')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* BDDK card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('help.bddk2026.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('help.bddk2026.restructuringCeiling')}</span>
                  <span className="font-medium">{t('help.bddk2026.restructuringValue')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('help.bddk2026.interestCeiling')}</span>
                  <span className="font-medium">{t('help.bddk2026.interestValue')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('help.bddk2026.cashAdvance')}</span>
                  <span className="font-medium">{t('help.bddk2026.cashAdvanceValue')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('help.bddk2026.kkdfBsmv')}</span>
                  <span className="font-medium">{t('help.bddk2026.kkdfBsmvValue')}</span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('contact.title')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contact.email')}</p>
                    <p className="font-medium">{CONTACT_INFO.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contact.phone')}</p>
                    <p className="font-medium">{CONTACT_INFO.phone}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('contact.workingHours')}</p>
                    <p className="font-medium">{t('contact.workingHoursValue')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  {t('help.feedback.title')}
                </CardTitle>
                <CardDescription>
                  {t('help.feedback.subtitle')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="feedback">{t('help.feedback.yourMessage')}</Label>
                  <Textarea
                    id="feedback"
                    placeholder={t('help.feedback.messagePlaceholder')}
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    rows={4}
                  />
                </div>
                <Button onClick={handleSendFeedback} className="w-full">
                  {t('common:actions.send')}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-4">
                <div className="text-center text-sm text-muted-foreground">
                  <p className="font-medium">Kredy v{APP_INFO.version}</p>
                  <p className="mt-1">{APP_INFO.developer}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default HelpSupport;
