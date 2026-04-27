import Icon from './_Icon';

/** 💡 — insight bulb with a palm-frond filament, ties the "Signal" pillar to Caribbean motif. */
export default function InsightIcon(props) {
  return (
    <Icon {...props}>
      <path d="M9 17 H15" />
      <path d="M10 20 H14" />
      <path d="M7 10 A5 5 0 0 1 17 10 C17 12.5 15.5 14 14 15.5 V17 H10 V15.5 C8.5 14 7 12.5 7 10 Z" />
      <path d="M10 13 Q12 10 14 13" opacity="0.5" />
    </Icon>
  );
}
