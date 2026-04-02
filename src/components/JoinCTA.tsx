import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const JoinCTA = () => {
  return (
    <section id="join" className="relative px-6 md:px-8 py-24 bg-foreground text-primary-foreground overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-gold/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="max-w-4xl mx-auto text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 mb-6">
          <Sparkles className="w-4 h-4 text-gold" />
          <span className="text-xs font-medium uppercase tracking-wider">Ready to level up?</span>
        </div>
        
        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
          Join the community
        </h2>
        
        <p className="text-base md:text-lg opacity-80 max-w-xl mx-auto mb-10 leading-relaxed">
          Become part of a vibrant community of tech enthusiasts, innovators, and future leaders.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/positions" className="group flex items-center gap-2 bg-primary-foreground text-foreground px-8 py-4 rounded-full text-sm font-medium hover:bg-primary-foreground/90 transition-all duration-300 shadow-elegant">
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            Apply Now
          </Link>
          <Link to="/gallery" className="flex items-center gap-2 border border-primary-foreground/30 px-8 py-4 rounded-full text-sm font-medium hover:bg-primary-foreground/10 transition-all duration-300">
            Learn More
          </Link>
        </div>
      </div>
    </section>
  );
};

export default JoinCTA;
