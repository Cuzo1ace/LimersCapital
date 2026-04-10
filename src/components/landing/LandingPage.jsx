import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GradientText from '../ui/GradientText';
import GlassCard from '../ui/GlassCard';
import LiquidMetalButton from '../ui/LiquidMetalButton';
import WaitlistModal from '../WaitlistModal';
import {
  SOCIAL_LINKS,
  HEADLINES,
  HERO_SUBHEAD,
  SHOWCASE_HEADLINE,
  SHOWCASE_SUBHEAD,
  SHOWCASE_FEATURES,
  COMMUNITY_HEADLINE,
  COMMUNITY_SUBHEAD,
} from './landingLinks';

/* ─────────────────────────── Inline SVG Icons ─────────────────────────── */

const SparkleIcon = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M12 2 L13.5 9 L21 10.5 L13.5 12 L12 19 L10.5 12 L3 10.5 L10.5 9 Z"
      fill="currentColor"
    />
    <path
      d="M19 4 L19.7 6.3 L22 7 L19.7 7.7 L19 10 L18.3 7.7 L16 7 L18.3 6.3 Z"
      fill="currentColor"
      opacity="0.6"
    />
  </svg>
);

const XIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const InstagramIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
  </svg>
);

const TikTokIcon = ({ size = 22 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43V8.91a8.16 8.16 0 0 0 4.79 1.52v-3.4a4.85 4.85 0 0 1-1.86-.34Z" />
  </svg>
);

const ChevronDown = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6 9l6 6 6-6" />
  </svg>
);

/* ─────────────────────────── Social Icons Row ─────────────────────────── */

function SocialIcons({ size = 22, gap = 'gap-5' }) {
  const links = [
    { url: SOCIAL_LINKS.x, label: 'X (Twitter)', Icon: XIcon },
    { url: SOCIAL_LINKS.instagram, label: 'Instagram', Icon: InstagramIcon },
    { url: SOCIAL_LINKS.tiktok, label: 'TikTok', Icon: TikTokIcon },
  ];
  return (
    <div className={`flex items-center justify-center ${gap}`}>
      {links.map(({ url, label, Icon }) => (
        <a
          key={label}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={label}
          className="text-txt-2 hover:text-sea transition-colors duration-300 press-scale"
        >
          <Icon size={size} />
        </a>
      ))}
    </div>
  );
}

/* ─────────────────────────── Section 1: Hero ─────────────────────────── */

function HeroSection({ onLaunch, headlineIdx }) {
  const headline = HEADLINES[headlineIdx];

  return (
    <section className="relative min-h-screen flex flex-col">
      {/* Top nav bar */}
      <nav className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-2">
          <SparkleIcon size={20} className="text-sea" />
          <span className="font-headline font-bold text-lg md:text-xl text-txt">
            Limer's Capital
          </span>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm font-body text-txt-2">
          <a href="#showcase" className="hover:text-txt transition-colors">Product</a>
          <a href="#community" className="hover:text-txt transition-colors">Community</a>
          <a href={SOCIAL_LINKS.x} target="_blank" rel="noopener noreferrer" className="hover:text-txt transition-colors">Articles</a>
        </div>
        <button
          onClick={onLaunch}
          className="group flex items-center gap-1.5 px-4 py-2 rounded-lg
            border border-border bg-white/5 hover:bg-white/10
            text-txt text-sm font-body font-medium
            transition-all duration-300 press-scale
            hover:border-sea/40"
          aria-label="Squeeze — launch the app"
        >
          Squeeze
          <span className="text-sea group-hover:translate-x-0.5 transition-transform">↗</span>
        </button>
      </nav>

      {/* Hero center */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-sea"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,163,0.4))' }}
        >
          <SparkleIcon size={48} />
        </motion.div>

        {/* Auto-rotating headline — fixed width + height container so longer
            variants don't wrap word-by-word or push into the subhead */}
        <div className="relative w-full max-w-[900px] mx-auto min-h-[180px] md:min-h-[260px] lg:min-h-[300px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={headline.id}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -24, filter: 'blur(8px)' }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <GradientText
                as="h1"
                className="text-[2rem] md:text-[3.4rem] lg:text-[4.2rem] font-black font-headline leading-[1.08] whitespace-pre-line tracking-tight text-center px-4"
              >
                {headline.text}
              </GradientText>
            </motion.div>
          </AnimatePresence>
        </div>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="mt-8 text-base md:text-lg text-txt-2 font-body max-w-2xl leading-relaxed"
        >
          {HERO_SUBHEAD}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, duration: 0.6 }}
          className="mt-10 flex flex-col sm:flex-row items-center gap-4"
        >
          <LiquidMetalButton label="Squeeze 🍋" onClick={onLaunch} />
          <a
            href="#showcase"
            className="px-5 py-2.5 rounded-lg font-body font-medium text-sm
              text-txt-2 hover:text-txt transition-colors press-scale"
          >
            Learn more
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-12"
        >
          <SocialIcons />
        </motion.div>
      </div>

      {/* Scroll-down chevron */}
      <motion.a
        href="#showcase"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.5, 0.2, 0.5] }}
        transition={{ delay: 1.2, duration: 2.4, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted hover:text-sea transition-colors"
        aria-label="Scroll down"
      >
        <ChevronDown size={28} />
      </motion.a>
    </section>
  );
}

