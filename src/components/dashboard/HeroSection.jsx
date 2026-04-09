import { motion } from 'framer-motion';
import GlassCard from '../ui/GlassCard';
import GradientText from '../ui/GradientText';
import CountUp from '../ui/CountUp';
import LiquidMetalButton from '../ui/LiquidMetalButton';
import useStore from '../../store/useStore';

export default function HeroSection() {
  const setActiveTab = useStore(s => s.setActiveTab);

  return (
    <section className="relative -mx-3 md:-mx-7 px-6 md:px-12 py-10 md:py-16 mb-8 overflow-hidden">
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background: 'linear-gradient(135deg, rgba(0,255,163,0.06) 0%, transparent 40%, rgba(191,129,255,0.04) 100%)',
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8">
        {/* Left content */}
        <div className="flex flex-col gap-4 max-w-lg">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[.65rem] text-sea uppercase tracking-[0.2em] font-headline font-semibold"
          >
            The Caribbean's Solana Platform
          </motion.span>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GradientText
              as="h1"
              className="text-[1.8rem] md:text-[2.6rem] font-black font-headline leading-[1.1]"
            >
              Learn Crypto. Trade Smart. Earn $LIMER.
            </GradientText>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-[.88rem] text-txt-2 leading-relaxed"
          >
            From zero to DeFi — education, paper trading, and real rewards on Solana.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center gap-3 mt-2"
          >
            <LiquidMetalButton
              label="Start Learning"
              onClick={() => setActiveTab('learn')}
            />
            <button
              onClick={() => setActiveTab('market')}
              className="px-5 py-2.5 rounded-lg font-headline font-semibold text-[.82rem]
                backdrop-blur-xl bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)]
                text-txt hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.2)]
                transition-all duration-300 cursor-pointer press-scale"
            >
              Explore Market
            </button>
          </motion.div>
        </div>

        {/* Right floating stat cards */}
        <div className="flex flex-row md:flex-col gap-3 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <GlassCard variant="stat" delay={0.3} className="min-w-[120px] p-4 flex flex-col gap-1">
            <span className="text-[.65rem] text-muted font-body uppercase tracking-wider">Users</span>
            <span className="text-xl font-mono font-bold text-sea">
              <CountUp end={1247} />
            </span>
            <span className="text-[.58rem] text-muted">+12% this week</span>
          </GlassCard>

          <GlassCard variant="stat" delay={0.4} className="min-w-[120px] p-4 flex flex-col gap-1">
            <span className="text-[.65rem] text-muted font-body uppercase tracking-wider">Nations</span>
            <span className="text-xl font-mono font-bold text-coral">
              <CountUp end={30} suffix="+" />
            </span>
            <span className="text-[.58rem] text-muted">Caribbean-wide</span>
          </GlassCard>

          <GlassCard variant="stat" delay={0.5} className="min-w-[120px] p-4 flex flex-col gap-1">
            <span className="text-[.65rem] text-muted font-body uppercase tracking-wider">Paper Trade</span>
            <span className="text-xl font-mono font-bold text-sun">
              <CountUp end={100} prefix="$" suffix="K" />
            </span>
            <span className="text-[.58rem] text-muted">Virtual balance</span>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
