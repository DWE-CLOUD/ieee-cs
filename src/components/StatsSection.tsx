import { Users, Calendar, Trophy, Code } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "Active Members", description: "Growing community" },
  { icon: Calendar, value: "50+", label: "Events/Year", description: "Workshops & hackathons" },
  { icon: Trophy, value: "25+", label: "Hackathon Wins", description: "Across competitions" },
  { icon: Code, value: "100+", label: "Projects Built", description: "Real-world impact" },
];

const StatsSection = () => {
  return (
    <section className="px-6 md:px-8 py-20 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="group relative p-6 md:p-8 rounded-2xl bg-card border border-border/50 hover:border-accent/30 transition-all duration-500 hover-lift"
            >
              <div className="absolute inset-0 rounded-2xl bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mb-5 group-hover:bg-accent/10 group-hover:scale-110 transition-all duration-500">
                  <stat.icon className="w-5 h-5 text-foreground group-hover:text-accent transition-colors duration-300" />
                </div>
                
                <span className="font-serif text-4xl md:text-5xl text-foreground block mb-1">
                  {stat.value}
                </span>
                
                <span className="text-sm font-medium text-foreground block mb-1">
                  {stat.label}
                </span>
                
                <span className="text-xs text-muted-foreground">
                  {stat.description}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