/* ─────────────────────────── Section 2: Showcase ─────────────────────────── */

function ShowcaseSection() {
  return (
    <section
      id="showcase"
      className="relative py-24 md:py-32 px-6 md:px-12 overflow-hidden"
    >
      {/* Caribbean map background, faded */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: 'url(/landing/solana-caribbean-map.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.3,
        }}
      />
      {/* Dark gradient overlay for text readability */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(13,14,16,0.7) 0%, rgba(13,14,16,0.92) 60%, rgba(13,14,16,0.98) 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.7 }}
          className="text-center mb-16 md:mb-20"
        >
          <h2 className="text-[2rem] md:text-[3.5rem] font-headline font-black text-txt leading-tight max-w-4xl mx-auto">
            {SHOWCASE_HEADLINE}
          </h2>
          <p className="mt-6 text-base md:text-lg text-txt-2 font-body max-w-2xl mx-auto leading-relaxed">
            {SHOWCASE_SUBHEAD}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {SHOWCASE_FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.12 }}
            >
              <GlassCard
                variant="elevated"
                animate={false}
                className="p-6 md:p-7 h-full flex flex-col gap-3"
              >
                <div className="text-4xl mb-1" aria-hidden="true">{feature.icon}</div>
                <h3 className="font-headline font-bold text-xl md:text-2xl text-txt">
                  {feature.title}
                </h3>
                <p className="text-sm md:text-[.92rem] text-txt-2 font-body leading-relaxed">
                  {feature.body}
                </p>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Section 3: Community ─────────────────────────── */

function CommunitySection({ onJoinWaitlist }) {
  return (
    <section
      id="community"
      className="relative py-24 md:py-32 px-6 md:px-12"
    >
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.6 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-8 inline-block text-sea"
          style={{ filter: 'drop-shadow(0 0 20px rgba(0,255,163,0.4))' }}
        >
          <SparkleIcon size={44} />
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-[2.2rem] md:text-[4rem] font-headline font-black text-txt leading-[1.05]"
        >
          {COMMUNITY_HEADLINE}
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-6 text-base md:text-lg text-txt-2 font-body leading-relaxed"
        >
          {COMMUNITY_SUBHEAD}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-10"
        >
          <button
            onClick={onJoinWaitlist}
            className="group inline-flex items-center gap-2 px-7 py-3.5 rounded-lg
              border border-sea/40 bg-sea/5 hover:bg-sea/10 hover:border-sea/60
              text-sea font-headline font-semibold text-base
              transition-all duration-300 press-scale neon-glow-primary"
          >
            Join the Waitlist
            <span className="group-hover:translate-x-0.5 transition-transform">↗</span>
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-14"
        >
          <SocialIcons size={28} gap="gap-8" />
        </motion.div>
      </div>
    </section>
  );
}

/* ─────────────────────────── Footer ─────────────────────────── */

function Footer() {
  return (
    <footer className="relative py-10 text-center">
      <p className="text-xs md:text-sm text-muted font-body tracking-wider">
        Built on Solana ◎
      </p>
    </footer>
  );
}

/* ─────────────────────────── Main Landing Page ─────────────────────────── */

export default function LandingPage({ onLaunch }) {
  const [headlineIdx, setHeadlineIdx] = useState(0);
  const [waitlistOpen, setWaitlistOpen] = useState(false);

  // Auto-rotate the hero headline every 4.5s. Pauses if reduced-motion is preferred.
  useEffect(() => {
    const reduceMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return;

    const id = setInterval(() => {
      setHeadlineIdx((i) => (i + 1) % HEADLINES.length);
    }, 4500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative min-h-screen text-txt overflow-x-hidden">
      <HeroSection onLaunch={onLaunch} headlineIdx={headlineIdx} />
      <ShowcaseSection />
      <CommunitySection onJoinWaitlist={() => setWaitlistOpen(true)} />
      <Footer />

      {waitlistOpen && <WaitlistModal onClose={() => setWaitlistOpen(false)} />}
    </div>
  );
}
