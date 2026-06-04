import type { Locale } from '../config';
import en from './en';
import zhTW from './zh-TW';
import zhCN from './zh-CN';
import ja from './ja';
import type { MessageKey } from './keys';

export type { MessageKey };
export { en };

export const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en,
  'zh-TW': zhTW,
  'zh-CN': zhCN,
  ja,
};
