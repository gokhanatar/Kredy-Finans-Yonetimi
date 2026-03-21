
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
829
830
831
832
833
834
835
836
837
838
839
840
841
842
843
844
845
846
847
848
849
850
851
852
853
854
855
856
857
858
859
860
861
862
863
864
865
866
867
868
869
870
871
872
873
874
875
876
877
878
879
880
881
882
883
884
885
886
887
888
889
890
891
892
893
894
895
896
897
898
899
900
901
902
903
904
905
906
907
908
909
910
911
912
913
914
915
916
917
918
919
920
921
922
923
924
925
926
927
928
929
930
931
932
933
934
935
936
937
938
939
940
941
942
943
944
945
946
947
948
949
950
951
952
953
954
955
956
957
958
959
960
961
962
963
964
965
966
967
968
969
970
971
972
973
974
975
976
977
978
979
980
981
982
983
984
985
986
987
988
989
990
991
992
993
994
995
996
997
998
999
1000
1001
1002
1003
1004
1005
1006
1007
1008
1009
1010
1011
1012
1013
1014
1015
1016
1017
1018
1019
1020
1021
1022
1023
1024
1025
1026
1027
1028
1029
1030
1031
1032
1033
1034
1035
1036
1037
1038
1039
1040
1041
1042
1043
1044
1045
1046
1047
1048
1049
1050
1051
1052
1053
1054
1055
1056
1057
1058
1059
1060
1061
1062
1063
1064
1065
1066
1067
1068
1069
1070
1071
1072
1073
1074
1075
1076
1077
1078
1079
1080
1081
1082
1083
1084
1085
1086
1087
1088
1089
1090
1091
1092
1093
1094
1095
1096
1097
1098
1099
1100
1101
1102
1103
1104
1105
1106
1107
1108
1109
1110
1111
1112
1113
1114
1115
1116
1117
1118
1119
1120
1121
1122
1123
1124
1125
1126
1127
1128
1129
1130
1131
1132
1133
1134
1135
1136
1137
1138
1139
1140
1141
1142
1143
1144
1145
1146 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { CreditCard } from "@/types/finance";
import { formatCurrency } from "@/lib/financeUtils";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { usePurchaseHistory } from "@/hooks/usePurchaseHistory";
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { CategoryIcon } from '@/components/ui/category-icon';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Building2,
  Calculator,
  TrendingUp,
  Receipt,
  PieChart,
  FileText,
  Calendar,
  Wallet,
  Percent,
  Download,
  FileSpreadsheet,
  Bell,
  Clock,
  Filter,
  BarChart3,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, isWithinInterval, subMonths, differenceInDays, addMonths } from "date-fns";
import { tr } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from "recharts";
 
// VAT rates in Turkey - labels resolved via i18n in component
const VAT_RATES = [
  { rate: 20, labelKey: "commercial.generalVat", descKey: "commercial.generalVatDesc" },
  { rate: 10, labelKey: "commercial.reducedVat", descKey: "commercial.reducedVatDesc" },
  { rate: 1, labelKey: "commercial.lowVat", descKey: "commercial.lowVatDesc" },
] as const;
 
const EXPENSE_CATEGORIES = [
  { id: "office", labelKey: "commercial.expenseCategories.office", icon: "building-2" },
  { id: "equipment", labelKey: "commercial.expenseCategories.equipment", icon: "monitor" },
  { id: "travel", labelKey: "commercial.expenseCategories.travel", icon: "plane" },
  { id: "marketing", labelKey: "commercial.expenseCategories.marketing", icon: "bell" },
  { id: "software", labelKey: "commercial.expenseCategories.software", icon: "laptop" },
  { id: "communication", labelKey: "commercial.expenseCategories.communication", icon: "smartphone" },
  { id: "professional", labelKey: "commercial.expenseCategories.professional", icon: "briefcase" },
  { id: "other", labelKey: "common:other", icon: "package" },
] as const;
 
// Tax calendar dates
const TAX_PERIODS = [
  { id: "kdv", nameKey: "commercial.vatDeclaration", dayOfMonth: 26, descKey: "commercial.vatDate" },
] as const;
 
const QUARTERLY_TAX_MONTHS = [1, 4, 7, 10]; // Geçici Vergi: Ocak, Nisan, Temmuz, Ekim
 
const DATE_FILTER_IDS = ["this_month", "last_month", "last_3_months", "last_6_months", "all"] as const;
 
