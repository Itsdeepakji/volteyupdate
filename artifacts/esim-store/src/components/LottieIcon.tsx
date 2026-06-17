import Lottie from "lottie-react";
import { useEffect, useRef, useState } from "react";
import type { LottieRefCurrentProps } from "lottie-react";

type Props = {
  src: string;
  size?: number;
  className?: string;
  autoplay?: boolean;
  loop?: boolean;
  playOnHover?: boolean;
  style?: React.CSSProperties;
};

const _cache = new Map<string, object>();

export function LottieIcon({
  src,
  size = 24,
  className,
  autoplay = false,
  loop = false,
  playOnHover = true,
  style,
}: Props) {
  const [data, setData] = useState<object | null>(_cache.get(src) ?? null);
  const ref = useRef<LottieRefCurrentProps>(null);

  useEffect(() => {
    if (_cache.has(src)) { setData(_cache.get(src)!); return; }
    fetch(src)
      .then((r) => r.json())
      .then((d) => { _cache.set(src, d); setData(d); })
      .catch(() => {});
  }, [src]);

  if (!data) {
    return (
      <span
        style={{ display: "inline-block", width: size, height: size, flexShrink: 0 }}
        aria-hidden
      />
    );
  }

  return (
    <span
      className={className}
      style={{ display: "inline-block", width: size, height: size, flexShrink: 0, lineHeight: 0, ...style }}
      onMouseEnter={() => { if (playOnHover) ref.current?.play(); }}
      onMouseLeave={() => {
        if (playOnHover) {
          ref.current?.stop();
          ref.current?.goToAndStop(0, true);
        }
      }}
    >
      <Lottie
        lottieRef={ref}
        animationData={data}
        autoplay={autoplay}
        loop={loop}
        style={{ width: size, height: size }}
      />
    </span>
  );
}
