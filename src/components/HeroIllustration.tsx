import heroIllustration from "@/assets/hero-illustration.png";

const HeroIllustration = () => {
  return (
    <section className="w-full bg-background">
      <div className="w-full">
        <img
          src={heroIllustration}
          alt="SaaS design illustration featuring robotic arms and finance app mockup"
          className="w-full h-auto object-cover"
        />
      </div>
    </section>
  );
};

export default HeroIllustration;