export default function CommercialCardAnalytics() {
  const navigate = useNavigate();
  const { t } = useTranslation(['cards', 'common']);
  const [cards] = useLocalStorage<CreditCard[]>("kredi-pusula-cards", [] as CreditCard[]);
  const { purchases } = usePurchaseHistory();
  
  // VAT Calculator state
  const [vatAmount, setVatAmount] = useState<string>("");
  const [selectedVatRate, setSelectedVatRate] = useState<number>(20);
  const [isVatIncluded, setIsVatIncluded] = useState<boolean>(true);
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDateRange, setSelectedDateRange] = useState<string>("all");
  const [selectedCardId, setSelectedCardId] = useState<string>("all");
  
  // Filter commercial cards
  const commercialCards = cards.filter((c) => c.cardType === "ticari");
  
  // Get purchases from commercial cards
  const commercialPurchases = useMemo(() => {
    const commercialCardIds = commercialCards.map((c) => c.id);
    return purchases.filter((p) => commercialCardIds.includes(p.cardId));
  }, [purchases, commercialCards]);
  
  // Current month expenses
  const currentMonthExpenses = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    return commercialPurchases.filter((p) =>
      isWithinInterval(new Date(p.date), { start, end })
    );
  }, [commercialPurchases]);
  
  // Total commercial spending
  const totalCommercialSpending = commercialPurchases.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  
  const currentMonthTotal = currentMonthExpenses.reduce(
    (sum, p) => sum + p.amount,
    0
  );
  
  // Estimated VAT (assuming 20% average)
  const estimatedVAT = totalCommercialSpending * 0.20 / 1.20;
  const currentMonthVAT = currentMonthTotal * 0.20 / 1.20;
  
  // VAT calculation
  const parsedVatAmount = parseFloat(vatAmount.replace(/[^0-9.,]/g, "").replace(",", ".")) || 0;
  
  const vatCalculation = useMemo(() => {
    if (parsedVatAmount <= 0) return null;
    
    if (isVatIncluded) {
      // KDV dahil tutardan hesapla
      const netAmount = parsedVatAmount / (1 + selectedVatRate / 100);
      const vatValue = parsedVatAmount - netAmount;
      return {
        grossAmount: parsedVatAmount,
        netAmount,
        vatAmount: vatValue,
      };
    } else {
      // KDV hariç tutardan hesapla
      const vatValue = parsedVatAmount * (selectedVatRate / 100);
      const grossAmount = parsedVatAmount + vatValue;
      return {
        grossAmount,
        netAmount: parsedVatAmount,
        vatAmount: vatValue,
      };
    }
  }, [parsedVatAmount, selectedVatRate, isVatIncluded]);
  
  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    commercialPurchases.forEach((p) => {
      const cat = p.category || "other";
      breakdown[cat] = (breakdown[cat] || 0) + p.amount;
    });
    return Object.entries(breakdown)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [commercialPurchases]);
  
  // Filtered purchases based on selected filters
  const filteredPurchases = useMemo(() => {
    let filtered = commercialPurchases;
    
    // Category filter
    if (selectedCategory !== "all") {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }
    
    // Card filter
    if (selectedCardId !== "all") {
      filtered = filtered.filter((p) => p.cardId === selectedCardId);
    }
    
    // Date range filter
    const now = new Date();
    if (selectedDateRange === "this_month") {
      filtered = filtered.filter((p) =>
        isWithinInterval(new Date(p.date), { start: startOfMonth(now), end: endOfMonth(now) })
      );
    } else if (selectedDateRange === "last_month") {
      const lastMonth = subMonths(now, 1);
      filtered = filtered.filter((p) =>
        isWithinInterval(new Date(p.date), { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) })
      );
    } else if (selectedDateRange === "last_3_months") {
      filtered = filtered.filter((p) =>
        isWithinInterval(new Date(p.date), { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) })
      );
    } else if (selectedDateRange === "last_6_months") {
      filtered = filtered.filter((p) =>
        isWithinInterval(new Date(p.date), { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) })
      );
    }
    
    return filtered;
  }, [commercialPurchases, selectedCategory, selectedCardId, selectedDateRange]);
  
  const filteredTotal = filteredPurchases.reduce((sum, p) => sum + p.amount, 0);
  const filteredVAT = filteredTotal * 0.20 / 1.20;
  
  // Tax calendar calculations
  const taxCalendarData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    // Next KDV date (26th of current or next month)
    let nextKDVDate = new Date(currentYear, now.getMonth(), 26);
    if (now.getDate() > 26) {
      nextKDVDate = addMonths(nextKDVDate, 1);
    }
    const daysToKDV = differenceInDays(nextKDVDate, now);
    
    // Next quarterly tax date
    const nextQuarterMonth = QUARTERLY_TAX_MONTHS.find((m) => m >= currentMonth) || QUARTERLY_TAX_MONTHS[0];
    let nextQuarterYear = currentYear;
    if (nextQuarterMonth < currentMonth) {
      nextQuarterYear = currentYear + 1;
    }
    const nextQuarterDate = new Date(nextQuarterYear, nextQuarterMonth - 1, 17); // 17th is typical deadline
    const daysToQuarter = differenceInDays(nextQuarterDate, now);
    
    return {
      nextKDVDate,
      daysToKDV,
      nextQuarterDate,
      daysToQuarter,
      isKDVUrgent: daysToKDV <= 7,
      isQuarterUrgent: daysToQuarter <= 14,
    };
  }, []);
  
  // Monthly chart data (last 6 months)
  const monthlyChartData = useMemo(() => {
    const now = new Date();
    const months: { month: string; office: number; travel: number; marketing: number; other: number; vat: number }[] = [];
 
    for (let i = 5; i >= 0; i--) {
      const targetMonth = subMonths(now, i);
      const start = startOfMonth(targetMonth);
      const end = endOfMonth(targetMonth);
 
      const monthPurchases = commercialPurchases.filter((p) =>
        isWithinInterval(new Date(p.date), { start, end })
      );
 
      const categoryTotals: Record<string, number> = {
        office: 0,
        travel: 0,
        marketing: 0,
        other: 0,
      };
 
      monthPurchases.forEach((p) => {
        const cat = p.category || "other";
        if (cat === "office" || cat === "equipment" || cat === "software") {
          categoryTotals.office += p.amount;
        } else if (cat === "travel") {
          categoryTotals.travel += p.amount;
        } else if (cat === "marketing") {
          categoryTotals.marketing += p.amount;
        } else {
          categoryTotals.other += p.amount;
        }
      });
 
      const monthTotal = monthPurchases.reduce((sum, p) => sum + p.amount, 0);
 
      months.push({
        month: format(targetMonth, "MMM", { locale: tr }),
        office: categoryTotals.office,
        travel: categoryTotals.travel,
        marketing: categoryTotals.marketing,
        other: categoryTotals.other,
        vat: monthTotal * 0.20 / 1.20,
      });
    }
 
    return months;
  }, [commercialPurchases]);
  
  // Export to Excel (CSV format)
  const exportToExcel = () => {
    if (commercialPurchases.length === 0) {
      toast({
        title: t('commercial.noData'),
        description: t('commercial.noExportData'),
        variant: "destructive",
      });
      return;
    }
 
    const headers = [t('commercial.csvDate'), t('commercial.csvCard'), t('commercial.csvMerchant'), t('commercial.csvCategory'), t('commercial.csvAmount'), t('commercial.csvInstallment'), t('commercial.csvTotal'), t('commercial.csvEstimatedVat')];
    const rows = commercialPurchases.map((p) => {
      const card = commercialCards.find((c) => c.id === p.cardId);
      const expenseCat = EXPENSE_CATEGORIES.find((c) => c.id === p.category);
      const estimatedVat = p.amount * 0.20 / 1.20;
      return [
        format(new Date(p.date), "dd.MM.yyyy", { locale: tr }),
        `${card?.bankName || t('common:unknown')} ****${card?.lastFourDigits || ""}`,
        p.merchant || p.description || "-",
        expenseCat ? t(expenseCat.labelKey) : p.category || t('common:other'),
        p.amount.toFixed(2).replace(".", ","),
        p.installments > 1 ? `${p.installments}x` : t('purchases.singlePayment'),
        p.totalAmount.toFixed(2).replace(".", ","),
        estimatedVat.toFixed(2).replace(".", ","),
      ];
    });
    
    // Summary row
    rows.push([]);
    rows.push(["", "", "", t('commercial.total'), totalCommercialSpending.toFixed(2).replace(".", ","), "", "", estimatedVAT.toFixed(2).replace(".", ",")]);
    
    const csvContent = [
      headers.join(";"),
      ...rows.map((row) => row.join(";")),
    ].join("\n");
    
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${t('commercial.exportFilename')}-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: t('commercial.excelDownloaded'),
      description: t('commercial.excelDesc'),
    });
  };
  
  // Export to PDF (printable HTML format)
  const exportToPDF = () => {
    if (commercialPurchases.length === 0) {
      toast({
        title: t('commercial.noData'),
        description: t('commercial.noExportData'),
        variant: "destructive",
      });
      return;
    }
 
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast({
        title: t('common:status.error'),
        description: t('commercial.popupBlocked'),
        variant: "destructive",
      });
      return;
    }
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${t('commercial.expenseReports')}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; }
          .summary-card { background: #f5f5f5; padding: 15px; border-radius: 8px; flex: 1; }
          .summary-card h3 { margin: 0 0 5px 0; font-size: 14px; color: #666; }
          .summary-card p { margin: 0; font-size: 24px; font-weight: bold; }
          .summary-card.vat p { color: #10b981; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #f5f5f5; font-weight: 600; }
          .amount { text-align: right; }
          .total-row { font-weight: bold; background: #f5f5f5; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #666; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${t('commercial.reportTitle')}</h1>
        <p>${t('commercial.reportDate')}: ${format(new Date(), "d MMMM yyyy", { locale: tr })}</p>
        
        <div class="summary">
          <div class="summary-card">
            <h3>${t('commercial.totalSpending')}</h3>
            <p>₺${totalCommercialSpending.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
          </div>
          <div class="summary-card vat">
            <h3>${t('commercial.estimatedVat')} (${t('commercial.deductibleVat')})</h3>
            <p>₺${estimatedVAT.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
        
        <h2>${t('commercial.transactionDetails')}</h2>
        <table>
          <thead>
            <tr>
              <th>${t('commercial.csvDate')}</th>
              <th>${t('commercial.csvCard')}</th>
              <th>${t('commercial.pdfDescription')}</th>
              <th>${t('commercial.csvCategory')}</th>
              <th class="amount">${t('commercial.csvAmount')}</th>
              <th class="amount">${t('commercial.vat')}</th>
            </tr>
          </thead>
          <tbody>
            ${commercialPurchases.map((p) => {
              const card = commercialCards.find((c) => c.id === p.cardId);
              const expenseCat = EXPENSE_CATEGORIES.find((c) => c.id === p.category);
              const vat = p.amount * 0.20 / 1.20;
              return `
                <tr>
                  <td>${format(new Date(p.date), "dd.MM.yyyy")}</td>
                  <td>${card?.bankName || "-"} ****${card?.lastFourDigits || ""}</td>
                  <td>${p.merchant || p.description || "-"}</td>
                  <td>${expenseCat?.icon || ""} ${expenseCat ? t(expenseCat.labelKey) : p.category || t('common:other')}</td>
                  <td class="amount">₺${p.amount.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                  <td class="amount">₺${vat.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
                </tr>
              `;
            }).join("")}
            <tr class="total-row">
              <td colspan="4">${t('commercial.total')}</td>
              <td class="amount">₺${totalCommercialSpending.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
              <td class="amount">₺${estimatedVAT.toLocaleString("tr-TR", { minimumFractionDigits: 2 })}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>${t('commercial.reportFooter')}</p>
          <p>${t('commercial.vatCalcNote')}</p>
        </div>
        
        <script>window.print();</script>
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    toast({
      title: t('commercial.pdfReady'),
      description: t('commercial.pdfDesc'),
    });
  };
 
  if (commercialCards.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="px-5 pb-safe-nav pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/")}
            className="mb-4 gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common:actions.back')}
          </Button>
 
          <PremiumLockOverlay showFloatingButton={false}>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold mb-2">{t('commercial.notFound')}</h2>
              <p className="text-muted-foreground mb-6 max-w-sm">
                {t('commercial.addRequired')}
              </p>
              <Button onClick={() => navigate("/")}>
                {t('commercial.addCard')}
              </Button>
            </div>
          </PremiumLockOverlay>
        </main>
        <MobileNav activeTab="cards" />
      </div>
    );
  }
 
  return (
    <div className="min-h-screen bg-background">
      <Header />
 
      <main className="px-5 pb-safe-nav pt-4">
        {/* FREE: Back button + title + summary cards */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common:actions.back')}
        </Button>
 
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/50">
            <Building2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{t('commercial.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('commercial.cardsCount', { count: commercialCards.length })}
            </p>
          </div>
        </div>
 
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{t('commercial.totalSpending')}</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(totalCommercialSpending)}</p>
            </CardContent>
          </Card>
 
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Receipt className="h-4 w-4 text-emerald-500" />
                <span className="text-xs text-muted-foreground">{t('commercial.estimatedVat')}</span>
              </div>
              <p className="text-lg font-bold text-emerald-600">{formatCurrency(estimatedVAT)}</p>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('common:time.thisMonth')}</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(currentMonthTotal)}</p>
            </CardContent>
          </Card>
 
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{t('commercial.thisMonthVat')}</span>
              </div>
              <p className="text-lg font-bold">{formatCurrency(currentMonthVAT)}</p>
            </CardContent>
          </Card>
        </div>
 
        {/* LOCKED: Tabs (VAT calculator, tax calendar, analysis, reports) */}
        <PremiumLockOverlay showFloatingButton={false}>
        <Tabs defaultValue="vat" className="space-y-4">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="vat" className="gap-1 text-xs px-2">
              <Calculator className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('commercial.vat')}</span>
            </TabsTrigger>
            <TabsTrigger value="tax" className="gap-1 text-xs px-2">
              <Bell className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('commercial.tax')}</span>
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1 text-xs px-2">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('commercial.analysis')}</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="gap-1 text-xs px-2">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('commercial.reports')}</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="vat" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  {t('commercial.vatCalculator')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Amount Input */}
                <div className="space-y-2">
                  <Label>{t('shopping.amount')}</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₺</span>
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      placeholder={t('commercial.amountPlaceholder')}
                      value={vatAmount}
                      onChange={(e) => setVatAmount(e.target.value)}
                      className="pl-8 text-lg font-semibold"
                    />
                  </div>
                </div>
                
                {/* VAT Included Toggle */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsVatIncluded(true)}
                    className={cn(
                      "rounded-lg border-2 py-3 text-sm font-medium transition-all",
                      isVatIncluded
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    {t('commercial.vatIncluded')}
                  </button>
                  <button
                    onClick={() => setIsVatIncluded(false)}
                    className={cn(
                      "rounded-lg border-2 py-3 text-sm font-medium transition-all",
                      !isVatIncluded
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background hover:border-primary/50"
                    )}
                  >
                    {t('commercial.vatExcluded')}
                  </button>
                </div>
                
                {/* VAT Rate Selection */}
                <div className="space-y-2">
                  <Label>{t('commercial.vatRate')}</Label>
                  <div className="grid gap-2">
                    {VAT_RATES.map((vat) => (
                      <button
                        key={vat.rate}
                        onClick={() => setSelectedVatRate(vat.rate)}
                        className={cn(
                          "flex items-center justify-between rounded-lg border-2 p-3 text-left transition-all",
                          selectedVatRate === vat.rate
                            ? "border-primary bg-primary/10"
                            : "border-border bg-background hover:border-primary/50"
                        )}
                      >
                        <div>
                          <p className={cn(
                            "font-medium",
                            selectedVatRate === vat.rate && "text-primary"
                          )}>
                            {t(vat.labelKey)}
                          </p>
                          <p className="text-xs text-muted-foreground">{t(vat.descKey)}</p>
                        </div>
                        <div className={cn(
                          "flex h-8 w-8 items-center justify-center rounded-full",
                          selectedVatRate === vat.rate
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-muted-foreground"
                        )}>
                          %{vat.rate}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Result */}
                {vatCalculation && (
                  <div className="rounded-xl bg-secondary/50 p-4 space-y-3 mt-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {t('commercial.calcResult')}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('commercial.netAmount')}</span>
                        <span className="font-medium">{formatCurrency(vatCalculation.netAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('commercial.vat')} (%{selectedVatRate})</span>
                        <span className="font-medium text-emerald-600">
                          +{formatCurrency(vatCalculation.vatAmount)}
                        </span>
                      </div>
                      <div className="border-t border-border pt-2 mt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">{t('commercial.grossAmount')}</span>
                          <span className="text-lg font-bold text-primary">
                            {formatCurrency(vatCalculation.grossAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tax Calendar Tab */}
          <TabsContent value="tax" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  {t('commercial.taxCalendar')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* KDV Deadline */}
                <div className={cn(
                  "rounded-xl p-4 border-2",
                  taxCalendarData.isKDVUrgent ? "border-destructive bg-destructive/5" : "border-border"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      taxCalendarData.isKDVUrgent ? "bg-destructive text-destructive-foreground" : "bg-primary/10 text-primary"
                    )}>
                      <Receipt className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{t('commercial.kdvReport')}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(taxCalendarData.nextKDVDate, "d MMMM yyyy", { locale: tr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        taxCalendarData.isKDVUrgent ? "text-destructive" : "text-foreground"
                      )}>
                        {taxCalendarData.daysToKDV}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('commercial.daysLeft', { days: taxCalendarData.daysToKDV })}</p>
                    </div>
                  </div>
                  {taxCalendarData.isKDVUrgent && (
                    <div className="mt-3 rounded-lg bg-destructive/10 p-2 text-center">
                      <p className="text-xs text-destructive font-medium">
                        ⚠️ {t('commercial.urgentDeadline')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Quarterly Tax */}
                <div className={cn(
                  "rounded-xl p-4 border-2",
                  taxCalendarData.isQuarterUrgent ? "border-amber-500 bg-amber-500/5" : "border-border"
                )}>
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-xl",
                      taxCalendarData.isQuarterUrgent ? "bg-amber-500 text-white" : "bg-secondary text-muted-foreground"
                    )}>
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{t('commercial.quarterlyTax')}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(taxCalendarData.nextQuarterDate, "MMMM yyyy", { locale: tr })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-bold",
                        taxCalendarData.isQuarterUrgent ? "text-amber-600" : "text-foreground"
                      )}>
                        {taxCalendarData.daysToQuarter}
                      </p>
                      <p className="text-xs text-muted-foreground">{t('commercial.daysLeft', { days: taxCalendarData.daysToQuarter })}</p>
                    </div>
                  </div>
                </div>
                
                {/* This month VAT summary for declaration */}
                <div className="rounded-xl bg-emerald-500/10 p-4">
                  <h4 className="font-medium flex items-center gap-2 text-emerald-700">
                    <FileText className="h-4 w-4" />
                    {t('commercial.monthlyDeclaration')}
                  </h4>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.commercialExpense')}</span>
                      <span className="font-medium">{formatCurrency(currentMonthTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.deductibleVat')}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(currentMonthVAT)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-center text-muted-foreground">
                  {t('commercial.estimateDisclaimer')}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="expenses" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {t('commercial.filters')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={selectedDateRange} onValueChange={setSelectedDateRange}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder={t('commercial.period')} />
                    </SelectTrigger>
                    <SelectContent>
                      {DATE_FILTER_IDS.map((id) => (
                        <SelectItem key={id} value={id}>
                          {id === 'all' ? t('common:all') : id === 'this_month' ? t('common:time.thisMonth') : id === 'last_month' ? t('common:time.lastMonth', { defaultValue: 'Geçen Ay' }) : id === 'last_3_months' ? t('common:time.last3Months', { defaultValue: 'Son 3 Ay' }) : t('common:time.last6Months', { defaultValue: 'Son 6 Ay' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder={t('shopping.category')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('common:all')}</SelectItem>
                      {EXPENSE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}><CategoryIcon name={cat.icon} size={16} className="inline-block mr-1" />{t(cat.labelKey)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedCardId} onValueChange={setSelectedCardId}>
                    <SelectTrigger className="text-xs h-9">
                      <SelectValue placeholder={t('shopping.cardPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('purchases.allCards')}</SelectItem>
                      {commercialCards.map((card) => (
                        <SelectItem key={card.id} value={card.id}>{card.bankName}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Filtered results summary */}
                <div className="flex justify-between items-center text-sm pt-2 border-t">
                  <span className="text-muted-foreground">{t('commercial.transactionsShown', { count: filteredPurchases.length })}</span>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(filteredTotal)}</p>
                    <p className="text-xs text-emerald-600">{t('commercial.vat')}: {formatCurrency(filteredVAT)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Monthly Comparison Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  {t('commercial.monthlyComparison')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.some(d => d.office + d.travel + d.marketing + d.other > 0) ? (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyChartData}>
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        <Bar dataKey="office" name={t('commercial.chartOffice')} stackId="a" fill="hsl(221, 83%, 53%)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="travel" name={t('commercial.chartTravel')} stackId="a" fill="hsl(142, 71%, 45%)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="marketing" name={t('commercial.chartMarketing')} stackId="a" fill="hsl(262, 83%, 58%)" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="other" name={t('commercial.chartOther')} stackId="a" fill="hsl(215, 14%, 64%)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('commercial.noData')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* KDV Trend Line Chart */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  {t('commercial.monthlyVatTrend')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyChartData.some(d => d.vat > 0) ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={monthlyChartData}>
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                        <Tooltip 
                          formatter={(value: number) => formatCurrency(value)}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="vat"
                          name={t('commercial.vat')}
                          stroke="hsl(142, 71%, 45%)"
                          strokeWidth={3}
                          dot={{ fill: 'hsl(142, 71%, 45%)', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('commercial.noData')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Category Breakdown (moved from before) */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  {t('commercial.categoryDistribution')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {categoryBreakdown.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('purchases.noPurchases')}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryBreakdown.map((item) => {
                      const expenseCat = EXPENSE_CATEGORIES.find((c) => c.id === item.category);
                      const percentage = (item.amount / totalCommercialSpending) * 100;
                      
                      return (
                        <div key={item.category} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2">
                              <CategoryIcon name={expenseCat?.icon || "package"} size={16} />
                              <span>{expenseCat ? t(expenseCat.labelKey) : item.category}</span>
                            </span>
                            <span className="font-medium">{formatCurrency(item.amount)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-secondary overflow-hidden">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Commercial Cards List */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {t('commercial.myCommercialCards')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {commercialCards.map((card) => {
                  const cardPurchases = commercialPurchases.filter((p) => p.cardId === card.id);
                  const cardTotal = cardPurchases.reduce((sum, p) => sum + p.amount, 0);
                  const utilizationRate = (card.currentDebt / card.limit) * 100;
                  
                  return (
                    <div
                      key={card.id}
                      className="rounded-xl border border-border p-4 space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br",
                          card.color
                        )}>
                          <Building2 className="h-5 w-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{card.bankName}</p>
                          <p className="text-xs text-muted-foreground">
                            •••• {card.lastFourDigits}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">{t('commercial.totalSpending')}</p>
                          <p className="font-semibold">{formatCurrency(cardTotal)}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">{t('commercial.limitUsage')}</span>
                          <span className={cn(
                            "font-medium",
                            utilizationRate > 70 ? "text-destructive" :
                            utilizationRate > 40 ? "text-amber-500" : "text-emerald-500"
                          )}>
                            %{utilizationRate.toFixed(0)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              utilizationRate > 70 ? "bg-destructive" :
                              utilizationRate > 40 ? "bg-amber-500" : "bg-emerald-500"
                            )}
                            style={{ width: `${Math.min(utilizationRate, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  {t('commercial.expenseReports')}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {t('commercial.exportDesc')}
                </p>
                
                <div className="grid gap-3">
                  <Button
                    onClick={exportToExcel}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                      <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t('commercial.exportExcel')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('commercial.exportExcelDesc')}
                      </p>
                    </div>
                  </Button>
                  
                  <Button
                    onClick={exportToPDF}
                    variant="outline"
                    className="w-full justify-start gap-3 h-auto py-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                      <FileText className="h-5 w-5 text-red-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{t('commercial.exportPdf')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('commercial.exportPdfDesc')}
                      </p>
                    </div>
                  </Button>
                </div>
                
                <div className="rounded-xl bg-secondary/50 p-4 space-y-2 mt-4">
                  <h4 className="font-medium flex items-center gap-2 text-sm">
                    <Receipt className="h-4 w-4" />
                    {t('commercial.reportSummary')}
                  </h4>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.totalTransactions')}</span>
                      <span className="font-medium">{t('commercial.transactionsShown', { count: commercialPurchases.length })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.totalSpending')}</span>
                      <span className="font-medium">{formatCurrency(totalCommercialSpending)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.estimatedVat')}</span>
                      <span className="font-medium text-emerald-600">{formatCurrency(estimatedVAT)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('commercial.period')}</span>
                      <span className="font-medium">
                        {commercialPurchases.length > 0
                          ? `${format(new Date(Math.min(...commercialPurchases.map((p) => new Date(p.date).getTime()))), "MMM yyyy", { locale: tr })} - ${format(new Date(), "MMM yyyy", { locale: tr })}`
                          : "-"
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </PremiumLockOverlay>
      </main>
 
      <MobileNav activeTab="cards" />
    </div>
  );
}
 