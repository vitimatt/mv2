'use client';

import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

export function HlsVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (Hls.isSupported()) {
      const hls = new Hls({
        maxBufferLength: 300,
        maxMaxBufferLength: 600,
        startFragPrefetch: true,
        capLevelToPlayerSize: false,
        maxDevicePixelRatio: 2,
      });

      // Lock to highest quality from the start so loop doesn't replay low-quality segments
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        if (data.levels.length > 0) {
          const maxLevel = data.levels.length - 1;
          hls.startLevel = maxLevel;
          hls.loadLevel = maxLevel;
        }
      });

      // Flush lower-quality segments when quality upgrades so they're re-fetched at high quality on loop
      let lastFragLevel = -1;
      hls.on(Hls.Events.FRAG_CHANGED, (_event, data) => {
        const { frag } = data;
        if (!hls.levels[frag.level]) return;

        const currentLevel = frag.level;
        const isUpgrade = lastFragLevel >= 0 && currentLevel > lastFragLevel;
        lastFragLevel = currentLevel;

        if (isUpgrade && frag.start > 0.5) {
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
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        objectFit: 'contain',
      }}
    />
  );
}
