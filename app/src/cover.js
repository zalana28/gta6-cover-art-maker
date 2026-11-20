// Vice Cover Studio — cover rendering engine.
// Draws a GTA-poster-style multi-panel cover onto any 2d canvas:
// diagonal panels, a photo per panel (pan + zoom), a colour grade,
// halftone dots and big bold outlined caption lettering.
// No network, no fonts to load: lettering uses heavy system sans fonts.

export const LAYOUTS = {
  '1': { panels: 1, label: 'One panel' },
  '2': { panels: 2, label: 'Two panels' },
  '3': { panels: 3, label: 'Three panels' },
  '4': { panels: 4, label: 'Four panels' },
};

export const GRADES = {
  sunset: { label: 'Sunset', filter: 'saturate(1.25) contrast(1.08) brightness(1.02)' },
  neon: { label: 'Neon', filter: 'saturate(1.7) contrast(1.12) brightness(0.98)' },
  noir: { label: 'Noir', filter: 'grayscale(1) contrast(1.25) brightness(1.05)' },
};

export const CAPTION_STYLES = {
  outline: { label: 'Outline' },
  solid: { label: 'Solid pop' },
  neon: { label: 'Neon glow' },
  sunset: { label: 'Sunset fade' },
};

// Diagonal panel polygons, as fractions of the cover width/height.
// Each panel is a list of [x, y] corners in 0..1 space.
export function panelPolygons(layout, w, h) {
  const P = (x, y) => [x * w, y * h];
  if (layout === '1') {
    return [[P(0, 0), P(1, 0), P(1, 1), P(0, 1)]];
  }
  if (layout === '2') {
    return [
      [P(0, 0), P(0.62, 0), P(0.38, 1), P(0, 1)],
      [P(0.62, 0), P(1, 0), P(1, 1), P(0.38, 1)],
    ];
  }
  if (layout === '3') {
    return [
      [P(0, 0), P(0.40, 0), P(0.16, 1), P(0, 1)],
      [P(0.40, 0), P(0.74, 0), P(0.50, 1), P(0.16, 1)],
      [P(0.74, 0), P(1, 0), P(1, 1), P(0.50, 1)],
    ];
  }
  // 4 panels: two rows, each split on a diagonal running the other way.
  return [
    [P(0, 0), P(0.56, 0), P(0.44, 0.5), P(0, 0.5)],
    [P(0.56, 0), P(1, 0), P(1, 0.5), P(0.44, 0.5)],
    [P(0, 0.5), P(0.44, 0.5), P(0.56, 1), P(0, 1)],
    [P(0.44, 0.5), P(1, 0.5), P(1, 1), P(0.56, 1)],
  ];
}

function polygonBounds(poly) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of poly) {
    if (x < x0) x0 = x;
    if (y < y0) y0 = y;
    if (x > x1) x1 = x;
    if (y > y1) y1 = y;
  }
  return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
}

function tracePolygon(ctx, poly) {
  ctx.beginPath();
  ctx.moveTo(poly[0][0], poly[0][1]);
  for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i][0], poly[i][1]);
  ctx.closePath();
}

// Draw one photo into one panel, cover-fit, with the panel's pan/zoom.
export function drawPanelPhoto(ctx, img, poly, pan) {
  const box = polygonBounds(poly);
  const zoom = pan.zoom || 1;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const scale = Math.max(box.w / iw, box.h / ih) * zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = box.x + (box.w - dw) / 2 + (pan.x || 0) * box.w;
  const dy = box.y + (box.h - dh) / 2 + (pan.y || 0) * box.h;
  ctx.save();
  tracePolygon(ctx, poly);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

// Warm sunset wash, neon magenta/cyan wash, or a noir vignette.
export function applyGradeWash(ctx, w, h, grade) {
  if (grade === 'sunset') {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255, 94, 120, 0.10)');
    g.addColorStop(0.55, 'rgba(255, 140, 60, 0.05)');
    g.addColorStop(1, 'rgba(255, 180, 40, 0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'neon') {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, 'rgba(255, 0, 128, 0.12)');
    g.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 229, 255, 0.14)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  } else if (grade === 'noir') {
    const g = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    g.addColorStop(0, 'rgba(0, 0, 0, 0)');
    g.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }
}

