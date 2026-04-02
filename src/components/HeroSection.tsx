import { ArrowRight, Sparkles } from "lucide-react";
import DecorativeArrow from "./icons/DecorativeArrow";
import AsteriskIcon from "./icons/AsteriskIcon";
import { useEffect, useState } from "react";
import SmartLink from "@/components/SmartLink";
import { useHomeContent } from "@/components/home/HomeContentProvider";

const HeroSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const content = useHomeContent();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <section className="relative px-6 md:px-8 pt-32 pb-8 bg-background overflow-hidden min-h-[85vh] flex items-center">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent pointer-events-none" />
      
      {/* Decorative floating elements */}
      <div className="absolute top-40 right-[15%] w-32 h-32 rounded-full bg-accent/5 blur-3xl animate-pulse-soft pointer-events-none" />
      <div className="absolute bottom-20 left-[10%] w-40 h-40 rounded-full bg-gold/5 blur-3xl animate-pulse-soft pointer-events-none" style={{ animationDelay: '1s' }} />
      
      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Main headline */}
          <div className="lg:col-span-8">
            {/* Badge */}
            <div 
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/20 mb-8
                transition-all duration-700 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
              `}
            >
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-xs font-medium text-accent uppercase tracking-wider">
                {content.hero.badge}
              </span>
            </div>

            <h1 
              className={`
                font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl leading-[0.95] tracking-tight text-foreground
                transition-all duration-1000 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: '100ms' }}
            >
              {content.hero.titleLine1}
              <br />
              <span className="inline-flex items-center gap-3 md:gap-4 flex-wrap mt-2">
                <DecorativeArrow className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 text-accent" />
                <span>{content.hero.titleLine2}</span>
                <span className="inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-muted shadow-soft">
                  <AsteriskIcon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-foreground" />
                </span>
              </span>
              <br />
              <span 
                className={`
                  text-muted-foreground transition-all duration-1000 ease-out
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                `}
                style={{ transitionDelay: '200ms' }}
              >
                {content.hero.titleLine3}
              </span>
            </h1>
          </div>

          {/* Right side content */}
          <div 
            className={`
              lg:col-span-4 flex flex-col gap-8 lg:pt-8
              transition-all duration-1000 ease-out
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
            style={{ transitionDelay: '300ms' }}
          >
            {/* Description card */}
            <div className="relative">
              <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-accent via-accent/50 to-transparent" />
              <p className="text-sm leading-relaxed text-muted-foreground max-w-sm pl-4">
                {content.hero.description}
              </p>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <SmartLink
                href={content.hero.primaryCtaHref}
                className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-foreground text-primary-foreground text-sm font-medium hover:bg-foreground/90 transition-all duration-300 shadow-soft hover:shadow-elegant"
              >
                <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                {content.hero.primaryCtaLabel}
              </SmartLink>
              <SmartLink
                href={content.hero.secondaryCtaHref}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-border text-foreground text-sm font-medium hover:bg-muted/50 transition-all duration-300"
              >
                {content.hero.secondaryCtaLabel}
              </SmartLink>
            </div>

            {/* Stats teaser */}
            <div 
              className={`
                flex items-center gap-6 pt-4 border-t border-border/50
                transition-all duration-1000 ease-out
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
              `}
              style={{ transitionDelay: '500ms' }}
            >
              {content.hero.teaserStats.map((stat, index) => (
                <div key={`${stat.value}-${stat.label}`} className="contents">
                  <div>
                    <span className="font-serif text-2xl text-foreground">{stat.value}</span>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                  {index < content.hero.teaserStats.length - 1 && <div className="w-px h-10 bg-border/50" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
