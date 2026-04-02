import { ArrowRight, Menu, X, User, LogIn } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import ieeeLogo from "@/assets/ieee-cs-logo.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, profile, isAdmin, loading } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      setIsHidden(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "About", href: "#about" },
    { name: "Events", href: "#events" },
    { name: "Team", href: "#team" },
    { name: "Gallery", href: "/gallery", isRoute: true },
    { name: "Positions", href: "/positions", isRoute: true },
  ];

  return (
    <header
      className={`
        fixed top-0 left-0 right-0 z-50 px-6 md:px-8 py-4
        transition-all duration-500 ease-out
        ${isHidden 
          ? "-translate-y-full opacity-0" 
          : "translate-y-0 opacity-100"
        }
        ${isScrolled && !isHidden
          ? "glass-strong shadow-soft" 
          : "bg-transparent"
        }
      `}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img 
            src={ieeeLogo} 
            alt="IEEE Computer Society" 
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-300 link-underline"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                className="relative px-4 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-300 link-underline"
              >
                {link.name}
              </a>
            )
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Link
              to="/admin"
              className="hidden lg:block text-sm font-medium text-accent hover:text-accent/80 transition-colors duration-300"
            >
              Admin
            </Link>
          )}
          
          {!loading && (
            user ? (
              <Link
                to="/profile"
                className="group flex items-center gap-2 bg-foreground text-primary-foreground px-4 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-all duration-300 shadow-soft hover:shadow-elegant"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">{profile?.display_name || 'Profile'}</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="group flex items-center gap-2 bg-foreground text-primary-foreground px-5 py-2.5 rounded-full text-sm font-medium hover:bg-foreground/90 transition-all duration-300 shadow-soft hover:shadow-elegant"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )
          )}

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors duration-300"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-foreground" />
            ) : (
              <Menu className="w-5 h-5 text-foreground" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`
          md:hidden absolute top-full left-0 right-0 glass-strong
          transition-all duration-300 ease-out overflow-hidden
          ${isMobileMenuOpen ? "max-h-80 opacity-100" : "max-h-0 opacity-0"}
        `}
      >
        <nav className="flex flex-col p-4 gap-1">
          {navLinks.map((link) => (
            link.isRoute ? (
              <Link
                key={link.name}
                to={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors duration-300"
              >
                {link.name}
              </Link>
            ) : (
              <a
                key={link.name}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors duration-300"
              >
                {link.name}
              </a>
            )
          ))}
          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-accent hover:bg-muted rounded-lg transition-colors duration-300"
            >
              Admin Dashboard
            </Link>
          )}
          {!loading && !user && (
            <Link
              to="/auth"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors duration-300"
            >
              Sign In
            </Link>
          )}
          {!loading && user && (
            <Link
              to="/profile"
              onClick={() => setIsMobileMenuOpen(false)}
              className="px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors duration-300"
            >
              Profile
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
