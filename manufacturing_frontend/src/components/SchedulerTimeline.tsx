/* eslint-disable no-unused-vars */
import React from 'react';
import { Box, Chip, Stack, Typography } from '@mui/material';
import type { Operation, ScheduleBoard, WorkCenter } from '../types/scheduler';

type DragMode = 'move' | 'resize-start' | 'resize-end' | null;

type InternalOp = Operation & { _color: string; _wcIndex: number };

// PUBLIC_INTERFACE
export interface SchedulerTimelineProps {
  /** Scheduler board data to render */
  board: ScheduleBoard;
  /** When true, blocks can be dragged/resized; otherwise read-only view */
  editable?: boolean;
  /** Called when a drag-drop (or resize) completes with new timing or workcenter. */
  onChange?: (opId: string, next: { start?: string; end?: string; workCenterId?: string }) => void;
  /** Optional time window to display; computed from data otherwise */
  window?: { start: Date; end: Date };
  /** Snap step in minutes (default: 15) */
  snapMinutes?: number;
}

/**
 * Lightweight, dependency-free timeline renderer with block drag/move/resize.
 * Rows = work centers; Columns = time. Blocks are absolutely positioned using a
 * px-per-ms scale computed from the visible time window.
 * Supports mouse and touch.
 */
const SchedulerTimeline: React.FC<SchedulerTimelineProps> = ({
  board,
  editable = true,
  onChange,
  window,
  snapMinutes = 15,
}) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [dims, setDims] = React.useState({ width: 0, height: 0 });
  const [drag, setDrag] = React.useState<{
    mode: DragMode;
    opId: string;
    wcIndex: number;
    startMs: number;
    endMs: number;
    pointerStartX: number;
    pointerStartY: number;
    originalStart: number;
    originalEnd: number;
  } | null>(null);

  const wcIndexById = React.useMemo(() => {
    const map = new Map<string, number>();
    board.workCenters.forEach((wc, idx) => map.set(wc.id, idx));
    return map;
  }, [board.workCenters]);

  const ops: InternalOp[] = React.useMemo(() => {
    const byWc: Record<string, WorkCenter> = Object.fromEntries(board.workCenters.map((w) => [w.id, w]));
    return board.operations.map((o) => {
      const wc = byWc[o.workCenterId];
      const idx = wcIndexById.get(o.workCenterId) ?? 0;
      return {
        ...o,
        _color: o.color || wc?.color || '#1976d2',
        _wcIndex: idx,
      };
    });
  }, [board.operations, board.workCenters, wcIndexById]);

  const windowComputed = React.useMemo(() => {
    if (window) return window;
    if (!ops.length) {
      const now = new Date();
      const start = new Date(now);
      start.setHours(now.getHours() - 1, 0, 0, 0);
      const end = new Date(start);
      end.setHours(start.getHours() + 8);
      return { start, end };
    }
    let min = Number.POSITIVE_INFINITY;
    let max = Number.NEGATIVE_INFINITY;
    ops.forEach((o) => {
      const s = new Date(o.start).getTime();
      const e = new Date(o.end).getTime();
      min = Math.min(min, s);
      max = Math.max(max, e);
    });
    // Pad window
    const pad = Math.round((max - min) * 0.1) || 30 * 60_000;
    return { start: new Date(min - pad), end: new Date(max + pad) };
  }, [ops, window]);

  const msTotal = windowComputed.end.getTime() - windowComputed.start.getTime();
  const pxPerMs = dims.width > 0 && msTotal > 0 ? dims.width / msTotal : 0.0001;

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setDims({ width: rect.width, height: rect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const rowHeight = 56;
  const headerHeight = 40;

  function msToLeft(ms: number) {
    return (ms - windowComputed.start.getTime()) * pxPerMs;
  }
  function msToWidth(msStart: number, msEnd: number) {
    return Math.max(8, (msEnd - msStart) * pxPerMs);
  }
  function snap(ms: number) {
    const step = snapMinutes * 60_000;
    return Math.round(ms / step) * step;
  }

  function pointer(e: React.MouseEvent | React.TouchEvent) {
    if ('touches' in e && e.touches[0]) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    const me = e as React.MouseEvent;
    return { x: me.clientX, y: me.clientY };
  }

  function onBlockDown(
    e: React.MouseEvent | React.TouchEvent,
    op: InternalOp,
    mode: DragMode,
  ) {
    if (!editable) return;
    e.preventDefault();
    const p = pointer(e);
    setDrag({
      mode,
      opId: op.id,
      wcIndex: op._wcIndex,
      startMs: new Date(op.start).getTime(),
      endMs: new Date(op.end).getTime(),
      pointerStartX: p.x,
      pointerStartY: p.y,
      originalStart: new Date(op.start).getTime(),
      originalEnd: new Date(op.end).getTime(),
    });
  }

  function onMove(e: React.MouseEvent | React.TouchEvent) {
    if (!drag) return;
    e.preventDefault();
    const p = pointer(e);
    const dx = p.x - drag.pointerStartX;
    const dy = p.y - drag.pointerStartY;

    let start = drag.originalStart;
    let end = drag.originalEnd;

    if (drag.mode === 'move') {
      const deltaMs = dx / pxPerMs;
      start = snap(drag.originalStart + deltaMs);
      end = snap(drag.originalEnd + deltaMs);

      // Row reassignment by vertical movement
      const rowOffset = Math.round(dy / rowHeight);
      const nextIndex = Math.max(0, Math.min(board.workCenters.length - 1, drag.wcIndex + rowOffset));
      setDrag((d) => (d ? { ...d, startMs: start, endMs: end, wcIndex: nextIndex } : d));
      return;
    }

    if (drag.mode === 'resize-start') {
      const deltaMs = dx / pxPerMs;
      start = snap(Math.min(drag.originalEnd - 5 * 60_000, drag.originalStart + deltaMs));
    }

    if (drag.mode === 'resize-end') {
      const deltaMs = dx / pxPerMs;
      end = snap(Math.max(drag.originalStart + 5 * 60_000, drag.originalEnd + deltaMs));
    }

    setDrag((d) => (d ? { ...d, startMs: start, endMs: end } : d));
  }

  function onUp() {
    if (!drag) return;
    const op = ops.find((o) => o.id === drag.opId);
    if (!op) {
      setDrag(null);
      return;
    }
    const nextWc = board.workCenters[drag.wcIndex]?.id || op.workCenterId;
    const payload: { start?: string; end?: string; workCenterId?: string } = {};

    if (drag.startMs !== drag.originalStart) payload.start = new Date(drag.startMs).toISOString();
    if (drag.endMs !== drag.originalEnd) payload.end = new Date(drag.endMs).toISOString();
    if (nextWc !== op.workCenterId) payload.workCenterId = nextWc;

    if (Object.keys(payload).length > 0) {
      onChange?.(op.id, payload);
    }
    setDrag(null);
  }

  // Render hour ticks
  const ticks = React.useMemo(() => {
    const arr: { ms: number; label: string }[] = [];
    const start = new Date(windowComputed.start);
    start.setMinutes(0, 0, 0);
    for (let t = start.getTime(); t <= windowComputed.end.getTime(); t += 60 * 60_000) {
      const d = new Date(t);
      const label = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      arr.push({ ms: t, label });
    }
    return arr;
  }, [windowComputed.end, windowComputed.start]);

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        backgroundColor: 'background.paper',
        touchAction: 'none',
        userSelect: 'none',
      }}
      onMouseMove={onMove as any}
      onMouseUp={onUp}
      onMouseLeave={onUp}
      onTouchMove={onMove as any}
      onTouchEnd={onUp}
    >
      {/* Header time scale */}
      <Box
        sx={{
          position: 'relative',
          height: headerHeight,
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: 'grey.50',
        }}
      >
        {ticks.map((t, i) => (
          <Box
            key={`tick-${i}`}
            sx={{
              position: 'absolute',
              left: msToLeft(t.ms),
              top: 0,
              transform: 'translateX(-50%)',
              height: '100%',
              px: 0.5,
              color: 'text.secondary',
              fontSize: 12,
              borderLeft: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {t.label}
          </Box>
        ))}
      </Box>

      {/* Rows */}
      <Box sx={{ position: 'relative' }}>
        {board.workCenters.map((wc, rowIdx) => (
          <Row
            key={wc.id}
            name={wc.name}
            index={rowIdx}
            height={rowHeight}
            totalWidth={dims.width}
            isLast={rowIdx === board.workCenters.length - 1}
          />
        ))}

        {/* Blocks */}
        {ops.map((op) => {
          const s = new Date(op.start).getTime();
          const e = new Date(op.end).getTime();
          const left = msToLeft(s);
          const width = msToWidth(s, e);
          const top = headerHeight + op._wcIndex * rowHeight + 6;

          const isDragging = drag && drag.opId === op.id;
          const draggingLeft = isDragging ? msToLeft(drag.startMs) : left;
          const draggingWidth = isDragging ? msToWidth(drag.startMs, drag.endMs) : width;
          const draggingTop = isDragging ? headerHeight + drag.wcIndex * rowHeight + 6 : top;

          return (
            <Box
              key={op.id}
              sx={{
                position: 'absolute',
                left: draggingLeft,
                top: draggingTop,
                width: draggingWidth,
                height: rowHeight - 12,
                borderRadius: 1,
                bgcolor: op._color,
                color: '#fff',
                boxShadow: 1,
                cursor: editable ? 'grab' : 'default',
              }}
              onMouseDown={(e) => onBlockDown(e, op, 'move')}
              onTouchStart={(e) => onBlockDown(e, op, 'move')}
            >
              {/* Resize handles */}
              {editable ? (
                <>
                  <Box
                    onMouseDown={(e) => onBlockDown(e, op, 'resize-start')}
                    onTouchStart={(e) => onBlockDown(e, op, 'resize-start')}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: 8,
                      height: '100%',
                      cursor: 'ew-resize',
                      bgcolor: 'rgba(255,255,255,0.35)',
                    }}
                  />
                  <Box
                    onMouseDown={(e) => onBlockDown(e, op, 'resize-end')}
                    onTouchStart={(e) => onBlockDown(e, op, 'resize-end')}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      top: 0,
                      width: 8,
                      height: '100%',
                      cursor: 'ew-resize',
                      bgcolor: 'rgba(255,255,255,0.35)',
                    }}
                  />
                </>
              ) : null}
              <Stack spacing={0} sx={{ p: 1 }}>
                <Typography variant="body2" sx={{ lineHeight: 1.1, fontWeight: 700 }}>
                  {op.workOrderNo}
                </Typography>
                <Typography variant="caption" sx={{ lineHeight: 1.1, opacity: 0.9 }}>
                  {new Date(op.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(op.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  {op.item ? <Chip size="small" label={op.item} sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' }} /> : null}
                  {typeof op.quantity === 'number' ? (
                    <Chip
                      size="small"
                      label={`${op.quantity}`}
                      sx={{ bgcolor: 'rgba(255,255,255,0.25)', color: '#fff' }}
                    />
                  ) : null}
                </Stack>
              </Stack>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

function Row({
  name,
  index,
  height,
  totalWidth,
  isLast,
}: {
  name: string;
  index: number;
  height: number;
  totalWidth: number;
  isLast: boolean;
}) {
  return (
    <Box
      sx={{
        position: 'relative',
        height,
        borderBottom: isLast ? 'none' : '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box
        sx={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: totalWidth,
          height,
          background:
            index % 2 === 0 ? 'transparent' : 'linear-gradient(0deg, rgba(0,0,0,0.015), rgba(0,0,0,0.015))',
        }}
      />
      <Typography
        variant="body2"
        sx={{
          position: 'absolute',
          left: 8,
          top: height / 2 - 10,
          zIndex: 1,
          color: 'text.secondary',
          pointerEvents: 'none',
        }}
      >
        {name}
      </Typography>
    </Box>
  );
}

export default SchedulerTimeline;
