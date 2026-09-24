import { Download, Printer, Refresh } from 'pixelarticons/react';

/**
 * ClaimPhoto.jsx
 * Shown right after the booth finishes capturing. Displays the 4 raw photos
 * and asks the user to claim them (which triggers the printing animation).
 * The composed strip is already downloadable from here.
 */
function ClaimPhoto({ photos, stripSrc, onClaim, onRetake }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 p-4 md:p-6">
      <div className="w-full max-w-lg animate-fade-in-up rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-purple-900/50 backdrop-blur-xl md:p-8">
        <div className="text-center">
          <h1 className="text-2xl font-black uppercase tracking-widest text-white drop-shadow md:text-3xl">
            Your photos are ready!
          </h1>
          <p className="mt-2 text-sm text-white/75">Take a look, then claim your photobooth strip.</p>
        </div>

        {/* 2x2 raw photo thumbnails */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-xl border-2 border-white/20 bg-white/10"
            >
              {photos[i] ? (
                <img src={photos[i]} alt={`Shot ${i + 1}`} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-white/5" />
              )}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={stripSrc}
            download="photobooth-strip.png"
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white/15 px-6 py-3 font-bold text-white ring-1 ring-white/30 transition hover:bg-white/25"
          >
            <Download width={22} height={22} />
            Download
          </a>
          <button type="button" onClick={onClaim} className="group flex-1 rounded-full p-1">
            <span className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 text-lg font-black text-white shadow-xl shadow-pink-900/40 ring-2 ring-white/30 transition group-hover:scale-[1.02] group-active:scale-95">
              <Printer width={24} height={24} />
              Claim Photo
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={onRetake}
          className="mt-4 flex w-full items-center justify-center gap-2 text-sm font-semibold text-white/60 transition hover:text-white"
        >
          <Refresh width={18} height={18} />
          Retake photos
        </button>
      </div>
    </div>
  );
}

export default ClaimPhoto;