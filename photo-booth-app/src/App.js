import { useState } from 'react';
import Camera from './Camera';
import ClaimPhoto from './ClaimPhoto';
import PrintingAnimation from './PrintingAnimation';
import PhotoStrip from './PhotoStrip';
import StripEditor from './StripEditor';
import composeStrip, { DEFAULT_CONFIG } from './stripComposer';

/**
 * App.js
 * Orchestrates the photobooth flow as a stage machine:
 *   camera -> claim -> printing -> result (-> editor -> printing -> result)
 *
 * Captured photos are composed into a single strip PNG (composeStrip) once
 * after capture and again after any edit, then passed to the printing
 * animation as the "paper" that comes out of the machine.
 */
function App() {
  const [phase, setPhase] = useState('camera'); // 'camera' | 'claim' | 'printing' | 'result'
  const [photos, setPhotos] = useState(null);
  const [config, setConfig] = useState(null);
  const [stripSrc, setStripSrc] = useState(null);
  const [editing, setEditing] = useState(false);
  const [composeError, setComposeError] = useState(null);

  // Booth finished capturing -> compose the strip, show claim screen
  const handleCaptured = async (captured) => {
    if (!captured || captured.length === 0) return;
    const cfg = DEFAULT_CONFIG(captured);
    try {
      const src = await composeStrip(cfg);
      setComposeError(null);
      setPhotos(captured);
      setConfig(cfg);
      setStripSrc(src);
      setPhase('claim');
    } catch (err) {
      console.error('Failed to compose strip', err);
      setComposeError('Could not compose your strip. Please try again.');
    }
  };

  // User pressed "Claim Photo" -> start the printing animation
  const handleClaim = () => setPhase('printing');

  // Printing finished -> show the final strip
  const handlePrintDone = () => setPhase('result');

  // Editor applied changes -> recompose and reprint
  const handleEditSave = async (next) => {
    try {
      const src = await composeStrip(next);
      setComposeError(null);
      setConfig(next);
      setStripSrc(src);
      setEditing(false);
      setPhase('printing');
    } catch (err) {
      console.error('Failed to recompose strip', err);
      setComposeError('Could not apply your edits. Please try again.');
      setEditing(false);
    }
  };

  // Back to the booth
  const handleRestart = () => {
    setComposeError(null);
    setPhotos(null);
    setConfig(null);
    setStripSrc(null);
    setEditing(false);
    setPhase('camera');
  };

  let screen;
  if (phase === 'camera' || !photos || !stripSrc) {
    screen = <Camera onProceed={handleCaptured} />;
  } else if (phase === 'claim') {
    screen = (
      <ClaimPhoto
        photos={photos}
        stripSrc={stripSrc}
        onClaim={handleClaim}
        onRetake={handleRestart}
      />
    );
  } else if (phase === 'printing') {
    screen = <PrintingAnimation stripSrc={stripSrc} onDone={handlePrintDone} />;
  } else if (editing) {
    screen = (
      <StripEditor config={config} onCancel={() => setEditing(false)} onApply={handleEditSave} />
    );
  } else {
    screen = (
      <PhotoStrip stripSrc={stripSrc} onEdit={() => setEditing(true)} onRestart={handleRestart} />
    );
  }

  return (
    <>
      {composeError && (
        <div className="fixed inset-x-0 top-4 z-[70] mx-auto w-[calc(100%-2rem)] max-w-md rounded-xl bg-red-600/95 px-4 py-3 text-center text-sm font-bold text-white shadow-2xl">
          {composeError}
        </div>
      )}
      {screen}
    </>
  );
}

export default App;