/**
 * One-time asset step: cuts the middle car out of the Sell section's three-car
 * frame for use on phones (components/scroll/SellSection.tsx).
 *
 * The source is one photograph of three vehicles side by side — two vans with a
 * sports car between them. At desktop widths they fill the band; at 390px each
 * one is barely 100px across and they read as a row of overlapping shapes. So
 * the phone gets the middle car alone, cropped out of the same photograph
 * rather than drawn from a CSS zoom on the full frame: the crop is a twentieth
 * of the file's weight and the browser is not asked to raster a 2400px picture
 * at nearly four times viewport width.
 *
 * The box below was measured off the pixels, not eyeballed — see the luminance
 * runs in the constants. Both ends sit in the gaps between vehicles, where the
 * file is pure black, so the crop's edges are invisible against the section's
 * own black background.
 *
 *   node scripts/crop-sell-mobile.mjs
 *
 * The output is committed — the app never generates it at runtime.
 */
import path from "node:path";
import sharp from "sharp";

const SRC = path.join(process.cwd(), "public", "images", "sellbg.png");
const OUT = path.join(process.cwd(), "public", "images", "sellbg-mobile.png");

/* ── The crop, in source pixels ───────────────────────────────────────────
   Thresholding the 2400x1340 file at 24/255 luma gives three columns of
   content — 138-854, 901-1503 and 1568-2286 — and the middle one runs from
   row 534 to row 904. The horizontal box is centred on that car (x 1202) and
   stops short of both neighbouring runs, so it lands inside the black gaps on
   either side. The vertical box adds a little margin above the wing and below
   the tyres.                                                              */
const LEFT = 877;
const TOP = 494;
const WIDTH = 650; // 877-1527: the car plus 24px of black each side
const HEIGHT = 450; // 494-944: 40px of black above the wing and below the tyres

const run = async () => {
  const { size, width, height } = await sharp(SRC)
    .extract({ left: LEFT, top: TOP, width: WIDTH, height: HEIGHT })
    .png({ compressionLevel: 9 })
    .toFile(OUT);

  console.log(
    `sellbg.png -> sellbg-mobile.png (${width}x${height}, ${(size / 1024).toFixed(1)} kB)`
  );
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
