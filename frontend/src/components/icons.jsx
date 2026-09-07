// Small, dependency-free icon set (hand-written SVGs, Feather-style) -
// avoids pulling in an icon library just for a dozen glyphs.
function Icon({ children, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function HomeIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
    </Icon>
  );
}

export function DepositIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8.5 11.5 12 8l3.5 3.5" />
    </Icon>
  );
}

export function WithdrawIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16V8M8.5 12.5 12 16l3.5-3.5" />
    </Icon>
  );
}

export function PlansIcon(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 13 9 5 9-5" />
    </Icon>
  );
}

export function ReferralIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="8" cy="8" r="3" />
      <path d="M2.5 19a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="7" r="2.4" />
      <path d="M14.7 12.2A4.6 4.6 0 0 1 21.5 16" />
    </Icon>
  );
}

export function TransactionsIcon(props) {
  return (
    <Icon {...props}>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" />
    </Icon>
  );
}

export function WalletIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <path d="M3 10h18" />
      <circle cx="16.5" cy="14" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function UsersIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M2.8 19a6.2 6.2 0 0 1 12.4 0" />
      <path d="M16.5 5.3a3.2 3.2 0 0 1 0 6.2" />
      <path d="M18 13.2a6.2 6.2 0 0 1 3.2 5.4" />
    </Icon>
  );
}

export function SettingsIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </Icon>
  );
}

export function AuditIcon(props) {
  return (
    <Icon {...props}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1V3" />
      <path d="M9 12h6M9 16h6M9 8h2" />
    </Icon>
  );
}

export function ShieldIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 3 4.5 6v6c0 4.5 3 7.7 7.5 9 4.5-1.3 7.5-4.5 7.5-9V6L12 3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function LogoutIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </Icon>
  );
}

export function BellIcon(props) {
  return (
    <Icon {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </Icon>
  );
}

export function SunIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.2 19.8l1.6-1.6M18.2 5.8l1.6-1.6" />
    </Icon>
  );
}

export function MoonIcon(props) {
  return (
    <Icon {...props}>
      <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a6.8 6.8 0 0 0 10.5 10.5Z" />
    </Icon>
  );
}

export function ChevronDownIcon(props) {
  return (
    <Icon {...props}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function GiftIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="9" width="18" height="12" rx="1.5" />
      <path d="M3 13h18M12 9v12" />
      <path d="M12 9c-1.6 0-4-.9-4-3s1.6-3 2.6-2c1.2.9 1.4 3 1.4 5Z" />
      <path d="M12 9c1.6 0 4-.9 4-3s-1.6-3-2.6-2c-1.2.9-1.4 3-1.4 5Z" />
    </Icon>
  );
}

// --- Plan-card icon set (PlansPage/DepositPage) ---

export function RocketIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.5c2.8 1.6 4.5 4.6 4.5 8 0 2-.6 3.8-1.6 5.3L12 18l-2.9-2.2C8.1 14.3 7.5 12.5 7.5 10.5c0-3.4 1.7-6.4 4.5-8Z" />
      <circle cx="12" cy="10" r="1.8" />
      <path d="M9 15.5 6.5 18a3 3 0 0 0-.9 2.2v1.3l1.3-.4A3 3 0 0 0 9 19.2M15 15.5l2.5 2.5a3 3 0 0 1 .9 2.2v1.3l-1.3-.4A3 3 0 0 1 15 19.2" />
    </Icon>
  );
}

export function PieChartIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 2.5a9.5 9.5 0 1 0 9.5 9.5H12V2.5Z" />
      <path d="M15 2.9A9.5 9.5 0 0 1 21.1 9H15V2.9Z" />
    </Icon>
  );
}

export function DiamondIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 9 8 3.5h8L20 9l-8 11.5L4 9Z" />
      <path d="M4 9h16M9.5 3.5 8 9l4 11.5 4-11.5-1.5-5.5" />
    </Icon>
  );
}

export function CrownIcon(props) {
  return (
    <Icon {...props}>
      <path d="m3 8 3.5 3L12 5l5.5 6L21 8l-2 11H5L3 8Z" />
      <path d="M5 19h14" />
    </Icon>
  );
}

export function StarIcon(props) {
  return (
    <Icon {...props}>
      <path d="m12 3 2.6 5.6 6.1.6-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.6L12 3Z" />
    </Icon>
  );
}

export function BoltIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12.5 2 4 13.5h6L10 22l9-12.5h-6.5L12.5 2Z" />
    </Icon>
  );
}

export function CartIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="9" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="17.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
      <path d="M2.5 3h2.3l2 12.2a2 2 0 0 0 2 1.7h8.4a2 2 0 0 0 2-1.6L21 7.5H6" />
    </Icon>
  );
}

export function ClockIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5.5l3.5 2" />
    </Icon>
  );
}
