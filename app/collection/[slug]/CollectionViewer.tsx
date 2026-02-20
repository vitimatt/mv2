'use client';

import { useState, useRef, useEffect } from 'react';
import { HlsVideo } from './HlsVideo';

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
        setTimeout(() => {
          setData(json.data);
          setShowContent(true);
        }, 400);
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
        }}
      >
        {allVideoUrls.length > 0 && <VideoManifestPreloader urls={allVideoUrls} />}
        {data.projects.map((project) => (
          <div key={project._id} style={{ width: '100%', margin: 0, padding: 0 }}>
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
              const dims = mediaDimensions[mediaKey];
              const isFill = fitMode === 'fill';
              const isVertical = dims ? dims.height > dims.width : false;
              const useVhContainer = !isFill && isVertical && !isMobile;

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
                  }
                : {
                    width: '100%',
                    margin: 0,
                    padding: 0,
                    lineHeight: 0,
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
                    verticalAlign: 'bottom',
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
                      style={imgStyle}
                      loading={isFirstMedia ? 'eager' : 'lazy'}
                      fetchPriority={isFirstMedia ? 'high' : 'auto'}
                      decoding="async"
                      onLoad={(e) => {
                        const img = e.currentTarget;
                        setMediaAspect(mediaKey, img.naturalWidth, img.naturalHeight);
                        setMediaLoaded(mediaKey);
                      }}
                    />
                  )}
                  {mediaType === 'video' && hlsUrl && (
                    <div
                      style={
                        useVhContainer
                          ? { width: '100%', height: '100%' }
                          : { width: '100%', lineHeight: 0 }
                      }
                    >
                      <HlsVideo
                        src={hlsUrl}
                        priority={isFirstMedia}
                        onLoadedMetadata={(video) =>
                          setMediaAspect(mediaKey, video.videoWidth, video.videoHeight)
                        }
                        onCanPlay={() => setMediaLoaded(mediaKey)}
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
      className="password-fade-in"
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
