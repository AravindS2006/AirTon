import React, { useEffect, useRef } from 'react';
import { prefersReducedMotion, useIris } from './Iris';
import type { IrisSpec } from './Iris';

interface SceneProps {
  id?: string;
  iris?: IrisSpec;
  className?: string;
  children: React.ReactNode;
  labelledBy?: string;
}

/**
 * A scroll scene: when it crosses the middle of the viewport it moves the iris to
 * its own target. Content is visible by default; sections below the fold get a soft
 * entrance only when the browser supports it, so nothing waits hidden for a script.
 */
const Scene: React.FC<SceneProps> = ({ id, iris, className = '', children, labelledBy }) => {
  const ref = useRef<HTMLElement>(null);
  const { setTarget } = useIris();
  const spec = useRef(iris);
  spec.current = iris;

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;
    const rect = el.getBoundingClientRect();
    if (!prefersReducedMotion() && rect.top > window.innerHeight * 0.9) el.classList.add('pre');
    const reveal = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.remove('pre')),
      { rootMargin: '0px 0px -12% 0px' },
    );
    const camera = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && spec.current && setTarget(spec.current)),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    reveal.observe(el);
    camera.observe(el);
    return () => {
      reveal.disconnect();
      camera.disconnect();
    };
  }, [setTarget]);

  return (
    <section id={id} ref={ref} className={`scene ${className}`} aria-labelledby={labelledBy}>
      {children}
    </section>
  );
};

export default Scene;
