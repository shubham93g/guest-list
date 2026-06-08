// Uploads local files to the public Vercel Blob store used for hero videos.
//
// Usage: npm run upload-hero-media -- <file...>
//
// Requires BLOB_READ_WRITE_TOKEN (see .env.example — create a *public* Blob
// store from the Vercel dashboard's Storage tab and copy the token into
// .env.local).
//
// Each upload gets a random suffix (addRandomSuffix) and a 1-year
// cacheControlMaxAge, producing a content-addressed, indefinitely-cacheable
// URL — paste the printed URL into HERO_VIDEOS in src/lib/cdn.ts.

import { put } from '@vercel/blob';
import { readFile } from 'node:fs/promises';
import { basename } from 'node:path';

const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;

const filePaths = process.argv.slice(2);
if (filePaths.length === 0) {
  console.error('Usage: npm run upload-hero-media -- <file...>');
  process.exit(1);
}

for (const filePath of filePaths) {
  const body = await readFile(filePath);
  const blob = await put(basename(filePath), body, {
    access: 'public',
    addRandomSuffix: true,
    cacheControlMaxAge: ONE_YEAR_IN_SECONDS,
  });
  console.log(`${basename(filePath)} -> ${blob.url}`);
}
