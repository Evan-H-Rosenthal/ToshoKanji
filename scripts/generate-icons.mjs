import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const iconDir = path.join(root, "public", "icons");
const sourceSvg = path.join(iconDir, "toshokanji-icon.svg");

const pngTargets = [
  ["toshokanji-icon-192.png", 192],
  ["toshokanji-icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["favicon-32.png", 32],
  ["favicon-48.png", 48],
];

async function renderPng(outputName, size) {
  await sharp(sourceSvg)
    .resize(size, size, { fit: "contain" })
    .png()
    .toFile(path.join(iconDir, outputName));
}

async function renderMaskableIcon() {
  const safeArtSize = 410;
  const art = await sharp(sourceSvg)
    .resize(safeArtSize, safeArtSize, { fit: "contain" })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: "#ffffff",
    },
  })
    .composite([
      {
        input: art,
        left: Math.round((512 - safeArtSize) / 2),
        top: Math.round((512 - safeArtSize) / 2),
      },
    ])
    .png()
    .toFile(path.join(iconDir, "toshokanji-maskable-512.png"));
}

function createIco(pngImages) {
  const headerSize = 6;
  const entrySize = 16;
  const imageCount = pngImages.length;
  const directorySize = headerSize + entrySize * imageCount;
  const totalSize =
    directorySize + pngImages.reduce((sum, image) => sum + image.buffer.length, 0);
  const ico = Buffer.alloc(totalSize);

  ico.writeUInt16LE(0, 0);
  ico.writeUInt16LE(1, 2);
  ico.writeUInt16LE(imageCount, 4);

  let imageOffset = directorySize;
  pngImages.forEach((image, index) => {
    const entryOffset = headerSize + entrySize * index;
    ico.writeUInt8(image.size >= 256 ? 0 : image.size, entryOffset);
    ico.writeUInt8(image.size >= 256 ? 0 : image.size, entryOffset + 1);
    ico.writeUInt8(0, entryOffset + 2);
    ico.writeUInt8(0, entryOffset + 3);
    ico.writeUInt16LE(1, entryOffset + 4);
    ico.writeUInt16LE(32, entryOffset + 6);
    ico.writeUInt32LE(image.buffer.length, entryOffset + 8);
    ico.writeUInt32LE(imageOffset, entryOffset + 12);

    image.buffer.copy(ico, imageOffset);
    imageOffset += image.buffer.length;
  });

  return ico;
}

async function renderFavicon() {
  const faviconImages = await Promise.all(
    [16, 32, 48].map(async (size) => ({
      size,
      buffer: await sharp(sourceSvg)
        .resize(size, size, { fit: "contain" })
        .png()
        .toBuffer(),
    })),
  );

  await writeFile(path.join(root, "public", "favicon.ico"), createIco(faviconImages));
}

await mkdir(iconDir, { recursive: true });
await readFile(sourceSvg);
await Promise.all(pngTargets.map(([outputName, size]) => renderPng(outputName, size)));
await renderMaskableIcon();
await renderFavicon();

console.log("Generated ToshoKanji PWA icons from public/icons/toshokanji-icon.svg");
