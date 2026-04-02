import { useState, useEffect } from "react";
import { Home, Calendar, Users, Info, Sparkles, Briefcase, User, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ieeeLogo from "@/assets/ieee-logo.png";

const FloatingNav = () => {
  const [activeItem, setActiveItem] = useState("Home");
  const [isVisible, setIsVisible] = useState(false);
  const { user, loading } = useAuth();
  const location = useLocation();

  // Only show on home page
  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 400 && isHomePage);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isHomePage]);

  useEffect(() => {
    const sections = [
      { id: "events", name: "Events" },
      { id: "team", name: "Team" },
      { id: "about", name: "About" },
      { id: "join", name: "Join" },
    ];
    
    const handleScroll = () => {
      const scrollPos = window.scrollY + window.innerHeight / 2;
      
      for (const section of sections) {
        const element = document.getElementById(section.id);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (scrollPos >= offsetTop && scrollPos < offsetTop + offsetHeight) {
            setActiveItem(section.name);
            return;
          }
        }
      }
      
      if (window.scrollY < 400) {
        setActiveItem("Home");
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", icon: Home, href: "#", isRoute: false },
    { name: "About", icon: Info, href: "#about", isRoute: false },
    { name: "Events", icon: Calendar, href: "#events", isRoute: false },
    { name: "Team", icon: Users, href: "#team", isRoute: false },
    { name: "Positions", icon: Briefcase, href: "/positions", isRoute: true },
  ];

  const handleClick = (name: string) => {
    setActiveItem(name);
  };

  if (!isHomePage) return null;

  return (
    <nav 
      className={`
        fixed bottom-6 left-1/2 -translate-x-1/2 z-50
        transition-all duration-500 ease-out
        ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}
      `}
    >
      <div className="flex items-center gap-1 bg-background/80 backdrop-blur-2xl px-2 py-2 rounded-full shadow-elegant border border-border/60">
        {/* Logo pill */}
        <a 
          href="#"
          onClick={() => handleClick("Home")}
          className="flex items-center justify-center h-10 px-3 rounded-full bg-foreground mr-1 transition-transform duration-300 hover:scale-105"
        >
          <img src={ieeeLogo} alt="IEEE" className="h-5 w-auto object-contain invert" />
        </a>

        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeItem === item.name;
          
          if (item.isRoute) {
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => handleClick(item.name)}
                className={`
                  flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                  ${isActive 
                    ? "bg-foreground text-primary-foreground shadow-soft" 
                    : "text-foreground/70 hover:text-foreground hover:bg-muted"
                  }
                `}
              >
                <IconComponent className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {item.name}
                </span>
              </Link>
            );
          }
          
          return (
            <a
              key={item.name}
              href={item.href}
              onClick={() => handleClick(item.name)}
              className={`
                flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300
                ${isActive 
                  ? "bg-foreground text-primary-foreground shadow-soft" 
                  : "text-foreground/70 hover:text-foreground hover:bg-muted"
                }
              `}
            >
              <IconComponent className="w-4 h-4" />
              <span className="hidden sm:inline">
                {item.name}
              </span>
            </a>
          );
        })}

        {/* Auth Button */}
        {!loading && (
          user ? (
            <Link
              to="/profile"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ml-1 bg-accent/90 text-accent-foreground hover:bg-accent"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ml-1 bg-accent/90 text-accent-foreground hover:bg-accent"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>
          )
        )}
      </div>
    </nav>
  );
};

export default FloatingNav;
