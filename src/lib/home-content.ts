export interface LinkItem {
  label: string;
  href: string;
}

export interface StatItem {
  value: string;
  label: string;
  description: string;
}

export interface HeroTeaserStat {
  value: string;
  label: string;
}

export interface JourneyItem {
  step: string;
  title: string;
  subtitle: string;
  description: string;
  highlights: string[];
  metricOneValue: string;
  metricOneLabel: string;
  metricTwoValue: string;
  metricTwoLabel: string;
}

export interface HomePageContent {
  hero: {
    badge: string;
    titleLine1: string;
    titleLine2: string;
    titleLine3: string;
    description: string;
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    teaserStats: HeroTeaserStat[];
  };
  marquee: {
    items: string[];
  };
  stats: {
    items: StatItem[];
  };
  about: {
    wordOne: string;
    wordTwo: string;
    wordThree: string;
  };
  journey: {
    eyebrow: string;
    titleLine1: string;
    titleLine2: string;
    description: string;
    items: JourneyItem[];
  };
  team: {
    eyebrow: string;
    title: string;
    description: string;
    joinCtaLabel: string;
  };
  gallery: {
    eyebrow: string;
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
  upcomingEvents: {
    eyebrow: string;
    title: string;
    description: string;
    viewAllLabel: string;
    viewAllHref: string;
    emptyHint: string;
  };
  footer: {
    description: string;
    quickLinks: LinkItem[];
    contactEmail: string;
    contactLocation: string;
    instagramUrl: string;
    linkedinUrl: string;
    githubUrl: string;
    twitterUrl: string;
    copyright: string;
    credit: string;
  };
}

export const defaultHomeContent: HomePageContent = {
  hero: {
    badge: 'Innovate • Learn • Build',
    titleLine1: 'We build the',
    titleLine2: 'future of',
    titleLine3: 'technology.',
    description:
      'IEEE Computer Society is the premier technical club at our college. We empower students to innovate, learn, and build cutting-edge technology together.',
    primaryCtaLabel: 'Explore our work',
    primaryCtaHref: '/gallery',
    secondaryCtaLabel: 'Become a member',
    secondaryCtaHref: '/positions',
    teaserStats: [
      { value: '500+', label: 'Members' },
      { value: '50+', label: 'Events/Year' },
      { value: '25+', label: 'Wins' },
    ],
  },
  marquee: {
    items: [
      'HACKATHONS',
      'WORKSHOPS',
      'AI & ML',
      'WEB DEV',
      'CYBERSECURITY',
      'CODING',
      'CLOUD',
      'NETWORKING',
      'OPEN SOURCE',
      'RESEARCH',
    ],
  },
  stats: {
    items: [
      { value: '500+', label: 'Active Members', description: 'Growing community' },
      { value: '50+', label: 'Events/Year', description: 'Workshops & hackathons' },
      { value: '25+', label: 'Hackathon Wins', description: 'Across competitions' },
      { value: '100+', label: 'Projects Built', description: 'Real-world impact' },
    ],
  },
  about: {
    wordOne: 'We',
    wordTwo: 'are',
    wordThree: 'IEEE',
  },
  journey: {
    eyebrow: '/ Our Journey /',
    titleLine1: 'Building Community',
    titleLine2: 'Through Events',
    description:
      'From hackathons to workshops, we create opportunities for students to learn, build, and grow together. Each event is designed to push boundaries and foster innovation in our tech community.',
    items: [
      {
        step: '01',
        title: 'HackFest 2024',
        subtitle: 'Annual Hackathon',
        description:
          'Our flagship 24-hour hackathon where 200+ students built innovative solutions. Teams competed for prizes worth $5000.',
        highlights: [
          '200+ participants from 15 colleges',
          '50 innovative projects submitted',
          'Industry mentors from top tech companies',
          'Best project won internship opportunities',
        ],
        metricOneValue: '200+',
        metricOneLabel: 'Participants',
        metricTwoValue: '50',
        metricTwoLabel: 'Projects Built',
      },
      {
        step: '02',
        title: 'TechTalk Series',
        subtitle: 'Workshop & Seminars',
        description:
          'Monthly technical workshops covering cutting-edge technologies. Industry experts shared insights on AI, Cloud, and Web3.',
        highlights: [
          '12 workshops conducted this year',
          'Guest speakers from Google & Microsoft',
          'Hands-on coding sessions',
          'Certificate of participation',
        ],
        metricOneValue: '12',
        metricOneLabel: 'Workshops',
        metricTwoValue: '24+',
        metricTwoLabel: 'Hours of Content',
      },
      {
        step: '03',
        title: 'CodeSprint 2024',
        subtitle: 'Competitive Programming',
        description:
          'Intense coding competition testing algorithmic skills. Top performers qualified for regional IEEE competitions.',
        highlights: [
          '500+ problems solved collectively',
          'Top 3 qualified for regionals',
          'Cash prizes for winners',
          'Coding resources provided',
        ],
        metricOneValue: '500+',
        metricOneLabel: 'Problems Solved',
        metricTwoValue: '3',
        metricTwoLabel: 'Regional Qualifiers',
      },
    ],
  },
  team: {
    eyebrow: '/ We are IEEE CS /',
    title: 'Team',
    description:
      'A passionate group of students united by their love for technology, made of colleagues turned friends who genuinely enjoy working together.',
    joinCtaLabel: 'Join',
  },
  gallery: {
    eyebrow: 'Moments Captured',
    title: 'Event Gallery',
    description: 'Relive the memories from our workshops, hackathons, and community events.',
    ctaLabel: 'View Full Gallery',
    ctaHref: '/gallery',
  },
  upcomingEvents: {
    eyebrow: "What's happening",
    title: 'Upcoming Events',
    description: 'Join us for workshops, hackathons, and networking opportunities',
    viewAllLabel: 'View all events',
    viewAllHref: '/#events',
    emptyHint: 'These are placeholder events. Add real events from the admin dashboard.',
  },
  footer: {
    description:
      'Empowering the next generation of tech leaders through hands-on learning, community building, and innovation.',
    quickLinks: [
      { label: 'About Us', href: '/#about' },
      { label: 'Events', href: '/#events' },
      { label: 'Team', href: '/#team' },
      { label: 'Gallery', href: '/gallery' },
      { label: 'Positions', href: '/positions' },
    ],
    contactEmail: 'ieee.cs@college.edu',
    contactLocation: 'CS Building, Room 101',
    instagramUrl: '',
    linkedinUrl: '',
    githubUrl: '',
    twitterUrl: '',
    copyright: '© 2025 IEEE Computer Society. All rights reserved.',
    credit: 'Made by CS students, for CS students.',
  },
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown, fallback: string) =>
  typeof value === 'string' ? value : fallback;

const asStringArray = (value: unknown, fallback: string[]) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const nextItems = value.filter((item): item is string => typeof item === 'string');
  return nextItems.length > 0 ? nextItems : fallback;
};

