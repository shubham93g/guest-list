// Public Vercel Blob store hosting the hero background videos — keeps these
// large binaries (~22 MB combined) off Vercel's Edge CDN and its per-GB Fast
// Data Transfer billing. hero.jpg stays in public/ — it's small (~1 MB) and
// is preloaded on every page, so local serving is fine.
//
// Pathnames include Vercel's random suffix, making each URL content-addressed:
// re-uploading a changed file produces a new URL, so these can be cached by
// the browser indefinitely (see cacheControlMaxAge in
// scripts/upload-hero-media.mjs and the CSP in next.config.ts).
const BLOB_ORIGIN = 'https://b8sxkniqsebh03qb.public.blob.vercel-storage.com';

export const CDN_BASE = BLOB_ORIGIN; // CSP media-src origin (next.config.ts)

export const HERO_VIDEOS = [
  `${BLOB_ORIGIN}/hero4-FqDjExXshoQKEnzOTBeZyqdiau6qbT.mp4`,
  `${BLOB_ORIGIN}/hero3-BuBi8rZ1XrGbCOVMgEjkbu1yrpnyzd.mp4`,
  `${BLOB_ORIGIN}/hero-vbqSUjiWBvH6qhHt58luj80EQjOj5h.mp4`,
  `${BLOB_ORIGIN}/hero6-yR2EGHIGbaRQ3ncX0a51zGa4s8NK9a.mp4`,
];
