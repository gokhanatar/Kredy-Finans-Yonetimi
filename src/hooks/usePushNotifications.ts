
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
1147
1148
1149
1150
1151
1152
1153
1154
1155
1156
1157
1158
1159
1160
1161
1162
1163
1164
1165
1166
1167
1168
1169
1170
1171
1172
1173
1174
1175
1176
1177
1178
1179
1180
1181
1182
1183
1184
1185
1186
1187
1188
1189
1190
1191
1192
1193
1194
1195
1196
1197
1198
1199
1200
1201
1202
1203
1204
1205
1206
1207
1208
1209
1210
1211
1212
1213
1214
1215
1216
1217
1218
1219
1220
1221
1222
1223
1224
1225
1226
1227
1228
1229
1230
1231
1232
1233
1234
1235
1236
1237
1238
1239
1240
1241
1242
1243
1244
1245
1246
1247
1248
1249
1250
1251
1252
1253
1254
1255
1256
1257
1258
1259
1260
1261
1262
1263
1264
1265
1266
1267
1268
1269
1270
1271
1272
1273
1274
1275
1276
1277
1278
1279
1280
1281
1282
1283
1284
1285
1286
1287
1288
1289
1290
1291
1292
1293
1294
1295
1296
1297
1298
1299
1300
1301
1302
1303
1304
1305
1306
1307
1308
1309
1310
1311
1312
1313
1314
1315
1316
1317
1318
1319
1320
1321
1322
1323
1324
1325
1326
1327
1328
1329
1330
1331
1332
1333
1334
1335
1336
1337
1338
1339
1340
1341
1342
1343
1344
1345
1346
1347
1348
1349
1350
1351
1352
1353
1354
1355
1356
1357
1358
1359
1360
1361
1362
1363
1364
1365
1366
1367
1368
1369
1370
1371
1372
1373
1374
1375
1376
1377
1378
1379
1380
1381
1382
1383
1384
1385
1386
1387
1388
1389
1390
1391
1392
1393
1394
1395
1396
1397
1398
1399
1400
1401
1402
1403
1404
1405
1406
1407
1408
1409
1410
1411
1412
1413
1414
1415
1416
1417
1418
1419
1420
1421
1422
1423
1424
1425
1426
1427
1428
1429
1430
1431
1432
1433
1434
1435
1436
1437
1438
1439
1440
1441
1442
1443
1444
1445
1446
1447
1448
1449
1450
1451
1452
1453
1454
1455
1456
1457
1458
1459
1460
1461
1462
1463
1464
1465
1466
1467
1468
1469
1470
1471
1472
1473
1474
1475
1476
1477
1478
1479
1480
1481
1482
1483
1484
1485
1486
1487
1488
1489
1490
1491
1492
1493
1494
1495
1496
1497
1498
1499
1500
1501
1502
1503
1504
1505
1506
1507
1508
1509 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useEffect, useCallback, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Capacitor } from '@capacitor/core';
import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { CreditCard, FINANCIAL_CONSTANTS } from '@/types/finance';
import { Loan } from '@/types/loan';
import { addDays, differenceInDays, isBefore, startOfDay, setHours, setMinutes, subDays, addMonths, getMonth, getYear, setDate, parseISO, format, getDaysInMonth } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Budget, Goal, RecurringExpense, Subscription, CategorySpendingLimit, FAMILY_STORAGE_KEYS, PERSONAL_STORAGE_KEYS, RecurringBill, Account, KMH_CONSTANTS } from '@/types/familyFinance';
import { calculateCardDailyInterest, calculateLoanDailyInterest } from '@/lib/overdueUtils';
import { Property, Vehicle } from '@/types/assetTypes';
import { Investment } from '@/types/investment';
 
interface NotificationSettings {
  enabled: boolean;
  paymentReminder: boolean;
  goldenWindowAlert: boolean;
  statementReminder: boolean;
  reminderDaysBefore: number;
  reminderTime: { hour: number; minute: number };
  // Vergi hatırlatıcı ayarları
  taxReminder: boolean;
  kdvReminderDays: number;
  quarterlyTaxReminder: boolean;
  // Gecikme bildirimi ayarları
  overdueReminder: boolean;
  overdueNotificationFrequency: 'daily' | 'every_3_days' | 'weekly';
  overdueNotificationTime: { hour: number; minute: number };
  // Kredi bildirimleri
  loanPaymentReminder: boolean;
  loanReminderDays: number;
  // Aile finansı bildirimleri
  budgetAlert: boolean;
  goalReminder: boolean;
  recurringExpenseReminder: boolean;
  subscriptionRenewalReminder: boolean;
  // Yatırım bildirimleri
  investmentPriceAlert: boolean;
  // Varlık vergi
  propertyTaxReminder: boolean;
  mtvReminder: boolean;
  // Araç & Gayrimenkul hatırlatmaları
  vehicleInspectionReminder: boolean;
  rentDueReminder: boolean;
  contractRenewalReminder: boolean;
  // Fatura hatırlatması
  recurringBillReminder: boolean;
  // KMH (Kredili Mevduat Hesabı) faiz bildirimi
  kmhInterestReminder: boolean;
  // Aile aktivite bildirimi (üye harcama, gelir, bütçe vs.)
  familyActivityNotification: boolean;
}
 
// All toggle keys (excluding non-toggle fields)
export const NOTIFICATION_TOGGLE_KEYS: (keyof NotificationSettings)[] = [
  'paymentReminder',
  'goldenWindowAlert',
  'statementReminder',
  'overdueReminder',
  'loanPaymentReminder',
  'taxReminder',
  'quarterlyTaxReminder',
  'propertyTaxReminder',
  'mtvReminder',
  'budgetAlert',
  'goalReminder',
  'recurringExpenseReminder',
  'subscriptionRenewalReminder',
  'investmentPriceAlert',
  'vehicleInspectionReminder',
  'rentDueReminder',
  'contractRenewalReminder',
  'recurringBillReminder',
  'kmhInterestReminder',
  'familyActivityNotification',
];
 
