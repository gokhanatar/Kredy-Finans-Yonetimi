
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
349
350
351
352
353
354
355
356
357
358
359
360
361
362
363
364
365
366
367
368
369
370
371
372
373
374
375
376
377
378
379
380
381
382
383
384
385
386
387
388
389
390
391
392
393
394
395
396
397
398
399
400
401
402
403
404
405
406
407
408
409
410
411
412
413
414
415
416
417
418
419
420
421
422
423
424
425
426
427
428
429
430
431
432
433
434
435
436
437
438
439
440
441
442
443
444
445
446
447
448
449
450
451
452
453
454
455
456
457
458
459
460
461
462
463
464
465
466
467
468
469
470
471
472
473
474
475
476
477
478
479
480
481
482
483
484
485
486
487
488
489
490
491
492
493
494
495
496
497
498
499
500
501
502
503
504
505
506
507
508
509
510
511
512
513
514
515
516
517
518
519
520
521
522
523
524
525
526
527
528
529
530
531
532
533
534
535
536
537
538
539
540
541
542
543
544
545
546
547
548
549
550
551
552
553
554
555
556
557
558
559
560
561
562
563
564
565
566
567
568
569
570
571
572
573
574
575
576
577
578
579
580
581
582
583
584
585
586
587
588
589
590
591
592
593
594
595
596
597
598
599
600
601
602
603
604
605
606
607
608
609
610
611
612
613
614
615
616
617
618
619
620
621
622
623
624
625
626
627
628
629
630
631
632
633
634
635
636
637
638
639
640
641
642
643
644
645
646
647
648
649
650
651
652
653
654
655
656
657
658
659
660
661
662
663
664
665
666
667
668
669
670
671
672
673
674
675
676
677
678
679
680
681
682
683
684
685
686
687
688
689
690
691
692
693
694
695
696
697
698
699
700
701
702
703
704
705
706
707
708
709
710
711
712
713
714
715
716
717
718
719
720
721
722
723
724
725
726
727
728
729
730
731
732
733
734
735
736
737
738
739
740
741
742
743
744
745
746
747
748
749
750
751
752
753
754
755
756
757
758
759
760
761
762
763
764
765
766
767
768
769
770
771
772
773
774
775
776
777
778
779
780
781
782
783
784
785
786
787
788
789
790
791
792
793
794
795
796
797
798
799
800
801
802
803
804
805
806
807
808
809
810
811
812
813
814
815
816
817
818
819
820
821
822
823
824
825
826
827
828 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useRef, useCallback } from "react";
import { ArrowLeft, User, Sun, Download, Upload, Trash2, Globe, Wallet, Lock, Shield, Languages, Check, ScanFace, Fingerprint, Smartphone, Bot, Key, ExternalLink, CheckCircle, XCircle, Users } from "lucide-react";
 
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionContext } from "@/contexts/SubscriptionContext";
import { useFamilySync } from "@/contexts/FamilySyncContext";
import {
  getGeminiApiKey,
  setGeminiApiKey,
  removeGeminiApiKey,
  isGeminiConfigured,
} from "@/lib/geminiReceiptScanner";
 
import { CloudSyncSettings } from "@/components/CloudSyncSettings";
import { THEME_LABELS, LANGUAGE_LABELS, CURRENCY_SYMBOLS } from "@/types/user";
import type { UserProfile } from "@/types/user";
import { APP_INFO } from "@/data/faqData";
import { exportAllData, importData, getStorageUsage } from "@/lib/dataService";
import { loadLanguage } from "@/i18n";
 
