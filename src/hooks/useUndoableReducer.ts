import { Dispatch, Reducer, useCallback, useReducer, useRef } from 'react';

export interface UndoableHistory {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  reset: () => void;
}

interface Options<A> {
  isUndoable: (action: A) => boolean;
  maxHistory?: number;
}

interface Internal<S> {
  past: S[];
  present: S;
  future: S[];
}

type Meta<A> = A | { type: '__UNDO__' } | { type: '__REDO__' } | { type: '__RESET_HISTORY__' };

export function useUndoableReducer<S, A extends { type: string }>(
  reducer: Reducer<S, A>,
  initialState: S,
  options: Options<A>
): [S, Dispatch<A>, UndoableHistory] {
  const { maxHistory = 50 } = options;
  const optsRef = useRef(options);
  optsRef.current = options;

  const wrapped = useCallback(
    (s: Internal<S>, action: Meta<A>): Internal<S> => {
      if (action.type === '__UNDO__') {
        if (s.past.length === 0) return s;
        const previous = s.past[s.past.length - 1];
        const past = s.past.slice(0, -1);
        return { past, present: previous, future: [s.present, ...s.future] };
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
      if (!optsRef.current.isUndoable(a)) {
        return { ...s, present: nextPresent };
      }
      const past = [...s.past, s.present];
      if (past.length > maxHistory) past.shift();
      return { past, present: nextPresent, future: [] };
    },
    [reducer, maxHistory]
  );

  const [internal, rawDispatch] = useReducer(wrapped, {
    past: [],
    present: initialState,
    future: [],
  });

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
