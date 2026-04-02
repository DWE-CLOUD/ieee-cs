import { Instagram, Linkedin, Github, Twitter } from "lucide-react";
import ieeeLogo from "@/assets/ieee-cs-logo.png";
import SmartLink from "@/components/SmartLink";
import { useHomeContent } from "@/components/home/HomeContentProvider";

const Footer = () => {
  const content = useHomeContent();
  const socialLinks = [
    { icon: Instagram, href: content.footer.instagramUrl, label: 'Instagram' },
    { icon: Linkedin, href: content.footer.linkedinUrl, label: 'LinkedIn' },
    { icon: Github, href: content.footer.githubUrl, label: 'GitHub' },
    { icon: Twitter, href: content.footer.twitterUrl, label: 'Twitter' },
  ].filter((item) => item.href);

  return (
    <footer id="contact" className="px-8 py-12 bg-background border-t border-border/30">
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
              {content.footer.description}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {content.footer.quickLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  <SmartLink href={link.href} className="text-sm text-foreground hover:opacity-70 transition-opacity">
                    {link.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
              Get in Touch
            </h4>
            <a
              href={`mailto:${content.footer.contactEmail}`}
              className="block text-sm text-foreground mb-2 hover:opacity-70 transition-opacity"
            >
              {content.footer.contactEmail}
            </a>
            <p className="text-sm text-muted-foreground mb-4">{content.footer.contactLocation}</p>
            
            {socialLinks.length > 0 && (
              <div className="flex items-center gap-4">
                {socialLinks.map(({ icon: Icon, href, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="w-9 h-9 rounded-full bg-muted flex items-center justify-center hover:bg-foreground hover:text-primary-foreground transition-all"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-8 border-t border-border/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{content.footer.copyright}</p>
          <p className="text-xs text-muted-foreground">{content.footer.credit}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
