import heart from 'pixelarticons/svg/heart.svg';
import star from 'pixelarticons/svg/star.svg';
import crown from 'pixelarticons/svg/crown.svg';
import fire from 'pixelarticons/svg/fire.svg';
import sparkle from 'pixelarticons/svg/sparkle.svg';
import music from 'pixelarticons/svg/music.svg';
import smile from 'pixelarticons/svg/smile.svg';
import sunglasses from 'pixelarticons/svg/sunglasses.svg';
import zap from 'pixelarticons/svg/zap.svg';
import balloon from 'pixelarticons/svg/balloon.svg';

const resolveAsset = (asset) => (asset && asset.default != null ? asset.default : asset);

export const STICKER_PALETTE = [
  { name: 'heart', src: resolveAsset(heart) },
  { name: 'star', src: resolveAsset(star) },
  { name: 'crown', src: resolveAsset(crown) },
  { name: 'fire', src: resolveAsset(fire) },
  { name: 'sparkle', src: resolveAsset(sparkle) },
  { name: 'music', src: resolveAsset(music) },
  { name: 'smile', src: resolveAsset(smile) },
  { name: 'sunglasses', src: resolveAsset(sunglasses) },
  { name: 'zap', src: resolveAsset(zap) },
  { name: 'balloon', src: resolveAsset(balloon) },
];

const STICKER_SOURCES = Object.fromEntries(STICKER_PALETTE.map((s) => [s.name, s.src]));

export const FILTERS = {
  normal: 'none',
  bw: 'grayscale(1) brightness(1.02) contrast(1.05)',
  sepia: 'sepia(0.85) contrast(1.04) brightness(1.02)',
  vivid: 'saturate(1.45) contrast(1.12)',
};

export const FILTER_NAMES = Object.keys(FILTERS);

export const BORDER_COLORS = ['#ffffff', '#111111', '#7c3aed', '#ec4899', '#2563eb', '#16a34a', '#ea580c', '#eab308'];

export const BG_COLORS = ['#ffffff', '#18181b', '#f5f3ff', '#fbe3fb', '#e0f0ff', '#fdf6d8'];

export const DEFAULT_CONFIG = (photos) => ({
  photos,
  brand: 'PHOTO BOOTH',
  borderColor: '#ffffff',
  bgColor: '#ffffff',
  filter: 'normal',
  stickers: [],
});

const WIDTH = 720;
const PAD = 28;
const GAP = 10;
const SLOT = WIDTH - PAD * 2;
const FOOTER = 96;
const HEIGHT = PAD + SLOT * 4 + GAP * 3 + FOOTER + PAD;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('failed to load image'));
    img.src = src;
  });
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCover(ctx, img, x, y, w, h) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  if (!iw || !ih) return;
  const scale = Math.max(w / iw, h / ih);
  const sw = w / scale;
  const sh = h / scale;
  const sx = (iw - sw) / 2;
  const sy = (ih - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
}

function clamp255(value) {
  return Math.max(0, Math.min(255, Math.round(value)));
}

// Applies a photo filter by processing pixels directly (no ctx.filter, which
// is browser-dependent). Returns the original image for 'normal' or a filtered
// canvas otherwise. Works everywhere Chrome, Safari and Firefox support
// getImageData along with the same preview shown in the editor.
function applyFilterToImage(img, filterName) {
  if (!filterName || filterName === 'normal') return img;
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth || img.width;
  canvas.height = img.naturalHeight || img.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const r0 = data[i];
    const g0 = data[i + 1];
    const b0 = data[i + 2];
    let r = r0;
    let g = g0;
    let b = b0;
    if (filterName === 'bw') {
      const gray = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
      r = g = b = gray;
    } else if (filterName === 'sepia') {
      r = 0.393 * r0 + 0.769 * g0 + 0.189 * b0;
      g = 0.349 * r0 + 0.686 * g0 + 0.168 * b0;
      b = 0.272 * r0 + 0.534 * g0 + 0.131 * b0;
    } else if (filterName === 'vivid') {
      const l = 0.299 * r0 + 0.587 * g0 + 0.114 * b0;
      const s = 1.45;
      const nr = l + (r0 - l) * s;
      const ng = l + (g0 - l) * s;
      const nb = l + (b0 - l) * s;
      r = nr + (nr - 128) * 0.12;
      g = ng + (ng - 128) * 0.12;
      b = nb + (nb - 128) * 0.12;
    }
    data[i] = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

export default async function composeStrip(config) {
  const cfg = config || {};
  const photos = cfg.photos || [];
  const brand = (cfg.brand || 'PHOTO BOOTH').toUpperCase();
  const borderColor = cfg.borderColor || '#ffffff';
  const bgColor = cfg.bgColor || '#ffffff';
  const stickers = cfg.stickers || [];

  const photoImgs = await Promise.all(photos.map((src) => loadImage(src)));

  const stickerImgs = {};
  const needed = [...new Set(stickers.map((s) => s.name))];
  await Promise.all(
    needed.map(async (name) => {
      const src = STICKER_SOURCES[name];
      if (src) stickerImgs[name] = await loadImage(src);
    })
  );

  const canvas = document.createElement('canvas');
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  const radius = 12;
  const margin = 12;
  const borderW = 5;

  for (let i = 0; i < 4; i += 1) {
    const x = PAD;
    const y = PAD + i * (SLOT + GAP);
    const img = photoImgs[i];
    if (!img) continue;

    const filtered = applyFilterToImage(img, cfg.filter);
    ctx.save();
    roundRect(ctx, x, y, SLOT, SLOT, radius);
    ctx.clip();
    drawCover(ctx, filtered, x + margin, y + margin, SLOT - margin * 2, SLOT - margin * 2);
    ctx.restore();

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderW;
    roundRect(ctx, x, y, SLOT, SLOT, radius);
    ctx.stroke();
  }

  const fy = PAD + SLOT * 4 + GAP * 3;
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PAD + 44, fy);
  ctx.lineTo(WIDTH - PAD - 44, fy);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.fillStyle = '#2d2d2d';
  let brandSize = 42;
  if (brand.length > 20) brandSize = 26;
  else if (brand.length > 14) brandSize = 32;
  ctx.font = `700 ${brandSize}px Arial, sans-serif`;
  ctx.fillText(brand, WIDTH / 2, fy + 54);

  const date = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
  ctx.font = '600 20px Arial, sans-serif';
  ctx.fillStyle = '#8a8a8a';
  ctx.fillText(date, WIDTH / 2, fy + 84);

  for (const st of stickers) {
    const slot = st.slot;
    if (slot == null || slot < 0 || slot > 3) continue;
    const img = stickerImgs[st.name];
    if (!img) continue;
    const drawW = SLOT * (st.scale || 0.22);
    const cx = PAD + (st.x ?? 0.5) * SLOT;
    const cy = PAD + slot * (SLOT + GAP) + (st.y ?? 0.8) * SLOT;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, drawW * 0.62, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fill();
    ctx.restore();

    ctx.drawImage(img, cx - drawW / 2, cy - drawW / 2, drawW, drawW);
  }

  return canvas.toDataURL('image/png');
}