// PROTOTYPE, never merge. Liquid workshop, round 3: the silhouettes the cascade pours
// itself into. Each shape is drawn once into an offscreen 2D canvas (text in the site's
// own fonts, or a lucide icon), then sampled into N particle targets.
//
// Swappable on purpose: any text, icon, logo SVG path or (later) a photo's luminance can
// become a target set. Round 9: one shape per pillar of the story (../story.ts), then
// contact. Earlier test shapes (palette, browser, CRM users, a pixel TEAM RANDOM
// wordmark the user called hideous) are gone.
//
// Icon geometry below is copied from lucide-react 0.364.0 (already a dependency of the
// site; ISC licence, https://lucide.dev/license): pen-tool, code-xml, trending-up
// (polylines written as paths), compass (polygon written as a path), send.

export interface Fonts {
  /** CSS font-family strings from next/font (app/fonts.ts). */
  pixel: string;
  marker: string;
  sans: string;
}

type IconNode =
  | ["path", { d: string; cut?: boolean }]
  | ["circle", { cx: number; cy: number; r: number }]
  | [
      "rect",
      { x: number; y: number; width: number; height: number; rx: number },
    ];

export type ShapeSpec =
  | {
      key: string;
      kind: "text";
      text: string;
      font: keyof Fonts;
      weight: number;
    }
  | {
      key: string;
      kind: "icon";
      nodes: IconNode[];
      /** Stroke width in the icon's 24-unit grid (lucide draws at 2). */
      stroke: number;
      /** Also fill closed paths, so the shape reads as a silhouette, not line art. */
      fill?: boolean;
    };

/** Design: the vector pen. */
const ICON_PEN: IconNode[] = [
  ["path", { d: "m12 19 7-7 3 3-7 7-3-3z" }],
  ["path", { d: "m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" }],
  ["path", { d: "m2 2 7.586 7.586" }],
  ["circle", { cx: 11, cy: 11, r: 2 }],
];

/** Build: code. */
const ICON_CODE: IconNode[] = [
  ["path", { d: "m18 16 4-4-4-4" }],
  ["path", { d: "m6 8-4 4 4 4" }],
  ["path", { d: "m14.5 4-5 16" }],
];

/** Scale: the growth line. */
const ICON_TRENDING: IconNode[] = [
  ["path", { d: "M22 7 13.5 15.5 8.5 10.5 2 17" }],
  ["path", { d: "M16 7 22 7 22 13" }],
];

/** Advise: a compass (filled needle, so it reads as one). */
const ICON_COMPASS: IconNode[] = [
  ["circle", { cx: 12, cy: 12, r: 10 }],
  ["path", { d: "M16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88Z" }],
];

/** Contact: the paper plane. */
const ICON_SEND: IconNode[] = [
  ["path", { d: "m22 2-7 20-4-9-9-4Z" }],
  // Filled, the plane's fold would vanish inside it: cut it back out as a crease.
  ["path", { d: "M22 2 11 13", cut: true }],
];

/**
 * The scroll story, top to bottom: one shape per beat in ../story.ts (same keys, which
 * are also what the panel's "shape" picker shows). Strokes are set so the lines come out
 * about equally thick on screen (each shape is scaled to its own bounding box).
 */
export const SHAPES: readonly ShapeSpec[] = [
  { key: "design", kind: "icon", nodes: ICON_PEN, stroke: 2.6 },
  { key: "build", kind: "icon", nodes: ICON_CODE, stroke: 2.4 },
  { key: "scale", kind: "icon", nodes: ICON_TRENDING, stroke: 2 },
  { key: "advise", kind: "icon", nodes: ICON_COMPASS, stroke: 2.4, fill: true },
  { key: "contact", kind: "icon", nodes: ICON_SEND, stroke: 2.2, fill: true },
];

export interface ShapeTargets {
  count: number;
  /** Per point: x, y (shape units: height 1, centred, y up), h (0 bottom .. 1 top), edge. */
  points: Float32Array;
  /**
   * Per point: thickness (0 at the silhouette's edge .. 1 at its core) and the inward
   * direction (shape units, y up). The shader rounds the silhouette into a liquid surface
   * from these and lights it.
   */
  shade: Float32Array;
  /** Width / height of the sampled silhouette. */
  aspect: number;
}

