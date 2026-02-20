'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HlsVideo } from './HlsVideo';

// ~1kB minimal silent MP4 - used to prime Safari for video playback on password submit
const SAFARI_PRIME_VIDEO =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTXzg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAhl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAqAAAAAAABAAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';

function primeSafariVideoPlayback() {
  const video = document.createElement('video');
  video.muted = true;
  video.playsInline = true;
  video.src = SAFARI_PRIME_VIDEO;
  video.play().then(() => video.pause()).catch(() => {});
}

function VideoManifestPreloader({ urls }: { urls: string[] }) {
  useEffect(() => {
    const ids: ReturnType<typeof setTimeout>[] = [];
    urls.forEach((url, i) => {
      const delay = i === 0 ? 0 : i * 150;
      ids.push(
        setTimeout(() => {
          fetch(url, { mode: 'cors', credentials: 'omit' }).catch(() => {});
        }, delay)
      );
    });
    return () => ids.forEach((id) => clearTimeout(id));
  }, [urls]);
  return null;
}

type Project = {
  _id: string;
  title?: string;
  workType?: string;
  year?: string;
  with?: string;
  link?: string;
  media?: Array<{
    mediaType: string;
    imageUrl?: string;
    hlsUrl?: string;
    fitMode?: 'fit' | 'fill';
    useMobileAlternative?: boolean;
    mobileMediaType?: string;
    mobileImageUrl?: string;
    mobileHlsUrl?: string;
    mobileFitMode?: 'fit' | 'fill';
  }>;
};

type CollectionData = {
  _id: string;
  title?: string;
  slug?: { current?: string };
  projects: Project[];
};

const PASSWORD_STYLE = {
  fontFamily: "'ABCDiatype', sans-serif",
  fontWeight: 500,
  fontSize: '27px',
  lineHeight: '32px',
  letterSpacing: '0.02em',
};

