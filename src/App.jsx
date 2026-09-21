import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sound } from './audio.js';

const BASE = import.meta.env.BASE_URL;

const routes = {
  about: { label: 'Обо мне', desktop: 'about-desktop.webp', mobile: 'about-mobile.webp' },
  now: { label: 'Сейчас', desktop: 'now-desktop.webp', mobile: 'now-mobile.webp' },
  inspiration: { label: 'Вдохновение', desktop: 'inspiration-desktop.webp', mobile: 'inspiration-mobile.webp' },
  projects: { label: 'Мои проекты', desktop: 'projects-desktop.webp', mobile: 'projects-mobile.webp' },
  contacts: { label: 'Контакты', desktop: 'contacts-desktop.webp', mobile: 'contacts-mobile.webp' }
};

const menuItems = Object.entries(routes).map(([id, route]) => ({ id, label: route.label }));

function getHashRoute() {
  const value = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return routes[value] ? value : 'home';
}

function asset(path) {
  return `${BASE}assets/${path}`;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);
  return reduced;
}

function ParticleTitle({ text = 'МЕНЮ' }) {
  const canvasRef = useRef(null);
  const hostRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = hostRef.current;
    if (!canvas || !host) return undefined;
    const ctx = canvas.getContext('2d');
    let frame;
    let particles = [];
    let pointer = { x: -999, y: -999, active: false };
    let started = performance.now();

    const build = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, rect.width * dpr);
      canvas.height = Math.max(1, rect.height * dpr);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const off = document.createElement('canvas');
      off.width = Math.max(1, Math.floor(rect.width));
      off.height = Math.max(1, Math.floor(rect.height));
      const ox = off.getContext('2d', { willReadFrequently: true });
      const size = Math.min(rect.height * 0.92, rect.width * 0.31);
      ox.font = `400 ${size}px "Times New Roman", serif`;
      ox.textBaseline = 'middle';
      ox.fillStyle = '#151515';
      ox.fillText(text, 2, rect.height * 0.54);
      const pixels = ox.getImageData(0, 0, off.width, off.height).data;
      const step = rect.width < 600 ? 5 : 6;
      particles = [];
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          if (pixels[(y * off.width + x) * 4 + 3] > 80) {
            const angle = Math.random() * Math.PI * 2;
            const spread = 80 + Math.random() * 180;
            particles.push({
              tx: x,
              ty: y,
              x: x + Math.cos(angle) * spread,
              y: y + Math.sin(angle) * spread,
              seed: Math.random(),
              size: 0.75 + Math.random() * 1.5
            });
          }
        }
      }
      started = performance.now();
    };

    const render = (now) => {
      const rect = host.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      const progress = Math.min(1, (now - started) / 1250);
      const eased = 1 - Math.pow(1 - progress, 3);
      particles.forEach((p) => {
        let tx = p.tx;
        let ty = p.ty;
        if (pointer.active) {
          const dx = tx - pointer.x;
          const dy = ty - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 105 && distance > 0) {
            const force = Math.pow(1 - distance / 105, 2) * 32;
            tx += (dx / distance) * force;
            ty += (dy / distance) * force;
          }
        }
        p.x += ((p.x + (tx - p.x) * eased) - p.x) * 0.22;
        p.y += ((p.y + (ty - p.y) * eased) - p.y) * 0.22;
        p.x += (tx - p.x) * 0.09;
        p.y += (ty - p.y) * 0.09;
        ctx.globalAlpha = 0.45 + p.seed * 0.55;
        ctx.fillStyle = '#151515';
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });
      ctx.globalAlpha = 1;
      frame = requestAnimationFrame(render);
    };

    const onMove = (event) => {
      const rect = canvas.getBoundingClientRect();
      pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true };
    };
    const onLeave = () => { pointer.active = false; };
    const observer = new ResizeObserver(build);
    observer.observe(host);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);
    build();
    frame = requestAnimationFrame(render);
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
    };
  }, [text]);

  return <div className="particle-title" ref={hostRef}><canvas ref={canvasRef} aria-label={text} /></div>;
}

function IntroScene({ onDone, reduced }) {
  const [phase, setPhase] = useState('forming');
  useEffect(() => {
    if (reduced) {
      const id = window.setTimeout(onDone, 900);
      return () => window.clearTimeout(id);
    }
    const timers = [
      window.setTimeout(() => setPhase('open'), 520),
      window.setTimeout(() => setPhase('question'), 1450),
      window.setTimeout(() => setPhase('closing'), 3850),
      window.setTimeout(onDone, 4850)
    ];
    return () => timers.forEach(window.clearTimeout);
  }, [onDone, reduced]);

  return (
    <section className={`intro-scene intro-${phase}`} aria-label="Кто он?">
      <picture className="intro-picture">
        <source media="(max-width: 700px)" srcSet={asset('posters/intro-mobile.webp')} />
        <img src={asset('posters/intro-desktop.webp')} alt="Кто он?" />
      </picture>
      <div className="intro-curtain intro-curtain-top" />
      <div className="intro-curtain intro-curtain-bottom" />
      <button className="intro-skip" onClick={onDone} aria-label="Перейти к меню">Пропустить →</button>
    </section>
  );
}

