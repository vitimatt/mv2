'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePathname } from 'next/navigation';
import { client } from '@/sanity/lib/client';
import { COLLECTION_PROJECTS_FOR_ABOUT_QUERY } from '@/sanity/lib/queries';

const INACTIVITY_MS = 10_000;
const SPIN_ANIMATION_MS = 8_000;
const SLEEP_MODE_SVG_COUNT = 5;

function pickRandomSleepSvg(exclude?: number) {
  const options = exclude
    ? Array.from({ length: SLEEP_MODE_SVG_COUNT }, (_, i) => i + 1).filter((n) => n !== exclude)
    : Array.from({ length: SLEEP_MODE_SVG_COUNT }, (_, i) => i + 1);
  const pool = options.length > 0 ? options : Array.from({ length: SLEEP_MODE_SVG_COUNT }, (_, i) => i + 1);
  return pool[Math.floor(Math.random() * pool.length)];
}

const SIDEWAYS_INTERVAL_MS = SPIN_ANIMATION_MS / 2;

const DEFAULT_TEXT = 'Martina Vimercati, Matteo Viti.';
const HOVER_TEXT =
  'Martina Vimercati, Matteo Viti collaboratively work as a design duo, focusing on research-led web design and development, working primarily across contemporary culture, design, architecture, and food.';

const MODAL_STYLE = {
  fontFamily: "'ABCDiatype', sans-serif",
  fontWeight: 500,
  fontSize: '27px',
  lineHeight: '32px',
  letterSpacing: '0.02em',
};

type SelectedProject = {
  title?: string | null;
  workType?: string | null;
  year?: string | null;
  with?: string | null;
  link?: string | null;
};

function formatProjectLine(p: SelectedProject): string {
  const parts = [p.title, p.workType, p.year, p.with].filter(Boolean);
  return parts.join(', ');
}

function ModalContent({ selectedProjects }: { selectedProjects: SelectedProject[] }) {
  return (
    <div
      className="header-modal-content"
      style={{
        width: '70vw',
        margin: '0 auto',
        paddingBottom: '70px',
        ...MODAL_STYLE,
      }}
    >
      <p style={{ textAlign: 'center', marginBottom: '100px' }}>
        Martina Vimercati, Matteo Viti collaboratively work as a design duo,
        focusing on research-led web design and development, working primarily
        across contemporary culture, design, architecture, and food.
      </p>

      <h2
        style={{
          textAlign: 'center',
          marginTop: '100px',
          marginBottom: '16px',
          ...MODAL_STYLE,
        }}
      >
        PRACTICE
      </h2>
      <ol className="modal-list-decimal">
        <li>
          Through educational paths and professional experiences across different
          visual disciplines — graphic design, photography, video, and exhibition
          design — we have developed a practice that integrates different
          languages and tools, along with the awareness needed to realise a
          project.
        </li>
        <li>
          Over the past two years, we have focused on web design, working
          continuously on websites and digital projects and exploring their
          logics, from design to development.
        </li>
        <li>
          Alongside our studio work, we develop personal projects related to food,
          as a space for research, experimentation, and collaborative practice.
        </li>
      </ol>

      <h2
        style={{
          textAlign: 'center',
          marginTop: '100px',
          marginBottom: '16px',
          ...MODAL_STYLE,
        }}
      >
        SELECTED PROJECTS
      </h2>
      <ol className="modal-list-alpha">
        {selectedProjects.map((p, i) => {
          const content = formatProjectLine(p);
          const style = {
            cursor: p.link ? 'pointer' : undefined,
            transition: 'none' as const,
          };
          return (
            <li
              key={i}
              className="about-project-line"
              data-link={p.link ? 'true' : undefined}
              style={style}
              onClick={(e) => {
                if (p.link) {
                  e.preventDefault();
                  e.stopPropagation();
                  window.open(p.link, '_blank', 'noopener,noreferrer');
                }
              }}
            >
              {content}
            </li>
          );
        })}
      </ol>

      <h2
        style={{
          textAlign: 'center',
          marginTop: '100px',
          marginBottom: '16px',
          ...MODAL_STYLE,
        }}
      >
        CONTACTS
      </h2>
      <p style={{ margin: 0 }}>
        info@martinavimercati.com, @martinavimercati, +39 3490867743
        <br />
        info@matteoviti.com, @vitimatt, +39 3490867743
      </p>
    </div>
  );
}