const DEFAULT_SETTINGS: NotificationSettings = {
  enabled: true,
  paymentReminder: true,
  goldenWindowAlert: true,
  statementReminder: true,
  reminderDaysBefore: 3,
  reminderTime: { hour: 9, minute: 0 },
  // Vergi hatırlatıcı varsayılanları
  taxReminder: false,
  kdvReminderDays: 5,
  quarterlyTaxReminder: true,
  // Gecikme bildirimi varsayılanları
  overdueReminder: true,
  overdueNotificationFrequency: 'daily',
  overdueNotificationTime: { hour: 10, minute: 0 },
  // Kredi bildirimi varsayılanları
  loanPaymentReminder: true,
  loanReminderDays: 3,
  // Aile finansı varsayılanları
  budgetAlert: true,
  goalReminder: true,
  recurringExpenseReminder: true,
  subscriptionRenewalReminder: true,
  // Yatırım varsayılanları
  investmentPriceAlert: true,
  // Varlık vergi varsayılanları
  propertyTaxReminder: true,
  mtvReminder: true,
  // Araç & Gayrimenkul hatırlatma varsayılanları
  vehicleInspectionReminder: true,
  rentDueReminder: true,
  contractRenewalReminder: true,
  // Fatura hatırlatma varsayılanı
  recurringBillReminder: true,
  // KMH faiz bildirimi varsayılanı
  kmhInterestReminder: true,
  // Aile aktivite varsayılanı
  familyActivityNotification: true,
};
 
