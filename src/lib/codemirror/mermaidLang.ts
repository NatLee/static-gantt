import { StreamLanguage, StreamParser } from '@codemirror/language';

interface State {
  afterColon: boolean;
}

const HEADER_KEYWORDS = new Set(['gantt', 'dateFormat', 'axisFormat', 'weekday', 'title']);
const SECTION_KEYWORD = 'section';
const STATUS_TOKENS = new Set(['done', 'active', 'crit', 'milestone', 'after']);
const DURATION_RE = /^\d+(?:\.\d+)?[dwmhs]\b/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?)?/;
const IDENT_RE = /^[A-Za-z_][\w-]*/;

const parser: StreamParser<State> = {
  name: 'mermaid',
  startState: () => ({ afterColon: false }),
  token(stream, state) {
    if (stream.sol()) {
      state.afterColon = false;
      if (stream.eatSpace()) return null;
    } else if (stream.eatSpace()) {
      return null;
    }

    // Comments
    if (stream.match(/^%%.*$/)) return 'comment';

    // Colon marks the start of the "flags, id, date, dur" portion
    if (stream.match(/^:/)) {
      state.afterColon = true;
      return 'operator';
    }
    if (stream.match(/^,/)) return 'punctuation';

    // Dates
    if (stream.match(DATE_RE)) return 'number';
    // Durations like 5d, 2w
    if (stream.match(DURATION_RE)) return 'number';
    // Bare integers
    if (stream.match(/^\d+\b/)) return 'number';

    // Header-level keywords only at line start
    const pos = stream.pos;
    const line = stream.string.slice(0, pos);
    const atLineStart = line.trim().length === 0;

    const id = stream.match(IDENT_RE) as RegExpMatchArray | null;
    if (id) {
      const word = id[0];
      if (atLineStart && HEADER_KEYWORDS.has(word)) return 'keyword';
      if (atLineStart && word === SECTION_KEYWORD) return 'keyword';
      if (STATUS_TOKENS.has(word)) return 'atom';
      // After colon, the first identifier is usually the task id (also valid for after <id>)
      if (state.afterColon) return 'variableName';
      // Before colon (task name area), treat words as generic text
      return 'string';
    }

    // Fallback: consume one char
    stream.next();
    return null;
  },
  languageData: {
    commentTokens: { line: '%%' },
  },
};

export const mermaidLanguage = StreamLanguage.define(parser);
