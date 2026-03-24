import useStore from '../store/useStore';
import AgentSqueeze from '../components/defi/AgentSqueeze';

export default function AgentSqueezePage() {
  const { unlockedFeatures } = useStore();
  const hasAccess = unlockedFeatures.includes('agent_squeeze_basic') || unlockedFeatures.includes('agent_squeeze_pro');

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-5xl mb-4">\uD83D\uDD12</div>
        <h2 className="font-headline text-lg font-bold text-txt mb-2">Agent Squeeze is Locked</h2>
        <p className="text-[.82rem] text-txt-2 text-center max-w-md mb-4">
          Complete <strong>Module 6: Meteora Mastery</strong> in the Learn tab to unlock Agent Squeeze — our deterministic LP opportunity analyzer.
        </p>
        <div className="text-[.7rem] text-muted">
          Learn &rarr; LP Fundamentals &rarr; Meteora Mastery &rarr; \uD83D\uDD13 Agent Squeeze
        </div>
      </div>
    );
  }

  return <AgentSqueeze />;
}
