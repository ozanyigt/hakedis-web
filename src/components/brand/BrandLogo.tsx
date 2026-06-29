import { Link } from 'react-router-dom';
import { BRAND_LOGO_SRC, BRAND_NAME } from '@/config/brand';

const SIZE_CLASSES = {
  sm: 'h-9',
  md: 'h-12',
  lg: 'h-16',
  hero: 'h-28 sm:h-36',
} as const;

interface BrandLogoProps {
  size?: keyof typeof SIZE_CLASSES;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
  to?: string;
}

export function BrandLogo({
  size = 'sm',
  showWordmark = false,
  wordmarkClassName = 'text-lg font-semibold tracking-tight text-white',
  className = '',
  to,
}: BrandLogoProps) {
  const image = (
    <img
      src={BRAND_LOGO_SRC}
      alt={BRAND_NAME}
      className={`${SIZE_CLASSES[size]} w-auto object-contain ${className}`}
      draggable={false}
    />
  );

  const content = (
    <span className="inline-flex items-center gap-2.5">
      {image}
      {showWordmark ? <span className={wordmarkClassName}>{BRAND_NAME}</span> : null}
    </span>
  );

  if (to) {
    return (
      <Link to={to} className="group inline-flex items-center transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return content;
}
