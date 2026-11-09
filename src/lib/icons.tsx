import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function Svg({ size = 16, children, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const CheckIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.2 8.4 6.3 11.5 12.8 4.6" />
  </Svg>
);

export const ChevronDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 6.5 4 4 4-4" />
  </Svg>
);

export const ChevronRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6.5 4 4 4-4 4" />
  </Svg>
);

export const ChevronUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 9.5 4-4 4 4" />
  </Svg>
);

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 3.5v9M3.5 8h9" />
  </Svg>
);

export const ArrowUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 12.5v-9M4 7.5l4-4 4 4" />
  </Svg>
);

export const ArrowRightIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 8h10M9 4l4 4-4 4" />
  </Svg>
);

export const MicIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="6" y="2.5" width="4" height="7" rx="2" />
    <path d="M3.5 8a4.5 4.5 0 0 0 9 0M8 12.5V14" />
  </Svg>
);

export const PaperclipIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M11.5 6.5 7.2 10.8a2.2 2.2 0 0 1-3.1-3.1l4.9-4.9a3.4 3.4 0 0 1 4.8 4.8l-4.9 4.9a1.9 1.9 0 0 1-2.7-2.7l4.3-4.3" />
  </Svg>
);

export const SparkleIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.5c.5 2.6 1.4 3.5 4 4-2.6.5-3.5 1.4-4 4-.5-2.6-1.4-3.5-4-4 2.6-.5 3.5-1.4 4-4Z" />
    <path d="M12.5 10.5c.25 1.2.7 1.65 1.9 1.9-1.2.25-1.65.7-1.9 1.9-.25-1.2-.7-1.65-1.9-1.9 1.2-.25 1.65-.7 1.9-1.9Z" />
  </Svg>
);

export const ShieldIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.2 13 4v4.1c0 3-2.1 4.9-5 5.7-2.9-.8-5-2.7-5-5.7V4l5-1.8Z" />
    <path d="m6.1 8 1.4 1.4 2.5-2.6" />
  </Svg>
);

export const ClockIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="5.6" />
    <path d="M8 4.8V8l2.2 1.4" />
  </Svg>
);

export const CopyIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="5.5" y="5.5" width="7" height="8" rx="1.6" />
    <path d="M10.5 3.4A1.4 1.4 0 0 0 9.1 2H4.1A1.6 1.6 0 0 0 2.5 3.6v5a1.4 1.4 0 0 0 1.4 1.4" />
  </Svg>
);

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 6.2A5.2 5.2 0 0 0 3.6 5M3 9.8A5.2 5.2 0 0 0 12.4 11" />
    <path d="M13 2.6v3.6H9.4M3 13.4V9.8h3.6" />
  </Svg>
);

export const ThumbUpIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.4 7.2 7.6 3c.3-.6.7-.9 1.3-.9.9 0 1.5.7 1.4 1.6l-.3 2.2h2.4c.9 0 1.5.8 1.3 1.6l-.9 4.2c-.1.7-.8 1.2-1.5 1.2H5.4" />
    <rect x="2.4" y="7.2" width="2.4" height="6.7" rx=".8" />
  </Svg>
);

export const ThumbDownIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5.4 8.8 2.2 4.2c.3.6.7.9 1.3.9.9 0 1.5-.7 1.4-1.6l-.3-2.2h2.4c.9 0 1.5-.8 1.3-1.6l-.9-4.2c-.1-.7-.8-1.2-1.5-1.2H5.4" />
    <rect x="2.4" y="2.1" width="2.4" height="6.7" rx=".8" />
  </Svg>
);

export const XIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m4 4 8 8M12 4l-8 8" />
  </Svg>
);

export const FolderIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 5.2c0-.8.6-1.4 1.4-1.4h2.3l1.3 1.5h4.6c.8 0 1.4.6 1.4 1.4v4.1c0 .8-.6 1.4-1.4 1.4H3.9c-.8 0-1.4-.6-1.4-1.4V5.2Z" />
  </Svg>
);

export const PlugIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 2.5v3M10 2.5v3M4.5 5.5h7v1.7a3.5 3.5 0 0 1-3.5 3.5A3.5 3.5 0 0 1 4.5 7.2V5.5ZM8 10.7v2.8" />
  </Svg>
);

export const AlertIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8 2.9 14 13H2L8 2.9Z" />
    <path d="M8 6.4v3M8 11.4v.1" />
  </Svg>
);

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="7.2" cy="7.2" r="4.2" />
    <path d="m10.4 10.4 3 3" />
  </Svg>
);

export const MoreIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="3.4" cy="8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r=".9" fill="currentColor" stroke="none" />
    <circle cx="12.6" cy="8" r=".9" fill="currentColor" stroke="none" />
  </Svg>
);

export const PauseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M6 3.5v9M10 3.5v9" />
  </Svg>
);

export const PlayIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M5.2 3.4 12 8l-6.8 4.6V3.4Z" />
  </Svg>
);

export const BoltIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M8.8 2 4 9h3.2L7 14l4.9-7H8.6L8.8 2Z" />
  </Svg>
);

export const VolumeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3 6.4h2l2.6-2.2v7.6L5 9.6H3V6.4Z" />
    <path d="M10 5.6a3.4 3.4 0 0 1 0 4.8M11.8 3.9a6 6 0 0 1 0 8.2" />
  </Svg>
);

export const UndoIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 6.5h6a3 3 0 0 1 0 6H6" />
    <path d="m6 3.5-2.5 3 2.5 3" />
  </Svg>
);

export const GridIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="2.5" y="2.5" width="4.4" height="4.4" rx="1.1" />
    <rect x="9.1" y="2.5" width="4.4" height="4.4" rx="1.1" />
    <rect x="2.5" y="9.1" width="4.4" height="4.4" rx="1.1" />
    <rect x="9.1" y="9.1" width="4.4" height="4.4" rx="1.1" />
  </Svg>
);

export const SunIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="8" cy="8" r="3.1" />
    <path d="M8 1.4v1.4M8 13.2v1.4M1.4 8h1.4M13.2 8h1.4M3.3 3.3l1 1M11.7 11.7l1 1M12.7 3.3l-1 1M4.3 11.7l-1 1" />
  </Svg>
);

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M13 9.6A5.6 5.6 0 0 1 6.4 3 5.7 5.7 0 1 0 13 9.6Z" />
  </Svg>
);

export const GithubIcon = (p: IconProps) => (
  <Svg {...p} fill="currentColor" stroke="none">
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
  </Svg>
);

export const CodeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m5.6 5.4-3 2.6 3 2.6M10.4 5.4l3 2.6-3 2.6" />
  </Svg>
);

export const LayersIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m8 2.4 5.4 2.9L8 8.2 2.6 5.3 8 2.4Z" />
    <path d="m2.6 8.2 5.4 2.9 5.4-2.9" />
  </Svg>
);

export const WandIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m3 13 7.4-7.4M9.6 3.2l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5L7.6 5.2l1.5-.5.5-1.5Z" />
  </Svg>
);
