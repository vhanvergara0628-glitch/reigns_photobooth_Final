import { useEffect, useState } from 'react';
import { Loader, Printer } from 'pixelarticons/react';
import { playReadyChime, startPrinting, stopPrinting } from './sounds';

/**
 * PrintingAnimation.jsx
 * Photobooth "machine" moment: a booth graphic with a slot, out of which the
 * finished strip slides downward (print-down keyframe) with a subtle paper
 * wobble. Shows "PRINTING..." then "Strip ready!" before calling onDone.
 *
 * The strip is measured first so the emerging height matches the actual
 * strip's aspect ratio (responsive width).
 */
function PrintingAnimation({ stripSrc, onDone }) {
  const [stage, setStage] = useState('printing'); // 'printing' | 'ready'
  const [natural, setNatural] = useState(null);

  useEffect(() => {
    const t1 = setTimeout(() => setStage('ready'), 3300);
    const t2 = setTimeout(() => onDone(), 4400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [onDone]);

  // Machine sound while the strip prints, chime when it's done
  useEffect(() => {
    startPrinting();
    return () => stopPrinting();
  }, []);

  useEffect(() => {
    if (stage === 'ready') {
      stopPrinting();
      playReadyChime();
    }
  }, [stage]);

  const displayW = Math.min(240, window.innerWidth - 40);
  const displayH = natural ? Math.round((displayW * natural) / 720) : undefined;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 p-4 md:p-6">
      <div className="flex animate-fade-in-up flex-col items-center">
        {/* Hidden measurer so the strip renders at its exact aspect ratio */}
        <img
          src={stripSrc}
          alt=""
          className="hidden"
          onLoad={(e) => setNatural(e.target.naturalWidth)}
        />

        {/* Machine */}
        <div
          className="relative z-10 flex flex-col items-center rounded-t-2xl bg-slate-900 px-4 pb-3 pt-5 text-white shadow-2xl shadow-black/50"
          style={{ width: displayW + 20 }}
        >
          <span className="animate-pulse-soft text-purple-300">
            <Printer width={44} height={44} />
          </span>
          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.3em] text-white/70">
            Reign's Photobooth
          </p>
          <div className="mt-3 h-2 w-3/4 rounded-full bg-black" />
        </div>

        {/* Strip sliding out of the slot */}
        {natural && displayH && (
          <div
            className="relative overflow-hidden bg-black/20 shadow-2xl shadow-black/40"
            style={{ width: displayW, height: displayH }}
          >
            <div className="animate-paper-wobble">
              <img
                src={stripSrc}
                alt="Printing photobooth strip"
                className="animate-print-down h-auto w-full"
                style={{ width: displayW }}
              />
            </div>
          </div>
        )}
      </div>

      <p className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80">
        {stage === 'printing' ? (
          <>
            <Loader className="animate-spin" width={18} height={18} />
            Printing...
          </>
        ) : (
          <span className="text-emerald-300">Strip ready!</span>
        )}
      </p>
    </div>
  );
}

export default PrintingAnimation;