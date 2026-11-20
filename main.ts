// Vice Cover Studio — make.fun hand-in program (Node 22, stdlib only).
// Copies this repo's app/ and screenshots/ next to this file into the
// output directory and writes dossier.json with the vendored library.
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// Outside the grader MAKEFUN_OUTPUT_DIR stands in for /output.
// The run is deterministic: same inputs, same bytes out.

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outDir, { recursive: true });
cpSync(join(here, 'app'), join(outDir, 'app'), { recursive: true });
mkdirSync(join(outDir, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(outDir, 'screenshots'), { recursive: true });
}

// Caps from the scorer: text budget for the dossier, at most 4 screenshots
// of 256 KiB, app/ at most 993 files / 48 MiB, paths at most 1000 bytes.
writeFileSync(
  join(outDir, 'dossier.json'),
  buildDossier(outDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 50331648,
    app_path_max_bytes: 1000,
  }),
);
