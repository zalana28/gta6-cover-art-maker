// Vice Cover Studio — screenshot helpers and offscreen export.
// Reads ?shot= presets from the URL so a cover can be staged
// deterministically (layout, grade, caption, title), and renders a cover
// at any exact pixel size into a PNG data URL for download or capture.

import { renderCover } from './cover.js';

// Render the current state at exact pixels and return a PNG data URL.
export function exportCoverDataURL(w, h, state, photos) {
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  renderCover(off.getContext('2d'), w, h, state, photos);
  return off.toDataURL('image/png');
}

// Apply URL presets used when staging screenshots, e.g.
//   ?shot=cover&layout=4&grade=neon&caption=neon&title=VICE%20CITY
// Only known keys are honoured; unknown values are ignored.
export function applyShotPreset(state, photos, ui) {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('shot')) return;
  const layout = params.get('layout');
  if (['1', '2', '3', '4'].includes(layout)) state.layout = layout;
  const grade = params.get('grade');
  if (['sunset', 'neon', 'noir'].includes(grade)) state.grade = grade;
  const caption = params.get('caption');
  if (['outline', 'solid', 'neon', 'sunset'].includes(caption)) state.captionStyle = caption;
  const title = params.get('title');
  if (title) state.title = title;
  const subtitle = params.get('subtitle');
  if (subtitle !== null) state.subtitle = subtitle;
  const titleInput = document.getElementById('titleInput');
  if (titleInput) titleInput.value = state.title;
  const subtitleInput = document.getElementById('subtitleInput');
  if (subtitleInput) subtitleInput.value = state.subtitle;
  document.querySelectorAll('.layout-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.layout === state.layout));
  document.querySelectorAll('.grade-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.grade === state.grade));
  document.querySelectorAll('.caption-chip').forEach((c) => c.classList.toggle('is-active', c.dataset.caption === state.captionStyle));
  if (ui && ui.setSelectedPanel) ui.setSelectedPanel(0);
  if (ui && ui.drawPreview) ui.drawPreview();
}
