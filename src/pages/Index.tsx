import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import Marquee from "@/components/Marquee";
import StatsSection from "@/components/StatsSection";
import WeAreIEEESection from "@/components/WeAreIEEESection";
import EventsTimeline from "@/components/EventsTimeline";
import TeamSection from "@/components/TeamSection";
import GallerySection from "@/components/GallerySection";
import UpcomingEvents from "@/components/UpcomingEvents";
import Footer from "@/components/Footer";
import FloatingNav from "@/components/FloatingNav";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <Marquee />
      <StatsSection />
      <WeAreIEEESection />
      <EventsTimeline />
      <TeamSection />
      <GallerySection />
      <UpcomingEvents />
      <Footer />
      <FloatingNav />
    </div>
  );
};

export default Index;
