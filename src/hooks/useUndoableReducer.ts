import { Dispatch, Reducer, useCallback, useReducer } from 'react';

export interface UndoableHistory {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

export interface UndoableOptions<A> {
  /** Actions that change the document go on the undo stack; view changes (zoom, dialogs) don't. */
  isUndoable: (action: A) => boolean;
  maxHistory: number;
}

export interface History<S> {
  past: S[];
  present: S;
  future: S[];
}

type HistoryAction<A> = A | { type: '__UNDO__' } | { type: '__REDO__' } | { type: '__RESET_HISTORY__' };

/** Wrap a reducer with undo/redo. Pure, so it can be built once at module level and tested. */
export function undoable<S, A extends { type: string }>(
  reducer: Reducer<S, A>,
  { isUndoable, maxHistory }: UndoableOptions<A>
): Reducer<History<S>, HistoryAction<A>> {
  return (s, action) => {
    if (action.type === '__UNDO__') {
      if (s.past.length === 0) return s;
      return { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] };
    }
    if (action.type === '__REDO__') {
      if (s.future.length === 0) return s;
      const [next, ...rest] = s.future;
      return { past: [...s.past, s.present], present: next, future: rest };
    }
    if (action.type === '__RESET_HISTORY__') {
      return { past: [], present: s.present, future: [] };
    }
    const a = action as A;
    const nextPresent = reducer(s.present, a);
    if (nextPresent === s.present) return s;
    if (!isUndoable(a)) return { ...s, present: nextPresent };
    const past = [...s.past, s.present].slice(-maxHistory);
    return { past, present: nextPresent, future: [] };
  };
}

/** useReducer over a reducer built with `undoable`. */
export function useUndoableReducer<S, A extends { type: string }>(
  reducer: Reducer<History<S>, HistoryAction<A>>,
  initialState: S
): [S, Dispatch<A>, UndoableHistory] {
  const [internal, rawDispatch] = useReducer(reducer, { past: [], present: initialState, future: [] });

  const dispatch = useCallback((action: A) => rawDispatch(action), []);
  const undo = useCallback(() => rawDispatch({ type: '__UNDO__' }), []);
  const redo = useCallback(() => rawDispatch({ type: '__REDO__' }), []);
  const reset = useCallback(() => rawDispatch({ type: '__RESET_HISTORY__' }), []);

  const history: UndoableHistory = {
    canUndo: internal.past.length > 0,
    canRedo: internal.future.length > 0,
    undo,
    redo,
    reset,
  };

  return [internal.present, dispatch, history];
}