export function CollectionViewer({
  slug,
  title: _title,
}: {
  slug: string;
  title: string;
}) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CollectionData | null>(null);
  const [showPassword, setShowPassword] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [isPasswordHovered, setIsPasswordHovered] = useState(false);
  const [mediaDimensions, setMediaDimensions] = useState<
    Record<string, { width: number; height: number }>
  >({});
  const [loadedMedia, setLoadedMedia] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);
  const [cursorLabel, setCursorLabel] = useState<string | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const setMediaAspect = (key: string, width: number, height: number) => {
    setMediaDimensions((prev) => ({ ...prev, [key]: { width, height } }));
  };

  const setMediaLoaded = (key: string) => {
    setLoadedMedia((prev) => ({ ...prev, [key]: true }));
  };

  const isPasswordActive = password.length > 0 || isPasswordHovered;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    primeSafariVideoPlayback();
    setLoading(true);
    try {
      const res = await fetch(`/api/collection/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setShowPassword(false);
        setData(json.data);
        setShowContent(true);
      }
    } catch {
      // Don't do anything on error
    } finally {
      setLoading(false);
    }
  };

  const handleContainerClick = () => {
    inputRef.current?.focus();
  };

  const stripProtocol = (url: string) =>
    url
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .replace(/\/$/, '');

  if (data && showContent) {
    const allVideoUrls = data.projects.flatMap((p) =>
      (p.media ?? []).flatMap((m) => {
        const urls: string[] = [];
        if (m.hlsUrl) urls.push(m.hlsUrl);
        if (m.useMobileAlternative && m.mobileHlsUrl) urls.push(m.mobileHlsUrl);
        return urls;
      })
    );

    return (
      <main
        className="content-fade-in"
        style={{
          width: '100%',
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
          minHeight: isMobile ? 0 : undefined,
          fontSize: 0,
          lineHeight: 0,
        }}
      >
        {allVideoUrls.length > 0 && <VideoManifestPreloader urls={allVideoUrls} />}
        {cursorLabel &&
          !isMobile &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              style={{
                position: 'fixed',
                left: cursorPos.x + 20,
                top: cursorPos.y,
                fontFamily: "'ABCDiatype', sans-serif",
                fontWeight: 500,
              fontSize: '15px',
              lineHeight: '19px',
                letterSpacing: '0.02em',
                color: '#fff',
                mixBlendMode: 'difference',
                pointerEvents: 'none',
                zIndex: 2147483647,
                whiteSpace: 'nowrap',
              }}
            >
              {cursorLabel}
            </div>,
            document.body
          )}
        {data.projects.map((project) => (
          <div
            key={project._id}
            style={{
              width: '100%',
              margin: 0,
              padding: 0,
              fontSize: 0,
              lineHeight: 0,
            }}
          >
            {project.media?.map((item, i) => {
              const useMobileAlt =
                isMobile &&
                item.useMobileAlternative &&
                ((item.mobileMediaType === 'image' && item.mobileImageUrl) ||
                  (item.mobileMediaType === 'video' && item.mobileHlsUrl));

              const mediaType = useMobileAlt ? item.mobileMediaType! : item.mediaType;
              const imageUrl = useMobileAlt ? item.mobileImageUrl : item.imageUrl;
              const hlsUrl = useMobileAlt ? item.mobileHlsUrl : item.hlsUrl;
              const fitMode = useMobileAlt ? (item.mobileFitMode ?? item.fitMode) : item.fitMode;

              const mediaKey = useMobileAlt ? `${project._id}-${i}-mobile` : `${project._id}-${i}`;
              const rawDims = mediaDimensions[mediaKey];
              const dims =
                rawDims && rawDims.width > 0 && rawDims.height > 0 ? rawDims : null;
              const isFill = fitMode === 'fill';
              const isVertical = dims ? dims.height > dims.width : false;
              // For fit mode without valid dimensions (Safari reports 0x0, or metadata not yet loaded),
              // assume vertical and use vh container; avoids "fit" behaving like "fill"
              const fitWithoutValidDims = !isFill && !dims && mediaType === 'video';
              const useVhContainer =
                (!isFill && isVertical && !isMobile) || (fitWithoutValidDims && !isMobile);

              const containerStyle: React.CSSProperties = useVhContainer
                ? {
                    width: '100%',
                    height: '100vh',
                    minHeight: '100vh',
                    maxHeight: '100vh',
                    margin: 0,
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    lineHeight: 0,
                    fontSize: 0,
                  }
                : {
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    display: 'block',
                    lineHeight: 0,
                    fontSize: 0,
                    overflow: 'hidden',
                    minHeight: 0,
                    ...(dims
                      ? { aspectRatio: `${dims.width} / ${dims.height}` }
                      : mediaType === 'video' && { aspectRatio: '16 / 9' }),
                  };

              const imgStyle: React.CSSProperties = useVhContainer
                ? {
                    maxWidth: '100%',
                    maxHeight: '100vh',
                    width: 'auto',
                    height: 'auto',
                    objectFit: 'contain',
                    display: 'block',
                  }
                : {
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                    verticalAlign: 'top',
                  };

              const isFirstMedia = project._id === data.projects[0]?._id && i === 0;
              const isLoaded = loadedMedia[mediaKey];

              return (
                <div
                  key={i}
                  style={{
                    ...containerStyle,
                    opacity: isLoaded ? 1 : 0,
                    transition: 'opacity 0.5s ease-out',
                  }}
                >
                  {mediaType === 'image' && imageUrl && (
                    <img
                      src={imageUrl}
                      alt=""
                      style={{
                        ...imgStyle,
                      }}
                      loading={isFirstMedia ? 'eager' : 'lazy'}
                      fetchPriority={isFirstMedia ? 'high' : 'auto'}
                      decoding="async"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setMediaAspect(mediaKey, img.naturalWidth, img.naturalHeight);
                        setMediaLoaded(mediaKey);
                      }}
                      onClick={() => {
                        if (project.link) {
                          window.open(project.link, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      onMouseEnter={() => {
                        if (project.link) setCursorLabel(stripProtocol(project.link));
                      }}
                      onMouseMove={(e) => {
                        if (project.link) setCursorPos({ x: e.clientX, y: e.clientY });
                      }}
                      onMouseLeave={() => setCursorLabel(null)}
                    />
                  )}
                  {mediaType === 'video' && hlsUrl && (
                    <div
                      style={
                        useVhContainer
                          ? {
                              width: dims ? 'auto' : '100%',
                              height: dims ? 'auto' : '100%',
                              maxWidth: '100%',
                              maxHeight: '100vh',
                              ...(dims && {
                                aspectRatio: `${dims.width} / ${dims.height}`,
                              }),
                              lineHeight: 0,
                              fontSize: 0,
                            }
                          : { width: '100%', lineHeight: 0, fontSize: 0 }
                      }
                    >
                      <HlsVideo
                        src={hlsUrl}
                        priority={isFirstMedia}
                        onLoadedMetadata={(video) =>
                          setMediaAspect(mediaKey, video.videoWidth, video.videoHeight)
                        }
                        onCanPlay={() => setMediaLoaded(mediaKey)}
                        link={project.link}
                        onMouseEnter={() => {
                          if (project.link) setCursorLabel(stripProtocol(project.link));
                        }}
                        onMouseMove={(e) => {
                          if (project.link) setCursorPos({ x: e.clientX, y: e.clientY });
                        }}
                        onMouseLeave={() => setCursorLabel(null)}
                        onClick={() => {
                          if (project.link) window.open(project.link, '_blank', 'noopener,noreferrer');
                        }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </main>
    );
  }

  return (
    <main
      className="password-fade-in password-form"
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        pointerEvents: 'auto',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          pointerEvents: 'auto',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'baseline',
            gap: 0,
            opacity: showPassword ? 1 : 0,
            transition: 'opacity 0.4s ease-out',
          }}
        >
          <span
            style={{
              opacity: isPasswordActive ? 1 : 0.3,
              color: isPasswordActive ? '#000' : undefined,
              transition: 'none',
              display: 'inline',
              ...PASSWORD_STYLE,
            }}
            onClick={() => inputRef.current?.focus()}
            onMouseEnter={() => setIsPasswordHovered(true)}
            onMouseLeave={() => setIsPasswordHovered(false)}
          >
            <span style={{ position: 'relative', display: 'inline-block' }}>
              <span style={{ whiteSpace: 'pre' }}>
                {password || 'Password'}
              </span>
              <input
                ref={inputRef}
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder=""
                disabled={loading}
                autoComplete="off"
                aria-label="Password"
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width: '100%',
                  height: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: 0,
                  margin: 0,
                  font: 'inherit',
                  letterSpacing: 'inherit',
                  cursor: 'text',
                  color: 'transparent',
                  caretColor: '#000',
                }}
              />
            </span>
            ,<span style={{ whiteSpace: 'pre' }}> </span>
          </span>
          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#000',
              transition: 'none',
              ...PASSWORD_STYLE,
            }}
            onMouseEnter={(e) => {
              if (!loading) e.currentTarget.style.opacity = '0.3';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Enter
          </button>
        </div>
      </form>
    </main>
  );
}
