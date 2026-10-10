/**
 * One-time asset step: builds the tiny blurred stand-ins used as the
 * full-screen panel backgrounds in components/IdentityPanels.tsx.
 *
 * The backgrounds are pre-blurred on disk instead of with a live CSS
 * `filter: blur()` — a full-viewport filter repaints on every scroll frame and
 * wrecks the scroll film. Upscaling a 48px JPEG with `object-cover` gives the
 * same look for free.
 *
 * Every top-level JPEG in public/images gets a copy at
 * public/images/blur/<name>-blur.jpg, so dropping in a new category photo and
 * re-running this is enough. They stay readable as photographs — the panel
 * overlay does the darkening, not the blur.
 *
 *   node scripts/generate-blur.mjs
 *
 * The output is committed — the app never generates it at runtime.
 */
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = path.join(process.cwd(), "public", "images");
const OUT_DIR = path.join(SRC_DIR, "blur");

const WIDTH = 1280; // full-screen background: the vehicle outline stays readable
const SIGMA = 10; // light blur relative to the width — softens detail, keeps shape
const BRIGHTNESS = 1.1; // lifts the photo so it survives the navy overlay
const SATURATION = 1.15;
const QUALITY = 70;

const isJpeg = (name) => /\.jpe?g$/i.test(name);

const run = async () => {
  await mkdir(OUT_DIR, { recursive: true });

  const entries = await readdir(SRC_DIR, { withFileTypes: true });
  const sources = entries.filter((e) => e.isFile() && isJpeg(e.name));

  if (sources.length === 0) {
    console.warn(`No JPEGs found in ${SRC_DIR}`);
    return;
  }

  for (const entry of sources) {
    const name = entry.name.replace(/\.jpe?g$/i, "");
    const out = path.join(OUT_DIR, `${name}-blur.jpg`);

    // The blur is baked in here. Nothing on the page applies a CSS
    // `filter: blur()` — a full-viewport filter repaints on every scroll frame.
    const { size, width, height } = await sharp(path.join(SRC_DIR, entry.name))
      .resize({ width: WIDTH })
      .blur(SIGMA)
      .modulate({ brightness: BRIGHTNESS, saturation: SATURATION })
      .jpeg({ quality: QUALITY })
      .toFile(out);

    console.log(
      `${entry.name} -> blur/${name}-blur.jpg (${width}x${height}, ${(size / 1024).toFixed(1)} kB)`
    );
  }
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
