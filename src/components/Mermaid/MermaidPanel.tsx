'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react';
import { GanttState } from '@/types';
import { generateMermaidFromData } from '@/lib/mermaidGenerator';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export interface MermaidPanelHandle {
  getCode: () => string;
}

interface MermaidPanelProps {
  state: GanttState;
}

const MermaidPanel = forwardRef<MermaidPanelHandle, MermaidPanelProps>(
  function MermaidPanel({ state }, ref) {
    const [code, setCode] = useState(() => generateMermaidFromData(state.tasks));
    const [svgContent, setSvgContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [editorWidth, setEditorWidth] = useState(40); // percentage
    const [zoom, setZoom] = useState(1);
    const [panX, setPanX] = useState(0);
    const [panY, setPanY] = useState(0);
    const [isDraggingDivider, setIsDraggingDivider] = useState(false);
    const [isPanning, setIsPanning] = useState(false);
    const panStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

    const codeRef = useRef(code);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const previewRef = useRef<HTMLDivElement>(null);
    const svgContainerRef = useRef<HTMLDivElement>(null);
    const renderIdRef = useRef(0);

    // Expose getCode to parent via ref
    useImperativeHandle(ref, () => ({
      getCode: () => codeRef.current,
    }), []);

    // Regenerate code when mode switches TO mermaid
    useEffect(() => {
      if (state.currentMode === 'mermaid') {
        const newCode = generateMermaidFromData(state.tasks);
        setCode(newCode);
        codeRef.current = newCode;
      }
    }, [state.currentMode, state.tasks]);

    // Render mermaid diagram
    const renderMermaid = useCallback(async (mermaidCode: string) => {
      const renderId = ++renderIdRef.current;
      try {
        const mermaidModule = await import('mermaid');
        const mermaid = mermaidModule.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: state.isDark ? 'dark' : 'default',
          gantt: {
            useMaxWidth: false,
          },
        });

        // Unique id for each render
        const id = `mermaid-render-${renderId}`;
        const { svg } = await mermaid.render(id, mermaidCode);

        // Only update if this is still the latest render
        if (renderId === renderIdRef.current) {
          setSvgContent(svg);
          setError(null);
        }
      } catch (err: unknown) {
        if (renderId === renderIdRef.current) {
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
        }
      }
    }, [state.isDark]);

    // Render on initial load and theme change
    useEffect(() => {
      renderMermaid(codeRef.current);
    }, [renderMermaid]);

    // Handle code changes with debounce
    const handleCodeChange = useCallback((value: string) => {
      setCode(value);
      codeRef.current = value;

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        renderMermaid(value);
      }, 400);
    }, [renderMermaid]);

    // Cleanup debounce on unmount
    useEffect(() => {
      return () => {
        if (debounceRef.current) {
          clearTimeout(debounceRef.current);
        }
      };
    }, []);

    // --- Divider drag ---
    const handleDividerMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      setIsDraggingDivider(true);
    }, []);

    useEffect(() => {
      if (!isDraggingDivider) return;

      const handleMouseMove = (e: MouseEvent) => {
        const container = document.getElementById('mermaid-split-container');
        if (!container) return;
        const rect = container.getBoundingClientRect();
        const pct = ((e.clientX - rect.left) / rect.width) * 100;
        const clamped = Math.max((200 / rect.width) * 100, Math.min(80, pct));
        setEditorWidth(clamped);
      };

      const handleMouseUp = () => {
        setIsDraggingDivider(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isDraggingDivider]);

    // --- Pan/Zoom ---
    const handleWheel = useCallback((e: React.WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(prev => Math.max(0.1, Math.min(5, prev + delta)));
    }, []);

    const handlePreviewMouseDown = useCallback((e: React.MouseEvent) => {
      // Only pan on left click in the preview area
      if (e.button !== 0) return;
      e.preventDefault();
      setIsPanning(true);
      panStartRef.current = { x: e.clientX, y: e.clientY, panX, panY };
    }, [panX, panY]);

    useEffect(() => {
      if (!isPanning) return;

      const handleMouseMove = (e: MouseEvent) => {
        const dx = e.clientX - panStartRef.current.x;
        const dy = e.clientY - panStartRef.current.y;
        setPanX(panStartRef.current.panX + dx);
        setPanY(panStartRef.current.panY + dy);
      };

      const handleMouseUp = () => {
        setIsPanning(false);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isPanning]);

    const handleZoomIn = useCallback(() => {
      setZoom(prev => Math.min(5, prev + 0.2));
    }, []);

    const handleZoomOut = useCallback(() => {
      setZoom(prev => Math.max(0.1, prev - 0.2));
    }, []);

    const handleFit = useCallback(() => {
      setZoom(1);
      setPanX(0);
      setPanY(0);
    }, []);

    // --- Export ---
    const handleExportSVG = useCallback(() => {
      if (!svgContent) return;
      const blob = new Blob([svgContent], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'gantt-chart.svg';
      a.click();
      URL.revokeObjectURL(url);
    }, [svgContent]);

    const handleExportPNG = useCallback(() => {
      if (!svgContent) return;

      const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const scale = 2; // high-res
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.scale(scale, scale);
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (!blob) return;
          const pngUrl = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = pngUrl;
          a.download = 'gantt-chart.png';
          a.click();
          URL.revokeObjectURL(pngUrl);
        }, 'image/png');
        URL.revokeObjectURL(url);
      };
      img.src = url;
    }, [svgContent]);

    const extensions = useMemo(() => [markdown()], []);

    return (
      <div
        id="mermaid-split-container"
        className="flex-1 flex overflow-hidden"
        style={{ cursor: isDraggingDivider ? 'col-resize' : undefined }}
      >
        {/* Left: Code Editor */}
        <div
          className="flex flex-col overflow-hidden"
          style={{ width: `${editorWidth}%`, minWidth: 200 }}
        >
          {/* Editor Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
          >
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-secondary)' }}>
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
                Mermaid Editor
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                className="btn-glass text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                onClick={handleExportSVG}
                title="Export SVG"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                SVG
              </button>
              <button
                className="btn-glass text-[11px] font-semibold px-2.5 py-1 rounded-md cursor-pointer flex items-center gap-1"
                onClick={handleExportPNG}
                title="Export PNG"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                PNG
              </button>
            </div>
          </div>

          {/* CodeMirror */}
          <div className="flex-1 overflow-auto">
            <CodeMirror
              value={code}
              onChange={handleCodeChange}
              extensions={extensions}
              theme={state.isDark ? 'dark' : 'light'}
              height="100%"
              style={{ height: '100%', fontSize: 13 }}
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                highlightActiveLine: true,
                bracketMatching: true,
              }}
            />
          </div>
        </div>

        {/* Divider */}
        <div
          className="mm-divider"
          onMouseDown={handleDividerMouseDown}
          style={{
            width: 6,
            cursor: 'col-resize',
            background: 'var(--border-color)',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 2,
              height: 32,
              borderRadius: 1,
              background: 'var(--text-secondary)',
              opacity: 0.4,
            }}
          />
        </div>

        {/* Right: Preview */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--bg-main)' }}>
          {/* Preview Header */}
          <div
            className="flex items-center justify-between px-4 py-2 border-b shrink-0"
            style={{ borderColor: 'var(--border-color)', background: 'var(--bg-card)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Preview
            </span>
            <div className="flex items-center gap-2">
              <button
                className="btn-glass text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer"
                onClick={handleZoomOut}
                title="Zoom out"
              >
                -
              </button>
              <span className="text-[11px] font-mono tabular-nums" style={{ color: 'var(--text-secondary)', minWidth: 36, textAlign: 'center' }}>
                {Math.round(zoom * 100)}%
              </span>
              <button
                className="btn-glass text-[11px] font-bold px-2 py-0.5 rounded cursor-pointer"
                onClick={handleZoomIn}
                title="Zoom in"
              >
                +
              </button>
              <button
                className="btn-glass text-[11px] font-semibold px-2.5 py-0.5 rounded cursor-pointer"
                onClick={handleFit}
                title="Reset view"
              >
                Fit
              </button>
            </div>
          </div>

          {/* Preview Area */}
          <div
            ref={previewRef}
            className="flex-1 overflow-hidden relative"
            onWheel={handleWheel}
            onMouseDown={handlePreviewMouseDown}
            style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
          >
            <div
              ref={svgContainerRef}
              style={{
                transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
                transformOrigin: '0 0',
                position: 'absolute',
                top: 16,
                left: 16,
              }}
            >
              {svgContent ? (
                <div dangerouslySetInnerHTML={{ __html: svgContent }} />
              ) : !error ? (
                <div className="flex items-center justify-center p-8" style={{ color: 'var(--text-secondary)' }}>
                  <span className="text-sm">Rendering diagram...</span>
                </div>
              ) : null}
            </div>

            {/* Error Panel */}
            {error && (
              <div
                className="absolute bottom-0 left-0 right-0 px-4 py-3 text-xs font-mono overflow-auto"
                style={{
                  background: 'rgba(239,68,68,0.1)',
                  borderTop: '1px solid rgba(239,68,68,0.3)',
                  color: '#ef4444',
                  maxHeight: '30%',
                }}
              >
                <div className="font-semibold mb-1">Render Error</div>
                <pre className="whitespace-pre-wrap break-words">{error}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

export default MermaidPanel;
