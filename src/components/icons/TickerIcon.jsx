import Icon from './_Icon';

/** 💹 — live ticker: chart rails with an upward arrow emerging from a baseline. */
export default function TickerIcon(props) {
  return (
    <Icon {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M6 15 L10 11 L13 13 L18 8" />
      <path d="M14 8 H18 V12" />
    </Icon>
  );
}
