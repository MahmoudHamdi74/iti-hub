import logo from '@/assets/Logo.png';

/** Crop the supplied asset's transparent margin without distorting the mark. */
export default function BrandLogo({ className = 'h-11 w-11' }) {
  return <span className={`relative inline-block overflow-hidden shrink-0 align-middle ${className}`}>
    <img data-no-lightbox src={logo} alt="ITI Hub" className="absolute w-[200%] max-w-none h-[200%] -left-1/2 -top-1/2 object-contain" />
  </span>;
}
