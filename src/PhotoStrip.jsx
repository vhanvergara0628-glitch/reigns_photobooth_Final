import { Download, Pencil, Refresh } from 'pixelarticons/react';

/**
 * PhotoStrip.jsx
 * Final result screen. Shows the composed, printable strip and offers Edit
 * (opens the strip editor), Download PNG, and starting over.
 */
function PhotoStrip({ stripSrc, onEdit, onRestart }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 p-4 md:p-6">
      <div className="w-full max-w-lg animate-fade-in-up rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-purple-900/50 backdrop-blur-xl md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow md:text-3xl">
            Your strip is ready!
          </h1>
          <p className="mt-2 text-sm text-white/75">Edit it, download it, or start fresh.</p>
        </div>

        {/* Strip preview */}
        <div className="mt-6 flex justify-center">
          <img
            src={stripSrc}
            alt="Photobooth strip"
            className="w-56 rounded-lg shadow-2xl ring-4 ring-white/90 sm:w-72"
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
          >
            <Pencil width={22} height={22} />
            Edit
          </button>
          <a
            href={stripSrc}
            download="photobooth-strip.png"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 font-bold text-purple-700 shadow-xl transition hover:bg-purple-50"
          >
            <Download width={22} height={22} />
            Download PNG
          </a>
        </div>

        <button
          type="button"
          onClick={onRestart}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
        >
          <Refresh width={18} height={18} />
          Take new photos
        </button>
      </div>
    </div>
  );
}

export default PhotoStrip;