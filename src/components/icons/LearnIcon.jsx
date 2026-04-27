import Icon from './_Icon';

/** Stacked pages with a small palm-frond corner flourish — the Limer's education motif. */
export default function LearnIcon(props) {
  return (
    <Icon {...props}>
      <path d="M4 5.5 A1.5 1.5 0 0 1 5.5 4 H11 V19 H5.5 A1.5 1.5 0 0 1 4 17.5 Z" />
      <path d="M20 5.5 A1.5 1.5 0 0 0 18.5 4 H13 V19 H18.5 A1.5 1.5 0 0 0 20 17.5 Z" />
      <path d="M12 4 V19" />
      <path d="M15 7 Q17 7.3 17 9" opacity="0.5" />
      <path d="M15 7 Q16.2 5.6 17.5 6.2" opacity="0.5" />
    </Icon>
  );
}
