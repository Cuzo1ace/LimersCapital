/**
 * ShatterButton — exploding particle button from 21st.dev
 *
 * Adapted from https://21st.dev/r/koustubhayadiyala36/shatter-button
 * for Limer's Capital (Vite + JSX, no "use client", themed to Veridian Night).
 *
 * When clicked, the button shatters into glowing fragments, fires the callback,
 * then reassembles after 1 second. Perfect for high-stakes confirmations like
 * trade execution where the user should FEEL the action.
 *
 * Usage:
 *   <ShatterButton
 *     shatterColor="#00ffa3"
 *     onClick={handleConfirm}
 *   >
 *     Confirm Buy
 *   </ShatterButton>
 *
 * Props:
 *   children       — button label
 *   className      — additional CSS classes
 *   shardCount     — number of shard particles (default 20)
 *   shatterColor   — hex color for glow + shards (default "#00ffa3")
 *   onClick        — callback fired on shatter
 *   disabled       — disables click + dims appearance
 */
import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShatterButton({
  children,
  className = '',
  shardCount = 20,
  shatterColor = '#00ffa3',
  onClick,
  disabled = false,
}) {
  const [isShattered, setIsShattered] = useState(false);
  const [shards, setShards] = useState([]);

  const handleClick = useCallback(() => {
    if (isShattered || disabled) return;

    const newShards = [];
    for (let i = 0; i < shardCount; i++) {
      const angle = (Math.PI * 2 * i) / shardCount + Math.random() * 0.5;
      const velocity = 80 + Math.random() * 160;
      newShards.push({
        id: i,
        x: 0,
        y: 0,
        rotation: Math.random() * 720 - 360,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity,
        size: 4 + Math.random() * 12,
        // Random polygon shape for each shard
        clipPath: `polygon(
          ${Math.random() * 50}% 0%,
          100% ${Math.random() * 50}%,
          ${50 + Math.random() * 50}% 100%,
          0% ${50 + Math.random() * 50}%
        )`,
      });
    }

    setShards(newShards);
    setIsShattered(true);
    onClick?.();

    setTimeout(() => {
      setIsShattered(false);
      setShards([]);
    }, 1000);
  }, [isShattered, disabled, shardCount, onClick]);

  return (
    <div className="relative inline-block flex-1">
      <motion.button
        className={`relative w-full px-6 py-2.5 font-bold text-[.78rem] rounded-xl overflow-hidden cursor-pointer gpu-accelerated ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        onClick={handleClick}
        disabled={disabled}
        animate={{
          scale: isShattered ? 0 : 1,
          opacity: isShattered ? 0 : 1,
        }}
        transition={{ duration: 0.15 }}
        whileHover={disabled ? {} : { scale: 1.03 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        style={{
          background: `linear-gradient(135deg, ${shatterColor}22 0%, ${shatterColor}55 100%)`,
          border: `1px solid ${shatterColor}66`,
          color: shatterColor,
          boxShadow: `0 0 15px ${shatterColor}25, inset 0 0 15px ${shatterColor}10`,
        }}
      >
        {/* Hover glow */}
        <motion.div
          className="absolute inset-0 opacity-0 pointer-events-none"
          whileHover={{ opacity: 1 }}
          style={{
            background: `radial-gradient(circle at center, ${shatterColor}33 0%, transparent 70%)`,
          }}
        />
        <span className="relative z-10">{children}</span>
      </motion.button>

      {/* Shards */}
      <AnimatePresence>
        {shards.map((shard) => (
          <motion.div
            key={shard.id}
            className="absolute pointer-events-none z-50"
            initial={{
              x: 0,
              y: 0,
              rotate: 0,
              opacity: 1,
              scale: 1,
            }}
            animate={{
              x: shard.velocityX,
              y: shard.velocityY,
              rotate: shard.rotation,
              opacity: 0,
              scale: 0.5,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.8,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            style={{
              left: '50%',
              top: '50%',
              width: shard.size,
              height: shard.size,
              background: shatterColor,
              boxShadow: `0 0 10px ${shatterColor}, 0 0 20px ${shatterColor}`,
              clipPath: shard.clipPath,
            }}
          />
        ))}
      </AnimatePresence>

      {/* Explosion ring */}
      <AnimatePresence>
        {isShattered && (
          <motion.div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none z-50"
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{ width: 250, height: 250, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            style={{
              border: `2px solid ${shatterColor}`,
              boxShadow: `0 0 30px ${shatterColor}`,
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
