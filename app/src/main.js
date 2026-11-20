// Vice Cover Studio — editor UI state and wiring.
// Owns the photos, the per-panel placement, the controls and the PNG export.
// Rendering itself lives in cover.js; screenshot presets live in shots.js.

import { renderCover, panelPolygons } from './cover.js';
import { applyShotPreset, exportCoverDataURL } from './shots.js';

const SAMPLE_URL = 'samples/vice-boulevard.jpg';

export const DEFAULT_STATE = {
  layout: '2',
  grade: 'sunset',
  captionStyle: 'outline',
  title: 'Vice City',
  subtitle: 'Sunset Heist',
  panels: [
    { photo: 0, x: 0, y: 0, zoom: 1 },
    { photo: 0, x: 0, y: 0, zoom: 1 },
    { photo: 0, x: 0, y: 0, zoom: 1 },
    { photo: 0, x: 0, y: 0, zoom: 1 },
  ],
};

export const state = structuredClone(DEFAULT_STATE);
export const photos = [];
export let selectedPanel = 0;
export let selectedPhoto = 0;
export let exportSize = { w: 1080, h: 1080 };

const canvas = document.getElementById('preview');
const ctx = canvas.getContext('2d');

export function panelCount() {
  return Number(state.layout);
}

export function drawPreview() {
  const side = 1080;
  if (canvas.width !== side) canvas.width = side;
  if (canvas.height !== side) canvas.height = side;
  renderCover(ctx, side, side, state, photos);
}

export function setSelectedPanel(index) {
  selectedPanel = Math.max(0, Math.min(panelCount() - 1, index));
  document.getElementById('selectedPanelLabel').textContent = `Panel ${selectedPanel + 1}`;
  const panel = state.panels[selectedPanel];
  const slider = document.getElementById('zoomSlider');
  slider.value = String(panel.zoom);
  document.getElementById('zoomValue').textContent = `${panel.zoom.toFixed(2)}×`;
}

function refreshPhotoStrip() {
  const strip = document.getElementById('photoStrip');
  strip.innerHTML = '';
  photos.forEach((photo, i) => {
    const thumb = document.createElement('img');
    thumb.src = photo.src;
    thumb.alt = photo.name;
    thumb.title = photo.name;
    if (i === selectedPhoto) thumb.classList.add('is-selected');
    if (photo.sample) thumb.classList.add('is-sample');
    thumb.addEventListener('click', () => {
      selectedPhoto = i;
      refreshPhotoStrip();
    });
    strip.appendChild(thumb);
  });
}

function assignPhotoToPanel(photoIndex, panelIndex) {
  state.panels[panelIndex].photo = photoIndex;
  state.panels[panelIndex].x = 0;
  state.panels[panelIndex].y = 0;
  state.panels[panelIndex].zoom = 1;
  setSelectedPanel(panelIndex);
  drawPreview();
}

function addPhotos(files) {
  let loaded = 0;
  const total = files.length;
  if (!total) return;
  for (const file of files) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        photos.push({ src: String(reader.result), name: file.name, img });
        selectedPhoto = photos.length - 1;
        assignPhotoToPanel(selectedPhoto, selectedPanel);
        refreshPhotoStrip();
        loaded += 1;
        if (loaded === total) drawPreview();
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
}

function loadSamplePhoto() {
  const img = new Image();
  img.onload = () => {
    photos.push({ src: SAMPLE_URL, name: 'Vice Boulevard (sample)', img, sample: true });
    refreshPhotoStrip();
    drawPreview();
    window.__ready = true;
  };
  img.onerror = () => {
    drawPreview();
    window.__ready = true;
  };
  img.src = SAMPLE_URL;
}

function pickPanelAt(clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const x = (clientX - rect.left) / rect.width;
  const y = (clientY - rect.top) / rect.height;
  // Panels are diagonal strips; pick by the strip the point falls in.
  // Walk panels in order, first polygon that contains the point wins
  // (point-in-polygon on unit space, same geometry as the renderer).
  const polys = panelPolygons(state.layout, 1, 1);
  for (let i = 0; i < polys.length; i++) {
    if (pointInPolygon(x, y, polys[i])) return i;
  }
  return 0;
}

