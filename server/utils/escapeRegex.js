/** Escape user input before placing it in a RegExp, preventing regex injection / ReDoS tricks. */
export const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