// Classic comic halftone dots in one corner, clipped to a soft triangle.
export function drawHalftone(ctx, w, h, grade) {
  const dot = grade === 'noir' ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.55)';
  const step = Math.max(10, w / 90);
  const r = step * 0.22;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(w, 0);
  ctx.lineTo(w, h * 0.30);
  ctx.lineTo(w * 0.72, 0);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = dot;
  for (let y = step / 2; y < h * 0.30; y += step) {
    for (let x = w - step / 2; x > w * 0.70; x -= step) {
      const shrink = 1 - (y / (h * 0.30)) * 0.5;
      ctx.beginPath();
      ctx.arc(x, y, Math.max(0.6, r * shrink), 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

function fitTitleFont(ctx, text, maxWidth, startPx, family) {
  let px = startPx;
  ctx.font = `900 ${px}px ${family}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `900 ${px}px ${family}`;
  }
  return px;
}

// Big bold caption: title across the bottom, subtitle on a pill beneath it.
export function drawCaption(ctx, w, h, title, subtitle, style) {
  const family = '"Arial Black", "Helvetica Neue", Arial, sans-serif';
  const margin = w * 0.045;
  const maxWidth = w - margin * 2;
  const titleText = (title || 'VICE CITY').toUpperCase();
  const titlePx = fitTitleFont(ctx, titleText, maxWidth, Math.round(h * 0.115), family);
  const titleY = h - h * 0.055 - Math.round(h * 0.028);
  ctx.save();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;

  if (style === 'sunset') {
    const g = ctx.createLinearGradient(0, titleY - titlePx, 0, titleY);
    g.addColorStop(0, '#ffe259');
    g.addColorStop(0.5, '#ff7e5f');
    g.addColorStop(1, '#ff2e88');
    ctx.fillStyle = g;
  } else if (style === 'neon') {
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = titlePx * 0.35;
  } else if (style === 'solid') {
    ctx.fillStyle = '#ffffff';
  } else {
    ctx.fillStyle = '#ffffff';
  }
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = Math.max(3, titlePx * 0.09);
  ctx.strokeText(titleText, margin, titleY);
  if (style === 'neon') {
    ctx.shadowColor = '#00e5ff';
    ctx.shadowBlur = titlePx * 0.18;
  }
  ctx.fillText(titleText, margin, titleY);
  ctx.shadowBlur = 0;

  const sub = (subtitle || '').trim();
  if (sub) {
    const subPx = Math.max(14, Math.round(h * 0.026));
    ctx.font = `700 ${subPx}px ${family}`;
    const subWidth = ctx.measureText(sub.toUpperCase()).width;
    const padX = subPx * 0.7;
    const pillW = subWidth + padX * 2;
    const pillH = subPx * 1.9;
    const pillX = margin;
    const pillY = titleY + subPx * 0.55;
    ctx.fillStyle = style === 'neon' ? '#ff2e88' : '#111111';
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.textBaseline = 'middle';
    ctx.fillText(sub.toUpperCase(), pillX + padX, pillY + pillH / 2 + 1);
  }
  ctx.restore();
}

// Full cover render. state: { layout, grade, captionStyle, title, subtitle,
// panels: [{ photo, x, y, zoom }] }, photos: array of loaded images.
export function renderCover(ctx, w, h, state, photos) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);
  const polys = panelPolygons(state.layout, w, h);
  const grade = GRADES[state.grade] ? state.grade : 'sunset';
  polys.forEach((poly, i) => {
    const panel = state.panels[i] || { photo: 0, x: 0, y: 0, zoom: 1 };
    // A photo entry is { img, src, name } from the editor; a bare image
    // works too, so plain image arrays stay renderable.
    const entry = photos[panel.photo];
    const img = entry && entry.img ? entry.img : entry;
    ctx.save();
    ctx.filter = GRADES[grade].filter;
    if (img) drawPanelPhoto(ctx, img, poly, panel);
    ctx.restore();
    ctx.save();
    tracePolygon(ctx, poly);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(2, w / 320);
    ctx.stroke();
    ctx.restore();
  });
  applyGradeWash(ctx, w, h, grade);
  drawHalftone(ctx, w, h, grade);
  drawCaption(ctx, w, h, state.title, state.subtitle, state.captionStyle);
}