function pointInPolygon(x, y, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function setupDragPan() {
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let moved = false;
  canvas.addEventListener('pointerdown', (event) => {
    dragging = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    const rect = canvas.getBoundingClientRect();
    const panel = state.panels[selectedPanel];
    panel.x += (event.clientX - lastX) / rect.width;
    panel.y += (event.clientY - lastY) / rect.height;
    lastX = event.clientX;
    lastY = event.clientY;
    moved = true;
    drawPreview();
  });
  canvas.addEventListener('pointerup', (event) => {
    dragging = false;
    if (!moved) {
      const picked = pickPanelAt(event.clientX, event.clientY);
      setSelectedPanel(picked);
      assignPhotoToPanel(selectedPhoto, picked);
    }
  });
}

function setupControls() {
  document.getElementById('photoInput').addEventListener('change', (event) => {
    addPhotos([...event.target.files]);
    event.target.value = '';
  });

  document.getElementById('fillAllBtn').addEventListener('click', () => {
    for (let i = 0; i < state.panels.length; i++) {
      state.panels[i].photo = selectedPhoto;
      state.panels[i].x = 0;
      state.panels[i].y = 0;
    }
    drawPreview();
  });

  document.getElementById('layoutRow').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-layout]');
    if (!btn) return;
    state.layout = btn.dataset.layout;
    document.querySelectorAll('.layout-chip').forEach((c) => c.classList.toggle('is-active', c === btn));
    setSelectedPanel(selectedPanel);
    drawPreview();
  });

  document.getElementById('gradeRow').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-grade]');
    if (!btn) return;
    state.grade = btn.dataset.grade;
    document.querySelectorAll('.grade-chip').forEach((c) => c.classList.toggle('is-active', c === btn));
    drawPreview();
  });

  document.getElementById('captionRow').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-caption]');
    if (!btn) return;
    state.captionStyle = btn.dataset.caption;
    document.querySelectorAll('.caption-chip').forEach((c) => c.classList.toggle('is-active', c === btn));
    drawPreview();
  });

  document.getElementById('zoomSlider').addEventListener('input', (event) => {
    const panel = state.panels[selectedPanel];
    panel.zoom = Number(event.target.value);
    document.getElementById('zoomValue').textContent = `${panel.zoom.toFixed(2)}×`;
    drawPreview();
  });

  document.getElementById('titleInput').addEventListener('input', (event) => {
    state.title = event.target.value;
    drawPreview();
  });

  document.getElementById('subtitleInput').addEventListener('input', (event) => {
    state.subtitle = event.target.value;
    drawPreview();
  });

  document.getElementById('sizeRow').addEventListener('click', (event) => {
    const btn = event.target.closest('[data-w]');
    if (!btn) return;
    exportSize = { w: Number(btn.dataset.w), h: Number(btn.dataset.h) };
    document.querySelectorAll('.size-chip').forEach((c) => c.classList.toggle('is-active', c === btn));
  });

  document.getElementById('exportBtn').addEventListener('click', () => {
    exportCoverPNG(exportSize.w, exportSize.h);
  });

  document.getElementById('resetBtn').addEventListener('click', () => {
    const fresh = structuredClone(DEFAULT_STATE);
    Object.assign(state, fresh);
    document.getElementById('titleInput').value = state.title;
    document.getElementById('subtitleInput').value = state.subtitle;
    document.querySelectorAll('.layout-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.layout === state.layout));
    document.querySelectorAll('.grade-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.grade === state.grade));
    document.querySelectorAll('.caption-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.caption === state.captionStyle));
    setSelectedPanel(0);
    drawPreview();
  });
}

// Export the cover at exact pixels and download it as a PNG.
export function exportCoverPNG(w, h) {
  const url = exportCoverDataURL(w, h, state, photos);
  const a = document.createElement('a');
  a.href = url;
  a.download = `vice-cover-${w}x${h}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

// Screenshot / automation handle: renders any size and returns a PNG data URL.
window.__vice = {
  state,
  photos,
  exportDataURL: (w, h) => exportCoverDataURL(w, h, state, photos),
  setPanel: (i) => setSelectedPanel(i),
  redraw: () => drawPreview(),
};

setupControls();
setupDragPan();
setSelectedPanel(0);
loadSamplePhoto();
applyShotPreset(state, photos, { drawPreview, setSelectedPanel });
