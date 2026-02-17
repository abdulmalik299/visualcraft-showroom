import type { SVGProps } from "react";
import { cx } from "../lib/utils";

type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function BaseIcon({ className, children, title, viewBox = "0 0 24 24", ...props }: IconProps & { viewBox?: string }) {
  return (
    <svg
      viewBox={viewBox}
      fill="none"
      aria-label={title}
      role={title ? "img" : "presentation"}
      className={cx("studio-icon", className)}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function LogoMark(props: IconProps) {
  return (
    <BaseIcon viewBox="0 0 64 64" {...props}>
      <defs>
        <linearGradient id="studio-gradient" x1="5" y1="7" x2="59" y2="57" gradientUnits="userSpaceOnUse">
          <stop stopColor="#68b6ff" />
          <stop offset="1" stopColor="#7b5cff" />
        </linearGradient>
      </defs>
      <path d="M8 12l16 40 8-18 8 18 16-40" stroke="url(#studio-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 12l16 14 8-8 8 8 16-14" stroke="url(#studio-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="2 5" />
      <circle cx="8" cy="12" r="2" stroke="url(#studio-gradient)" strokeWidth="2" />
      <circle cx="32" cy="18" r="2" stroke="url(#studio-gradient)" strokeWidth="2" />
      <circle cx="56" cy="12" r="2" stroke="url(#studio-gradient)" strokeWidth="2" />
      <circle cx="24" cy="52" r="2" stroke="url(#studio-gradient)" strokeWidth="2" />
      <circle cx="40" cy="52" r="2" stroke="url(#studio-gradient)" strokeWidth="2" />
    </BaseIcon>
  );
}

export const CloseIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="12" cy="12" r="9" /><path d="M9 9l6 6M15 9l-6 6" /></BaseIcon>;
export const PlayIcon = (props: IconProps) => <BaseIcon {...props}><path d="M7 5.5v13l11-6.5z" /></BaseIcon>;
export const GalleryIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4.5" y="4.5" width="15" height="15" rx="3" /><path d="M7 15l3.5-4 3 3 2.5-2.5 2 3.5" /><circle cx="10" cy="9" r="1.2" /></BaseIcon>;
export const FilmIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M8 5v14M16 5v14M4 9h16M4 15h16" strokeDasharray="3 4" /></BaseIcon>;
export const ArrowIcon = (props: IconProps) => <BaseIcon {...props}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></BaseIcon>;
export const CopyLinkIcon = (props: IconProps) => <BaseIcon {...props}><path d="M14.5 8h2a3 3 0 013 3v4a3 3 0 01-3 3h-4a3 3 0 01-3-3v-2" /><path d="M11.5 16h-4a3 3 0 01-3-3V9a3 3 0 013-3h4a3 3 0 013 3v2" /></BaseIcon>;
export const ToggleStudioModeIcon = (props: IconProps) => <BaseIcon {...props}><path d="M12 3.8v16.4" /><path d="M12 3.8a8.2 8.2 0 110 16.4" /><path d="M12 3.8a8.2 8.2 0 000 16.4" strokeDasharray="2 4" /></BaseIcon>;
export const PauseIcon = (props: IconProps) => <BaseIcon {...props}><path d="M9 6v12M15 6v12" /></BaseIcon>;
export const ExpandIcon = (props: IconProps) => <BaseIcon {...props}><path d="M8 4H4v4M20 8V4h-4M16 20h4v-4M4 16v4h4" /></BaseIcon>;
export const VolumeIcon = (props: IconProps) => <BaseIcon {...props}><path d="M10 8L7.5 10H5v4h2.5l2.5 2z" /><path d="M14 9.5a3.5 3.5 0 010 5" /><path d="M16.5 7a7 7 0 010 10" /></BaseIcon>;
export const SearchIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="11" cy="11" r="6" /><path d="M16 16l4 4" /></BaseIcon>;
export const DownloadIcon = (props: IconProps) => <BaseIcon {...props}><path d="M12 4v10" /><path d="M8.5 10.5L12 14l3.5-3.5" /><path d="M5 18h14" /></BaseIcon>;
export const ZoomInIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="10.5" cy="10.5" r="5.5" /><path d="M10.5 8v5M8 10.5h5" /><path d="M15.5 15.5L20 20" /></BaseIcon>;
export const ZoomOutIcon = (props: IconProps) => <BaseIcon {...props}><circle cx="10.5" cy="10.5" r="5.5" /><path d="M8 10.5h5" /><path d="M15.5 15.5L20 20" /></BaseIcon>;
export const ChevronLeftIcon = (props: IconProps) => <BaseIcon {...props}><path d="M14.5 6.5L8.5 12l6 5.5" /></BaseIcon>;
export const ChevronRightIcon = (props: IconProps) => <BaseIcon {...props}><path d="M9.5 6.5l6 5.5-6 5.5" /></BaseIcon>;
export const LayoutMasonryIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4" y="4" width="6" height="7" rx="1" /><rect x="4" y="13" width="6" height="7" rx="1" /><rect x="12" y="4" width="8" height="11" rx="1" /><rect x="12" y="17" width="8" height="3" rx="1" /></BaseIcon>;
export const LayoutJustifiedIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4" y="5" width="16" height="4" rx="1" /><rect x="4" y="11" width="10" height="4" rx="1" /><rect x="16" y="11" width="4" height="4" rx="1" /><rect x="4" y="17" width="6" height="2.5" rx="1" /><rect x="12" y="17" width="8" height="2.5" rx="1" /></BaseIcon>;
export const PipIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4" y="6" width="16" height="12" rx="2" /><rect x="12" y="11" width="6" height="5" rx="1" /></BaseIcon>;
export const MailIcon = (props: IconProps) => <BaseIcon {...props}><rect x="4" y="6" width="16" height="12" rx="2" /><path d="M5 8l7 5 7-5" /></BaseIcon>;
export const InstagramIcon = (props: IconProps) => <BaseIcon {...props}><rect x="5" y="5" width="14" height="14" rx="4" /><circle cx="12" cy="12" r="3.5" /><circle cx="16.5" cy="7.5" r="0.7" /></BaseIcon>;
export const LinkedInIcon = (props: IconProps) => <BaseIcon {...props}><rect x="5" y="5" width="14" height="14" rx="2" /><path d="M9 10v5M9 8.5v.01M12 15v-3.2a1.8 1.8 0 013.6 0V15" /></BaseIcon>;
export const BehanceIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4.5 8.5h6a2 2 0 010 4h-6z" /><path d="M4.5 12.5H11a2 2 0 010 4h-6.5z" /><path d="M14 10h6" /><path d="M14 14a3 3 0 006 0v-.2h-6V14z" /></BaseIcon>;
export const MenuIcon = (props: IconProps) => <BaseIcon {...props}><path d="M4 7h16M4 12h16M4 17h16" /></BaseIcon>;