function WhiteMenu({ onNavigate }) {
  const host = useRef(null);
  const [hovered, setHovered] = useState(null);

  const move = (event) => {
    const rect = host.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    host.current.style.setProperty('--mx', `${x * 10}px`);
    host.current.style.setProperty('--my', `${y * 8}px`);
  };

  return (
    <main className="white-menu" ref={host} onPointerMove={move}>
      <picture className="menu-art" aria-hidden="true">
        <source media="(max-width: 700px)" srcSet={asset('posters/menu-mobile.webp')} />
        <img src={asset('posters/menu-desktop.webp')} alt="" />
      </picture>
      <div className="menu-title-patch"><ParticleTitle /></div>
      <nav className="white-menu-links" aria-label="Главное меню">
        {menuItems.map((item, index) => (
          <button
            key={item.id}
            className={hovered === item.id ? 'is-hovered' : ''}
            style={{ '--index': index }}
            onPointerEnter={() => { setHovered(item.id); sound.tick(300 + index * 45, 0.055, 0.035); }}
            onPointerLeave={() => setHovered(null)}
            onClick={() => onNavigate(item.id, 'white')}
          >
            <span>{item.label}</span><i aria-hidden="true" />
          </button>
        ))}
      </nav>
      <p className="menu-hint">выбери направление</p>
    </main>
  );
}

function TransitionLayer({ route, stage }) {
  if (!route) return null;
  return (
    <div className={`route-transition transition-${route} stage-${stage}`} aria-hidden="true">
      <div className="transition-dust" />
      <div className="transition-orbit" />
      <div className="transition-frame" />
      <div className="transition-polygon" />
      <div className="transition-hands"><i /><i /></div>
      <strong>{routes[route].label}</strong>
    </div>
  );
}

function PaperMenuButton({ onClick }) {
  return (
    <button className="paper-menu-button" onClick={onClick} aria-label="Открыть меню">
      <span /><span /><span />
    </button>
  );
}

function OverlayMenu({ open, closing, current, onClose, onSelect, soundOn, onToggleSound }) {
  if (!open) return null;
  return (
    <aside className={`overlay-menu ${closing ? 'is-closing' : 'is-open'}`} aria-modal="true" role="dialog" aria-label="Навигация">
      <picture className="overlay-menu-art" aria-hidden="true">
        <source media="(max-width: 700px)" srcSet={asset('overlay-menu-mobile.webp')} />
        <img src={asset('overlay-menu-desktop.webp')} alt="" />
      </picture>
      <button className="overlay-close" onClick={onClose} aria-label="Закрыть меню">Закрыть <span>×</span></button>
      <nav className="overlay-links">
        {menuItems.map((item) => (
          <button key={item.id} className={current === item.id ? 'active' : ''} onClick={() => onSelect(item.id)}>{item.label}</button>
        ))}
        <button onClick={() => onSelect('home')}>Главное меню</button>
      </nav>
      <button className="sound-toggle" onClick={onToggleSound}>ЗВУК / {soundOn ? 'ВКЛ' : 'ВЫКЛ'}</button>
    </aside>
  );
}

function DynamicDate() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const date = new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(now).replaceAll('.', ' / ');
  const time = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(now);
  return <div className="dynamic-date"><strong>{date}</strong><span>LOCAL TIME&nbsp;&nbsp;{time}</span></div>;
}

function ProjectHotspots() {
  const [open, setOpen] = useState(null);
  const entries = [
    ['site', 'Этот сайт', 'Попытка собрать себя в одном пространстве. В первой версии важны визуал, движение и ощущение живого плаката.'],
    ['secret', 'Проект 19/09', 'Пока без названия. Пока без объяснений. Проект находится в разработке.']
  ];
  return (
    <div className="project-hotspots">
      {entries.map(([id, title, text], index) => (
        <div key={id} className={`project-hotspot project-${index + 1} ${open === id ? 'open' : ''}`}>
          <button onClick={() => { setOpen(open === id ? null : id); sound.tick(360, 0.08, 0.05); }} aria-expanded={open === id}>
            <span>{title}</span><i>{open === id ? '−' : '+'}</i>
          </button>
          <p>{text}</p>
        </div>
      ))}
    </div>
  );
}

