/**
 * PageTransition — directional, spatial page transitions
 *
 * Replaces the basic 120ms opacity fade with a transition that gives users
 * a sense of spatial movement through the app. Forward navigation slides
 * right-to-left with scale and blur; back navigation mirrors.
 *
 * Direction is derived from NavigationDirectionContext, which tracks the
 * tab index in BottomTabBar.
 *
 * Usage in App.jsx:
 *   <NavigationDirectionProvider>
 *     ...
 *     <AnimatePresence mode="wait">
 *       <PageTransition key={activeTab}>
 *         <TabContent />
 *       </PageTransition>
 *     </AnimatePresence>
 *   </NavigationDirectionProvider>
 */
import { createContext, useContext, useRef, useCallback } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// ── Navigation direction context ────────────────────────────────────────

const NavigationDirectionContext = createContext({
  direction: 1,
  setTabIndex: () => {},
});

export function useNavigationDirection() {
  return useContext(NavigationDirectionContext);
}

/**
 * Wrap the app in this provider. Call `setTabIndex(newIndex)` from
 * BottomTabBar when the user switches tabs.
 */
export function NavigationDirectionProvider({ children }) {
  const lastIndex = useRef(0);
  const directionRef = useRef(1);

  const setTabIndex = useCallback((newIndex) => {
    directionRef.current = newIndex > lastIndex.current ? 1 : -1;
    lastIndex.current = newIndex;
  }, []);

  return (
    <NavigationDirectionContext.Provider value={{
      get direction() { return directionRef.current; },
      setTabIndex,
    }}>
      {children}
    </NavigationDirectionContext.Provider>
  );
}

// ── Transition component ────────────────────────────────────────────────

const EASING = [0.22, 1, 0.36, 1];

export default function PageTransition({ children, className = '' }) {
  const { direction } = useNavigationDirection();
  const prefersReducedMotion = useReducedMotion();

  // Reduced motion: instant cut with no animation
  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={`gpu-accelerated ${className}`}
      initial={{
        opacity: 0,
        x: direction * 50,
        scale: 0.97,
        filter: 'blur(2px)',
      }}
      animate={{
        opacity: 1,
        x: 0,
        scale: 1,
        filter: 'blur(0px)',
      }}
      exit={{
        opacity: 0,
        x: direction * -30,
        scale: 0.98,
        filter: 'blur(4px)',
      }}
      transition={{
        duration: 0.28,
        ease: EASING,
      }}
    >
      {children}
    </motion.div>
  );
}
