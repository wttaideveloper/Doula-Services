'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Flower2, Pause, Play } from 'lucide-react';
import defaults,{type SiteContent} from '../content/types';

export default function HeroSlider({content=defaults.home.hero}:{content?:SiteContent['home']['hero']}) {
  const slides=content.slides.map(slide=>({...slide.image,label:slide.label}));
  const [position, setActive] = useState(0);
  const active = position % slides.length;
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setReducedMotion(preference.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updatePreference();
    updateVisibility();
    preference.addEventListener('change', updatePreference);
    document.addEventListener('visibilitychange', updateVisibility);
    return () => {
      preference.removeEventListener('change', updatePreference);
      document.removeEventListener('visibilitychange', updateVisibility);
    };
  }, []);
  const rotating = !paused && !hovered && !focused && !hidden && !reducedMotion;
  useEffect(() => {
    if (!rotating) return;
    const timer = window.setTimeout(() => setActive(current => (current + 1) % slides.length), content.slideSeconds*1000);
    return () => window.clearTimeout(timer);
  }, [active, rotating,slides.length,content.slideSeconds]);
  const change = (direction: number) => setActive(current => (current + direction + slides.length) % slides.length);
  return (
    <div className="hero-image hero-slider" role="region" aria-roledescription="carousel" aria-label="Birth and newborn photographs" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} onFocusCapture={() => setFocused(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}>
      <div className="hero-slide-viewport">
        {slides.map((slide, index) => (
          <img key={index} src={slide.src} alt={slide.alt} aria-hidden={index !== active} className={index === active ? 'hero-slide is-active' : 'hero-slide'} />
        ))}
      </div>
      <div className="image-note"><Flower2 size={24} strokeWidth={1}/><span>{content.imageNote}<br/><em>{content.imageNoteAccent}</em></span></div>
      <div className="hero-slider-controls">
        <button type="button" aria-label="Previous hero photo" onClick={() => change(-1)}><ChevronLeft size={18}/></button>
        <span aria-live={rotating ? 'off' : 'polite'} aria-atomic="true">{active + 1} / {slides.length}<span className="slider-sr-only"> — {slides[active].label}</span></span>
        <button type="button" aria-label="Next hero photo" onClick={() => change(1)}><ChevronRight size={18}/></button>
        {!reducedMotion && <button type="button" aria-label={paused ? 'Resume automatic slideshow' : 'Pause automatic slideshow'} onClick={() => setPaused(current => !current)}>{paused ? <Play size={15}/> : <Pause size={15}/>}</button>}
      </div>
    </div>
  );
}
