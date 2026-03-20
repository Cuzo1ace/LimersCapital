import useStore from '../../store/useStore';

export default function LPBar() {
  const lp = useStore(s => s.limerPoints);

  return (
    <div className="flex items-center gap-1.5 bg-[rgba(45,155,86,.08)] border border-[rgba(45,155,86,.25)] rounded-full px-2.5 py-1 text-[.68rem] text-[#2D9B56] font-bold cursor-default"
      title="Limer Points — maps to future $LIMER airdrop">
      <span>🍋</span>
      <span>{lp.toLocaleString()} LP</span>
    </div>
  );
}
