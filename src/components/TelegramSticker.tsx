import React, { useEffect, useRef, useState } from 'react';
import * as pako from 'pako';
import lottie, { AnimationItem } from 'lottie-web';

interface TelegramStickerProps {
  src: string;
  mimeType?: string;
  isAnimated?: boolean;
  emoji?: string;
  className?: string;
  onClick?: () => void;
}

export const TelegramSticker: React.FC<TelegramStickerProps> = ({
  src,
  mimeType,
  isAnimated,
  emoji,
  className = "w-40 h-40",
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const [isVideo, setIsVideo] = useState(
    Boolean(mimeType === 'video/webm' || mimeType?.includes('video') || src.includes('.webm'))
  );
  const [loadError, setLoadError] = useState(false);
  const [isLottieLoaded, setIsLottieLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Check if directly known to be webm video sticker
    if (mimeType === 'video/webm' || mimeType?.includes('video') || src.includes('.webm')) {
      setIsVideo(true);
      return;
    }

    // Always fetch sticker buffer to inspect if it's TGS (gzipped Lottie) or WebM video
    fetch(src)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch sticker');
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Check if WebM video sticker (EBML header: 0x1A 0x45 0xDF 0xA3)
        if (bytes.length >= 4 && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) {
          if (isMounted) {
            setIsVideo(true);
          }
          return;
        }

        // Check if gzip compressed (TGS files start with magic bytes 0x1f, 0x8b)
        let jsonStr: string | null = null;
        if (bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b) {
          try {
            const decompressed = pako.inflate(bytes);
            jsonStr = new TextDecoder("utf-8").decode(decompressed);
          } catch (e) {
            // Not valid gzip
          }
        } else {
          // Might already be raw JSON
          try {
            const text = new TextDecoder().decode(bytes);
            if (text.trim().startsWith('{')) {
              jsonStr = text;
            }
          } catch (e) {}
        }

        if (jsonStr) {
          try {
            const animationData = JSON.parse(jsonStr);
            if (isMounted && containerRef.current) {
              if (animRef.current) {
                animRef.current.destroy();
                animRef.current = null;
              }

              setIsLottieLoaded(true);

              requestAnimationFrame(() => {
                if (isMounted && containerRef.current) {
                  containerRef.current.innerHTML = '';
                  animRef.current = lottie.loadAnimation({
                    container: containerRef.current,
                    renderer: 'svg',
                    loop: true,
                    autoplay: true,
                    animationData,
                  });
                }
              });
            }
          } catch (pErr) {
            if (isMounted) setIsLottieLoaded(false);
          }
        }
      })
      .catch(() => {
        // Fallback to static img if parsing fails
        if (isMounted) {
          setIsLottieLoaded(false);
        }
      });

    return () => {
      isMounted = false;
      if (animRef.current) {
        animRef.current.destroy();
        animRef.current = null;
      }
    };
  }, [src, mimeType, isAnimated]);

  return (
    <div
      onClick={onClick}
      className={`relative select-none flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer ${className}`}
      title={emoji ? `Стикер ${emoji}` : "Стикер"}
    >
      {isVideo ? (
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-contain drop-shadow-lg"
          onError={() => setIsVideo(false)}
        />
      ) : (
        <>
          <div
            ref={containerRef}
            className={`w-full h-full drop-shadow-lg ${isLottieLoaded ? "block" : "hidden"}`}
          />
          {!isLottieLoaded && !loadError && (
            <img
              src={src}
              alt={emoji || "Telegram Sticker"}
              className="w-full h-full object-contain drop-shadow-lg filter"
              loading="lazy"
              onError={() => setLoadError(true)}
            />
          )}
          {loadError && !isLottieLoaded && emoji && (
            <div className="text-5xl select-none animate-bounce">{emoji}</div>
          )}
        </>
      )}

      {emoji && (
        <span className="absolute bottom-1 right-1 opacity-0 hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-md text-xs px-1.5 py-0.5 rounded-full text-white pointer-events-none">
          {emoji}
        </span>
      )}
    </div>
  );
};
