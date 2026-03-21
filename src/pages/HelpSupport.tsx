
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
312
313
314
315
316
317
318
319
320
321
322
323
324
325
326
327
328
329
330
331
332
333
334
335
336
337
338
339
340
341
342
343
344
345
346
347
348 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
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
 