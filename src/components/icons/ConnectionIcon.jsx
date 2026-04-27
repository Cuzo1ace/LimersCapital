import Icon from './_Icon';

/** Connection pillar — three nodes with linked edges forming a mini-network. */
export default function ConnectionIcon(props) {
  return (
    <Icon {...props}>
      <circle cx="5" cy="6" r="2.2" />
      <circle cx="19" cy="6" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M6.8 7.3 L10.5 16.4" />
      <path d="M17.2 7.3 L13.5 16.4" />
      <path d="M7 6 H17" />
    </Icon>
  );
}
