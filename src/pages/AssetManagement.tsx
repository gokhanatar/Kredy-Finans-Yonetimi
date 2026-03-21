
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Home, Car, Building2, Plus, Trash2, Edit, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PremiumLockOverlay } from '@/components/PremiumLockOverlay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from '@/components/ui/alert-dialog';
import { PropertyForm } from '@/components/PropertyForm';
import { VehicleForm } from '@/components/VehicleForm';
import { TaxCalendar } from '@/components/TaxCalendar';
import { useAssets } from '@/hooks/useAssets';
import { useAssetTaxNotifications } from '@/hooks/useAssetTaxNotifications';
import { 
  calculatePropertyTax, 
  checkInspectionStatus, 
  checkDisabledSaleRestriction,
  formatAssetCurrency,
  formatAssetDate,
} from '@/lib/assetTaxUtils';
import { 
  PROPERTY_TYPE_LABELS, 
  LOCATION_LABELS, 
  VEHICLE_TYPE_LABELS,
} from '@/types/assetTypes';
import { cn } from '@/lib/utils';
 
export default function AssetManagement() {
  const navigate = useNavigate();
  const { t } = useTranslation(['assets', 'common']);
  const [activeTab, setActiveTab] = useState('properties');
  
  const {
    properties,
    vehicles,
    businesses,
    addProperty,
    deleteProperty,
    addVehicle,
    deleteVehicle,
  } = useAssets();
  
  const { getUpcomingCritical } = useAssetTaxNotifications(properties, vehicles, businesses);
  const criticalNotifications = getUpcomingCritical(14);
 
  return (
    <div className="min-h-screen bg-background pb-safe-nav">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('subtitle')}
            </p>
          </div>
        </div>
      </div>
 
      <div className="p-4 space-y-4">
        {/* FREE: Critical notifications + tax calendar */}
        {criticalNotifications.length > 0 && (
          <Card className="border-orange-500/30 bg-orange-500/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-orange-600">
                <AlertCircle className="h-4 w-4" />
                {t('upcomingDeadlines')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {criticalNotifications.slice(0, 3).map((notification) => (
                <div
                  key={notification.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>{notification.title}</span>
                  <Badge variant={notification.severity === 'danger' ? 'destructive' : 'secondary'}>
                    {t('vehicle.daysRemaining', { days: notification.daysRemaining })}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
 
        <TaxCalendar
          properties={properties}
          vehicles={vehicles}
          businesses={businesses}
        />
 
        {/* LOCKED: Property/vehicle tabs */}
        <PremiumLockOverlay>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="properties" className="gap-2">
                <Home className="h-4 w-4" />
                {t('tabs.property')} ({properties.length})
              </TabsTrigger>
              <TabsTrigger value="vehicles" className="gap-2">
                <Car className="h-4 w-4" />
                {t('tabs.vehicles')} ({vehicles.length})
              </TabsTrigger>
            </TabsList>
 
            {/* Gayrimenkul Tab */}
            <TabsContent value="properties" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{t('property.registered')}</h3>
                <PropertyForm onSubmit={addProperty} />
              </div>
 
              {properties.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Home className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('property.notAdded')}</p>
                    <p className="text-sm mt-1">
                      {t('property.addDesc')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {properties.map((property) => {
                    const taxResult = calculatePropertyTax(property);
 
                    return (
                      <Card key={property.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{property.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {PROPERTY_TYPE_LABELS[property.type]}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {LOCATION_LABELS[property.location]} • {property.sqMeters ? `${property.sqMeters} ${t('property.sqMeters')}` : t('property.sqMetersNotSet')}
                              </p>
 
                              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                  <p className="text-muted-foreground">{t('property.value2026')}</p>
                                  <p className="font-medium">{formatAssetCurrency(property.currentValue)}</p>
                                </div>
                                <div>
                                  <p className="text-muted-foreground">{t('property.annualTax')}</p>
                                  <p className={cn(
                                    "font-medium",
                                    taxResult.isExempt && "text-green-600"
                                  )}>
                                    {taxResult.isExempt ? t('property.exempt') : formatAssetCurrency(taxResult.annualTax)}
                                  </p>
                                </div>
                              </div>
 
                              {taxResult.isExempt && (
                                <p className="text-xs text-green-600 mt-2">
                                  ✅ {taxResult.exemptReason}
                                </p>
                              )}
 
                              {property.isRented && property.annualRentIncome && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  🏠 {t('property.rentalIncome')}: {formatAssetCurrency(property.annualRentIncome)}/{t('common:time.perYear')}
                                </p>
                              )}
                            </div>
 
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('property.deleteTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('property.deleteConfirm', { name: property.name })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteProperty(property.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    {t('common:actions.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
 
            {/* Araçlar Tab */}
            <TabsContent value="vehicles" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="font-medium">{t('vehicle.registered')}</h3>
                <VehicleForm onSubmit={addVehicle} />
              </div>
 
              {vehicles.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    <Car className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>{t('vehicle.notAdded')}</p>
                    <p className="text-sm mt-1">
                      {t('vehicle.addDesc')}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {vehicles.map((vehicle) => {
                    const inspectionStatus = checkInspectionStatus(vehicle);
                    const saleRestriction = vehicle.isDisabledExempt
                      ? checkDisabledSaleRestriction(vehicle)
                      : null;
 
                    return (
                      <Card key={vehicle.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{vehicle.name}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {vehicle.plate}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {VEHICLE_TYPE_LABELS[vehicle.vehicleType]} • {vehicle.engineCC} cc
                              </p>
 
                              <div className="mt-3 space-y-1.5">
                                {/* Muayene Durumu */}
                                <div className={cn(
                                  "text-sm flex items-center gap-2",
                                  inspectionStatus.isOverdue && "text-red-600",
                                  inspectionStatus.isWarning && "text-orange-600"
                                )}>
                                  <span>{t('vehicle.nextInspection')}:</span>
                                  <span className="font-medium">
                                    {formatAssetDate(inspectionStatus.nextDate)}
                                  </span>
                                  {(inspectionStatus.isOverdue || inspectionStatus.isWarning) && (
                                    <Badge
                                      variant={inspectionStatus.isOverdue ? 'destructive' : 'secondary'}
                                      className="text-xs"
                                    >
                                      {inspectionStatus.isOverdue
                                        ? t('vehicle.daysOverdue', { days: Math.abs(inspectionStatus.daysRemaining) })
                                        : t('vehicle.daysRemaining', { days: inspectionStatus.daysRemaining })}
                                    </Badge>
                                  )}
                                </div>
 
                                {/* Engelli Satış Yasağı */}
                                {saleRestriction?.isBanned && (
                                  <div className="text-xs text-orange-600 flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {saleRestriction.penalty}
                                  </div>
                                )}
 
                                {inspectionStatus.warningMessage && (
                                  <p className="text-xs text-muted-foreground">
                                    ⚠️ {inspectionStatus.warningMessage}
                                  </p>
                                )}
                              </div>
                            </div>
 
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{t('vehicle.deleteTitle')}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {t('vehicle.deleteConfirm', { name: `${vehicle.name} (${vehicle.plate})` })}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteVehicle(vehicle.id)}
                                    className="bg-destructive text-destructive-foreground"
                                  >
                                    {t('common:actions.delete')}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </PremiumLockOverlay>
      </div>
    </div>
  );
}
 