function drawIcon(
  ctx: CanvasRenderingContext2D,
  spec: Extract<ShapeSpec, { kind: "icon" }>,
  size: number,
): void {
  const pad = size * 0.06;
  const k = (size - pad * 2) / 24;
  ctx.setTransform(k, 0, 0, k, pad, pad);
  ctx.lineWidth = spec.stroke;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#fff";
  ctx.fillStyle = "#fff";
  for (const [tag, a] of spec.nodes) {
    if (tag === "path") {
      const p = new Path2D(a.d);
      if (spec.fill && a.cut) {
        ctx.globalCompositeOperation = "destination-out";
        ctx.lineWidth = spec.stroke * 0.55;
        ctx.stroke(p);
        ctx.globalCompositeOperation = "source-over";
        ctx.lineWidth = spec.stroke;
        continue;
      }
      if (spec.fill) ctx.fill(p);
      ctx.stroke(p);
    } else if (tag === "circle") {
      ctx.beginPath();
      if (a.r <= 1) {
        // lucide's tiny filled dots (the palette's paint wells): a solid blob.
        ctx.arc(a.cx, a.cy, a.r + spec.stroke * 0.55, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(a.cx, a.cy, a.r, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else {
      ctx.beginPath();
      ctx.roundRect(a.x, a.y, a.width, a.height, a.rx);
      ctx.stroke();
    }
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
}

function rasterize(spec: ShapeSpec, fonts: Fonts): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("2D canvas unavailable");
  if (spec.kind === "icon") {
    canvas.width = canvas.height = 640;
    drawIcon(ctx, spec, 640);
    return canvas;
  }
  const px = 280;
  const font = `${spec.weight} ${px}px ${fonts[spec.font]}`;
  ctx.font = font;
  const w = Math.ceil(ctx.measureText(spec.text).width + px * 0.4);
  canvas.width = Math.min(4096, w);
  canvas.height = Math.ceil(px * 1.45);
  ctx.font = font; // resizing a canvas resets its state
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(spec.text, canvas.width / 2, canvas.height / 2);
  return canvas;
}

/**
 * Two-pass chamfer distance (px) from every filled pixel to the nearest empty one. Cheap
 * (two sweeps) and close enough to Euclidean for shading.
 */
function distanceField(
  img: Uint8ClampedArray,
  w: number,
  h: number,
): Float32Array {
  const d = new Float32Array(w * h);
  const D = Math.SQRT2;
  for (let i = 0; i < w * h; i++) d[i] = img[i * 4 + 3] > 127 ? 1e9 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      v = x > 0 ? Math.min(v, d[i - 1] + 1) : 1;
      if (y > 0) {
        v = Math.min(v, d[i - w] + 1);
        if (x > 0) v = Math.min(v, d[i - w - 1] + D);
        if (x < w - 1) v = Math.min(v, d[i - w + 1] + D);
      } else v = 1;
      d[i] = v;
    }
  }
  for (let y = h - 1; y >= 0; y--) {
    for (let x = w - 1; x >= 0; x--) {
      const i = y * w + x;
      let v = d[i];
      if (v === 0) continue;
      v = x < w - 1 ? Math.min(v, d[i + 1] + 1) : 1;
      if (y < h - 1) {
        v = Math.min(v, d[i + w] + 1);
        if (x < w - 1) v = Math.min(v, d[i + w + 1] + D);
        if (x > 0) v = Math.min(v, d[i + w - 1] + D);
      } else v = 1;
      d[i] = v;
    }
  }
  return d;
}

/**
 * Samples `count` points uniformly over the shape's filled pixels. Edge points (a pixel a
 * few px away is empty) get edge = 1; points on a bottom edge (empty just below) get 2.
 * Those become the rim light and the drip sources.
 */
export function sampleShape(
  spec: ShapeSpec,
  count: number,
  fonts: Fonts,
): ShapeTargets {
  const canvas = rasterize(spec, fonts);
  const { width: cw, height: ch } = canvas;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = ctx!.getImageData(0, 0, cw, ch).data;
  const alphaAt = (x: number, y: number) =>
    x < 0 || y < 0 || x >= cw || y >= ch ? 0 : img[(y * cw + x) * 4 + 3];

  let minX = cw;
  let minY = ch;
  let maxX = 0;
  let maxY = 0;
  const filled: number[] = [];
  for (let y = 0; y < ch; y++) {
    for (let x = 0; x < cw; x++) {
      if (img[(y * cw + x) * 4 + 3] > 127) {
        filled.push(y * cw + x);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const points = new Float32Array(count * 4);
  const shade = new Float32Array(count * 4);
  if (filled.length === 0) return { count, points, shade, aspect: 1 };
  const dist = distanceField(img, cw, ch);
  // Thickness is relative to the shape's own stroke: the 90th percentile of the interior
  // distance, so a filled silhouette still rounds off instead of reading flat.
  const sampleD: number[] = [];
  for (let k = 0; k < 4000; k++) {
    sampleD.push(dist[filled[Math.floor(Math.random() * filled.length)]]);
  }
  sampleD.sort((a, b) => a - b);
  const dRef = Math.max(1.5, sampleD[Math.floor(sampleD.length * 0.9)]);

  const bw = Math.max(1, maxX - minX);
  const bh = Math.max(1, maxY - minY);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const r = Math.max(2, Math.round(bh * 0.014));
  for (let i = 0; i < count; i++) {
    const idx = filled[Math.floor(Math.random() * filled.length)];
    const px = idx % cw;
    const py = Math.floor(idx / cw);
    const empty = (dx: number, dy: number) => alphaAt(px + dx, py + dy) < 128;
    const bottomEdge = empty(0, r);
    const edge = bottomEdge || empty(r, 0) || empty(-r, 0) || empty(0, -r);
    const x = px + Math.random();
    const y = py + Math.random();
    points[i * 4] = (x - cx) / bh;
    points[i * 4 + 1] = (cy - y) / bh;
    points[i * 4 + 2] = (maxY - y) / bh;
    points[i * 4 + 3] = bottomEdge ? 2 : edge ? 1 : 0;
    const di = py * cw + px;
    const gx = (dist[di + 1] ?? 0) - (dist[di - 1] ?? 0);
    const gy = (dist[di + cw] ?? 0) - (dist[di - cw] ?? 0);
    const gl = Math.hypot(gx, gy) || 1;
    shade[i * 4] = Math.min(1, dist[di] / dRef);
    shade[i * 4 + 1] = gx / gl;
    shade[i * 4 + 2] = -gy / gl;
  }
  return { count, points, shade, aspect: bw / bh };
}

/** Makes sure a next/font family is downloaded before the canvas draws with it. */
export async function loadFonts(fonts: Fonts): Promise<void> {
  if (!document.fonts?.load) return;
  const loads = SHAPES.flatMap((s) =>
    s.kind === "text"
      ? [document.fonts.load(`${s.weight} 100px ${fonts[s.font]}`, s.text)]
      : [],
  );
  await Promise.allSettled(loads);
}
