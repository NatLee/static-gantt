'use client';

import { useEffect, useRef } from 'react';
import { useGanttState } from '@/hooks/useGanttState';
import Header from '@/components/Header/Header';
import GanttPanel from '@/components/Gantt/GanttPanel';
import TaskEditorPanel from '@/components/Editor/TaskEditorPanel';
import AddDialog from '@/components/Dialogs/AddDialog';
import { parseMermaidToTasks } from '@/lib/mermaidParser';
import dynamic from 'next/dynamic';
import type { MermaidPanelHandle } from '@/components/Mermaid/MermaidPanel';

const MermaidPanel = dynamic(() => import('@/components/Mermaid/MermaidPanel'), {
  ssr: false,
});

export default function GanttApp() {
  const { state, dispatch, computed, hierarchy, taskMap, masterPhases } = useGanttState();
  const mermaidRef = useRef<MermaidPanelHandle>(null);
  const prevModeRef = useRef(state.currentMode);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.isDark ? 'dark' : 'light');
  }, [state.isDark]);

  // When switching from mermaid back to visual, parse the code and replace tasks
  useEffect(() => {
    if (prevModeRef.current === 'mermaid' && state.currentMode === 'visual') {
      if (mermaidRef.current) {
        const code = mermaidRef.current.getCode();
        const newTasks = parseMermaidToTasks(code);
        if (newTasks.length > 0) {
          dispatch({ type: 'REPLACE_ALL_TASKS', tasks: newTasks });
        }
      }
    }
    prevModeRef.current = state.currentMode;
  }, [state.currentMode, dispatch]);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header
        state={state}
        dispatch={dispatch}
        computed={computed}
        masterPhases={masterPhases}
      />

      {state.currentMode === 'visual' ? (
        <GanttPanel
          state={state}
          dispatch={dispatch}
          computed={computed}
          hierarchy={hierarchy}
          taskMap={taskMap}
        />
      ) : (
        <MermaidPanel
          ref={mermaidRef}
          state={state}
        />
      )}

      {state.editingTaskId !== null && (
        <TaskEditorPanel
          key={state.editingTaskId}
          state={state}
          dispatch={dispatch}
          computed={computed}
          taskMap={taskMap}
        />
      )}

      {state.activeDialog !== null && (
        <AddDialog
          state={state}
          dispatch={dispatch}
          masterPhases={masterPhases}
        />
      )}
    </div>
  );
}
