#!/usr/bin/env node
// ============================================================
//  PRÉPARATION DES VIDÉOS — « npm run videos » (à la racine du projet)
//
//  Pour chaque vidéo brute déposée dans brief/videos/, produit dans videos/ :
//    nom.mp4          H.264, 720×1280 max (1280×720 en paysage), CRF 28, faststart, AAC 96k  (vidéo complète, lightbox)
//    nom-preview.mp4  6 premières secondes, sans son, CRF 30            (aperçu muet du carrousel)
//    nom-poster.jpg   image à 1 s                                       (affichée pendant le chargement)
//  puis affiche la ligne prête à coller dans assets/data/realisations.js.
//
//  Options : --force (réencode même si les fichiers existent déjà)
//  Prérequis : ffmpeg installé (Windows : « winget install ffmpeg »).
// ============================================================
import { spawnSync } from 'node:child_process';
import { readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, parse } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'brief', 'videos');
const OUT = join(ROOT, 'videos');
const FORCE = process.argv.includes('--force');
const EXTS = new Set(['.mp4', '.mov', '.m4v', '.webm', '.mkv', '.avi']);
const ALERTE_MO = 8;

// ---- ffmpeg présent ? ----
const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
if (probe.error || probe.status !== 0) {
  console.error(`
  ✗ ffmpeg est introuvable.

  Installez-le puis relancez « npm run videos » :
    • Windows : ouvrez PowerShell et tapez   winget install ffmpeg
                (fermez puis rouvrez le terminal après l'installation)
    • macOS   : brew install ffmpeg
    • Linux   : sudo apt install ffmpeg
`);
  process.exit(1);
}

if (!existsSync(SRC)) { console.error(`✗ Dossier introuvable : ${SRC}`); process.exit(1); }
mkdirSync(OUT, { recursive: true });

const fichiers = readdirSync(SRC).filter(f => EXTS.has(parse(f).ext.toLowerCase()));
if (!fichiers.length) {
  console.log('Aucune vidéo dans brief/videos/. Déposez-y vos fichiers MP4 ou MOV, puis relancez « npm run videos ».');
  process.exit(0);
}

// « Brasserie Le Nord (final).MOV » → « brasserie-le-nord-final »
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'video';
const mo = (f) => statSync(f).size / 1024 / 1024;

// 720×1280 max en portrait (1280×720 en paysage, ex. showreel) : jamais agrandie, jamais déformée,
// dimensions paires (exigées par H.264)
const SCALE = "scale=w='if(gte(iw,ih),min(1280,iw),min(720,iw))':h='if(gte(iw,ih),min(720,ih),min(1280,ih))':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2";

function ffmpeg(args, etiquette) {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', ...args], { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(`${etiquette} : ${(r.stderr || '').trim().split('\n').slice(-3).join(' ')}`);
}

const lignes = [];
let erreurs = 0;
for (const fichier of fichiers) {
  const source = join(SRC, fichier);
  const nom = slug(parse(fichier).name);
  const video = join(OUT, `${nom}.mp4`);
  const preview = join(OUT, `${nom}-preview.mp4`);
  const poster = join(OUT, `${nom}-poster.jpg`);
  console.log(`\n▶ ${fichier}  →  videos/${nom}.*`);

  try {
    const aJour = !FORCE && [video, preview, poster].every(f => existsSync(f) && statSync(f).mtimeMs >= statSync(source).mtimeMs);
    if (aJour) {
      console.log('  déjà à jour (--force pour réencoder)');
    } else {
      ffmpeg(['-i', source, '-vf', SCALE, '-c:v', 'libx264', '-crf', '28', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
        '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', video], 'vidéo');
      ffmpeg(['-i', video, '-t', '6', '-an', '-c:v', 'libx264', '-crf', '30', '-preset', 'veryfast', '-pix_fmt', 'yuv420p',
        '-movflags', '+faststart', preview], 'aperçu');
      // JPEG « qualité 80 » ≈ -q:v 4 sur l'échelle ffmpeg (2 = meilleure, 31 = pire)
      ffmpeg(['-ss', '1', '-i', video, '-frames:v', '1', '-q:v', '4', poster], 'poster');
    }
    for (const f of [video, preview, poster]) {
      const taille = mo(f);
      const alerte = taille > ALERTE_MO ? `   ⚠ plus de ${ALERTE_MO} Mo : raccourcissez la vidéo ou augmentez le CRF` : '';
      console.log(`  ${parse(f).base.padEnd(36)} ${taille.toFixed(2).padStart(6)} Mo${alerte}`);
    }
    if (nom === 'showreel') {
      console.log('  → showreel détecté : il remplace automatiquement les photos d\'ambiance sous le hero.');
    } else {
      lignes.push(`  { client: "NOM DU LIEU", lieu: "VILLE / ARRONDISSEMENT", format: "Fragments", video: "/videos/${nom}.mp4", preview: "/videos/${nom}-preview.mp4", poster: "/videos/${nom}-poster.jpg" },`);
    }
  } catch (e) {
    erreurs++;
    console.error(`  ✗ échec — ${e.message}`);
  }
}

if (lignes.length) {
  console.log('\n────────────────────────────────────────────────────────────');
  console.log('Lignes à coller dans assets/data/realisations.js (dans le tableau [ ... ]),');
  console.log('puis remplacez NOM DU LIEU, VILLE et le format (Fragments | Mirage | TikTok Trend) :\n');
  console.log(lignes.join('\n'));
  console.log('\nPour un témoignage, utilisez assets/data/temoignages.js :');
  console.log('  { client, nom, role, video: "/videos/….mp4", poster: "/videos/…-poster.jpg", citationCourte }');
}
process.exit(erreurs ? 1 : 0);
