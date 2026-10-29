/**
 * Local fallback used when a remote photograph fails to load.
 * It is an inline SVG in the AAVASA palette, so there is never a broken-image icon.
 */
const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'>
<rect width='800' height='600' fill='#E9DFD1'/>
<rect y='380' width='800' height='220' fill='#DCE7DD'/>
<circle cx='590' cy='170' r='46' fill='#D8B4A0'/>
<path d='M250 420V300a90 90 0 0 1 180 0v120' fill='none' stroke='#52634E' stroke-width='14' stroke-linecap='round'/>
<path d='M295 420v-45a45 45 0 0 1 90 0v45' fill='#FAF8F4' stroke='#78866B' stroke-width='10' stroke-linecap='round'/>
<path d='M120 440c80-40 160 20 260-10s190-20 300 10' fill='none' stroke='#78866B' stroke-width='10' stroke-linecap='round'/>
</svg>`;

export const FALLBACK_IMAGE = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

/** Ask Unsplash for a smaller rendition so cards do not download full-size photographs. */
export function sized(url, width = 800) {
  if (!url) return FALLBACK_IMAGE;
  if (url.includes('images.unsplash.com')) {
    return url.replace(/([?&])w=\d+/, `$1w=${width}`);
  }
  return url;
}
