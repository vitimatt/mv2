'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function HlsVideo({
  src,
  priority = false,
  onLoadedMetadata,
  onCanPlay,
}: {
  src: string;
  priority?: boolean;
  onLoadedMetadata?: (video: HTMLVideoElement) => void;
  onCanPlay?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        // Faster startup: start with lowest quality, upgrade as buffer fills
        startLevel: priority ? 0 : -1,
        // Smaller initial buffer = faster first frame; grow as we play
        maxBufferLength: 60,
        maxMaxBufferLength: 120,
        // Keep back buffer so we don't re-fetch when scrubbing/looping
        backBufferLength: 30,
        startFragPrefetch: true,
        capLevelToPlayerSize: true,
        maxDevicePixelRatio: 2,
        enableWorker: true,
      });

      // Only flush low-quality segments when we have plenty of buffer (keeps videos loaded)
      let lastFragLevel = -1;
      hls.on(Hls.Events.FRAG_CHANGED, (_event, data) => {
        const { frag } = data;
        if (!hls.levels[frag.level]) return;

        const currentLevel = frag.level;
        const isUpgrade = lastFragLevel >= 0 && currentLevel > lastFragLevel;
        lastFragLevel = currentLevel;

        const buffered = video.buffered.length ? video.buffered.end(video.buffered.length - 1) - video.currentTime : 0;
        if (isUpgrade && frag.start > 0.5 && buffered > 15) {
          hls.trigger(Hls.Events.BUFFER_FLUSHING, {
            startOffset: 0,
            endOffset: frag.start - 0.1,
            type: 'video',
          });
        }
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      const handleEnded = () => {
        video.currentTime = 0;
        video.play();
      };
      video.addEventListener('ended', handleEnded);

      return () => {
        video.removeEventListener('ended', handleEnded);
        hls.destroy();
      };
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const handleEnded = () => {
        video.currentTime = 0;
        video.play();
      };
      video.addEventListener('ended', handleEnded);
      return () => video.removeEventListener('ended', handleEnded);
    }
  }, [src, priority]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      onLoadedMetadata={(e) => onLoadedMetadata?.(e.currentTarget)}
      onCanPlay={() => onCanPlay?.()}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
}
