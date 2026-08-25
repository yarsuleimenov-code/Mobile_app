const approvedLogoSrc = '/Mobile_app/zaberman-logo-dark-long.png'

export function ZabermanLogo({ className, alt = 'Zaberman' }: { className?: string; alt?: string }) {
  return <img className={className} src={approvedLogoSrc} width={1747} height={296} alt={alt} />
}
