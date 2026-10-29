import { useState } from 'react';
import { FALLBACK_IMAGE, sized } from '../utils/images.js';

/** <img> with lazy loading, a sized rendition and a graceful fallback so no broken-image icon ever shows. */
export default function SmartImage({ src, alt, width = 800, className = '', eager = false, ...rest }) {
  const [failed, setFailed] = useState(false);
  return (
    <img
      src={failed ? FALLBACK_IMAGE : sized(src, width)}
      alt={alt || ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
      {...rest}
    />
  );
}
