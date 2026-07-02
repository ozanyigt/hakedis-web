import { Link } from 'react-router-dom';
import { HardHat } from 'lucide-react';
import { BRAND_NAME } from '@/config/brand';

const ICON_SIZES = {
  sm: { box: 'h-9 w-9 rounded-lg', icon: 18 },
  md: { box: 'h-11 w-11 rounded-xl', icon: 22 },
  lg: { box: 'h-14 w-14 rounded-xl', icon: 28 },
  hero: { box: 'h-20 w-20 rounded-2xl sm:h-24 sm:w-24', icon: 36 },
} as const;

const WORDMARK_SIZES = {
  sm: 'text-base font-semibold',
  md: 'text-lg font-semibold',
  lg: 'text-xl font-bold',
  hero: 'text-3xl font-bold tracking-tight sm:text-4xl',
} as const;

type BrandLogoSize = keyof typeof ICON_SIZES;
type BrandLogoVariant = 'mark' | 'horizontal' | 'hero';

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  size?: BrandLogoSize;
  showWordmark?: boolean;
  wordmarkClassName?: string;
  className?: string;
  to?: string;
}

function BrandIcon({ size, className = '' }: { size: BrandLogoSize; className?: string }) {
  const { box, icon } = ICON_SIZES[size];

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/25 ${box} ${className}`}
      aria-hidden
    >
      <HardHat size={icon} strokeWidth={2.25} />
    </span>
  );
}

export function BrandLogo({
  variant = 'mark',
  size = 'sm',
  showWordmark = false,
  wordmarkClassName = 'text-lg font-semibold tracking-tight text-white',
  className = '',
  to,
}: BrandLogoProps) {
  const resolvedVariant = variant === 'hero' ? 'hero' : variant === 'horizontal' ? 'horizontal' : 'mark';
  const showText = resolvedVariant === 'horizontal' || resolvedVariant === 'hero' || showWordmark;
  const textClass =
    resolvedVariant === 'hero'
      ? `${WORDMARK_SIZES.hero} text-white`
      : wordmarkClassName || `${WORDMARK_SIZES[size]} text-white`;

  const content = (
    <span
      className={`inline-flex items-center ${resolvedVariant === 'hero' ? 'gap-4' : 'gap-2.5'} ${className}`}
    >
      <BrandIcon size={resolvedVariant === 'hero' ? 'hero' : size} />
      {showText ? <span className={textClass}>{BRAND_NAME}</span> : null}
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
