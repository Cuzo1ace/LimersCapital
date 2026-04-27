import Icon from './_Icon';

export default function WalletIcon(props) {
  return (
    <Icon {...props}>
      <path d="M3 7 A2 2 0 0 1 5 5 H17 V9" />
      <path d="M3 7 V18 A2 2 0 0 0 5 20 H19 A2 2 0 0 0 21 18 V11 A2 2 0 0 0 19 9 H5 A2 2 0 0 1 3 7 Z" />
      <circle cx="16.5" cy="14.5" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}
