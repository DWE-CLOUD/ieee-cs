import { ReactNode, useEffect, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import {
  defaultHomeContent,
  HomePageContent,
  normalizeHomeContent,
} from '@/lib/home-content';

const LandingContentManager = () => {
  const [content, setContent] = useState<HomePageContent>(defaultHomeContent);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    api
      .get<unknown>('/api/admin/site-content/home')
      .then((payload) => setContent(normalizeHomeContent(payload)))
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : 'Failed to load landing content');
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveContent = async () => {
    setIsSaving(true);
    try {
      await api.patch('/api/admin/site-content/home', content);
      toast.success('Landing page content updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save landing content');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setContent(defaultHomeContent);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-2xl text-foreground">Landing Page Editor</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edit homepage copy, CTA links, footer links, and section text from here.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={resetToDefaults}
            className="px-4 py-2 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
          >
            Reset To Defaults
          </button>
          <button
            onClick={saveContent}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50 transition-all"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <DetailsCard title="Hero Section" description="Main landing headline, CTA buttons, and teaser stats.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Badge"
            value={content.hero.badge}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, badge: value } }))
            }
          />
          <TextInput
            label="Primary CTA Label"
            value={content.hero.primaryCtaLabel}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, primaryCtaLabel: value } }))
            }
          />
          <TextInput
            label="Title Line 1"
            value={content.hero.titleLine1}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, titleLine1: value } }))
            }
          />
          <TextInput
            label="Primary CTA Link"
            value={content.hero.primaryCtaHref}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, primaryCtaHref: value } }))
            }
          />
          <TextInput
            label="Title Line 2"
            value={content.hero.titleLine2}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, titleLine2: value } }))
            }
          />
          <TextInput
            label="Secondary CTA Label"
            value={content.hero.secondaryCtaLabel}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, secondaryCtaLabel: value } }))
            }
          />
          <TextInput
            label="Title Line 3"
            value={content.hero.titleLine3}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, titleLine3: value } }))
            }
          />
          <TextInput
            label="Secondary CTA Link"
            value={content.hero.secondaryCtaHref}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, hero: { ...prev.hero, secondaryCtaHref: value } }))
            }
          />
        </div>
        <TextAreaInput
          label="Description"
          value={content.hero.description}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, hero: { ...prev.hero, description: value } }))
          }
          rows={4}
        />
        <div className="grid gap-4 md:grid-cols-3">
          {content.hero.teaserStats.map((stat, index) => (
            <div key={`${stat.label}-${index}`} className="rounded-2xl border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Teaser Stat {index + 1}</h4>
              <TextInput
                label="Value"
                value={stat.value}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      teaserStats: prev.hero.teaserStats.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, value } : item
                      ),
                    },
                  }))
                }
              />
              <TextInput
                label="Label"
                value={stat.label}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    hero: {
                      ...prev.hero,
                      teaserStats: prev.hero.teaserStats.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, label: value } : item
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </DetailsCard>

      <DetailsCard title="Marquee" description="Scrolling keywords shown below the hero.">
        <div className="grid gap-4 md:grid-cols-2">
          {content.marquee.items.map((item, index) => (
            <TextInput
              key={`marquee-${index}`}
              label={`Item ${index + 1}`}
              value={item}
              onChange={(value) =>
                setContent((prev) => ({
                  ...prev,
                  marquee: {
                    items: prev.marquee.items.map((current, currentIndex) =>
                      currentIndex === index ? value : current
                    ),
                  },
                }))
              }
            />
          ))}
        </div>
      </DetailsCard>

      <DetailsCard title="Stats Grid" description="Four homepage stats under the marquee.">
        <div className="grid gap-4 md:grid-cols-2">
          {content.stats.items.map((item, index) => (
            <div key={`stats-${index}`} className="rounded-2xl border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Stat Card {index + 1}</h4>
              <TextInput
                label="Value"
                value={item.value}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    stats: {
                      items: prev.stats.items.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, value } : current
                      ),
                    },
                  }))
                }
              />
              <TextInput
                label="Label"
                value={item.label}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    stats: {
                      items: prev.stats.items.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, label: value } : current
                      ),
                    },
                  }))
                }
              />
              <TextInput
                label="Description"
                value={item.description}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    stats: {
                      items: prev.stats.items.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, description: value } : current
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
      </DetailsCard>

      <DetailsCard title="About Section" description='The large "We are IEEE" section.'>
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Word One"
            value={content.about.wordOne}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, about: { ...prev.about, wordOne: value } }))
            }
          />
          <TextInput
            label="Word Two"
            value={content.about.wordTwo}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, about: { ...prev.about, wordTwo: value } }))
            }
          />
          <TextInput
            label="Word Three"
            value={content.about.wordThree}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, about: { ...prev.about, wordThree: value } }))
            }
          />
        </div>
      </DetailsCard>

      <DetailsCard title="Journey Timeline" description="Edit the story cards in the landing event timeline.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.journey.eyebrow}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, journey: { ...prev.journey, eyebrow: value } }))
            }
          />
          <div />
          <TextInput
            label="Title Line 1"
            value={content.journey.titleLine1}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, journey: { ...prev.journey, titleLine1: value } }))
            }
          />
          <TextInput
            label="Title Line 2"
            value={content.journey.titleLine2}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, journey: { ...prev.journey, titleLine2: value } }))
            }
          />
        </div>
        <TextAreaInput
          label="Section Description"
          value={content.journey.description}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, journey: { ...prev.journey, description: value } }))
          }
          rows={4}
        />
        <div className="space-y-4">
          {content.journey.items.map((item, index) => (
            <div key={`journey-${item.step}-${index}`} className="rounded-2xl border border-border/50 p-4 space-y-4">
              <h4 className="text-sm font-medium text-foreground">Timeline Card {index + 1}</h4>
              <div className="grid gap-4 md:grid-cols-2">
                <TextInput
                  label="Step"
                  value={item.step}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, step: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Subtitle"
                  value={item.subtitle}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, subtitle: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Title"
                  value={item.title}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, title: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Metric One Value"
                  value={item.metricOneValue}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, metricOneValue: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Metric One Label"
                  value={item.metricOneLabel}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, metricOneLabel: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Metric Two Value"
                  value={item.metricTwoValue}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, metricTwoValue: value } : current
                        ),
                      },
                    }))
                  }
                />
                <TextInput
                  label="Metric Two Label"
                  value={item.metricTwoLabel}
                  onChange={(value) =>
                    setContent((prev) => ({
                      ...prev,
                      journey: {
                        ...prev.journey,
                        items: prev.journey.items.map((current, currentIndex) =>
                          currentIndex === index ? { ...current, metricTwoLabel: value } : current
                        ),
                      },
                    }))
                  }
                />
              </div>
              <TextAreaInput
                label="Description"
                value={item.description}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    journey: {
                      ...prev.journey,
                      items: prev.journey.items.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, description: value } : current
                      ),
                    },
                  }))
                }
                rows={3}
              />
              <TextAreaInput
                label="Highlights (one per line)"
                value={item.highlights.join('\n')}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    journey: {
                      ...prev.journey,
                      items: prev.journey.items.map((current, currentIndex) =>
                        currentIndex === index
                          ? {
                              ...current,
                              highlights: value
                                .split('\n')
                                .map((line) => line.trim())
                                .filter(Boolean),
                            }
                          : current
                      ),
                    },
                  }))
                }
                rows={5}
              />
            </div>
          ))}
        </div>
      </DetailsCard>

      <DetailsCard title="Team Section" description="Controls the team header and team CTA label.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.team.eyebrow}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, team: { ...prev.team, eyebrow: value } }))
            }
          />
          <TextInput
            label="Section Title"
            value={content.team.title}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, team: { ...prev.team, title: value } }))
            }
          />
        </div>
        <TextAreaInput
          label="Description"
          value={content.team.description}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, team: { ...prev.team, description: value } }))
          }
          rows={4}
        />
        <TextInput
          label="Join CTA Label"
          value={content.team.joinCtaLabel}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, team: { ...prev.team, joinCtaLabel: value } }))
          }
        />
      </DetailsCard>

      <DetailsCard title="Gallery Section" description="Gallery heading and CTA in the landing page.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.gallery.eyebrow}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, gallery: { ...prev.gallery, eyebrow: value } }))
            }
          />
          <TextInput
            label="CTA Label"
            value={content.gallery.ctaLabel}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, gallery: { ...prev.gallery, ctaLabel: value } }))
            }
          />
          <TextInput
            label="Title"
            value={content.gallery.title}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, gallery: { ...prev.gallery, title: value } }))
            }
          />
          <TextInput
            label="CTA Link"
            value={content.gallery.ctaHref}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, gallery: { ...prev.gallery, ctaHref: value } }))
            }
          />
        </div>
        <TextAreaInput
          label="Description"
          value={content.gallery.description}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, gallery: { ...prev.gallery, description: value } }))
          }
          rows={3}
        />
      </DetailsCard>

      <DetailsCard title="Upcoming Events Section" description="Landing section title, CTA, and empty-state note.">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Eyebrow"
            value={content.upcomingEvents.eyebrow}
            onChange={(value) =>
              setContent((prev) => ({
                ...prev,
                upcomingEvents: { ...prev.upcomingEvents, eyebrow: value },
              }))
            }
          />
          <TextInput
            label="View All Label"
            value={content.upcomingEvents.viewAllLabel}
            onChange={(value) =>
              setContent((prev) => ({
                ...prev,
                upcomingEvents: { ...prev.upcomingEvents, viewAllLabel: value },
              }))
            }
          />
          <TextInput
            label="Title"
            value={content.upcomingEvents.title}
            onChange={(value) =>
              setContent((prev) => ({
                ...prev,
                upcomingEvents: { ...prev.upcomingEvents, title: value },
              }))
            }
          />
          <TextInput
            label="View All Link"
            value={content.upcomingEvents.viewAllHref}
            onChange={(value) =>
              setContent((prev) => ({
                ...prev,
                upcomingEvents: { ...prev.upcomingEvents, viewAllHref: value },
              }))
            }
          />
        </div>
        <TextAreaInput
          label="Description"
          value={content.upcomingEvents.description}
          onChange={(value) =>
            setContent((prev) => ({
              ...prev,
              upcomingEvents: { ...prev.upcomingEvents, description: value },
            }))
          }
          rows={3}
        />
        <TextAreaInput
          label="Empty State Hint"
          value={content.upcomingEvents.emptyHint}
          onChange={(value) =>
            setContent((prev) => ({
              ...prev,
              upcomingEvents: { ...prev.upcomingEvents, emptyHint: value },
            }))
          }
          rows={2}
        />
      </DetailsCard>

      <DetailsCard title="Footer" description="Quick links, contact info, and social URLs.">
        <TextAreaInput
          label="Footer Description"
          value={content.footer.description}
          onChange={(value) =>
            setContent((prev) => ({ ...prev, footer: { ...prev.footer, description: value } }))
          }
          rows={3}
        />
        <div className="grid gap-4 md:grid-cols-2">
          {content.footer.quickLinks.map((item, index) => (
            <div key={`quick-link-${index}`} className="rounded-2xl border border-border/50 p-4 space-y-3">
              <h4 className="text-sm font-medium text-foreground">Quick Link {index + 1}</h4>
              <TextInput
                label="Label"
                value={item.label}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      quickLinks: prev.footer.quickLinks.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, label: value } : current
                      ),
                    },
                  }))
                }
              />
              <TextInput
                label="Href"
                value={item.href}
                onChange={(value) =>
                  setContent((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      quickLinks: prev.footer.quickLinks.map((current, currentIndex) =>
                        currentIndex === index ? { ...current, href: value } : current
                      ),
                    },
                  }))
                }
              />
            </div>
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Contact Email"
            value={content.footer.contactEmail}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, contactEmail: value } }))
            }
          />
          <TextInput
            label="Contact Location"
            value={content.footer.contactLocation}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, contactLocation: value } }))
            }
          />
          <TextInput
            label="Instagram URL"
            value={content.footer.instagramUrl}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, instagramUrl: value } }))
            }
          />
          <TextInput
            label="LinkedIn URL"
            value={content.footer.linkedinUrl}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, linkedinUrl: value } }))
            }
          />
          <TextInput
            label="GitHub URL"
            value={content.footer.githubUrl}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, githubUrl: value } }))
            }
          />
          <TextInput
            label="Twitter/X URL"
            value={content.footer.twitterUrl}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, twitterUrl: value } }))
            }
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Copyright"
            value={content.footer.copyright}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, copyright: value } }))
            }
          />
          <TextInput
            label="Credit Line"
            value={content.footer.credit}
            onChange={(value) =>
              setContent((prev) => ({ ...prev, footer: { ...prev.footer, credit: value } }))
            }
          />
        </div>
      </DetailsCard>
    </div>
  );
};

const DetailsCard = ({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) => (
  <details open className="rounded-3xl border border-border/50 bg-background overflow-hidden">
    <summary className="cursor-pointer list-none px-6 py-5 bg-muted/20 border-b border-border/50">
      <h3 className="font-serif text-xl text-foreground">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </summary>
    <div className="space-y-4 p-6">{children}</div>
  </details>
);

const TextInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  </label>
);

const TextAreaInput = ({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) => (
  <label className="block space-y-1.5">
    <span className="text-sm font-medium text-foreground">{label}</span>
    <textarea
      value={value}
      rows={rows}
      onChange={(event) => onChange(event.target.value)}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-accent/40 resize-y"
    />
  </label>
);

export default LandingContentManager;
