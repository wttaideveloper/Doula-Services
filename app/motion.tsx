'use client';

import { useEffect } from 'react';

export default function Motion({ page }: { page: string }) {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const elements = Array.from(document.querySelectorAll<HTMLElement>(
      '.section-heading, .philosophy > *, .package, .about-preview > *, .two-column > *, .research, .faq, .extras > *, .process .package-grid > *, .contact-grid > *, .testimonials, .cta > *'
    ));
    let observer: IntersectionObserver | undefined;
    const reset = () => elements.forEach(el => el.classList.remove('reveal-pending'));
    const setup = () => {
      observer?.disconnect();
      reset();
      if (reduced.matches) return;
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.remove('reveal-pending');
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08 });
      elements.forEach(el => {
        el.classList.add('reveal-item');
        if (el.getBoundingClientRect().top > window.innerHeight) {
          el.classList.add('reveal-pending');
          observer?.observe(el);
        }
      });
    };
    let frame = 0;
    const update = () => {
      const range = document.documentElement.scrollHeight - window.innerHeight;
      document.documentElement.style.setProperty('--reading-progress', String(range > 0 ? window.scrollY / range : 0));
      document.body.classList.toggle('has-scrolled', window.scrollY > 24);
      frame = 0;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    setup();
    update();
    reduced.addEventListener('change', setup);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      observer?.disconnect();
      reset();
      cancelAnimationFrame(frame);
      reduced.removeEventListener('change', setup);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [page]);
  return <div className="reading-progress" aria-hidden="true" />;
}
