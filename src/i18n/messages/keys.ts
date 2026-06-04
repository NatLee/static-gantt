import en from './en';

// Every translation catalog must provide exactly these keys (TypeScript enforces
// completeness — a missing key is a compile error).
export type MessageKey = keyof typeof en;
