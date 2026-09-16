import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function BluetoothIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M7 7.5 17 16l-6.5 5.2V2.8L17 8 7 16.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function GearIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M19.2 12.8v-1.6l1.7-1.3-1.6-2.8-2 .5a6.8 6.8 0 0 0-1.4-.8l-.4-2.1h-3.2l-.4 2.1c-.5.2-1 .5-1.4.8l-2-.5-1.6 2.8 1.7 1.3v1.6l-1.7 1.3 1.6 2.8 2-.5c.4.3.9.6 1.4.8l.4 2.1h3.2l.4-2.1c.5-.2 1-.5 1.4-.8l2 .5 1.6-2.8-1.7-1.3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m9 6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m15 6-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ShieldIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 3.5 5.5 6.2v5.3c0 4.2 2.7 7.2 6.5 8.5 3.8-1.3 6.5-4.3 6.5-8.5V6.2L12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function WifiIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4.5 9.5a12 12 0 0 1 15 0M7.4 12.6a7.6 7.6 0 0 1 9.2 0M10.4 15.6a3.6 3.6 0 0 1 3.2 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="12" cy="18.2" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 5.5 20 19.5M10.2 10.4A3.2 3.2 0 0 0 12 15.2c.5 0 1-.1 1.4-.4M7 8.2C5 9.5 3.7 11.3 3.2 12c1.4 2.2 4.8 6 8.8 6 1.3 0 2.5-.3 3.6-.8M16.8 14.7c.8-.8 1.5-1.7 2-2.7-1.4-2.2-4.8-6-8.8-6-.7 0-1.4.1-2 .3"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <circle cx="12" cy="12" r="8.2" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M12 11.2V16M12 8.2v.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="m6.5 12.5 3.6 3.6 7.4-8.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
