import { useCallback, useRef, useState } from 'react';
import { Close, Printer, Trash } from 'pixelarticons/react';
import {
  BORDER_COLORS,
  BG_COLORS,
  FILTERS,
  FILTER_NAMES,
  STICKER_PALETTE,
} from './stripComposer';

const STICKER_MAP = Object.fromEntries(STICKER_PALETTE.map((s) => [s.name, s.src]));

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const FILTER_LABELS = {
  normal: 'Normal',
  bw: 'B&W',
  sepia: 'Sepia',
  vivid: 'Vivid',
};

/**
 * StripEditor.jsx
 * Lets the user restyle their strip before it prints:
 *   - footer brand text
 *   - border / paper colors
 *   - photo filter (applied to every photo)
 *   - pixel-art stickers: pick one, tap a photo to place it, drag to move,
 *     tap to remove.
 * "Apply & Reprint" passes the new config back so the app recomposes the
 * strip and re-runs the printing animation.
 */
function StripEditor({ config, onCancel, onApply }) {
  const [work, setWork] = useState(config || {});
  const [activeSticker, setActiveSticker] = useState(null);

  const slotRefs = useRef([]);
  const idRef = useRef(0);
  const dragRef = useRef(null);

  const nextId = useCallback(() => {
    idRef.current += 1;
    return idRef.current;
  }, []);

  const setWorkFields = useCallback((patch) => {
    setWork((w) => ({ ...w, ...patch }));
  }, []);

  const getStickerSrc = useCallback((name) => STICKER_MAP[name], []);

  // Press on an empty photo area stamps the active sticker there
  const stampSticker = useCallback(
    (e, slot) => {
      if (!activeSticker) return;
      const rect = slotRefs.current[slot]?.getBoundingClientRect();
      if (!rect) return;
      const x = clamp((e.clientX - rect.left) / rect.width, 0.12, 0.88);
      const y = clamp((e.clientY - rect.top) / rect.height, 0.12, 0.88);
      const sticker = { id: nextId(), slot, name: activeSticker, x, y, scale: 0.24 };
      console.log('Sticker placed:', sticker);
      setWork((w) => ({ ...w, stickers: [...(w.stickers || []), sticker] }));
    },
    [activeSticker, nextId]
  );

  const startDrag = useCallback((e, st) => {
    e.stopPropagation();
    dragRef.current = { id: st.id, slot: st.slot, moved: false, px: e.clientX, py: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, []);

  const moveDrag = useCallback((e, st) => {
    const d = dragRef.current;
    if (!d || d.id !== st.id) return;
    if (Math.abs(e.clientX - d.px) + Math.abs(e.clientY - d.py) > 6) d.moved = true;
    const rect = slotRefs.current[st.slot]?.getBoundingClientRect();
    if (!rect) return;
    const x = clamp((e.clientX - rect.left) / rect.width, 0.06, 0.94);
    const y = clamp((e.clientY - rect.top) / rect.height, 0.06, 0.94);
    setWork((w) => ({
      ...w,
      stickers: (w.stickers || []).map((s) => (s.id === st.id ? { ...s, x, y } : s)),
    }));
  }, []);

  const endDrag = useCallback((e, st) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (d && d.id === st.id && !d.moved) {
      setWork((w) => ({ ...w, stickers: (w.stickers || []).filter((s) => s.id !== st.id) }));
    }
  }, []);

  const stickersFor = useCallback((slot) => (work.stickers || []).filter((s) => s.slot === slot), [work.stickers]);

  const swatchButton = (color, isActive, onPick) => (
    <button
      key={color}
      type="button"
      aria-label={color}
      onClick={onPick}
      className={`h-9 w-9 rounded-full bg-white/10 ring-2 transition hover:scale-110 ${
        isActive ? 'scale-110 ring-white' : 'ring-white/30'
      }`}
      style={{ backgroundColor: color }}
    />
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 p-4 md:p-6">
      <div className="w-full max-w-4xl animate-fade-in-up rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-purple-900/50 backdrop-blur-xl md:p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black uppercase tracking-widest text-white drop-shadow md:text-2xl">
            Edit your strip
          </h1>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel editing"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 ring-1 ring-white/20 transition hover:bg-white/20"
          >
            <Close width={22} height={22} />
          </button>
        </div>

        <div className="mt-6 grid items-start gap-8 md:grid-cols-2">
          {/* ---------- Live strip preview ---------- */}
          <div className="flex flex-col items-center">
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  ref={(el) => {
                    slotRefs.current[i] = el;
                  }}
                  onPointerDown={activeSticker ? (e) => stampSticker(e, i) : undefined}
                  className="relative aspect-square w-40 cursor-pointer overflow-hidden rounded-lg bg-white/10 shadow-lg sm:w-44"
                  style={{
                    borderWidth: 5,
                    borderStyle: 'solid',
                    borderColor: work.borderColor,
                  }}
                >
                  {work.photos?.[i] && (
                    <img
                      src={work.photos[i]}
                      alt={`Shot ${i + 1}`}
                      className="h-full w-full object-cover"
                      style={{ filter: FILTERS[work.filter] || 'none' }}
                    />
                  )}
                  {stickersFor(i).map((st) => (
                    <div
                      key={st.id}
                      className="absolute z-10"
                      style={{
                        left: `${st.x * 100}%`,
                        top: `${st.y * 100}%`,
                        width: `${st.scale * 100}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                    >
                      <span className="absolute inset-0 rounded-full bg-white shadow-md" />
                      <img
                        src={getStickerSrc(st.name)}
                        alt={st.name}
                        draggable={false}
                        onPointerDown={(e) => startDrag(e, st)}
                        onPointerMove={(e) => moveDrag(e, st)}
                        onPointerUp={(e) => endDrag(e, st)}
                        className="pointer-events-auto relative h-full w-full select-none touch-none drop-shadow-sm"
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
            <p className="mt-3 max-w-xs text-center text-xs leading-relaxed text-white/60">
              Pick a sticker, then tap a photo to place it. Drag to move, tap again to remove.
            </p>
          </div>

          {/* ---------- Controls ---------- */}
          <div className="flex flex-col gap-5">
            {/* Footer text */}
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-wider text-white/70">
                Footer text
              </span>
              <input
                type="text"
                value={work.brand || ''}
                maxLength={26}
                onChange={(e) => setWorkFields({ brand: e.target.value })}
                placeholder="Reign's Photobooth"
                className="mt-2 w-full rounded-xl bg-white/15 px-4 py-3 font-bold text-white placeholder-white/40 ring-1 ring-white/20 outline-none transition focus:ring-2 focus:ring-purple-400"
              />
            </label>

            {/* Filter */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                Photo filter
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {FILTER_NAMES.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setWorkFields({ filter: name })}
                    className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                      work.filter === name
                        ? 'bg-purple-500 text-white ring-2 ring-white/50'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    {FILTER_LABELS[name]}
                  </button>
                ))}
              </div>
            </div>

            {/* Border color */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                Border color
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BORDER_COLORS.map((c) =>
                  swatchButton(c, work.borderColor === c, () => setWorkFields({ borderColor: c }))
                )}
              </div>
            </div>

            {/* Paper color */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                Paper color
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {BG_COLORS.map((c) =>
                  swatchButton(c, work.bgColor === c, () => setWorkFields({ bgColor: c }))
                )}
              </div>
            </div>

            {/* Stickers */}
            <div>
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-white/70">
                  Stickers
                </p>
                <button
                  type="button"
                  onClick={() => setWorkFields({ stickers: [] })}
                  className="flex items-center gap-1.5 rounded-lg bg-red-500/20 px-3 py-1.5 text-xs font-bold text-red-200 ring-1 ring-red-400/30 transition hover:bg-red-500/30"
                >
                  <Trash width={14} height={14} />
                  Clear
                </button>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {STICKER_PALETTE.map((s) => (
                  <button
                    key={s.name}
                    type="button"
                    onClick={() => setActiveSticker((cur) => (cur === s.name ? null : s.name))}
                    aria-label={`Sticker ${s.name}`}
                    className={`flex aspect-square items-center justify-center rounded-xl bg-white p-2 transition hover:scale-105 ${
                      activeSticker === s.name
                        ? 'scale-105 ring-2 ring-pink-400 ring-offset-2 ring-offset-purple-700'
                        : 'ring-1 ring-white/30'
                    }`}
                  >
                    <img src={s.src} alt="" className="h-full w-full" />
                  </button>
                ))}
              </div>
              {activeSticker && (
                <p className="mt-2 text-xs font-semibold text-amber-200">
                  Sticker selected — tap a photo to place it.
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="mt-1 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onCancel}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
              >
                <Close width={20} height={20} />
                Cancel
              </button>
              <button type="button" onClick={() => onApply(work)} className="group flex-1 rounded-full p-1">
                <span className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 font-black text-white shadow-xl shadow-pink-900/40 ring-2 ring-white/30 transition group-hover:scale-[1.02] group-active:scale-95">
                  <Printer width={22} height={22} />
                  Apply &amp; Reprint
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default StripEditor;