export function usePushNotifications(cards: CreditCard[], loans: Loan[] = []) {
  const { t } = useTranslation(['notifications']);
  const [settings, setSettings] = useState<NotificationSettings>(() => {
    const stored = localStorage.getItem('kredi-pusula-notification-settings');
    return stored ? JSON.parse(stored) : DEFAULT_SETTINGS;
  });
  const [permissionGranted, setPermissionGranted] = useState(false);
 
  // Check and request permissions
  const requestPermissions = useCallback(async () => {
    try {
      const result = await LocalNotifications.requestPermissions();
      const granted = result.display === 'granted';
      setPermissionGranted(granted);
      return granted;
    } catch (error) {
      console.error('Notifications not available (web mode):', error);
      return false;
    }
  }, []);
 
  // Schedule payment reminder notifications
  const schedulePaymentReminders = useCallback(async () => {
    if (!settings.enabled || !settings.paymentReminder || !permissionGranted) return;
 
    try {
      // Cancel existing notifications first
      await LocalNotifications.cancel({ notifications: cards.map((_, i) => ({ id: 1000 + i })) });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
 
      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate due date
        let dueDate = new Date(currentYear, currentMonth, card.dueDate);
        if (isBefore(dueDate, today)) {
          dueDate = new Date(currentYear, currentMonth + 1, card.dueDate);
        }
 
        const reminderDate = addDays(dueDate, -settings.reminderDaysBefore);
        
        // Only schedule if reminder date is in the future
        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const debtFormatted = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const dateFormatted = format(dueDate, 'd MMMM', { locale: tr });
 
          notifications.notifications.push({
            id: 1000 + index,
            title: t('notifications:push.paymentApproaching'),
            body: t('notifications:push.paymentApproachingBody', { bank: card.bankName, card: card.cardName, days: settings.reminderDaysBefore, amount: debtFormatted, date: dateFormatted }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'payment-reminder',
            extra: { cardId: card.id },
          });
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule notifications:', error);
    }
  }, [cards, settings, permissionGranted]);
 
  // Schedule golden window notifications
  const scheduleGoldenWindowAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.goldenWindowAlert || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({ notifications: cards.map((_, i) => ({ id: 2000 + i })) });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
 
      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate next statement date
        let statementDate = new Date(currentYear, currentMonth, card.statementDate);
        if (isBefore(statementDate, today)) {
          statementDate = new Date(currentYear, currentMonth + 1, card.statementDate);
        }
 
        // Golden window starts day after statement
        const goldenWindowStart = addDays(statementDate, 1);
        
        if (differenceInDays(goldenWindowStart, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(goldenWindowStart, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          // Approximate golden window days: ~30 days to next statement + gap from statement to due
          const gapDays = card.dueDate >= card.statementDate
            ? card.dueDate - card.statementDate
            : 30 - card.statementDate + card.dueDate;
          const goldenDays = 30 + gapDays;
 
          notifications.notifications.push({
            id: 2000 + index,
            title: t('notifications:push.goldenWindowOpen'),
            body: t('notifications:push.goldenWindowBody', { bank: card.bankName, card: card.cardName, days: goldenDays }),
            schedule: { at: scheduleTime },
            sound: 'kredy_positive.wav',
            actionTypeId: 'golden-window',
            extra: { cardId: card.id },
          });
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule golden window alerts:', error);
    }
  }, [cards, settings, permissionGranted]);
 
  // Calculate next KDV declaration date (26th of each month)
  const calculateNextKDVDate = useCallback(() => {
    const today = new Date();
    const { KDV_DECLARATION_DAY } = FINANCIAL_CONSTANTS.TAX_DEADLINES;
    
    let kdvDate = setDate(today, KDV_DECLARATION_DAY);
    
    // If we're past the 26th, move to next month
    if (today.getDate() > KDV_DECLARATION_DAY) {
      kdvDate = addMonths(kdvDate, 1);
    }
    
    return startOfDay(kdvDate);
  }, []);
 
  // Calculate next quarterly tax date (17th of Jan, Apr, Jul, Oct)
  const calculateNextQuarterlyTaxDate = useCallback(() => {
    const today = new Date();
    const { QUARTERLY_TAX_MONTHS, QUARTERLY_TAX_DAY } = FINANCIAL_CONSTANTS.TAX_DEADLINES;
    const currentMonth = getMonth(today);
    const currentYear = getYear(today);
    
    // Find the next quarterly tax month
    let nextQuarterMonth = QUARTERLY_TAX_MONTHS.find(m => m > currentMonth);
    let nextYear = currentYear;
    
    if (!nextQuarterMonth) {
      // Move to next year's first quarter
      nextQuarterMonth = QUARTERLY_TAX_MONTHS[0];
      nextYear = currentYear + 1;
    }
    
    // If we're in a quarter month but past the deadline day
    if (currentMonth === nextQuarterMonth - 1 && today.getDate() > QUARTERLY_TAX_DAY) {
      const nextIdx = QUARTERLY_TAX_MONTHS.indexOf(nextQuarterMonth) + 1;
      if (nextIdx < QUARTERLY_TAX_MONTHS.length) {
        nextQuarterMonth = QUARTERLY_TAX_MONTHS[nextIdx];
      } else {
        nextQuarterMonth = QUARTERLY_TAX_MONTHS[0];
        nextYear = currentYear + 1;
      }
    }
    
    const quarterDate = new Date(nextYear, nextQuarterMonth - 1, QUARTERLY_TAX_DAY);
    return startOfDay(quarterDate);
  }, []);
 
  // Schedule tax reminder notifications
  const scheduleTaxReminders = useCallback(async () => {
    if (!settings.enabled || !settings.taxReminder || !permissionGranted) return;
 
    try {
      // Cancel existing tax notifications (IDs 3000-3010)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 10 }, (_, i) => ({ id: 3000 + i })) 
      });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
 
      // KDV beyanname bildirimi
      const nextKDVDate = calculateNextKDVDate();
      const kdvReminderDate = subDays(nextKDVDate, settings.kdvReminderDays);
      
      if (differenceInDays(kdvReminderDate, today) > 0) {
        const scheduleTime = setMinutes(
          setHours(kdvReminderDate, settings.reminderTime.hour),
          settings.reminderTime.minute
        );
 
        const kdvMonthName = format(nextKDVDate, 'MMMM', { locale: tr });
 
        notifications.notifications.push({
          id: 3000,
          title: t('notifications:push.kdvReminder'),
          body: t('notifications:push.kdvReminderBody', { days: settings.kdvReminderDays, month: kdvMonthName }),
          schedule: { at: scheduleTime },
          sound: 'kredy_warning.wav',
          actionTypeId: 'tax-reminder',
          extra: { type: 'kdv' },
        });
      }
 
      // Geçici vergi bildirimi
      if (settings.quarterlyTaxReminder) {
        const nextQuarterDate = calculateNextQuarterlyTaxDate();
        const quarterReminderDate = subDays(nextQuarterDate, settings.kdvReminderDays);
        
        if (differenceInDays(quarterReminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(quarterReminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const quarterMonth = getMonth(nextQuarterDate) + 1;
          const quarterName = t(`notifications:push.quarterNames.${quarterMonth}`, { defaultValue: String(quarterMonth) });
          const quarterDaysLeft = differenceInDays(nextQuarterDate, today);
 
          notifications.notifications.push({
            id: 3001,
            title: t('notifications:push.quarterlyTaxReminder'),
            body: t('notifications:push.quarterlyTaxBody', { quarter: quarterName, days: quarterDaysLeft }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'tax-reminder',
            extra: { type: 'quarterly' },
          });
        }
      }
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule tax reminders:', error);
    }
  }, [settings, permissionGranted, calculateNextKDVDate, calculateNextQuarterlyTaxDate]);
 
  // Schedule overdue notifications for cards and loans
  const scheduleOverdueNotifications = useCallback(async () => {
    if (!settings.enabled || !settings.overdueReminder || !permissionGranted) return;
 
    try {
      // Cancel existing overdue notifications (IDs 4000-4100)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 4000 + i })) 
      });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      // Check overdue cards
      cards.forEach((card) => {
        if (card.currentDebt <= 0) return;
 
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        let dueDate = new Date(currentYear, currentMonth, card.dueDate);
        
        // If this month's due date is in the future, check last month
        if (!isBefore(dueDate, today)) {
          dueDate = new Date(currentYear, currentMonth - 1, card.dueDate);
        }
 
        const calculation = calculateCardDailyInterest(card.currentDebt, dueDate, false);
        
        if (calculation.isOverdue && calculation.overdueDays > 0) {
          const scheduleTime = setMinutes(
            setHours(new Date(), settings.overdueNotificationTime.hour),
            settings.overdueNotificationTime.minute
          );
 
          // If scheduled time is past, schedule for next interval
          let notificationDate = scheduleTime;
          if (isBefore(scheduleTime, new Date())) {
            if (settings.overdueNotificationFrequency === 'daily') {
              notificationDate = addDays(scheduleTime, 1);
            } else if (settings.overdueNotificationFrequency === 'every_3_days') {
              notificationDate = addDays(scheduleTime, 3);
            } else {
              notificationDate = addDays(scheduleTime, 7);
            }
          }
 
          const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const totalInterest = calculation.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const debtFormatted = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const totalDue = (card.currentDebt + calculation.totalInterest).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 
          notifications.notifications.push({
            id: 4000 + notificationIndex,
            title: t('notifications:push.cardOverdue'),
            body: t('notifications:push.cardOverdueBody', { bank: card.bankName, card: card.cardName, days: calculation.overdueDays, daily: dailyAmount, total: totalInterest, debt: debtFormatted, totalDue }),
            schedule: { at: notificationDate },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'overdue-card',
            extra: { cardId: card.id, type: 'credit_card' },
          });
          notificationIndex++;
        }
      });
 
      // Check overdue loans
      loans.forEach((loan) => {
        if (loan.isPaid || !loan.isOverdue || loan.overdueDays <= 0) return;
 
        const calculation = calculateLoanDailyInterest(
          loan.monthlyPayment,
          loan.overdueInterestRate,
          loan.overdueDays
        );
 
        const scheduleTime = setMinutes(
          setHours(new Date(), settings.overdueNotificationTime.hour),
          settings.overdueNotificationTime.minute
        );
 
        let notificationDate = scheduleTime;
        if (isBefore(scheduleTime, new Date())) {
          if (settings.overdueNotificationFrequency === 'daily') {
            notificationDate = addDays(scheduleTime, 1);
          } else if (settings.overdueNotificationFrequency === 'every_3_days') {
            notificationDate = addDays(scheduleTime, 3);
          } else {
            notificationDate = addDays(scheduleTime, 7);
          }
        }
 
        const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalInterest = loan.totalOverdueInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const paymentFormatted = loan.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 
        notifications.notifications.push({
          id: 4000 + notificationIndex,
          title: t('notifications:push.loanOverdue'),
          body: t('notifications:push.loanOverdueBody', { bank: loan.bankName, name: loan.name, days: loan.overdueDays, daily: dailyAmount, total: totalInterest, payment: paymentFormatted }),
          schedule: { at: notificationDate },
          sound: 'kredy_urgent.wav',
          actionTypeId: 'overdue-loan',
          extra: { loanId: loan.id, type: 'loan' },
        });
        notificationIndex++;
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule overdue notifications:', error);
    }
  }, [cards, loans, settings, permissionGranted]);
 
  // Schedule loan payment reminders
  const scheduleLoanReminders = useCallback(async () => {
    if (!settings.enabled || !settings.loanPaymentReminder || !permissionGranted) return;
 
    try {
      // Cancel existing loan reminders (IDs 5000-5100)
      await LocalNotifications.cancel({ 
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 5000 + i })) 
      });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
 
      loans.forEach((loan, index) => {
        if (loan.isPaid || loan.remainingInstallments <= 0) return;
 
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
        
        // Calculate next due date
        let dueDate = new Date(currentYear, currentMonth, loan.dueDay);
        if (isBefore(dueDate, today)) {
          dueDate = addMonths(dueDate, 1);
        }
 
        const reminderDate = subDays(dueDate, settings.loanReminderDays);
        
        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const paymentAmount = loan.monthlyPayment.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
          notifications.notifications.push({
            id: 5000 + index,
            title: t('notifications:push.loanApproaching'),
            body: t('notifications:push.loanApproachingBody', { bank: loan.bankName, name: loan.name, amount: paymentAmount, days: settings.loanReminderDays, remaining: loan.remainingInstallments }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'loan-reminder',
            extra: { loanId: loan.id },
          });
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule loan reminders:', error);
    }
  }, [loans, settings, permissionGranted]);
 
  // Schedule budget alerts when spending exceeds threshold of category limit
  const scheduleBudgetAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.budgetAlert || !permissionGranted) return;
 
    try {
      // Cancel existing budget notifications (IDs 6000-6100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 6000 + i })),
      });
 
      const budgetsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.BUDGETS);
      const limitsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.CATEGORY_LIMITS);
      if (!budgetsRaw) return;
 
      const budgets: Budget[] = JSON.parse(budgetsRaw);
      const categoryLimits: CategorySpendingLimit[] = limitsRaw ? JSON.parse(limitsRaw) : [];
 
      const now = new Date();
      const currentBudget = budgets.find(
        (b) => b.month === now.getMonth() && b.year === now.getFullYear()
      );
      if (!currentBudget) return;
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      currentBudget.categories.forEach((category) => {
        if (category.allocated <= 0) return;
 
        // Check category-specific limit threshold or default 80%
        const limitConfig = categoryLimits.find((l) => l.categoryId === category.name as never);
        const threshold = limitConfig ? limitConfig.alertThreshold / 100 : 0.8;
 
        const usageRatio = category.spent / category.allocated;
        if (usageRatio >= threshold) {
          const tomorrow = addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(tomorrow, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const spentFormatted = category.spent.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const allocatedFormatted = category.allocated.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
          const percentage = Math.round(usageRatio * 100);
          const daysLeft = getDaysInMonth(today) - today.getDate();
          const remainingBudget = Math.max(0, category.allocated - category.spent);
          const dailyLeft = daysLeft > 0
            ? (remainingBudget / daysLeft).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
            : '0';
 
          notifications.notifications.push({
            id: 6000 + notificationIndex,
            title: t('notifications:push.budgetAlert'),
            body: t('notifications:push.budgetAlertBody', { category: category.name, spent: spentFormatted, allocated: allocatedFormatted, percentage, daysLeft, dailyLeft }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'budget-alert',
            extra: { categoryId: category.id, type: 'budget' },
          });
          notificationIndex++;
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule budget alerts:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule goal reminders for deadlines approaching within 7 days
  const scheduleGoalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.goalReminder || !permissionGranted) return;
 
    try {
      // Cancel existing goal notifications (IDs 7000-7100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 7000 + i })),
      });
 
      const goalsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.GOALS);
      if (!goalsRaw) return;
 
      const goals: Goal[] = JSON.parse(goalsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      goals.forEach((goal) => {
        if (!goal.deadline) return;
        if (goal.currentAmount >= goal.targetAmount) return;
 
        const deadlineDate = startOfDay(parseISO(goal.deadline));
        const daysRemaining = differenceInDays(deadlineDate, today);
 
        // Only alert if deadline is within 7 days and in the future
        if (daysRemaining > 0 && daysRemaining <= 7) {
          const tomorrow = addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(tomorrow, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const remaining = (goal.targetAmount - goal.currentAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          const progress = Math.round((goal.currentAmount / goal.targetAmount) * 100);
 
          notifications.notifications.push({
            id: 7000 + notificationIndex,
            title: t('notifications:push.goalDeadline'),
            body: t('notifications:push.goalDeadlineBody', { name: goal.name, days: daysRemaining, remaining, progress }),
            schedule: { at: scheduleTime },
            sound: 'kredy_positive.wav',
            actionTypeId: 'goal-reminder',
            extra: { goalId: goal.id, type: 'goal' },
          });
          notificationIndex++;
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule goal reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule recurring expense reminders for upcoming payment days
  const scheduleRecurringExpenseReminders = useCallback(async () => {
    if (!settings.enabled || !settings.recurringExpenseReminder || !permissionGranted) return;
 
    try {
      // Cancel existing recurring expense notifications (IDs 8000-8050)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 8000 + i })),
      });
 
      const expensesRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.RECURRING_EXPENSES);
      if (!expensesRaw) return;
 
      const expenses: RecurringExpense[] = JSON.parse(expensesRaw);
      const today = startOfDay(new Date());
      const todayDayOfWeek = today.getDay(); // 0=Sunday
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      expenses.forEach((expense) => {
        if (!expense.isActive) return;
 
        // Find next active day for this expense
        const sortedDays = [...expense.activeDays].sort((a, b) => a - b);
        let nextActiveDay = sortedDays.find((d) => d > todayDayOfWeek);
        let daysUntilNext = 0;
 
        if (nextActiveDay !== undefined) {
          daysUntilNext = nextActiveDay - todayDayOfWeek;
        } else if (sortedDays.length > 0) {
          // Wrap to next week
          nextActiveDay = sortedDays[0];
          daysUntilNext = 7 - todayDayOfWeek + nextActiveDay;
        } else {
          return;
        }
 
        // Schedule reminder 1 day before the next active day (or today if tomorrow is active)
        if (daysUntilNext <= settings.reminderDaysBefore && daysUntilNext > 0) {
          const reminderDate = addDays(today, daysUntilNext > 1 ? daysUntilNext - 1 : 0);
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          // Only schedule if in the future
          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = expense.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
            notifications.notifications.push({
              id: 8000 + notificationIndex,
              title: t('notifications:push.recurringExpense'),
              body: t('notifications:push.recurringExpenseBody', { name: expense.name, amount: amountFormatted, days: daysUntilNext }),
              schedule: { at: scheduleTime },
              sound: 'kredy_info.wav',
              actionTypeId: 'recurring-expense',
              extra: { expenseId: expense.id, type: 'recurring_expense' },
            });
            notificationIndex++;
          }
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule recurring expense reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule subscription renewal reminders 3 days before billing date
  const scheduleSubscriptionRenewalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.subscriptionRenewalReminder || !permissionGranted) return;
 
    try {
      // Cancel existing subscription notifications (IDs 8050-8100)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 8050 + i })),
      });
 
      const subsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.SUBSCRIPTIONS);
      if (!subsRaw) return;
 
      const subscriptions: Subscription[] = JSON.parse(subsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      const cycleMap: Record<string, string> = { weekly: 'haftalık', monthly: 'aylık', yearly: 'yıllık' };
 
      subscriptions.forEach((sub) => {
        if (!sub.isActive) return;
 
        const cycle = cycleMap[sub.billingCycle] || sub.billingCycle;
 
        // Calculate next billing date
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();
        const day = Math.min(sub.billingDate, new Date(year, month + 1, 0).getDate());
 
        const nextBillingDate = new Date(year, month, day);
        if (nextBillingDate <= now) {
          if (sub.billingCycle === 'weekly') {
            nextBillingDate.setDate(nextBillingDate.getDate() + 7);
          } else if (sub.billingCycle === 'monthly') {
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
          } else {
            nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
          }
        }
 
        const reminderDate = subDays(startOfDay(nextBillingDate), 3);
        const daysUntilBilling = differenceInDays(startOfDay(nextBillingDate), today);
 
        // Schedule if reminder date is in the future (billing within ~3 days)
        if (daysUntilBilling > 0 && daysUntilBilling <= 3) {
          // Billing is within 3 days, schedule for today or tomorrow
          const scheduleDate = isBefore(today, reminderDate) ? reminderDate : addDays(today, 1);
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = sub.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
            notifications.notifications.push({
              id: 8050 + notificationIndex,
              title: t('notifications:push.subscriptionRenewal'),
              body: t('notifications:push.subscriptionRenewalBody', { name: sub.name, amount: amountFormatted, days: daysUntilBilling, cycle }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'subscription-renewal',
              extra: { subscriptionId: sub.id, type: 'subscription' },
            });
            notificationIndex++;
          }
        } else if (differenceInDays(reminderDate, today) > 0) {
          // Reminder date is still in the future (more than 3 days to billing)
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const amountFormatted = sub.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
 
          notifications.notifications.push({
            id: 8050 + notificationIndex,
            title: t('notifications:push.subscriptionRenewal'),
            body: t('notifications:push.subscriptionRenewalBody', { name: sub.name, amount: amountFormatted, days: daysUntilBilling, cycle }),
            schedule: { at: scheduleTime },
            sound: 'kredy_reminder.wav',
            actionTypeId: 'subscription-renewal',
            extra: { subscriptionId: sub.id, type: 'subscription' },
          });
          notificationIndex++;
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule subscription renewal reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule statement reminders (1 day before statement date)
  const scheduleStatementReminders = useCallback(async () => {
    if (!settings.enabled || !settings.statementReminder || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9100 + i })),
      });
 
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
 
      cards.forEach((card, index) => {
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
 
        let statementDate = new Date(currentYear, currentMonth, card.statementDate);
        if (isBefore(statementDate, today)) {
          statementDate = new Date(currentYear, currentMonth + 1, card.statementDate);
        }
 
        // Remind 1 day before statement date
        const reminderDate = subDays(statementDate, 1);
 
        if (differenceInDays(reminderDate, today) > 0) {
          const scheduleTime = setMinutes(
            setHours(reminderDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          const debtAmount = card.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 
          notifications.notifications.push({
            id: 9100 + index,
            title: t('notifications:push.statementReminder'),
            body: t('notifications:push.statementReminderBody', { bank: card.bankName, card: card.cardName, amount: debtAmount }),
            schedule: { at: scheduleTime },
            sound: 'kredy_info.wav',
            actionTypeId: 'statement-reminder',
            extra: { cardId: card.id },
          });
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule statement reminders:', error);
    }
  }, [cards, settings, permissionGranted]);
 
  // Schedule vehicle inspection reminders (30/14/7/1 days before)
  const scheduleVehicleInspectionReminders = useCallback(async () => {
    if (!settings.enabled || !settings.vehicleInspectionReminder || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9200 + i })),
      });
 
      const vehiclesRaw = localStorage.getItem('kredi-pusula-vehicles');
      if (!vehiclesRaw) return;
 
      const vehicles: Vehicle[] = JSON.parse(vehiclesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      vehicles.forEach((vehicle) => {
        if (!vehicle.lastInspectionDate) return;
 
        // Next inspection is ~2 years after last inspection
        const lastInspection = new Date(vehicle.lastInspectionDate);
        const nextInspection = addMonths(startOfDay(lastInspection), 24);
 
        const reminderDays = [30, 14, 7, 1];
        reminderDays.forEach((daysBefore) => {
          const reminderDate = subDays(nextInspection, daysBefore);
          const daysUntil = differenceInDays(reminderDate, today);
 
          if (daysUntil > 0 && daysUntil <= daysBefore + 1) {
            const scheduleTime = setMinutes(
              setHours(reminderDate, settings.reminderTime.hour),
              settings.reminderTime.minute
            );
 
            notifications.notifications.push({
              id: 9200 + notificationIndex,
              title: t('notifications:push.vehicleInspection'),
              body: t('notifications:push.vehicleInspectionBody', { name: vehicle.name, plate: vehicle.plate, days: daysBefore }),
              schedule: { at: scheduleTime },
              sound: 'kredy_warning.wav',
              actionTypeId: 'vehicle-inspection',
              extra: { vehicleName: vehicle.name },
            });
            notificationIndex++;
          }
        });
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule vehicle inspection reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule rent due reminders (3 days before rental day of month)
  const scheduleRentDueReminders = useCallback(async () => {
    if (!settings.enabled || !settings.rentDueReminder || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9300 + i })),
      });
 
      const propertiesRaw = localStorage.getItem('kredi-pusula-properties');
      if (!propertiesRaw) return;
 
      const properties: Property[] = JSON.parse(propertiesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      properties.forEach((property) => {
        if (!property.isRented || !property.rentalDayOfMonth) return;
 
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
 
        let rentDate = new Date(currentYear, currentMonth, property.rentalDayOfMonth);
        if (isBefore(rentDate, today)) {
          rentDate = addMonths(rentDate, 1);
        }
 
        const reminderDate = subDays(rentDate, 3);
 
        if (differenceInDays(reminderDate, today) >= 0) {
          const scheduleDate = differenceInDays(reminderDate, today) === 0
            ? addDays(today, 1)
            : reminderDate;
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = property.monthlyRentAmount
              ? property.monthlyRentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
              : '?';
 
            notifications.notifications.push({
              id: 9300 + notificationIndex,
              title: t('notifications:push.rentDue'),
              body: t('notifications:push.rentDueBody', { name: property.name, days: 3, amount: amountFormatted }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'rent-due',
              extra: { propertyName: property.name },
            });
            notificationIndex++;
          }
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule rent due reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule contract renewal reminders (30/14/7 days before)
  const scheduleContractRenewalReminders = useCallback(async () => {
    if (!settings.enabled || !settings.contractRenewalReminder || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9400 + i })),
      });
 
      const propertiesRaw = localStorage.getItem('kredi-pusula-properties');
      if (!propertiesRaw) return;
 
      const properties: Property[] = JSON.parse(propertiesRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      properties.forEach((property) => {
        if (!property.isRented || !property.contractEndDate) return;
 
        const contractEnd = startOfDay(parseISO(property.contractEndDate));
        const daysUntilEnd = differenceInDays(contractEnd, today);
 
        if (daysUntilEnd <= 0) return; // Already expired
 
        const reminderDays = [30, 14, 7];
        reminderDays.forEach((daysBefore) => {
          if (daysUntilEnd <= daysBefore && daysUntilEnd > 0) {
            const reminderDate = subDays(contractEnd, daysBefore);
            const scheduleDate = differenceInDays(reminderDate, today) <= 0
              ? addDays(today, 1)
              : reminderDate;
            const scheduleTime = setMinutes(
              setHours(scheduleDate, settings.reminderTime.hour),
              settings.reminderTime.minute
            );
 
            if (isBefore(new Date(), scheduleTime)) {
              const contractDateFormatted = format(contractEnd, 'd MMMM yyyy', { locale: tr });
 
              notifications.notifications.push({
                id: 9400 + notificationIndex,
                title: t('notifications:push.contractRenewal'),
                body: t('notifications:push.contractRenewalBody', { name: property.name, days: daysUntilEnd, date: contractDateFormatted }),
                schedule: { at: scheduleTime },
                sound: 'kredy_info.wav',
                actionTypeId: 'contract-renewal',
                extra: { propertyName: property.name },
              });
              notificationIndex++;
            }
          }
        });
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule contract renewal reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule recurring bill reminders (2 days before payment day)
  const scheduleRecurringBillReminders = useCallback(async () => {
    if (!settings.enabled || !settings.recurringBillReminder || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 100 }, (_, i) => ({ id: 9500 + i })),
      });
 
      const billsRaw = localStorage.getItem(FAMILY_STORAGE_KEYS.MONTHLY_BILLS);
      if (!billsRaw) return;
 
      const bills: RecurringBill[] = JSON.parse(billsRaw);
      const today = startOfDay(new Date());
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      bills.forEach((bill) => {
        if (!bill.isActive || bill.frequency !== 'monthly' || !bill.dayOfMonth) return;
 
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();
 
        let billDate = new Date(currentYear, currentMonth, bill.dayOfMonth);
        if (isBefore(billDate, today)) {
          billDate = addMonths(billDate, 1);
        }
 
        const reminderDate = subDays(billDate, 2);
 
        if (differenceInDays(reminderDate, today) >= 0) {
          const scheduleDate = differenceInDays(reminderDate, today) === 0
            ? addDays(today, 1)
            : reminderDate;
          const scheduleTime = setMinutes(
            setHours(scheduleDate, settings.reminderTime.hour),
            settings.reminderTime.minute
          );
 
          if (isBefore(new Date(), scheduleTime)) {
            const amountFormatted = (bill.fixedAmount || bill.lastPaidAmount || 0)
              .toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 
            notifications.notifications.push({
              id: 9500 + notificationIndex,
              title: t('notifications:push.recurringBill'),
              body: t('notifications:push.recurringBillBody', { name: bill.name, days: 2, amount: amountFormatted }),
              schedule: { at: scheduleTime },
              sound: 'kredy_reminder.wav',
              actionTypeId: 'recurring-bill',
              extra: { billId: bill.id },
            });
            notificationIndex++;
          }
        }
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule recurring bill reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule daily investment portfolio summary
  const scheduleInvestmentPriceAlerts = useCallback(async () => {
    if (!settings.enabled || !settings.investmentPriceAlert || !permissionGranted) return;
 
    try {
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 10 }, (_, i) => ({ id: 9600 + i })),
      });
 
      const investmentsRaw = localStorage.getItem('kredi-pusula-investments');
      if (!investmentsRaw) return;
 
      const investments: Investment[] = JSON.parse(investmentsRaw);
      if (investments.length === 0) return;
 
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const scheduleTime = setMinutes(
        setHours(tomorrow, settings.reminderTime.hour),
        settings.reminderTime.minute
      );
 
      const totalValue = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
      const totalFormatted = totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
      const uniqueCategories = new Set(investments.map(inv => inv.category)).size;
 
      await LocalNotifications.schedule({
        notifications: [{
          id: 9600,
          title: t('notifications:push.investmentSummary'),
          body: t('notifications:push.investmentSummaryBody', { count: investments.length, total: totalFormatted, types: uniqueCategories }),
          schedule: { at: scheduleTime },
          sound: 'kredy_positive.wav',
          actionTypeId: 'investment-alert',
          extra: { type: 'investment_summary' },
        }],
      });
    } catch (error) {
      console.error('Failed to schedule investment price alerts:', error);
    }
  }, [settings, permissionGranted]);
 
  // Schedule KMH interest reminders for accounts with negative balance
  const scheduleKMHInterestReminders = useCallback(async () => {
    if (!settings.enabled || !settings.kmhInterestReminder || !permissionGranted) return;
 
    try {
      // Cancel existing KMH notifications (IDs 9700-9749)
      await LocalNotifications.cancel({
        notifications: Array.from({ length: 50 }, (_, i) => ({ id: 9700 + i })),
      });
 
      // Check both personal and family accounts
      const keys = [PERSONAL_STORAGE_KEYS.ACCOUNTS, FAMILY_STORAGE_KEYS.ACCOUNTS];
      const allAccounts: Account[] = [];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (raw) allAccounts.push(...JSON.parse(raw));
      }
 
      const kmhAccounts = allAccounts.filter(
        (a) => a.kmhEnabled && a.balance < 0
      );
 
      if (kmhAccounts.length === 0) return;
 
      const today = startOfDay(new Date());
      const tomorrow = addDays(today, 1);
      const notifications: ScheduleOptions = { notifications: [] };
      let notificationIndex = 0;
 
      kmhAccounts.forEach((account) => {
        const negativeBalance = Math.abs(account.balance);
        const rate = account.kmhInterestRate || KMH_CONSTANTS.DEFAULT_INTEREST_RATE;
        const dailyInterest = negativeBalance * (rate / 100 / 30) * KMH_CONSTANTS.TAX_MULTIPLIER;
        const kmhLimit = account.kmhLimit || 0;
        const usagePercent = kmhLimit > 0 ? (negativeBalance / kmhLimit) * 100 : 0;
 
        const scheduleTime = setMinutes(
          setHours(tomorrow, settings.reminderTime.hour),
          settings.reminderTime.minute
        );
 
        const dailyFormatted = dailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const balanceFormatted = negativeBalance.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
 
        // Critical alert if usage > 75%
        if (usagePercent >= KMH_CONSTANTS.SEVERITY_HIGH * 100) {
          notifications.notifications.push({
            id: 9700 + notificationIndex,
            title: t('notifications:push.kmhCritical', { defaultValue: 'KMH Kritik Uyar\u0131!' }),
            body: t('notifications:push.kmhCriticalBody', {
              defaultValue: '{{name}} hesab\u0131n\u0131z\u0131n KMH kullan\u0131m\u0131 %{{percent}} seviyesinde. Eksi bakiye: \u20ba{{balance}}, g\u00fcnl\u00fck faiz: \u20ba{{daily}}',
              name: account.name,
              percent: Math.round(usagePercent),
              balance: balanceFormatted,
              daily: dailyFormatted,
            }),
            schedule: { at: scheduleTime },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'kmh-critical',
            extra: { accountId: account.id, type: 'kmh' },
          });
        } else {
          notifications.notifications.push({
            id: 9700 + notificationIndex,
            title: t('notifications:push.kmhInterestReminder', { defaultValue: 'KMH Faiz Hat\u0131rlatmas\u0131' }),
            body: t('notifications:push.kmhInterestReminderBody', {
              defaultValue: '{{name}} hesab\u0131n\u0131z eksi bakiyede. G\u00fcnl\u00fck faiz: \u20ba{{daily}}, toplam eksi: \u20ba{{balance}}',
              name: account.name,
              daily: dailyFormatted,
              balance: balanceFormatted,
            }),
            schedule: { at: scheduleTime },
            sound: 'kredy_warning.wav',
            actionTypeId: 'kmh-reminder',
            extra: { accountId: account.id, type: 'kmh' },
          });
        }
        notificationIndex++;
      });
 
      if (notifications.notifications.length > 0) {
        await LocalNotifications.schedule(notifications);
      }
    } catch (error) {
      console.error('Failed to schedule KMH interest reminders:', error);
    }
  }, [settings, permissionGranted]);
 
  // Generate daily overdue summary message
  const generateOverdueSummary = useCallback((): { messages: string[]; totalDailyInterest: number } => {
    const messages: string[] = [];
    let totalDailyInterest = 0;
    const today = startOfDay(new Date());
 
    // Check cards
    cards.forEach((card) => {
      if (card.currentDebt <= 0) return;
 
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();
      let dueDate = new Date(currentYear, currentMonth, card.dueDate);
      
      if (!isBefore(dueDate, today)) {
        dueDate = new Date(currentYear, currentMonth - 1, card.dueDate);
      }
 
      const calculation = calculateCardDailyInterest(card.currentDebt, dueDate, false);
      
      if (calculation.isOverdue) {
        const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const totalInterest = calculation.totalInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        
        messages.push(
          t('notifications:push.summaryCardOverdue', { bank: card.bankName, card: card.cardName, days: calculation.overdueDays, daily: dailyAmount, total: totalInterest })
        );
        totalDailyInterest += calculation.dailyAmount;
      }
    });
 
    // Check loans
    loans.forEach((loan) => {
      if (loan.isPaid || !loan.isOverdue || loan.overdueDays <= 0) return;
 
      const calculation = calculateLoanDailyInterest(
        loan.monthlyPayment,
        loan.overdueInterestRate,
        loan.overdueDays
      );
 
      const dailyAmount = calculation.dailyAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const totalInterest = loan.totalOverdueInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      
      messages.push(
        t('notifications:push.summaryLoanOverdue', { bank: loan.bankName, name: loan.name, days: loan.overdueDays, daily: dailyAmount, total: totalInterest })
      );
      totalDailyInterest += calculation.dailyAmount;
    });
 
    // Add summary if multiple items
    if (messages.length > 1) {
      const totalFormatted = totalDailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      messages.push(t('notifications:push.summaryTotal', { count: messages.length, amount: totalFormatted }));
    }
 
    return { messages, totalDailyInterest };
  }, [cards, loans]);
 
  // Update settings
  const updateSettings = useCallback((newSettings: Partial<NotificationSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      localStorage.setItem('kredi-pusula-notification-settings', JSON.stringify(updated));
      return updated;
    });
  }, []);
 
  // Send immediate test notification (includes first card's ID for payment action testing)
  const sendTestNotification = useCallback(async () => {
    try {
      const firstCard = cards.length > 0 ? cards[0] : null;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9999,
            title: firstCard
              ? t('notifications:push.paymentApproaching')
              : t('notifications:push.testTitle'),
            body: firstCard
              ? t('notifications:push.paymentApproachingBody', {
                  bank: firstCard.bankName,
                  card: firstCard.cardName,
                  days: 3,
                  amount: firstCard.currentDebt.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                  date: 'test',
                })
              : t('notifications:push.testBody'),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'kredy_info.wav',
            actionTypeId: firstCard ? 'payment-reminder' : 'test-notification',
            extra: firstCard ? { cardId: firstCard.id } : undefined,
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }, [cards]);
 
  // Send immediate overdue notification (for testing)
  const sendOverdueTestNotification = useCallback(async () => {
    const { messages, totalDailyInterest } = generateOverdueSummary();
    
    if (messages.length === 0) {
      try {
        await LocalNotifications.schedule({
          notifications: [
            {
              id: 9998,
              title: t('notifications:push.noOverdue'),
              body: t('notifications:push.noOverdueBody'),
              schedule: { at: new Date(Date.now() + 1000) },
              sound: 'kredy_info.wav',
            },
          ],
        });
        return true;
      } catch (error) {
        console.error('Test notification failed:', error);
        return false;
      }
    }
 
    try {
      const totalFormatted = totalDailyInterest.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 9998,
            title: t('notifications:push.overdueTitle'),
            body: t('notifications:push.overdueBody', { count: messages.length, amount: totalFormatted }),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'kredy_urgent.wav',
            actionTypeId: 'overdue-reminder',
          },
        ],
      });
      return true;
    } catch (error) {
      console.error('Test notification failed:', error);
      return false;
    }
  }, [generateOverdueSummary]);
 
  // Initialize permissions on mount
  useEffect(() => {
    requestPermissions();
  }, [requestPermissions]);
 
  // Reschedule notifications when cards, loans or settings change
  useEffect(() => {
    if (permissionGranted) {
      schedulePaymentReminders();
      scheduleGoldenWindowAlerts();
      scheduleTaxReminders();
      scheduleOverdueNotifications();
      scheduleLoanReminders();
      scheduleBudgetAlerts();
      scheduleGoalReminders();
      scheduleRecurringExpenseReminders();
      scheduleSubscriptionRenewalReminders();
      scheduleStatementReminders();
      scheduleVehicleInspectionReminders();
      scheduleRentDueReminders();
      scheduleContractRenewalReminders();
      scheduleRecurringBillReminders();
      scheduleInvestmentPriceAlerts();
      scheduleKMHInterestReminders();
    }
  }, [permissionGranted, schedulePaymentReminders, scheduleGoldenWindowAlerts, scheduleTaxReminders, scheduleOverdueNotifications, scheduleLoanReminders, scheduleBudgetAlerts, scheduleGoalReminders, scheduleRecurringExpenseReminders, scheduleSubscriptionRenewalReminders, scheduleStatementReminders, scheduleVehicleInspectionReminders, scheduleRentDueReminders, scheduleContractRenewalReminders, scheduleRecurringBillReminders, scheduleInvestmentPriceAlerts, scheduleKMHInterestReminders]);
 
  // Re-schedule all notifications when app returns to foreground
  const permissionRef = useRef(permissionGranted);
  permissionRef.current = permissionGranted;
 
  const rescheduleAll = useCallback(() => {
    schedulePaymentReminders();
    scheduleGoldenWindowAlerts();
    scheduleTaxReminders();
    scheduleOverdueNotifications();
    scheduleLoanReminders();
    scheduleBudgetAlerts();
    scheduleGoalReminders();
    scheduleRecurringExpenseReminders();
    scheduleSubscriptionRenewalReminders();
    scheduleStatementReminders();
    scheduleVehicleInspectionReminders();
    scheduleRentDueReminders();
    scheduleContractRenewalReminders();
    scheduleRecurringBillReminders();
    scheduleInvestmentPriceAlerts();
    scheduleKMHInterestReminders();
  }, [schedulePaymentReminders, scheduleGoldenWindowAlerts, scheduleTaxReminders, scheduleOverdueNotifications, scheduleLoanReminders, scheduleBudgetAlerts, scheduleGoalReminders, scheduleRecurringExpenseReminders, scheduleSubscriptionRenewalReminders, scheduleStatementReminders, scheduleVehicleInspectionReminders, scheduleRentDueReminders, scheduleContractRenewalReminders, scheduleRecurringBillReminders, scheduleInvestmentPriceAlerts, scheduleKMHInterestReminders]);
 
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
 
    let listener: { remove: () => void } | null = null;
 
    (async () => {
      try {
        const { App } = await import('@capacitor/app');
        const l = await App.addListener('appStateChange', ({ isActive }) => {
          if (isActive && permissionRef.current) {
            rescheduleAll();
          }
        });
        listener = l;
      } catch { /* web — no Capacitor */ }
    })();
 
    return () => { listener?.remove(); };
  }, [rescheduleAll]);
 
  return {
    settings,
    updateSettings,
    permissionGranted,
    requestPermissions,
    sendTestNotification,
    sendOverdueTestNotification,
    generateOverdueSummary,
    // Yeni export'lar
    calculateNextKDVDate,
    calculateNextQuarterlyTaxDate,
    scheduleOverdueNotifications,
    scheduleLoanReminders,
    scheduleBudgetAlerts,
    scheduleGoalReminders,
    scheduleRecurringExpenseReminders,
    scheduleSubscriptionRenewalReminders,
    scheduleStatementReminders,
    scheduleVehicleInspectionReminders,
    scheduleRentDueReminders,
    scheduleContractRenewalReminders,
    scheduleRecurringBillReminders,
    scheduleInvestmentPriceAlerts,
    scheduleKMHInterestReminders,
  };
}
 