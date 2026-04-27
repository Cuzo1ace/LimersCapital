import Icon from './_Icon';

/** Caribbean palm — the signature brand motif. Trunk arcs, six fronds radiate. */
export default function PalmIcon(props) {
  return (
    <Icon {...props}>
      <path d="M12 9 C11.5 13 10 17 8 21" />
      <path d="M12 9 Q15 5 20 5" />
      <path d="M12 9 Q14 4 17 2" />
      <path d="M12 9 Q10 4 6 3" />
      <path d="M12 9 Q8 5 4 7" />
      <path d="M12 9 Q13 5 11 2" />
      <circle cx="12" cy="9" r="1.2" fill="currentColor" stroke="none" />
    </Icon>
  );
}
