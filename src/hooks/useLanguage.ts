
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
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserProfile } from './useUserProfile';
import { loadLanguage } from '@/i18n';
import type { UserProfile } from '@/types/user';
 
const RTL_LANGUAGES: UserProfile['language'][] = ['ar'];
 
export function useLanguage() {
  const { i18n } = useTranslation();
  const { profile } = useUserProfile();
 
  useEffect(() => {
    const lang = profile.language || 'tr';
 
    if (i18n.language !== lang) {
      loadLanguage(lang).then(() => {
        i18n.changeLanguage(lang);
      });
    }
 
    const isRtl = RTL_LANGUAGES.includes(lang);
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [profile.language, i18n]);
 
  return {
    language: profile.language,
    isRtl: RTL_LANGUAGES.includes(profile.language),
  };
}
 