import { useCallback, useEffect, useRef, useState } from 'react';
import Webcam from 'react-webcam';
import { playShutter, playTick, unlockAudio } from './sounds';
import {
  Camera as CameraIcon,
  CircleInfoSolid,
  Clock,
  Crown,
  Refresh,
  Sparkles,
  Zap,
} from 'pixelarticons/react';

const MAX_PHOTOS = 4;
const TIMER_OPTIONS = [3, 5, 10];

/**
 * Camera.jsx
 * Real photobooth capture screen.
 *
 * Flow: user picks a countdown (3/5/10s) and presses Start. The booth then
 * runs the full 4-photo sequence automatically - a big countdown + full-screen
 * flash for every shot - with no strip preview in between. When all 4 photos
 * are captured the screen announces "Your photos are ready!" and the finished
 * set is passed to the parent via onProceed.
 *
 * Captures mirror the live webcam preview (react-webcam's getScreenshot
 * ignores the mirrored flag and can return a stale frame, so we draw the live
 * <video> element onto a canvas instead).
 */
function Camera({ onProceed }) {
  const [phase, setPhase] = useState('setup'); // 'setup' | 'running' | 'done'
  const [timerSeconds, setTimerSeconds] = useState(3); // chosen countdown length
  const [countdown, setCountdown] = useState(0); // seconds remaining to display
  const [isFlash, setIsFlash] = useState(false); // full-screen white flash
  const [standby, setStandby] = useState(false); // brief breather between shots
  const [photos, setPhotos] = useState([]);
  const [cameraActive, setCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  const webcamRef = useRef(null);
  const photosCountRef = useRef(0);
  const lastTickRef = useRef(0); // dedupe countdown ticks (StrictMode-safe)

  const currentPhoto = Math.min(photos.length + 1, MAX_PHOTOS);

  // Map a getUserMedia error to a friendly, actionable message
  const getErrorMessage = useCallback((error) => {
    if (error?.name === 'NotAllowedError') {
      return 'Camera permission was denied. Please allow camera access in your browser settings, then retry.';
    }
    if (error?.name === 'NotFoundError' || error?.name === 'DevicesNotFoundError') {
      return 'No camera was found on this device. Connect a webcam and retry.';
    }
    if (error?.name === 'NotReadableError') {
      return 'Your camera is already in use by another app. Close it and retry.';
    }
    return `Camera could not be started. Please check your device and retry. (${error?.name || 'unknown error'})`;
  }, []);

  // Capture the current webcam frame as a base64 data URL, mirrored to match
  // the live preview. A ref guards the shot count so the capture effect never
  // double-fires when photo state updates.
  const captureFrame = useCallback(() => {
    if (photosCountRef.current >= MAX_PHOTOS) return;
    const video = webcamRef.current?.video;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    if (!dataUrl) return;
    photosCountRef.current += 1;
    setPhotos((prev) => [...prev, dataUrl]);
  }, []);

  // Keep the count ref in sync whenever photos are reset
  useEffect(() => {
    photosCountRef.current = photos.length;
  }, [photos.length]);

  // Start a new booth session (from the setup screen)
  const startSession = useCallback(() => {
    unlockAudio(); // create/resume audio from this user gesture
    setPhotos([]);
    photosCountRef.current = 0;
    setStandby(true);
    setPhase('running');
  }, []);

  // Abort the session and return to setup
  const restart = useCallback(() => {
    setPhotos([]);
    photosCountRef.current = 0;
    setStandby(false);
    setCountdown(0);
    setPhase('setup');
  }, []);

  // Kick off the countdown for the next photo whenever we're in standby
  useEffect(() => {
    if (phase !== 'running' || !standby) return;
    if (photos.length >= MAX_PHOTOS) return;
    setStandby(false);
    setCountdown(timerSeconds);
  }, [phase, standby, timerSeconds, photos.length]);

  // Countdown driver: tick once per second, capture + flash at zero
  useEffect(() => {
    if (phase !== 'running' || standby) return;
    if (countdown > 0) {
      const tick = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(tick);
    }
    captureFrame();
    setIsFlash(true);
    playShutter();
    const pause = setTimeout(() => {
      setIsFlash(false);
      setStandby(true);
    }, 320);
    return () => clearTimeout(pause);
  }, [phase, standby, countdown, captureFrame]);

  // Tick sound for every second of the countdown, final blip on the last one
  useEffect(() => {
    if (phase !== 'running' || standby || countdown <= 0) {
      lastTickRef.current = 0;
      return;
    }
    if (lastTickRef.current === countdown) return;
    lastTickRef.current = countdown;
    playTick(countdown === 1);
  }, [phase, standby, countdown]);

  // When the 4th photo lands, announce completion and move on
  useEffect(() => {
    if (phase === 'running' && photos.length >= MAX_PHOTOS) {
      setStandby(false);
      const t = setTimeout(() => setPhase('done'), 800);
      return () => clearTimeout(t);
    }
  }, [phase, photos.length]);

  // Done phase -> hand the finished photos to the parent
  useEffect(() => {
    if (phase !== 'done') return;
    const t = setTimeout(() => onProceed(photos), 1300);
    return () => clearTimeout(t);
  }, [phase, photos, onProceed]);

  // Handle camera errors gracefully (permission denied, no camera, etc.)
  const handleUserMediaError = useCallback(
    (error) => {
      setCameraError(getErrorMessage(error));
      setCameraActive(false);
      setPhase('setup');
      setPhotos([]);
      photosCountRef.current = 0;
      setStandby(false);
      setCountdown(0);
    },
    [getErrorMessage]
  );

  // Re-request access to the camera after an error
  const handleRetryCamera = useCallback(() => {
    setCameraError(null);
    setCameraActive(true);
  }, []);

  return (
    <>
      {/* Full-screen white flash on every capture */}
      {isFlash && <div className="pointer-events-none fixed inset-0 z-50 animate-flash bg-white" />}

      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 p-6">
        <div className="w-full max-w-3xl rounded-3xl border border-white/20 bg-white/10 p-6 shadow-2xl shadow-purple-900/50 backdrop-blur-xl md:p-8">
          {/* Header */}
          <div className="mb-5 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-xl font-black uppercase tracking-widest text-white drop-shadow">
              <Crown className="animate-pop-in text-amber-300" width={26} height={26} />
              Reign's Photobooth
            </h1>
            {phase === 'running' && (
              <button
                type="button"
                onClick={restart}
                className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white/80 ring-1 ring-white/20 transition hover:bg-white/20"
              >
                <Refresh width={20} height={20} />
                Restart
              </button>
            )}
          </div>

          {/* ---------- Live camera feed ---------- */}
          <div className="relative overflow-hidden rounded-2xl border-4 border-white/10 bg-black p-2 shadow-xl shadow-black/40">
            {cameraActive && !cameraError ? (
              <Webcam
                ref={webcamRef}
                audio={false}
                mirrored
                videoConstraints={{ width: 1280, height: 720, facingMode: 'user' }}
                onUserMediaError={handleUserMediaError}
                className="h-auto w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex aspect-[16/9] w-full flex-col items-center justify-center gap-4 rounded-xl bg-gray-900 p-8 text-center text-white">
                <CircleInfoSolid width={72} height={72} className="text-purple-300" />
                <p className="max-w-sm text-sm leading-relaxed text-gray-300">{cameraError}</p>
                <button
                  type="button"
                  onClick={handleRetryCamera}
                  className="mt-2 flex items-center gap-2 rounded-full bg-white px-6 py-2 text-sm font-bold text-purple-700 shadow-lg transition hover:scale-105 hover:bg-purple-50"
                >
                  <Refresh width={24} height={24} />
                  Retry Camera
                </button>
              </div>
            )}

            {/* Countdown overlay */}
            {phase === 'running' && countdown > 0 && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/45">
                <p className="text-lg font-bold uppercase tracking-[0.35em] text-white/90">
                  Photo {currentPhoto} / {MAX_PHOTOS}
                </p>
                <span
                  key={countdown}
                  className="animate-pop-in text-[9rem] font-black leading-none text-white drop-shadow-2xl md:text-[12rem]"
                >
                  {countdown}
                </span>
                <p className="text-2xl font-semibold text-white/85">Get ready...</p>
              </div>
            )}

            {/* Completion overlay */}
            {phase === 'done' && (
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl bg-black/55">
                <span className="animate-pop-in">
                  <Sparkles className="text-amber-300" width={80} height={80} />
                </span>
                <p className="animate-fade-in-up text-3xl font-black uppercase tracking-wider text-white drop-shadow-lg md:text-4xl">
                  Your photos are ready!
                </p>
              </div>
            )}
          </div>

          {/* ---------- Controls ---------- */}
          {phase === 'setup' && (
            <div className="mt-6 animate-fade-in-up">
              <p className="mb-3 text-sm font-bold uppercase tracking-wider text-white/70">
                Choose your countdown
              </p>
              <div className="flex gap-2">
                {TIMER_OPTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTimerSeconds(s)}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-black transition ${
                      timerSeconds === s
                        ? 'bg-purple-500 text-white ring-2 ring-white/50'
                        : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }`}
                  >
                    <Clock width={22} height={22} />
                    {s}s
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/70">
                You'll get <span className="font-bold text-white">{timerSeconds} seconds</span> for
                each of the <span className="font-bold text-white">4 shots</span>. No previews in
                between - just like a real booth.
              </p>
              <button
                type="button"
                onClick={startSession}
                disabled={!!cameraError}
                className="group mt-5 w-full rounded-full p-1 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <span className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 text-xl font-black text-white shadow-xl shadow-pink-900/40 ring-2 ring-white/30 transition group-hover:scale-[1.02] group-hover:shadow-2xl group-active:scale-95">
                  <Zap width={26} height={26} />
                  Start Booth
                </span>
              </button>
            </div>
          )}

          {phase === 'running' && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2">
                {Array.from({ length: MAX_PHOTOS }, (_, i) => (
                  <span
                    key={i}
                    className={`h-3 w-3 rounded-full transition ${
                      i < photos.length
                        ? 'bg-emerald-400'
                        : i === photos.length
                          ? 'animate-pulse-soft bg-amber-300'
                          : 'bg-white/25'
                    }`}
                  />
                ))}
              </div>
              <span className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-white/80">
                <CameraIcon width={20} height={20} />
                Photo {currentPhoto} / {MAX_PHOTOS}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Camera;