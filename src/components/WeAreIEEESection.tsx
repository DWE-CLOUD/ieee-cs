import { useEffect, useRef, useState } from "react";
import AsteriskIcon from "./icons/AsteriskIcon";
import DecorativeArrow from "./icons/DecorativeArrow";

const WeAreIEEESection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;

      const rect = sectionRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const sectionHeight = sectionRef.current.offsetHeight;

      const start = windowHeight * 0.8;
      const end = -sectionHeight * 0.3;
      const current = rect.top;
      
      const progress = Math.max(0, Math.min(1, (start - current) / (start - end)));
      setScrollProgress(progress);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine active word: 0 = We, 1 = are, 2 = IEEE
  const activeWord = scrollProgress < 0.33 ? 0 : scrollProgress < 0.66 ? 1 : 2;

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background py-20"
    >
      {/* Left decorative asterisk */}
      <div 
        className="absolute left-8 md:left-16 lg:left-24 top-1/2 -translate-y-1/2 transition-all duration-700 ease-out"
        style={{ 
          transform: `translateY(-50%) rotate(${scrollProgress * 180}deg)`,
          opacity: scrollProgress > 0.1 ? 0.6 : 0,
        }}
      >
        <div className="w-20 h-20 md:w-28 md:h-28 rounded-full bg-muted flex items-center justify-center">
          <AsteriskIcon className="w-10 h-10 md:w-14 md:h-14 text-foreground/50" />
        </div>
      </div>

      {/* Main vertical text */}
      <div className="text-center px-4 relative z-10">
        {/* "We" */}
        <div 
          className="transition-all duration-700 ease-out"
          style={{ 
            transform: `translateX(${scrollProgress > 0.05 ? 0 : -50}px)`,
            opacity: scrollProgress > 0.05 ? 1 : 0,
          }}
        >
          <h2 
            className={`
              font-serif text-[17vw] md:text-[14vw] lg:text-[12vw] leading-[0.9] tracking-tight
              transition-all duration-500 ease-out
              ${activeWord === 0 ? 'text-foreground' : 'text-foreground/15'}
            `}
          >
            We
          </h2>
        </div>

        {/* "are" with decorative elements */}
        <div 
          className="flex items-center justify-center gap-4 md:gap-6 transition-all duration-700 ease-out"
          style={{ 
            transform: `translateX(${scrollProgress > 0.15 ? 0 : 50}px)`,
            opacity: scrollProgress > 0.15 ? 1 : 0,
          }}
        >
          <div 
            className={`transition-opacity duration-500 ${activeWord === 1 ? 'opacity-60' : 'opacity-20'}`}
          >
            <DecorativeArrow className="w-10 h-10 md:w-14 md:h-14 text-foreground" />
          </div>
          <h2 
            className={`
              font-serif text-[17vw] md:text-[14vw] lg:text-[12vw] leading-[0.9] tracking-tight
              transition-all duration-500 ease-out
              ${activeWord === 1 ? 'text-foreground' : 'text-foreground/15'}
            `}
          >
            are
          </h2>
          <div 
            className={`
              w-10 h-10 md:w-14 md:h-14 rounded-full bg-muted flex items-center justify-center
              transition-all duration-500
              ${activeWord === 1 ? 'opacity-80' : 'opacity-30'}
            `}
          >
            <AsteriskIcon className="w-5 h-5 md:w-7 md:h-7 text-foreground/60" />
          </div>
        </div>

        {/* "IEEE" - main highlight */}
        <div 
          className="transition-all duration-700 ease-out"
          style={{ 
            transform: `translateY(${scrollProgress > 0.25 ? 0 : 30}px) scale(${activeWord === 2 ? 1.02 : 1})`,
            opacity: scrollProgress > 0.25 ? 1 : 0,
          }}
        >
          <h2 
            className={`
              font-serif text-[20vw] md:text-[16vw] lg:text-[14vw] leading-[0.85] tracking-tight
              transition-all duration-500 ease-out
              ${activeWord === 2 ? 'text-foreground' : 'text-foreground/15'}
            `}
          >
            IEEE
          </h2>
        </div>
      </div>

      {/* Right decorative arrow */}
      <div 
        className="absolute right-8 md:right-16 lg:right-24 top-1/3 transition-all duration-700 ease-out"
        style={{ 
          transform: `rotate(${45}deg) translateY(${(1 - scrollProgress) * 20}px)`,
          opacity: scrollProgress > 0.2 ? 0.4 : 0,
        }}
      >
        <DecorativeArrow className="w-16 h-16 md:w-20 md:h-20 text-foreground/30" />
      </div>

      {/* Progress indicator */}
      <div 
        className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-4 transition-opacity duration-500"
        style={{ opacity: scrollProgress > 0.1 ? 1 : 0 }}
      >
        {['We', 'are', 'IEEE'].map((word, i) => (
          <div
            key={word}
            className={`
              flex items-center justify-center transition-all duration-500
              ${activeWord === i ? 'scale-110' : 'scale-100'}
            `}
          >
            <div
              className={`
                h-2 rounded-full transition-all duration-500
                ${activeWord === i 
                  ? 'w-8 bg-foreground' 
                  : activeWord > i 
                    ? 'w-2 bg-foreground/60' 
                    : 'w-2 bg-foreground/20'
                }
              `}
            />
          </div>
        ))}
      </div>
    </section>
  );
};

export default WeAreIEEESection;