const AccountSettings = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['settings', 'common']);
  const { profile, updateProfile, exportData, clearAllData } = useUserProfile();
  const { isPinSet, setPin, removePin, setPinWithHints, isBiometricAvailable, isBiometricEnabled, biometryType, enableBiometric, disableBiometric } = useAuth();
  const { isPremium } = useSubscriptionContext();
  const { familyId, members, memberId } = useFamilySync();
  const [geminiKey, setGeminiKey] = useState(getGeminiApiKey() || '');
  const [geminiConfigured, setGeminiConfigured] = useState(isGeminiConfigured());
  const [geminiTesting, setGeminiTesting] = useState(false);
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email);
  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncome?.toString() || '');
  const [pendingTheme, setPendingTheme] = useState<UserProfile['theme']>(profile.theme);
  const [pendingCurrency, setPendingCurrency] = useState<UserProfile['preferredCurrency']>(profile.preferredCurrency);
  const [pendingLanguage, setPendingLanguage] = useState<UserProfile['language']>(profile.language);
  const [newPin, setNewPin] = useState('');
  const [pinHintInput1, setPinHintInput1] = useState('');
  const [pinHintInput2, setPinHintInput2] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const storageUsage = getStorageUsage();
 
  const handleSaveProfile = () => {
    updateProfile({
      name,
      email,
      monthlyIncome: monthlyIncome ? Number(monthlyIncome) : undefined,
    });
    toast({
      title: t('profile.updated'),
      description: t('profile.updatedDesc'),
    });
  };
 
  const appearanceChanged =
    pendingTheme !== profile.theme ||
    pendingCurrency !== profile.preferredCurrency ||
    pendingLanguage !== profile.language;
 
  const handleSaveAppearance = useCallback(async () => {
    // Apply language change
    if (pendingLanguage !== profile.language) {
      await loadLanguage(pendingLanguage);
      await i18n.changeLanguage(pendingLanguage);
      const isRtl = pendingLanguage === 'ar';
      document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
      document.documentElement.lang = pendingLanguage;
    }
 
    // Apply theme immediately on the DOM
    const root = document.documentElement;
    const allThemeClasses = ['dark', 'sepia', 'elderly', 'girls', 'high-contrast', 'corporate'];
    root.classList.remove(...allThemeClasses);
    if (pendingTheme === 'system') {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    } else if (pendingTheme !== 'light') {
      root.classList.add(pendingTheme);
    }
 
    updateProfile({
      theme: pendingTheme,
      preferredCurrency: pendingCurrency,
      language: pendingLanguage,
    });
 
    toast({
      title: t('appearance.appearanceSaved'),
      description: t('appearance.appearanceSavedDesc'),
    });
  }, [pendingTheme, pendingCurrency, pendingLanguage, profile.language, i18n, updateProfile, t]);
 
  const handleExport = async () => {
    const result = await exportAllData();
    toast({
      title: t('data.exported'),
      description: `${result.fileName} (${result.format})`,
    });
  };
 
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const result = await importData(file);
    toast({
      title: result.success ? t('data.restored') : t('common:status.error'),
      description: result.message,
      variant: result.success ? "default" : "destructive",
    });
    if (result.success) {
      window.location.reload();
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };
 
  const handleSetPin = () => {
    if (newPin.length !== 6) {
      toast({ title: t('common:status.error'), description: t('security.pinDigits'), variant: "destructive" });
      return;
    }
    if (!pinHintInput1.trim()) {
      toast({ title: t('common:status.error'), description: t('security.hintRequired', { defaultValue: 'Ipucu 1 zorunludur' }), variant: "destructive" });
      return;
    }
    if (!pinHintInput2.trim()) {
      toast({ title: t('common:status.error'), description: t('security.hint2Required', { defaultValue: 'Ipucu 2 zorunludur' }), variant: "destructive" });
      return;
    }
    setPinWithHints(newPin, pinHintInput1.trim(), pinHintInput2.trim());
    setNewPin('');
    setPinHintInput1('');
    setPinHintInput2('');
    setShowPinInput(false);
    toast({ title: t('security.pinSet'), description: t('security.pinSetDesc') });
  };
 
  const handleRemovePin = () => {
    removePin();
    toast({ title: t('security.pinRemoved'), description: t('security.pinRemovedDesc') });
  };
 
  const [resetStep, setResetStep] = useState(0); // 0=closed, 1=info, 2=confirm
  const handleClearData = () => {
    clearAllData();
    setResetStep(0);
    toast({
      title: t('data.deleted'),
      description: t('data.deletedDesc'),
      variant: "destructive",
    });
    navigate('/');
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
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <User className="h-5 w-5 text-primary" />
              {t('profile.title')}
            </CardTitle>
            <CardDescription>
              {t('profile.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('profile.fullName')}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('profile.namePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">{t('profile.email')}</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('profile.emailPlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="income" className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                {t('profile.monthlyIncome')}
              </Label>
              <Input
                id="income"
                type="number"
                value={monthlyIncome}
                onChange={(e) => setMonthlyIncome(e.target.value)}
                placeholder={t('profile.forLimitCalc')}
              />
              <p className="text-xs text-muted-foreground">
                {t('profile.bddkInfo')}
              </p>
            </div>
            <Button onClick={handleSaveProfile} className="w-full">
              {t('profile.saveChanges')}
            </Button>
          </CardContent>
        </Card>
 
        {/* Cloud Sync */}
        <CloudSyncSettings />
 
        {/* Family Members */}
        {familyId && Object.keys(members).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-5 w-5 text-primary" />
                {t('family.membersTitle', { defaultValue: 'Aile Üyeleri' })}
              </CardTitle>
              <CardDescription>
                {t('family.membersCount', { defaultValue: '{{count}} üye', count: Object.keys(members).length })}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(members).map(([id, member]) => {
                const isOnline = Date.now() - member.lastSeen < 5 * 60 * 1000;
                const isMe = id === memberId;
                const joinDate = new Date(member.joinedAt).toLocaleDateString('tr-TR', {
                  day: '2-digit', month: 'short', year: 'numeric',
                });
                return (
                  <div key={id} className="flex items-center gap-3 rounded-lg bg-secondary/30 p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-sm">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        {isMe && (
                          <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                            {t('common:you', { defaultValue: 'Sen' })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('family.joinedAt', { defaultValue: 'Katılma: {{date}}', date: joinDate })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-success' : 'bg-muted-foreground/30'}`} />
                      <span className="text-xs text-muted-foreground">
                        {isOnline
                          ? t('family.online', { defaultValue: 'Çevrimiçi' })
                          : t('family.offline', { defaultValue: 'Çevrimdışı' })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}
 
        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sun className="h-5 w-5 text-primary" />
              {t('appearance.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('appearance.theme')}</Label>
              <Select
                value={pendingTheme}
                onValueChange={(value: UserProfile['theme']) =>
                  setPendingTheme(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(THEME_LABELS) as Array<keyof typeof THEME_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`common:theme.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
 
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('appearance.currency')}
              </Label>
              <Select
                value={pendingCurrency}
                onValueChange={(value: UserProfile['preferredCurrency']) =>
                  setPendingCurrency(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(CURRENCY_SYMBOLS) as Array<keyof typeof CURRENCY_SYMBOLS>).map((key) => (
                    <SelectItem key={key} value={key}>
                      {t(`common:currency.${key}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
 
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                {t('appearance.language')}
              </Label>
              <Select
                value={pendingLanguage}
                onValueChange={(value: UserProfile['language']) =>
                  setPendingLanguage(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(LANGUAGE_LABELS) as Array<keyof typeof LANGUAGE_LABELS>).map((key) => (
                    <SelectItem key={key} value={key}>
                      {LANGUAGE_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
 
            {appearanceChanged && (
              <Button onClick={handleSaveAppearance} className="w-full gap-2">
                <Check className="h-4 w-4" />
                {t('appearance.saveAppearance')}
              </Button>
            )}
          </CardContent>
        </Card>
 
        {/* Kişisel Finans Tercihi — sadece aile bağlantısı varken */}
        {familyId && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Wallet className="h-5 w-5 text-primary" />
                {t('personalFinance.title')}
              </CardTitle>
              <CardDescription>{t('personalFinance.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div className="flex-1 min-w-0 pr-4">
                  <Label className="text-sm font-medium">{t('personalFinance.hideToggle')}</Label>
                  <p className="text-xs text-muted-foreground">{t('personalFinance.hideToggleDesc')}</p>
                </div>
                <Switch
                  checked={profile.hidePersonalFinance ?? false}
                  onCheckedChange={(checked) => updateProfile({ hidePersonalFinance: checked })}
                />
              </div>
              <div className="rounded-lg bg-amber-500/10 p-3">
                <p className="text-xs text-amber-700 dark:text-amber-400">{t('personalFinance.warning')}</p>
              </div>
            </CardContent>
          </Card>
        )}
 
        {/* Security */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-5 w-5 text-primary" />
              {t('security.title')}
            </CardTitle>
            <CardDescription>
              {t('security.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            {/* App Lock Toggle */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Lock className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <Label className="text-sm font-medium">{t('security.appLock')}</Label>
                  <p className="text-xs text-muted-foreground">{t('security.appLockDesc')}</p>
                </div>
              </div>
              <Switch
                checked={isPinSet}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setShowPinInput(true);
                  } else {
                    handleRemovePin();
                  }
                }}
              />
            </div>
 
            {/* PIN Input */}
            {showPinInput && !isPinSet && (
              <div className="space-y-3 pb-3 pl-12">
                <div className="flex gap-2">
                  <Input
                    type="tel"
                    pattern="[0-9]*"
                    maxLength={6}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('security.pinDigits')}
                    className="flex-1"
                  />
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={pinHintInput1}
                    onChange={(e) => setPinHintInput1(e.target.value)}
                    placeholder={t('security.hintPlaceholder1', { defaultValue: 'Bu ipucu sifrenizi hatirlamaniza yardimci olacak' })}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('security.hintLabel1', { defaultValue: 'Ipucu 1 (zorunlu)' })}
                  </p>
                </div>
                <div className="space-y-2">
                  <Input
                    type="text"
                    value={pinHintInput2}
                    onChange={(e) => setPinHintInput2(e.target.value)}
                    placeholder={t('security.hintPlaceholder2', { defaultValue: 'Ikinci ipucu (zorunlu)' })}
                    maxLength={100}
                  />
                  <p className="text-xs text-muted-foreground">
                    {t('security.hintLabel2', { defaultValue: 'Ipucu 2 (zorunlu)' })}
                  </p>
                </div>
                <Button size="sm" onClick={handleSetPin} className="w-full">{t('common:actions.save')}</Button>
              </div>
            )}
 
            {/* Biometric Toggle */}
            {isPinSet && isBiometricAvailable && (
              <>
                <Separator />
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      {biometryType === 'face'
                        ? <ScanFace className="h-4 w-4 text-primary" />
                        : <Fingerprint className="h-4 w-4 text-primary" />}
                    </div>
                    <div className="min-w-0">
                      <Label className="text-sm font-medium">
                        {biometryType === 'face' ? t('security.faceId') : t('security.touchId')}
                      </Label>
                      <p className="text-xs text-muted-foreground">{t('security.biometricDesc')}</p>
                    </div>
                  </div>
                  <Switch
                    checked={isBiometricEnabled}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        enableBiometric();
                        toast({ title: t('security.biometricEnabled'), description: t('security.biometricEnabledDesc') });
                      } else {
                        disableBiometric();
                        toast({ title: t('security.biometricDisabled'), description: t('security.biometricDisabledDesc') });
                      }
                    }}
                  />
                </div>
              </>
            )}
 
            {/* Auto-lock Info */}
            {isPinSet && (
              <>
                <Separator />
                <div className="flex items-center gap-3 py-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/10">
                    <Smartphone className="h-4 w-4 text-success" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-success">{t('security.autoLock')}</p>
                    <p className="text-xs text-muted-foreground">{t('security.autoLockDesc')}</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
 
        {/* Data Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5 text-primary" />
              {t('data.title')}
            </CardTitle>
            <CardDescription>
              {t('data.storage')}: {storageUsage.formatted}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={handleExport}
              >
                <Download className="h-4 w-4" />
                {t('data.export')}
              </Button>
              <p className="text-xs text-muted-foreground px-1">{t('data.exportDesc')}</p>
            </div>
 
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
            <div className="space-y-1.5">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t('data.restore')}
              </Button>
              <p className="text-xs text-muted-foreground px-1">{t('data.restoreDesc')}</p>
            </div>
 
            <Separator />
 
            <Button variant="destructive" className="w-full gap-2" onClick={() => setResetStep(1)}>
              <Trash2 className="h-4 w-4" />
              {t('data.deleteAll')}
            </Button>
 
            {/* Step 1: Info — What gets deleted */}
            <AlertDialog open={resetStep === 1} onOpenChange={(open) => { if (!open) setResetStep(0); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                    <Trash2 className="h-5 w-5" />
                    {t('data.resetTitle', { defaultValue: 'Verileri Sıfırla' })}
                  </AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="space-y-3 text-sm">
                      <p className="font-medium text-foreground">
                        {t('data.resetExplanation', { defaultValue: 'Bu işlem geri alınamaz. Aşağıdaki veriler kalıcı olarak silinecek:' })}
                      </p>
                      <div className="rounded-lg bg-destructive/10 p-3 space-y-1 text-destructive text-xs">
                        <p>• {t('data.resetItem.cards', { defaultValue: 'Kredi kartları ve taksitli alışverişler' })}</p>
                        <p>• {t('data.resetItem.accounts', { defaultValue: 'Banka hesapları ve bakiyeler' })}</p>
                        <p>• {t('data.resetItem.transactions', { defaultValue: 'Gelir ve gider işlemleri' })}</p>
                        <p>• {t('data.resetItem.loans', { defaultValue: 'Krediler ve ödeme planları' })}</p>
                        <p>• {t('data.resetItem.investments', { defaultValue: 'Yatırımlar (altın, döviz, hisse vb.)' })}</p>
                        <p>• {t('data.resetItem.assets', { defaultValue: 'Gayrimenkuller, araçlar, işletmeler' })}</p>
                        <p>• {t('data.resetItem.budgets', { defaultValue: 'Bütçeler, hedefler ve abonelikler' })}</p>
                        <p>• {t('data.resetItem.profile', { defaultValue: 'Profil bilgileri ve tercihler' })}</p>
                      </div>
                      <div className="rounded-lg bg-success/10 p-3 space-y-1 text-success text-xs">
                        <p className="font-medium">{t('data.resetKeep', { defaultValue: 'Silinmeyecekler:' })}</p>
                        <p>• {t('data.resetKeep.pro', { defaultValue: 'Pro abonelik durumu korunur' })}</p>
                        <p>• {t('data.resetKeep.pin', { defaultValue: 'PIN kilidi korunur' })}</p>
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={(e) => { e.preventDefault(); setResetStep(2); }}
                  >
                    {t('data.resetContinue', { defaultValue: 'Devam Et' })}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
 
            {/* Step 2: Final confirmation */}
            <AlertDialog open={resetStep === 2} onOpenChange={(open) => { if (!open) setResetStep(0); }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-destructive">
                    {t('data.resetFinalTitle', { defaultValue: 'Emin misiniz?' })}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('data.resetFinalWarning', { defaultValue: 'Tüm verileriniz kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam etmek istiyor musunuz?' })}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setResetStep(0)}>
                    {t('data.resetGoBack', { defaultValue: 'Vazgeç' })}
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={handleClearData}
                  >
                    {t('data.resetFinalConfirm', { defaultValue: 'Evet, Her Şeyi Sil' })}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
 
        {/* AI Receipt Scanner — PRO only */}
        {isPremium && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bot className="h-5 w-5 text-primary" />
                {t('gemini.title')}
                {geminiConfigured ? (
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle className="h-3.5 w-3.5" />
                    {t('gemini.configured')}
                  </span>
                ) : (
                  <span className="ml-auto flex items-center gap-1 text-xs font-medium text-muted-foreground">
                    <XCircle className="h-3.5 w-3.5" />
                    {t('gemini.notConfigured')}
                  </span>
                )}
              </CardTitle>
              <CardDescription>{t('gemini.subtitle')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{t('gemini.description')}</p>
 
              <div className="rounded-lg bg-secondary/50 p-3 space-y-1">
                <p className="text-xs font-semibold">{t('gemini.limits')}</p>
                <p className="text-xs text-muted-foreground">• {t('gemini.limitsDaily')}</p>
                <p className="text-xs text-muted-foreground">• {t('gemini.limitsMinute')}</p>
                <p className="text-xs text-muted-foreground">• {t('gemini.limitsMonthly')}</p>
              </div>
 
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  {t('gemini.apiKey')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={t('gemini.apiKeyPlaceholder')}
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (geminiKey.trim()) {
                        setGeminiApiKey(geminiKey.trim());
                        setGeminiConfigured(true);
                        toast({ title: t('gemini.saved') });
                      }
                    }}
                    disabled={!geminiKey.trim()}
                  >
                    {t('gemini.save')}
                  </Button>
                </div>
 
                {geminiConfigured && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    disabled={geminiTesting}
                    onClick={async () => {
                      setGeminiTesting(true);
                      try {
                        const key = getGeminiApiKey();
                        if (!key) throw new Error('No key');
                        const res = await fetch(
                          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
                          {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              contents: [{ parts: [{ text: 'Merhaba, test. Sadece "OK" yaz.' }] }],
                              generationConfig: { maxOutputTokens: 10 },
                            }),
                          }
                        );
                        if (res.ok) {
                          toast({ title: t('gemini.testSuccess', 'API anahtarı çalışıyor!'), variant: 'default' });
                        } else {
                          const err = await res.json().catch(() => ({}));
                          toast({
                            title: t('gemini.testFail', 'API anahtarı geçersiz'),
                            description: err?.error?.message || `Hata: ${res.status}`,
                            variant: 'destructive',
                          });
                        }
                      } catch (e) {
                        toast({
                          title: t('gemini.testFail', 'Bağlantı hatası'),
                          description: t('gemini.testFailDesc', 'İnternet bağlantınızı kontrol edin.'),
                          variant: 'destructive',
                        });
                      } finally {
                        setGeminiTesting(false);
                      }
                    }}
                  >
                    {geminiTesting ? t('gemini.testing', 'Test ediliyor...') : t('gemini.test', 'Kontrol Et')}
                  </Button>
                )}
              </div>
 
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{t('gemini.howToGet')}</p>
                  <p>{t('gemini.howToGetDesc')}</p>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline"
                  >
                    aistudio.google.com/apikey
                  </a>
                </div>
              </div>
 
              {geminiConfigured && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-destructive"
                  onClick={() => {
                    removeGeminiApiKey();
                    setGeminiKey('');
                    setGeminiConfigured(false);
                    toast({ title: t('gemini.removed') });
                  }}
                >
                  {t('gemini.removeKey')}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
 
        {/* App Info */}
        <Card>
          <CardContent className="py-4">
            <div className="text-center text-sm text-muted-foreground">
              <img src="/logo.png" alt="Kredy" className="mx-auto h-12 w-12 rounded-xl mb-2" />
              <p className="font-medium">Kredy - Bütçe & Finans</p>
              <p>{t('appInfo.version')} {APP_INFO.version}</p>
              <p className="mt-1">{t('appInfo.lastUpdate')}: {APP_INFO.lastUpdate}</p>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};
 
export default AccountSettings;
 