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

/** Translation key for each task status, shared by the tooltip, the search list and the bars. */
export const STATUS_LABEL_KEYS = {
  done: 'status.done',
  'in-progress': 'status.inProgress',
  planned: 'status.planned',
} as const satisfies Record<import('@/types').TaskStatus, MessageKey>;
