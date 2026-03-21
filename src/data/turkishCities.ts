
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 export interface TurkishCity {
  code: string;   // "01", "06", etc.
  name: string;   // "Adana", "Ankara", etc.
  isBuyuksehir: boolean;
}
 
export const TURKISH_CITIES: TurkishCity[] = [
  { code: '01', name: 'Adana', isBuyuksehir: true },
  { code: '02', name: 'Adıyaman', isBuyuksehir: false },
  { code: '03', name: 'Afyonkarahisar', isBuyuksehir: false },
  { code: '04', name: 'Ağrı', isBuyuksehir: false },
  { code: '05', name: 'Amasya', isBuyuksehir: false },
  { code: '06', name: 'Ankara', isBuyuksehir: true },
  { code: '07', name: 'Antalya', isBuyuksehir: true },
  { code: '08', name: 'Artvin', isBuyuksehir: false },
  { code: '09', name: 'Aydın', isBuyuksehir: true },
  { code: '10', name: 'Balıkesir', isBuyuksehir: true },
  { code: '11', name: 'Bilecik', isBuyuksehir: false },
  { code: '12', name: 'Bingöl', isBuyuksehir: false },
  { code: '13', name: 'Bitlis', isBuyuksehir: false },
  { code: '14', name: 'Bolu', isBuyuksehir: false },
  { code: '15', name: 'Burdur', isBuyuksehir: false },
  { code: '16', name: 'Bursa', isBuyuksehir: true },
  { code: '17', name: 'Çanakkale', isBuyuksehir: false },
  { code: '18', name: 'Çankırı', isBuyuksehir: false },
  { code: '19', name: 'Çorum', isBuyuksehir: false },
  { code: '20', name: 'Denizli', isBuyuksehir: true },
  { code: '21', name: 'Diyarbakır', isBuyuksehir: true },
  { code: '22', name: 'Edirne', isBuyuksehir: false },
  { code: '23', name: 'Elazığ', isBuyuksehir: false },
  { code: '24', name: 'Erzincan', isBuyuksehir: false },
  { code: '25', name: 'Erzurum', isBuyuksehir: true },
  { code: '26', name: 'Eskişehir', isBuyuksehir: true },
  { code: '27', name: 'Gaziantep', isBuyuksehir: true },
  { code: '28', name: 'Giresun', isBuyuksehir: false },
  { code: '29', name: 'Gümüşhane', isBuyuksehir: false },
  { code: '30', name: 'Hakkari', isBuyuksehir: false },
  { code: '31', name: 'Hatay', isBuyuksehir: true },
  { code: '32', name: 'Isparta', isBuyuksehir: false },
  { code: '33', name: 'Mersin', isBuyuksehir: true },
  { code: '34', name: 'İstanbul', isBuyuksehir: true },
  { code: '35', name: 'İzmir', isBuyuksehir: true },
  { code: '36', name: 'Kars', isBuyuksehir: false },
  { code: '37', name: 'Kastamonu', isBuyuksehir: false },
  { code: '38', name: 'Kayseri', isBuyuksehir: true },
  { code: '39', name: 'Kırklareli', isBuyuksehir: false },
  { code: '40', name: 'Kırşehir', isBuyuksehir: false },
  { code: '41', name: 'Kocaeli', isBuyuksehir: true },
  { code: '42', name: 'Konya', isBuyuksehir: true },
  { code: '43', name: 'Kütahya', isBuyuksehir: false },
  { code: '44', name: 'Malatya', isBuyuksehir: true },
  { code: '45', name: 'Manisa', isBuyuksehir: true },
  { code: '46', name: 'Kahramanmaraş', isBuyuksehir: true },
  { code: '47', name: 'Mardin', isBuyuksehir: true },
  { code: '48', name: 'Muğla', isBuyuksehir: true },
  { code: '49', name: 'Muş', isBuyuksehir: false },
  { code: '50', name: 'Nevşehir', isBuyuksehir: false },
  { code: '51', name: 'Niğde', isBuyuksehir: false },
  { code: '52', name: 'Ordu', isBuyuksehir: true },
  { code: '53', name: 'Rize', isBuyuksehir: false },
  { code: '54', name: 'Sakarya', isBuyuksehir: true },
  { code: '55', name: 'Samsun', isBuyuksehir: true },
  { code: '56', name: 'Siirt', isBuyuksehir: false },
  { code: '57', name: 'Sinop', isBuyuksehir: false },
  { code: '58', name: 'Sivas', isBuyuksehir: false },
  { code: '59', name: 'Tekirdağ', isBuyuksehir: true },
  { code: '60', name: 'Tokat', isBuyuksehir: false },
  { code: '61', name: 'Trabzon', isBuyuksehir: true },
  { code: '62', name: 'Tunceli', isBuyuksehir: false },
  { code: '63', name: 'Şanlıurfa', isBuyuksehir: true },
  { code: '64', name: 'Uşak', isBuyuksehir: false },
  { code: '65', name: 'Van', isBuyuksehir: true },
  { code: '66', name: 'Yozgat', isBuyuksehir: false },
  { code: '67', name: 'Zonguldak', isBuyuksehir: false },
  { code: '68', name: 'Aksaray', isBuyuksehir: false },
  { code: '69', name: 'Bayburt', isBuyuksehir: false },
  { code: '70', name: 'Karaman', isBuyuksehir: false },
  { code: '71', name: 'Kırıkkale', isBuyuksehir: false },
  { code: '72', name: 'Batman', isBuyuksehir: false },
  { code: '73', name: 'Şırnak', isBuyuksehir: false },
  { code: '74', name: 'Bartın', isBuyuksehir: false },
  { code: '75', name: 'Ardahan', isBuyuksehir: false },
  { code: '76', name: 'Iğdır', isBuyuksehir: false },
  { code: '77', name: 'Yalova', isBuyuksehir: false },
  { code: '78', name: 'Karabük', isBuyuksehir: false },
  { code: '79', name: 'Kilis', isBuyuksehir: false },
  { code: '80', name: 'Osmaniye', isBuyuksehir: false },
  { code: '81', name: 'Düzce', isBuyuksehir: false },
];
 