function ContactHotspots() {
  return (
    <div className="contact-hotspots" aria-label="Контакты">
      <button onClick={() => sound.tick(620, 0.08, 0.05)}>Telegram <span>↗</span></button>
      <button onClick={() => sound.tick(680, 0.08, 0.05)}>Instagram <span>↗</span></button>
      <button onClick={() => sound.tick(740, 0.08, 0.05)}>E-mail <span>↗</span></button>
    </div>
  );
}

function PosterPage({ id, onOpenMenu }) {
  const route = routes[id];
  const host = useRef(null);
  const move = (event) => {
    const rect = host.current?.getBoundingClientRect();
    if (!rect || window.matchMedia('(pointer: coarse)').matches) return;
    host.current.style.setProperty('--px', `${((event.clientX - rect.left) / rect.width - 0.5) * 14}px`);
    host.current.style.setProperty('--py', `${((event.clientY - rect.top) / rect.height - 0.5) * 10}px`);
  };

  return (
    <main className={`poster-page page-${id}`} ref={host} onPointerMove={move}>
      <div className="poster-shell">
        <picture>
          <source media="(max-width: 700px)" srcSet={asset(`posters/${route.mobile}`)} />
          <img src={asset(`posters/${route.desktop}`)} alt={`${route.label} — TheXilliX`} />
        </picture>
        <div className="poster-parallax" aria-hidden="true"><i /><i /><i /></div>
        {id === 'now' && <DynamicDate />}
        {id === 'projects' && <ProjectHotspots />}
        {id === 'contacts' && <ContactHotspots />}
      </div>
      <PaperMenuButton onClick={onOpenMenu} />
    </main>
  );
}

export default function App() {
  const reduced = useReducedMotion();
  const [route, setRoute] = useState(getHashRoute);
  const [intro, setIntro] = useState(() => getHashRoute() === 'home' && sessionStorage.getItem('thexillix-intro-seen') !== 'yes');
  const [transition, setTransition] = useState(null);
  const [transitionStage, setTransitionStage] = useState('enter');
  const [overlayOpen, setOverlayOpen] = useState(false);
  const [overlayClosing, setOverlayClosing] = useState(false);
  const [soundOn, setSoundOn] = useState(sound.enabled);

  useEffect(() => {
    const onHash = () => {
      setRoute(getHashRoute());
      window.scrollTo({ top: 0, behavior: 'instant' });
    };
    window.addEventListener('hashchange', onHash);
    const unlock = () => sound.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const completeIntro = useCallback(() => {
    sessionStorage.setItem('thexillix-intro-seen', 'yes');
    setIntro(false);
  }, []);

  const setHash = useCallback((target) => {
    const next = target === 'home' ? '#/' : `#/${target}`;
    if (window.location.hash === next) setRoute(target);
    else window.location.hash = next;
  }, []);

  const navigate = useCallback((target, source) => {
    if (source === 'white' && target !== 'home') {
      sound.transition(target);
      setTransition(target);
      setTransitionStage('enter');
      window.setTimeout(() => setTransitionStage('cover'), reduced ? 80 : 380);
      window.setTimeout(() => setHash(target), reduced ? 120 : 720);
      window.setTimeout(() => setTransitionStage('leave'), reduced ? 160 : 980);
      window.setTimeout(() => setTransition(null), reduced ? 300 : 1480);
      return;
    }
    setHash(target);
  }, [reduced, setHash]);

  const openOverlay = () => {
    sound.paper();
    setOverlayOpen(true);
    setOverlayClosing(false);
    document.body.classList.add('menu-open');
  };

  const closeOverlay = (target = null) => {
    sound.paper();
    setOverlayClosing(true);
    if (target) window.setTimeout(() => setHash(target), reduced ? 40 : 260);
    window.setTimeout(() => {
      setOverlayOpen(false);
      setOverlayClosing(false);
      document.body.classList.remove('menu-open');
    }, reduced ? 180 : 680);
  };

  const currentView = useMemo(() => {
    if (route === 'home') return <WhiteMenu onNavigate={navigate} />;
    return <PosterPage id={route} onOpenMenu={openOverlay} />;
  }, [route, navigate]);

  return (
    <>
      {intro ? <IntroScene onDone={completeIntro} reduced={reduced} /> : currentView}
      <TransitionLayer route={transition} stage={transitionStage} />
      <OverlayMenu
        open={overlayOpen}
        closing={overlayClosing}
        current={route}
        onClose={() => closeOverlay()}
        onSelect={(target) => closeOverlay(target)}
        soundOn={soundOn}
        onToggleSound={() => {
          const next = !soundOn;
          setSoundOn(next);
          sound.setEnabled(next);
          if (next) sound.tick(520, 0.09, 0.06);
        }}
      />
    </>
  );
}
