import AsteriskIcon from "./icons/AsteriskIcon";
import { ArrowRight, Plus } from "lucide-react";
import { useHomeContent } from "@/components/home/HomeContentProvider";

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
  const content = useHomeContent();
  const icons = ["asterisk", "arrow", "plus"] as const;
  const items = content.marquee.items.map((text, index) => ({
    text,
    icon: icons[index % icons.length],
  }));

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
