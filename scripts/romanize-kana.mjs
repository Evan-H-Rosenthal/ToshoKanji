import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { toRomaji } from "wanakana";

export function romanizeKana(value) {
  return toRomaji(value.normalize("NFKC"), {
    romanization: "hepburn",
    customRomajiMapping: { "\u3046\u3041": "wa", "\u3046\u3043": "wi", "\u3046\u3047": "we", "\u3046\u3049": "wo", "\u308e": "wa" },
  });
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : "";
if (invokedPath === import.meta.url) {
  const values = JSON.parse(fs.readFileSync(0, "utf8"));
  process.stdout.write(JSON.stringify(values.map((value) => romanizeKana(value))));
}
