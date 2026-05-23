import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Briefcase,
  Download,
  GraduationCap,
  LayoutTemplate,
  Link as LinkIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Save,
  Sparkles,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import ieeeLogo from "@/assets/ieee-logo.png";

interface ResumeEntry {
  id: string;
  title: string;
  organization: string;
  location: string;
  start: string;
  end: string;
  description: string;
}

interface ResumeData {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  skills: string;
  experience: ResumeEntry[];
  projects: ResumeEntry[];
  education: ResumeEntry[];
  certifications: string;
}

type EditorTab = "basics" | "experience" | "projects" | "education";

const makeId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const emptyEntry = (): ResumeEntry => ({
  id: makeId(),
  title: "",
  organization: "",
  location: "",
  start: "",
  end: "",
  description: "",
});

const emptyResume: ResumeData = {
  name: "",
  headline: "",
  email: "",
  phone: "",
  location: "",
  website: "",
  summary: "",
  skills: "",
  experience: [],
  projects: [],
  education: [],
  certifications: "",
};

const splitLines = (value: string) =>
  value
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

const ResumeEditor = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<EditorTab>("basics");
  const [isEditorLoading, setIsEditorLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [resume, setResume] = useState<ResumeData>(emptyResume);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (loading || !user) return;

    const saved = localStorage.getItem(`resume-editor:${user.id}`);
    if (saved) {
      try {
        setResume(JSON.parse(saved) as ResumeData);
      } catch {
        localStorage.removeItem(`resume-editor:${user.id}`);
      }
    } else {
      setResume({
        ...emptyResume,
        name: profile?.display_name || "",
        headline: profile?.headline || "",
        email: profile?.email || user.email || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        website: profile?.website_url || "",
        summary: profile?.bio || "",
        skills: (profile?.specialties || []).join("\n"),
        projects:
          profile?.focus_title || profile?.focus_body
            ? [
                {
                  ...emptyEntry(),
                  title: profile.focus_title || "Current Focus",
                  description: profile.focus_body || "",
                },
              ]
            : [],
        certifications: (profile?.achievements || []).join("\n"),
      });
    }

    const timer = window.setTimeout(() => setIsEditorLoading(false), 350);
    return () => window.clearTimeout(timer);
  }, [loading, profile, user]);

  useEffect(() => {
    if (!user || isEditorLoading) return;
    localStorage.setItem(`resume-editor:${user.id}`, JSON.stringify(resume));
  }, [isEditorLoading, resume, user]);

  const completion = useMemo(() => {
    const checks = [
      resume.name,
      resume.email,
      resume.headline,
      resume.summary,
      resume.skills,
      resume.experience.length > 0,
      resume.education.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [resume]);

  const updateEntry = (
    section: "experience" | "projects" | "education",
    id: string,
    patch: Partial<ResumeEntry>
  ) => {
    setResume((current) => ({
      ...current,
      [section]: current[section].map((entry) =>
        entry.id === id ? { ...entry, ...patch } : entry
      ),
    }));
  };

  const addEntry = (section: "experience" | "projects" | "education") => {
    setResume((current) => ({
      ...current,
      [section]: [...current[section], emptyEntry()],
    }));
  };

  const removeEntry = (section: "experience" | "projects" | "education", id: string) => {
    setResume((current) => ({
      ...current,
      [section]: current[section].filter((entry) => entry.id !== id),
    }));
  };

  const saveNow = () => {
    if (!user) return;
    setIsSaving(true);
    localStorage.setItem(`resume-editor:${user.id}`, JSON.stringify(resume));
    window.setTimeout(() => setIsSaving(false), 500);
  };

  const printResume = () => {
    saveNow();
    window.setTimeout(() => window.print(), 100);
  };

  const tabs: { id: EditorTab; label: string; icon: typeof User }[] = [
    { id: "basics", label: "Basics", icon: User },
    { id: "experience", label: "Experience", icon: Briefcase },
    { id: "projects", label: "Projects", icon: Sparkles },
    { id: "education", label: "Education", icon: GraduationCap },
  ];

  if (loading || isEditorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-9 h-9 animate-spin text-accent mx-auto mb-4" />
          <h1 className="font-serif text-2xl text-foreground">Loading editor</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Preparing your resume workspace from your member profile.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <header className="sticky top-0 z-50 glass-strong px-4 py-3 md:px-6 md:py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={ieeeLogo}
              alt="IEEE Computer Society"
              className="h-8 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/profile"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Profile
            </Link>
            <button
              onClick={saveNow}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save
            </button>
            <button
              onClick={printResume}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 md:px-6 md:py-8 print:p-0">
        <div className="max-w-7xl mx-auto print:max-w-none">
          <div className="grid gap-6 lg:grid-cols-[420px_1fr] print:block">
            <section className="print:hidden">
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-accent mb-3">
                  <LayoutTemplate className="w-4 h-4" />
                  Resume Builder
                </div>
                <h1 className="font-serif text-3xl md:text-4xl text-foreground">Resume Editor</h1>
                <p className="text-sm text-muted-foreground mt-2">
                  Build a clean resume from your profile, then export it as a PDF.
                </p>
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-foreground">Resume readiness</span>
                  <span className="text-sm text-muted-foreground">{completion}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-accent transition-all duration-300"
                    style={{ width: `${completion}%` }}
                  />
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                      activeTab === tab.id
                        ? "bg-foreground text-primary-foreground border-foreground"
                        : "bg-card text-muted-foreground border-border/60 hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-border/50 bg-card p-5 md:p-6">
                {activeTab === "basics" && (
                  <div className="space-y-5">
                    <TextField
                      icon={User}
                      label="Full Name"
                      value={resume.name}
                      onChange={(value) => setResume({ ...resume, name: value })}
                      placeholder="Your full name"
                    />
                    <TextField
                      icon={Sparkles}
                      label="Headline"
                      value={resume.headline}
                      onChange={(value) => setResume({ ...resume, headline: value })}
                      placeholder="Frontend Developer"
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField
                        icon={Mail}
                        label="Email"
                        value={resume.email}
                        onChange={(value) => setResume({ ...resume, email: value })}
                        placeholder="you@example.com"
                      />
                      <TextField
                        icon={Phone}
                        label="Phone"
                        value={resume.phone}
                        onChange={(value) => setResume({ ...resume, phone: value })}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <TextField
                        icon={MapPin}
                        label="Location"
                        value={resume.location}
                        onChange={(value) => setResume({ ...resume, location: value })}
                        placeholder="Chennai, India"
                      />
                      <TextField
                        icon={LinkIcon}
                        label="Website"
                        value={resume.website}
                        onChange={(value) => setResume({ ...resume, website: value })}
                        placeholder="portfolio.com"
                      />
                    </div>
                    <TextArea
                      label="Professional Summary"
                      value={resume.summary}
                      onChange={(value) => setResume({ ...resume, summary: value })}
                      placeholder="A focused 3-4 line summary of your strengths, domain, and impact."
                      rows={5}
                    />
                    <TextArea
                      label="Skills"
                      value={resume.skills}
                      onChange={(value) => setResume({ ...resume, skills: value })}
                      placeholder={"React\nTypeScript\nMachine Learning"}
                      rows={5}
                    />
                    <TextArea
                      label="Certifications / Achievements"
                      value={resume.certifications}
                      onChange={(value) => setResume({ ...resume, certifications: value })}
                      placeholder={"AWS Cloud Practitioner\nWon internal hackathon"}
                      rows={4}
                    />
                  </div>
                )}

                {activeTab === "experience" && (
                  <EntryEditor
                    title="Experience"
                    section="experience"
                    entries={resume.experience}
                    addEntry={addEntry}
                    updateEntry={updateEntry}
                    removeEntry={removeEntry}
                    titlePlaceholder="Web Team Lead"
                    organizationPlaceholder="IEEE Computer Society"
                  />
                )}

                {activeTab === "projects" && (
                  <EntryEditor
                    title="Projects"
                    section="projects"
                    entries={resume.projects}
                    addEntry={addEntry}
                    updateEntry={updateEntry}
                    removeEntry={removeEntry}
                    titlePlaceholder="Campus Event Platform"
                    organizationPlaceholder="Personal / Team Project"
                  />
                )}

                {activeTab === "education" && (
                  <EntryEditor
                    title="Education"
                    section="education"
                    entries={resume.education}
                    addEntry={addEntry}
                    updateEntry={updateEntry}
                    removeEntry={removeEntry}
                    titlePlaceholder="B.Tech Computer Science"
                    organizationPlaceholder="Your College"
                  />
                )}
              </div>
            </section>

            <section className="lg:sticky lg:top-24 lg:self-start print:static">
              <div className="rounded-3xl border border-border/50 bg-card p-3 shadow-elegant print:rounded-none print:border-0 print:shadow-none print:p-0 print:bg-white">
                <ResumePreview resume={resume} />
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

interface TextFieldProps {
  icon: typeof User;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

const TextField = ({ icon: Icon, label, value, onChange, placeholder }: TextFieldProps) => (
  <label className="block">
    <span className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
      <Icon className="w-4 h-4 text-muted-foreground" />
      {label}
    </span>
    <input
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
    />
  </label>
);

interface TextAreaProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  rows: number;
}

const TextArea = ({ label, value, onChange, placeholder, rows }: TextAreaProps) => (
  <label className="block">
    <span className="block text-sm font-medium text-foreground mb-2">{label}</span>
    <textarea
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-4 py-3 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
    />
  </label>
);

interface EntryEditorProps {
  title: string;
  section: "experience" | "projects" | "education";
  entries: ResumeEntry[];
  addEntry: (section: "experience" | "projects" | "education") => void;
  updateEntry: (
    section: "experience" | "projects" | "education",
    id: string,
    patch: Partial<ResumeEntry>
  ) => void;
  removeEntry: (section: "experience" | "projects" | "education", id: string) => void;
  titlePlaceholder: string;
  organizationPlaceholder: string;
}

const EntryEditor = ({
  title,
  section,
  entries,
  addEntry,
  updateEntry,
  removeEntry,
  titlePlaceholder,
  organizationPlaceholder,
}: EntryEditorProps) => (
  <div>
    <div className="flex items-center justify-between gap-3 mb-5">
      <h2 className="font-serif text-xl text-foreground">{title}</h2>
      <button
        onClick={() => addEntry(section)}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent text-accent-foreground text-sm font-medium hover:opacity-90 transition-opacity"
      >
        <Plus className="w-4 h-4" />
        Add
      </button>
    </div>

    {entries.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No {title.toLowerCase()} added yet.</p>
        <button
          onClick={() => addEntry(section)}
          className="mt-4 text-sm font-medium text-accent hover:text-accent/80"
        >
          Add first item
        </button>
      </div>
    ) : (
      <div className="space-y-5">
        {entries.map((entry, index) => (
          <div key={entry.id} className="rounded-2xl border border-border/50 p-4 bg-background">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Item {index + 1}</span>
              <button
                onClick={() => removeEntry(section, entry.id)}
                className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={`Remove ${title} item ${index + 1}`}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <input
                value={entry.title}
                onChange={(event) => updateEntry(section, entry.id, { title: event.target.value })}
                placeholder={titlePlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <input
                value={entry.organization}
                onChange={(event) =>
                  updateEntry(section, entry.id, { organization: event.target.value })
                }
                placeholder={organizationPlaceholder}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  value={entry.location}
                  onChange={(event) =>
                    updateEntry(section, entry.id, { location: event.target.value })
                  }
                  placeholder="Location"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  value={entry.start}
                  onChange={(event) => updateEntry(section, entry.id, { start: event.target.value })}
                  placeholder="Start"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
                <input
                  value={entry.end}
                  onChange={(event) => updateEntry(section, entry.id, { end: event.target.value })}
                  placeholder="End"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </div>
              <textarea
                value={entry.description}
                onChange={(event) =>
                  updateEntry(section, entry.id, { description: event.target.value })
                }
                placeholder={"Write one achievement per line.\nBuilt an event dashboard used by 300+ students."}
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
              />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

const ResumePreview = ({ resume }: { resume: ResumeData }) => {
  const skills = splitLines(resume.skills);
  const certifications = splitLines(resume.certifications);

  return (
    <div className="bg-white text-slate-950 min-h-[980px] rounded-[20px] p-8 md:p-10 print:min-h-screen print:rounded-none print:p-10">
      <header className="border-b border-slate-200 pb-6">
        <h1 className="font-serif text-4xl text-slate-950">{resume.name || "Your Name"}</h1>
        <p className="text-sm font-medium text-slate-700 mt-2">
          {resume.headline || "Your role or professional headline"}
        </p>
        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs text-slate-600">
          {resume.email && <span>{resume.email}</span>}
          {resume.phone && <span>{resume.phone}</span>}
          {resume.location && <span>{resume.location}</span>}
          {resume.website && <span>{resume.website}</span>}
        </div>
      </header>

      <div className="grid gap-7 mt-7">
        {resume.summary && (
          <PreviewSection title="Summary">
            <p className="text-sm leading-relaxed text-slate-700">{resume.summary}</p>
          </PreviewSection>
        )}

        {resume.experience.length > 0 && (
          <PreviewSection title="Experience">
            <EntryPreview entries={resume.experience} />
          </PreviewSection>
        )}

        {resume.projects.length > 0 && (
          <PreviewSection title="Projects">
            <EntryPreview entries={resume.projects} />
          </PreviewSection>
        )}

        {resume.education.length > 0 && (
          <PreviewSection title="Education">
            <EntryPreview entries={resume.education} />
          </PreviewSection>
        )}

        {skills.length > 0 && (
          <PreviewSection title="Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span
                  key={skill}
                  className="px-2.5 py-1 rounded-full border border-slate-200 text-xs text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </PreviewSection>
        )}

        {certifications.length > 0 && (
          <PreviewSection title="Certifications & Achievements">
            <ul className="space-y-1.5 text-sm text-slate-700">
              {certifications.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </PreviewSection>
        )}
      </div>
    </div>
  );
};

const PreviewSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section>
    <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500 mb-3">{title}</h2>
    {children}
  </section>
);

const EntryPreview = ({ entries }: { entries: ResumeEntry[] }) => (
  <div className="space-y-5">
    {entries.map((entry) => {
      const bullets = splitLines(entry.description);
      return (
        <article key={entry.id}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-950">
                {entry.title || "Untitled"}
              </h3>
              <p className="text-sm text-slate-700">{entry.organization}</p>
            </div>
            <p className="text-xs text-slate-500 sm:text-right">
              {[entry.start, entry.end].filter(Boolean).join(" - ")}
              {entry.location && <span className="block">{entry.location}</span>}
            </p>
          </div>
          {bullets.length > 0 && (
            <ul className="mt-2 space-y-1.5 text-sm text-slate-700">
              {bullets.map((bullet) => (
                <li key={bullet} className="flex gap-2">
                  <span className="mt-2 h-1 w-1 rounded-full bg-slate-400 shrink-0" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          )}
        </article>
      );
    })}
  </div>
);

export default ResumeEditor;