const normalizeLinkItem = (value: unknown, fallback: LinkItem): LinkItem => {
  const record = asRecord(value);
  return {
    label: asString(record.label, fallback.label),
    href: asString(record.href, fallback.href),
  };
};

const normalizeStatItem = (value: unknown, fallback: StatItem): StatItem => {
  const record = asRecord(value);
  return {
    value: asString(record.value, fallback.value),
    label: asString(record.label, fallback.label),
    description: asString(record.description, fallback.description),
  };
};

const normalizeHeroTeaserStat = (value: unknown, fallback: HeroTeaserStat): HeroTeaserStat => {
  const record = asRecord(value);
  return {
    value: asString(record.value, fallback.value),
    label: asString(record.label, fallback.label),
  };
};

const normalizeJourneyItem = (value: unknown, fallback: JourneyItem): JourneyItem => {
  const record = asRecord(value);
  return {
    step: asString(record.step, fallback.step),
    title: asString(record.title, fallback.title),
    subtitle: asString(record.subtitle, fallback.subtitle),
    description: asString(record.description, fallback.description),
    highlights: asStringArray(record.highlights, fallback.highlights),
    metricOneValue: asString(record.metricOneValue, fallback.metricOneValue),
    metricOneLabel: asString(record.metricOneLabel, fallback.metricOneLabel),
    metricTwoValue: asString(record.metricTwoValue, fallback.metricTwoValue),
    metricTwoLabel: asString(record.metricTwoLabel, fallback.metricTwoLabel),
  };
};

