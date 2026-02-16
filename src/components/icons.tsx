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

export function CloseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </BaseIcon>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M7 5.5v13l11-6.5z" />
    </BaseIcon>
  );
}

export function GalleryIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
      <path d="M7 15l3.5-4 3 3 2.5-2.5 2 3.5" />
      <circle cx="10" cy="9" r="1.2" />
    </BaseIcon>
  );
}

export function FilmIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <rect x="4" y="5" width="16" height="14" rx="2.5" />
      <path d="M8 5v14M16 5v14M4 9h16M4 15h16" strokeDasharray="3 4" />
    </BaseIcon>
  );
}

export function ArrowIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </BaseIcon>
  );
}

export function CopyLinkIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M14.5 8h2a3 3 0 013 3v4a3 3 0 01-3 3h-4a3 3 0 01-3-3v-2" />
      <path d="M11.5 16h-4a3 3 0 01-3-3V9a3 3 0 013-3h4a3 3 0 013 3v2" />
    </BaseIcon>
  );
}

export function ToggleStudioModeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M12 3.8v16.4" />
      <path d="M12 3.8a8.2 8.2 0 110 16.4" />
      <path d="M12 3.8a8.2 8.2 0 000 16.4" strokeDasharray="2 4" />
    </BaseIcon>
  );
}

export function PauseIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M9 6v12M15 6v12" />
    </BaseIcon>
  );
}

export function ExpandIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M8 4H4v4M20 8V4h-4M16 20h4v-4M4 16v4h4" />
    </BaseIcon>
  );
}

export function VolumeIcon(props: IconProps) {
  return (
    <BaseIcon {...props}>
      <path d="M10 8L7.5 10H5v4h2.5l2.5 2z" />
      <path d="M14 9.5a3.5 3.5 0 010 5" />
      <path d="M16.5 7a7 7 0 010 10" />
    </BaseIcon>
  );
}
