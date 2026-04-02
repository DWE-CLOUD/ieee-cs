import AsteriskIcon from "./icons/AsteriskIcon";
import { ArrowRight, Plus } from "lucide-react";

const MarqueeItem = ({ text, icon }: { text: string; icon: "asterisk" | "arrow" | "plus" }) => {
  return (
    <div className="flex items-center gap-4 px-4">
      <span className="text-xs uppercase tracking-widest font-medium text-foreground whitespace-nowrap">
        {text}
      </span>
      {icon === "asterisk" && <AsteriskIcon className="w-4 h-4 text-foreground" />}
      {icon === "arrow" && <ArrowRight className="w-4 h-4 text-foreground" />}
      {icon === "plus" && <Plus className="w-4 h-4 text-foreground" />}
    </div>
  );
};

const Marquee = () => {
  const items = [
    { text: "HACKATHONS", icon: "asterisk" as const },
    { text: "WORKSHOPS", icon: "arrow" as const },
    { text: "AI & ML", icon: "asterisk" as const },
    { text: "WEB DEV", icon: "plus" as const },
    { text: "CYBERSECURITY", icon: "asterisk" as const },
    { text: "CODING", icon: "arrow" as const },
    { text: "CLOUD", icon: "asterisk" as const },
    { text: "NETWORKING", icon: "arrow" as const },
    { text: "OPEN SOURCE", icon: "asterisk" as const },
    { text: "RESEARCH", icon: "arrow" as const },
  ];

  return (
    <div className="py-6 bg-background overflow-hidden border-y border-border/30">
      <div className="flex animate-marquee">
        {[...items, ...items].map((item, index) => (
          <MarqueeItem key={index} text={item.text} icon={item.icon} />
        ))}
      </div>
    </div>
  );
};

export default Marquee;
