export default function BrandLogo({ inverse = false, compact = false, className = '' }) {
  if (compact) {
    return <img className={`brand-symbol ${className}`} src="/brand/logo/mesma-pista-symbol.svg" alt="Mesma Pista" width="42" height="42" />
  }
  return <img className={`brand-logo ${className}`} src={`/brand/logo/mesma-pista-logo-${inverse ? 'light' : 'primary'}.svg`} alt="Mesma Pista" width="196" height="64" decoding="async" />
}
