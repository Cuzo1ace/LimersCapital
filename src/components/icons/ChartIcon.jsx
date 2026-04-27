import Icon from './_Icon';

export default function ChartIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 3v18h18" />
      <rect x="7" y="12" width="2.5" height="6" />
      <rect x="11.5" y="8" width="2.5" height="10" />
      <rect x="16" y="4" width="2.5" height="14" />
      <path d="M7 10 L12 6 L17 2" opacity="0.6" />
    </Icon>
  );
}