export const normalizeHomeContent = (value: unknown): HomePageContent => {
  const record = asRecord(value);
  const hero = asRecord(record.hero);
  const marquee = asRecord(record.marquee);
  const stats = asRecord(record.stats);
  const about = asRecord(record.about);
  const journey = asRecord(record.journey);
  const team = asRecord(record.team);
  const gallery = asRecord(record.gallery);
  const upcomingEvents = asRecord(record.upcomingEvents);
  const footer = asRecord(record.footer);

  return {
    hero: {
      badge: asString(hero.badge, defaultHomeContent.hero.badge),
      titleLine1: asString(hero.titleLine1, defaultHomeContent.hero.titleLine1),
      titleLine2: asString(hero.titleLine2, defaultHomeContent.hero.titleLine2),
      titleLine3: asString(hero.titleLine3, defaultHomeContent.hero.titleLine3),
      description: asString(hero.description, defaultHomeContent.hero.description),
      primaryCtaLabel: asString(hero.primaryCtaLabel, defaultHomeContent.hero.primaryCtaLabel),
      primaryCtaHref: asString(hero.primaryCtaHref, defaultHomeContent.hero.primaryCtaHref),
      secondaryCtaLabel: asString(hero.secondaryCtaLabel, defaultHomeContent.hero.secondaryCtaLabel),
      secondaryCtaHref: asString(hero.secondaryCtaHref, defaultHomeContent.hero.secondaryCtaHref),
      teaserStats: defaultHomeContent.hero.teaserStats.map((item, index) =>
        normalizeHeroTeaserStat(Array.isArray(hero.teaserStats) ? hero.teaserStats[index] : undefined, item)
      ),
    },
    marquee: {
      items: asStringArray(marquee.items, defaultHomeContent.marquee.items),
    },
    stats: {
      items: defaultHomeContent.stats.items.map((item, index) =>
        normalizeStatItem(Array.isArray(stats.items) ? stats.items[index] : undefined, item)
      ),
    },
    about: {
      wordOne: asString(about.wordOne, defaultHomeContent.about.wordOne),
      wordTwo: asString(about.wordTwo, defaultHomeContent.about.wordTwo),
      wordThree: asString(about.wordThree, defaultHomeContent.about.wordThree),
    },
    journey: {
      eyebrow: asString(journey.eyebrow, defaultHomeContent.journey.eyebrow),
      titleLine1: asString(journey.titleLine1, defaultHomeContent.journey.titleLine1),
      titleLine2: asString(journey.titleLine2, defaultHomeContent.journey.titleLine2),
      description: asString(journey.description, defaultHomeContent.journey.description),
      items: defaultHomeContent.journey.items.map((item, index) =>
        normalizeJourneyItem(Array.isArray(journey.items) ? journey.items[index] : undefined, item)
      ),
    },
    team: {
      eyebrow: asString(team.eyebrow, defaultHomeContent.team.eyebrow),
      title: asString(team.title, defaultHomeContent.team.title),
      description: asString(team.description, defaultHomeContent.team.description),
      joinCtaLabel: asString(team.joinCtaLabel, defaultHomeContent.team.joinCtaLabel),
    },
    gallery: {
      eyebrow: asString(gallery.eyebrow, defaultHomeContent.gallery.eyebrow),
      title: asString(gallery.title, defaultHomeContent.gallery.title),
      description: asString(gallery.description, defaultHomeContent.gallery.description),
      ctaLabel: asString(gallery.ctaLabel, defaultHomeContent.gallery.ctaLabel),
      ctaHref: asString(gallery.ctaHref, defaultHomeContent.gallery.ctaHref),
    },
    upcomingEvents: {
      eyebrow: asString(upcomingEvents.eyebrow, defaultHomeContent.upcomingEvents.eyebrow),
      title: asString(upcomingEvents.title, defaultHomeContent.upcomingEvents.title),
      description: asString(upcomingEvents.description, defaultHomeContent.upcomingEvents.description),
      viewAllLabel: asString(
        upcomingEvents.viewAllLabel,
        defaultHomeContent.upcomingEvents.viewAllLabel
      ),
      viewAllHref: asString(upcomingEvents.viewAllHref, defaultHomeContent.upcomingEvents.viewAllHref),
      emptyHint: asString(upcomingEvents.emptyHint, defaultHomeContent.upcomingEvents.emptyHint),
    },
    footer: {
      description: asString(footer.description, defaultHomeContent.footer.description),
      quickLinks: defaultHomeContent.footer.quickLinks.map((item, index) =>
        normalizeLinkItem(Array.isArray(footer.quickLinks) ? footer.quickLinks[index] : undefined, item)
      ),
      contactEmail: asString(footer.contactEmail, defaultHomeContent.footer.contactEmail),
      contactLocation: asString(footer.contactLocation, defaultHomeContent.footer.contactLocation),
      instagramUrl: asString(footer.instagramUrl, defaultHomeContent.footer.instagramUrl),
      linkedinUrl: asString(footer.linkedinUrl, defaultHomeContent.footer.linkedinUrl),
      githubUrl: asString(footer.githubUrl, defaultHomeContent.footer.githubUrl),
      twitterUrl: asString(footer.twitterUrl, defaultHomeContent.footer.twitterUrl),
      copyright: asString(footer.copyright, defaultHomeContent.footer.copyright),
      credit: asString(footer.credit, defaultHomeContent.footer.credit),
    },
  };
};
