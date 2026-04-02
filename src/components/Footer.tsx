import { Instagram, Linkedin, Github, Twitter } from "lucide-react";
import ieeeLogo from "@/assets/ieee-cs-logo.png";

const Footer = () => {
  return (
    <footer className="px-8 py-12 bg-background border-t border-border/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Logo & Description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img 
                src={ieeeLogo} 
                alt="IEEE Computer Society" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Empowering the next generation of tech leaders through hands-on learning, 
              community building, and innovation.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {["About Us", "Events", "Team", "Projects", "Contact"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-foreground hover:opacity-70 transition-opacity">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Get in Touch
            </h4>
            <p className="text-sm text-foreground mb-2">ieee.cs@college.edu</p>
            <p className="text-sm text-muted-foreground mb-4">CS Building, Room 101</p>
            
            <div className="flex items-center gap-4">
              {[Instagram, Linkedin, Github, Twitter].map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-all"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2025 IEEE Computer Society. All rights reserved.
          </p>
          <p className="text-xs text-muted-foreground">
            Made with ❤️ by CS students, for CS students.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
