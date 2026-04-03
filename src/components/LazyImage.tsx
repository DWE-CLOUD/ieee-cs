import { ImgHTMLAttributes, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const TRANSPARENT_PIXEL =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  eager?: boolean;
  rootMargin?: string;
}

const LazyImage = ({
  src,
  alt,
  className,
  eager = false,
  rootMargin = "300px",
  onLoad,
  style,
  ...props
}: LazyImageProps) => {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(eager);
  const [loaded, setLoaded] = useState(eager);

  useEffect(() => {
    if (!src || shouldLoad) {
      return;
    }

    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      setShouldLoad(true);
      return;
    }

    const element = imageRef.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [rootMargin, shouldLoad, src]);

  if (!src) {
    return null;
  }

  return (
    <img
      ref={imageRef}
      src={shouldLoad ? src : TRANSPARENT_PIXEL}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onLoad={(event) => {
        if (event.currentTarget.currentSrc !== TRANSPARENT_PIXEL) {
          setLoaded(true);
        }
        onLoad?.(event);
      }}
      className={cn(
        className,
        "transition-[opacity,filter,transform] duration-500",
        !loaded && "opacity-0 blur-sm scale-[1.02]",
        loaded && "opacity-100 blur-0 scale-100"
      )}
      style={{
        ...style,
        backgroundColor: loaded ? style?.backgroundColor : "rgba(148, 163, 184, 0.12)",
      }}
      {...props}
    />
  );
};

export default LazyImage;