export default function ExpandableHeader() {
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [sleepMode, setSleepMode] = useState(false);
  const [sleepSvg, setSleepSvg] = useState(1);
  const [selectedProjects, setSelectedProjects] = useState<SelectedProject[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sleepModeStartRef = useRef<number>(0);
  const spinRef = useRef<HTMLDivElement>(null);

  const pathname = usePathname();
  const collectionSlug =
    pathname?.match(/^\/collection\/([^/]+)/)?.[1] ?? null;

  useEffect(() => {
    if (!collectionSlug) {
      setSelectedProjects([]);
      return;
    }
    client
      .fetch<{ projects?: SelectedProject[] } | null>(
        COLLECTION_PROJECTS_FOR_ABOUT_QUERY,
        { slug: collectionSlug }
      )
      .then((data) => setSelectedProjects(data?.projects ?? []))
      .catch(() => setSelectedProjects([]));
  }, [collectionSlug]);

  const scheduleDismissOnSideways = useCallback(() => {
    if (dismissTimeoutRef.current) return;
    const elapsed = (Date.now() - sleepModeStartRef.current) % SPIN_ANIMATION_MS;
    const wait =
      elapsed < SPIN_ANIMATION_MS / 2
        ? SPIN_ANIMATION_MS / 2 - elapsed
        : SPIN_ANIMATION_MS - elapsed;
    dismissTimeoutRef.current = setTimeout(() => {
      dismissTimeoutRef.current = null;
      setSleepMode(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSleepMode(true), INACTIVITY_MS);
    }, wait);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    if (!isOverlayVisible) return;
    if (sleepMode) {
      scheduleDismissOnSideways();
      return;
    }
    if (dismissTimeoutRef.current) {
      clearTimeout(dismissTimeoutRef.current);
      dismissTimeoutRef.current = null;
    }
    setSleepMode(false);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      sleepModeStartRef.current = Date.now();
      setSleepMode(true);
    }, INACTIVITY_MS);
  }, [isOverlayVisible, sleepMode, scheduleDismissOnSideways]);

  useEffect(() => {
    if (!isOverlayVisible) {
      setSleepMode(false);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (dismissTimeoutRef.current) {
        clearTimeout(dismissTimeoutRef.current);
        dismissTimeoutRef.current = null;
      }
      return;
    }
    if (!sleepMode) resetInactivityTimer();
    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, resetInactivityTimer));
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetInactivityTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (dismissTimeoutRef.current) clearTimeout(dismissTimeoutRef.current);
    };
  }, [isOverlayVisible, sleepMode, resetInactivityTimer]);

  useEffect(() => {
    if (sleepMode) {
      document.documentElement.classList.add('sleep-mode-active');
      document.body.classList.add('sleep-mode-active');
    } else {
      document.documentElement.classList.remove('sleep-mode-active');
      document.body.classList.remove('sleep-mode-active');
    }
    return () => {
      document.documentElement.classList.remove('sleep-mode-active');
      document.body.classList.remove('sleep-mode-active');
    };
  }, [sleepMode]);

  useEffect(() => {
    if (!sleepMode) return;
    const el = spinRef.current;
    if (!el) return;
    let currentSvg = pickRandomSleepSvg();
    setSleepSvg(currentSvg);
    let lastSwitchBoundary = -1;
    let rafId: number;
    const tick = () => {
      const anims = el.getAnimations();
      const spinAnim = anims[0];
      const currentTime = spinAnim ? Number(spinAnim.currentTime) : (performance.now() % SPIN_ANIMATION_MS);
      const boundary = Math.floor(currentTime / SIDEWAYS_INTERVAL_MS) * SIDEWAYS_INTERVAL_MS;
      if (boundary > lastSwitchBoundary && boundary >= 0) {
        lastSwitchBoundary = boundary;
        currentSvg = pickRandomSleepSvg(currentSvg);
        setSleepSvg(currentSvg);
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [sleepMode]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isOverlayVisible) {
        setIsHovered(false);
        setIsOverlayVisible(true);
        return;
      }
      if ((e.target as HTMLElement).closest('.about-project-line[data-link]')) {
        return;
      }
      if (sleepMode) {
        setSleepMode(false);
        if (dismissTimeoutRef.current) {
          clearTimeout(dismissTimeoutRef.current);
          dismissTimeoutRef.current = null;
        }
      }
      setIsOverlayVisible(false);
    },
    [isOverlayVisible, sleepMode]
  );

  const shortText = isHovered ? HOVER_TEXT : DEFAULT_TEXT;

  return (
    <div
      className="header-fade-in"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: isOverlayVisible ? '100dvh' : 'auto',
        minHeight: isOverlayVisible ? '100vh' : 0,
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        pointerEvents: 'none',
      }}
    >
      {isOverlayVisible ? (
        <div
          className={`scrollbar-hide ${sleepMode ? 'sleep-mode-active' : ''}`}
          style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100dvh',
            minHeight: '100vh',
            maxHeight: '100dvh',
            backgroundColor: '#fff',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'none',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            padding: '20px 0',
            boxSizing: 'border-box',
            color: '#000',
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
          onClick={handleOverlayClick}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
            }}
          >
            <ModalContent selectedProjects={selectedProjects} />
          </div>
          {sleepMode &&
            typeof document !== 'undefined' &&
            createPortal(
              <div
                className="sleep-mode-overlay"
                style={{
                  position: 'fixed',
                  inset: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  perspective: 600,
                  transformStyle: 'preserve-3d',
                  pointerEvents: 'none',
                  zIndex: 1001,
                }}
              >
                <div ref={spinRef} className="sleep-mode-spin">
                  <div
                    className="sleep-mode-face"
                    style={{
                      background: '#000000',
                      WebkitMask: `url(/sleep-mode/${sleepSvg}.svg) center/cover no-repeat`,
                      mask: `url(/sleep-mode/${sleepSvg}.svg) center/cover no-repeat`,
                    }}
                  />
                  <div
                    className="sleep-mode-face sleep-mode-face-back"
                    style={{
                      background: '#000000',
                      WebkitMask: `url(/sleep-mode/${sleepSvg}.svg) center/cover no-repeat`,
                      mask: `url(/sleep-mode/${sleepSvg}.svg) center/cover no-repeat`,
                    }}
                  />
                </div>
              </div>,
              document.body
            )}
        </div>
      ) : (
        <div
          className="header-center-box"
          style={{
            width: '70vw',
            marginTop: '20px',
            marginBottom: '20px',
            fontFamily: "'ABCDiatype', sans-serif",
            fontWeight: 500,
            fontSize: '27px',
            lineHeight: '32px',
            letterSpacing: '0.02em',
            textAlign: 'center',
            cursor: 'pointer',
            pointerEvents: 'none',
          }}
        >
          <span
            style={{ pointerEvents: 'auto', display: 'inline-block' }}
            onClick={() => {
              setIsHovered(false);
              setIsOverlayVisible(true);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {shortText}
          </span>
        </div>
      )}
    </div>
  );
}
