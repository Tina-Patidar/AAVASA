import { Link } from 'react-router-dom';

/** Custom AAVASA emblem: an arch-shaped "A" with a doorway, a peach sun and a soft landscape line. */
export function LogoEmblem({ className = 'h-10 w-10', title = 'AAVASA emblem', tone = 'default' }) {
  const main = tone === 'light' ? '#FAF8F4' : '#52634E';
  const soft = tone === 'light' ? '#DCE7DD' : '#78866B';
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label={title} xmlns="http://www.w3.org/2000/svg">
      {/* muted-peach sun */}
      <circle cx="46" cy="18" r="4.6" fill="#D8B4A0" />
      {/* arch forming the letter A */}
      <path d="M14 51V31a18 18 0 0 1 36 0v20" fill="none" stroke={main} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* crossbar of the A */}
      <path d="M21 38h22" stroke={main} strokeWidth="2.6" strokeLinecap="round" />
      {/* doorway */}
      <path d="M27 51V44.5a5 5 0 0 1 10 0V51" fill={tone === 'light' ? 'transparent' : '#DCE7DD'} stroke={soft} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      {/* leaves */}
      <path d="M10 46c-4-3-5-8-4-12 4 1 7 4 8 9" fill={soft} opacity="0.85" />
      <path d="M54 46c4-3 5-8 4-12-4 1-7 4-8 9" fill={soft} opacity="0.85" />
      {/* flowing landscape line */}
      <path d="M6 55c8-4 14 2 26-1s18-3 26 0" fill="none" stroke={soft} strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

/**
 * variant="full"    emblem + wordmark + tagline (hero, auth pages, confirmation)
 * variant="compact" emblem + wordmark (navigation, footer)
 * variant="emblem"  emblem only
 */
export default function Logo({ variant = 'compact', tone = 'default', to = '/', className = '' }) {
  const text = tone === 'light' ? 'text-ivory' : 'text-charcoal';
  const sub = tone === 'light' ? 'text-sage' : 'text-forest';

  const content = (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoEmblem className={variant === 'full' ? 'h-14 w-14' : 'h-9 w-9 sm:h-10 sm:w-10'} tone={tone} />
      {variant !== 'emblem' && (
        <span className="flex flex-col leading-none">
          <span className={`font-serif text-xl font-medium tracking-brand sm:text-2xl ${text}`}>AAVASA</span>
          {variant === 'full' && <span className={`mt-1.5 text-[0.62rem] font-medium uppercase tracking-label ${sub}`}>A Stay That Feels Like Home</span>}
        </span>
      )}
    </span>
  );

  if (!to) return content;
  return (
    <Link to={to} aria-label="AAVASA home" className="inline-flex rounded-md">
      {content}
    </Link>
  );
}
