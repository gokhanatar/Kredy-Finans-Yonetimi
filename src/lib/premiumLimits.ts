
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
1071x
1x
1x
1x
1x
1x
1x
1x
 
 
 
1x
 
 
 
 
19x
12x
12x
12x
 
1x
 
1x
1x
1x
1x
1x
 
1x
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
1x
 
1x
1x
1x
1x
1x
1x
 
1x
 
 
 
 
1x
 
 
 
 
 
 
 
 
 
 
 export const FREE_LIMITS = {
  CARDS: 2,
  ACCOUNTS: 2,
  RECURRING_BILLS: 3,
  GOALS: 1,
  BUDGETS: 1,
  MONTHLY_TRANSACTIONS: 50,
} as const;
 
export type LimitKey = keyof typeof FREE_LIMITS;
 
export function checkLimit(key: LimitKey, currentCount: number, isPremium: boolean): {
  allowed: boolean;
  current: number;
  limit: number;
} {
  if (isPremium) return { allowed: true, current: currentCount, limit: Infinity };
  const limit = FREE_LIMITS[key];
  return { allowed: currentCount < limit, current: currentCount, limit };
}
 
// ============= FAMILY FREE MEMBER LIMITS =============
 
export const FAMILY_FREE_LIMITS = {
  MONTHLY_EXPENSES: 15,
  MONTHLY_INCOMES: 5,
  TRANSACTION_HISTORY_DAYS: 30,
} as const;
 
export const MAX_FREE_FAMILY_MEMBERS = 1;
 
export type FamilyFeature =
  | 'viewSummary'
  | 'viewTransactions'
  | 'addExpense'
  | 'addIncome'
  | 'viewAccounts'
  | 'manageAccounts'
  | 'viewGoals'
  | 'contributeGoals'
  | 'manageGoals'
  | 'viewBudget'
  | 'manageBudget'
  | 'viewBills'
  | 'manageBills'
  | 'viewSubscriptions'
  | 'manageSubscriptions'
  | 'viewSharedWallets'
  | 'manageSharedWallets'
  | 'viewNetWorth'
  | 'viewInvestments'
  | 'viewAssets';
 
export interface FamilyPermissions {
  canView: boolean;
  canEdit: boolean;
  canCreate: boolean;
  canDelete: boolean;
}
 
const FREE_MEMBER_PERMISSIONS: Record<FamilyFeature, FamilyPermissions> = {
  viewSummary:          { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  viewTransactions:     { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  addExpense:           { canView: true,  canEdit: false, canCreate: true,  canDelete: false },
  addIncome:            { canView: true,  canEdit: false, canCreate: true,  canDelete: false },
  viewAccounts:         { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  manageAccounts:       { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewGoals:            { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  contributeGoals:      { canView: true,  canEdit: true,  canCreate: false, canDelete: false },
  manageGoals:          { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewBudget:           { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  manageBudget:         { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewBills:            { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  manageBills:          { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewSubscriptions:    { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  manageSubscriptions:  { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewSharedWallets:    { canView: true,  canEdit: false, canCreate: false, canDelete: false },
  manageSharedWallets:  { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewNetWorth:         { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewInvestments:      { canView: false, canEdit: false, canCreate: false, canDelete: false },
  viewAssets:           { canView: false, canEdit: false, canCreate: false, canDelete: false },
};
 
const PRO_MEMBER_PERMISSIONS: FamilyPermissions = {
  canView: true,
  canEdit: true,
  canCreate: true,
  canDelete: true,
};
 
export function getFamilyPermissions(feature: FamilyFeature, isPremium: boolean): FamilyPermissions {
  if (isPremium) return PRO_MEMBER_PERMISSIONS;
  return FREE_MEMBER_PERMISSIONS[feature];
}
 
export function checkFamilyTransactionLimit(
  type: 'expense' | 'income',
  currentMonthCount: number,
  isPremium: boolean
): { allowed: boolean; current: number; limit: number } {
  if (isPremium) return { allowed: true, current: currentMonthCount, limit: Infinity };
  const limit = type === 'expense'
    ? FAMILY_FREE_LIMITS.MONTHLY_EXPENSES
    : FAMILY_FREE_LIMITS.MONTHLY_INCOMES;
  return { allowed: currentMonthCount < limit, current: currentMonthCount, limit };
}
 