"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  ALL_IDEAS,
  CATEGORIES,
  IdeaCategory,
  IdeaInterest,
  IdeaStatus,
} from "@/data/ideas";

type IdeaRecord = {
  id: string;
  title: string;
  detail: string;
  category: string;
  source: string;
  status: IdeaStatus;
  interest: IdeaInterest;
  note: string;
  sortOrder?: number;
};

type InspirationImage = {
  id: string;
  filename: string;
  contentType?: string;
  caption: string;
  createdAt?: string;
  url?: string;
};

type InspirationLink = {
  id: string;
  url: string;
  title: string;
  createdAt?: string;
};

type View = "saved" | "browse" | "inspiration";
type InterestFilter = "all" | IdeaInterest;
type GenerationMode = "ideas" | "images";

type IdeaBatchImportResult = {
  ideas: IdeaRecord[];
  added: number;
  skipped: number;
  batchName: string;
};

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const seedRecords: IdeaRecord[] = ALL_IDEAS.map((item, sortOrder) => ({
  ...item,
  note: "",
  sortOrder,
}));

const interestLabels: Record<IdeaInterest, string> = {
  consider: "Considering",
  love: "Love it",
  research: "Researching",
};

const compactInterestLabels: Record<IdeaInterest, string> = {
  consider: "Consider",
  love: "Love",
  research: "Research",
};

const GALLERY_DENSITY_STORAGE_KEY = "house-notes-gallery-density-v1";
const IDEA_BATCH_EXAMPLE = `{
  "batchName": "passive-comfort-ideas",
  "ideas": [
    {
      "title": "Example idea title",
      "category": "Comfort",
      "detail": "One sentence explaining why the idea may be worth considering."
    }
  ]
}`;

const IDEA_GROUPS: Array<{ id: string; label: string; categories: string[] }> = [
  {
    id: "design",
    label: "Design & layout",
    categories: ["Layout & architecture", "Materials & details"],
  },
  { id: "kitchen", label: "Kitchen & dining", categories: ["Kitchen & dining"] },
  {
    id: "comfort",
    label: "Comfort & convenience",
    categories: ["Comfort", "Daily convenience", "Storage", "Laundry & utility"],
  },
  { id: "bath", label: "Bath & wellness", categories: ["Bath & wellness"] },
  { id: "light", label: "Light & windows", categories: ["Light & windows"] },
  {
    id: "landscaping",
    label: "Landscaping & outdoors",
    categories: ["Outdoors & landscaping"],
  },
  {
    id: "efficiency",
    label: "Efficiency & future-proofing",
    categories: ["Energy & resilience", "Future-proofing"],
  },
];

export default function HouseNotes() {
  const [ideas, setIdeas] = useState<IdeaRecord[]>(seedRecords);
  const [images, setImages] = useState<InspirationImage[]>([]);
  const [links, setLinks] = useState<InspirationLink[]>([]);
  const [activeView, setActiveView] = useState<View>("saved");
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("all");
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const [isSyncing, setIsSyncing] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [generationMode, setGenerationMode] = useState<GenerationMode | null>(null);
  const [showBatchImport, setShowBatchImport] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => undefined);
    }

    const params = new URLSearchParams(window.location.search);
    const sharedCount = Number(params.get("shared") ?? "0");
    const sharedLink = params.get("shared_link") === "1";
    const shareError = params.get("share_error");
    const shareUpdate = window.setTimeout(() => {
      if (params.get("view") === "images" || sharedCount || sharedLink || shareError) {
        setActiveView("inspiration");
      }
      if (sharedCount > 0) {
        setNotice(sharedCount === 1 ? "Shared image added to your gallery." : `${sharedCount} shared images added to your gallery.`);
      } else if (sharedLink) {
        setNotice("Shared link added to your gallery.");
      } else if (shareError === "too-large") {
        setNotice("That image is larger than 12 MB.");
      } else if (shareError) {
        setNotice("That app did not share an image or a web link.");
      }
    }, 0);

    if (params.has("shared") || params.has("shared_link") || params.has("share_error")) {
      window.history.replaceState({}, "", params.get("view") === "images" ? "/?view=images" : "/");
    }
    return () => window.clearTimeout(shareUpdate);
  }, []);

  useEffect(() => {
    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const markInstalled = () => {
      setInstallPrompt(null);
      setNotice("House Notes is installed and ready for Android sharing.");
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    window.addEventListener("appinstalled", markInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
      window.removeEventListener("appinstalled", markInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    setInstallPrompt(null);
    if (choice.outcome === "accepted") setNotice("Installing House Notes…");
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/ideas", { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("Could not load ideas");
        return response.json() as Promise<{ ideas: IdeaRecord[] }>;
      }),
      fetch("/api/images", { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("Could not load images");
        return response.json() as Promise<{ images: InspirationImage[] }>;
      }),
      fetch("/api/links", { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("Could not load links");
        return response.json() as Promise<{ links: InspirationLink[] }>;
      }),
    ])
      .then(([ideaData, imageData, linkData]) => {
        if (!active) return;
        setIdeas(ideaData.ideas);
        setImages(imageData.images);
        setLinks(linkData.links);
      })
      .catch(() => {
        if (active) setNotice("The starter ideas are visible, but changes are not connected yet.");
      })
      .finally(() => active && setIsSyncing(false));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timeout = window.setTimeout(() => setNotice(""), 4200);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  const savedIdeas = useMemo(() => ideas.filter((item) => item.status === "saved"), [ideas]);
  const candidateIdeas = useMemo(() => ideas.filter((item) => item.status === "candidate"), [ideas]);

  const visibleIdeas = useMemo(() => {
    const source = activeView === "saved" ? savedIdeas : candidateIdeas;
    const normalized = query.trim().toLowerCase();
    return source.filter((item) => {
      const interestMatch =
        activeView !== "saved" || interestFilter === "all" || item.interest === interestFilter;
      const categoryMatch = category === "All" || item.category === category;
      const queryMatch =
        !normalized ||
        item.title.toLowerCase().includes(normalized) ||
        item.detail.toLowerCase().includes(normalized) ||
        item.category.toLowerCase().includes(normalized);
      return interestMatch && categoryMatch && queryMatch;
    });
  }, [activeView, candidateIdeas, category, interestFilter, query, savedIdeas]);

  function changeView(view: View) {
    setActiveView(view);
    setInterestFilter("all");
    setCategory("All");
    setQuery("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateIdea(id: string, update: Partial<IdeaRecord>, message?: string) {
    const previous = ideas;
    setIdeas((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item)));
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(update),
      });
      if (!response.ok) throw new Error("Save failed");
      const data = (await response.json()) as { idea: IdeaRecord };
      setIdeas((current) => current.map((item) => (item.id === id ? data.idea : item)));
      if (message) setNotice(message);
    } catch {
      setIdeas(previous);
      setNotice("That change did not save. Please try again.");
    }
  }

  async function addCustomIdea(input: { title: string; detail: string; category: string; interest: IdeaInterest }) {
    const response = await fetch("/api/ideas", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Could not add idea");
    const data = (await response.json()) as { idea: IdeaRecord };
    setIdeas((current) => [...current, data.idea]);
    setNotice("Added to My ideas.");
  }

  async function importIdeaBatch(payload: unknown): Promise<IdeaBatchImportResult> {
    const response = await fetch("/api/ideas/batch", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as IdeaBatchImportResult & { error?: string };
    if (!response.ok) throw new Error(data.error || "That batch could not be imported.");

    setIdeas((current) => {
      const currentIds = new Set(current.map((idea) => idea.id));
      return [...current, ...data.ideas.filter((idea) => !currentIds.has(idea.id))];
    });
    setCategory("All");
    setQuery("");
    setNotice(data.added
      ? `${data.added} new Browse idea${data.added === 1 ? "" : "s"} imported${data.skipped ? `; ${data.skipped} duplicate${data.skipped === 1 ? "" : "s"} skipped` : ""}.`
      : `No new ideas were imported; ${data.skipped} duplicate${data.skipped === 1 ? " was" : "s were"} skipped.`);
    return data;
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <button className="brand" onClick={() => changeView("saved")} aria-label="Go to My ideas">
          <span className="brand-mark" aria-hidden="true"><span /></span>
          <span>House Notes</span>
        </button>
        <nav className="main-nav" aria-label="House Notes sections">
          <NavButton active={activeView === "saved"} onClick={() => changeView("saved")}>
            My ideas <span>{savedIdeas.length}</span>
          </NavButton>
          <NavButton active={activeView === "browse"} onClick={() => changeView("browse")}>
            Browse ideas <span>{candidateIdeas.length}</span>
          </NavButton>
          <NavButton active={activeView === "inspiration"} onClick={() => changeView("inspiration")}>
            Images <span>{images.length + links.length + 1}</span>
          </NavButton>
        </nav>
        <div className="topbar-actions">
          {installPrompt && <button className="install-app-button" onClick={installApp}>Install app</button>}
          <div className={`sync-status ${isSyncing ? "is-syncing" : ""}`} aria-live="polite">
            <i /> {isSyncing ? "Opening your book" : "Saved privately"}
          </div>
        </div>
      </header>

      {activeView === "saved" && (
        <>
          <QuickAddPanel
            onAdd={async (input) => {
              await addCustomIdea(input);
              setInterestFilter(input.interest);
              setCategory("All");
              setQuery("");
            }}
          />
          <section className="content-section compact-content" aria-labelledby="my-ideas-title">
            <div className="compact-page-heading">
              <div><p className="eyebrow">Your collection</p><h1 id="my-ideas-title">My ideas</h1></div>
              <p>{savedIdeas.length} possibilities to remember—not decisions already made.</p>
              <button onClick={() => changeView("browse")}>Browse more ideas <span aria-hidden="true">→</span></button>
            </div>
            <InterestSwitcher
              active={interestFilter}
              ideas={savedIdeas}
              onChange={(value) => {
                setInterestFilter(value);
                setCategory("All");
                setQuery("");
              }}
            />
            <IdeaToolbar
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              ideas={savedIdeas}
              showCategories={false}
            />
            <GroupedSavedIdeas
              ideas={visibleIdeas}
              onUpdate={(idea, update, message) => updateIdea(idea.id, update, message)}
            />
            {visibleIdeas.length === 0 && <EmptyState query={query} />}
          </section>
        </>
      )}

      {activeView === "browse" && (
        <>
          <section className="compact-page-header" aria-labelledby="browse-title">
            <div><p className="eyebrow">Nothing is added automatically</p><h1 id="browse-title">Browse ideas</h1></div>
            <p>All {candidateIdeas.length} unsaved ideas are grouped below. One click keeps anything that catches your eye.</p>
            <div className="browse-header-actions">
              <div className="compact-tally"><strong>{visibleIdeas.length}</strong><span>ideas showing</span></div>
            </div>
          </section>
          <section className="content-section compact-content browse-content">
            <IdeaToolbar
              query={query}
              setQuery={setQuery}
              category={category}
              setCategory={setCategory}
              ideas={candidateIdeas}
            />
            <div className="chatgpt-handoff-strip">
              <span><strong>Want a genuinely new batch?</strong> Ask any AI for import-ready JSON, then paste it here.</span>
              <div className="handoff-strip-actions">
                <button type="button" onClick={() => setGenerationMode("ideas")}>
                  <span aria-hidden="true">✦</span> Create with ChatGPT
                </button>
                <button type="button" onClick={() => setShowBatchImport(true)}>
                  <span aria-hidden="true">↓</span> Import AI batch
                </button>
              </div>
            </div>
            <GroupedCandidateIdeas
              ideas={visibleIdeas}
              idPrefix="browse"
              onSave={(idea) => updateIdea(idea.id, { status: "saved" }, `“${idea.title}” is now in My ideas.`)}
            />
            {visibleIdeas.length === 0 && <EmptyState query={query} />}
          </section>
        </>
      )}

      {activeView === "inspiration" && (
        <ImagesView
          images={images}
          setImages={setImages}
          links={links}
          setLinks={setLinks}
          setNotice={setNotice}
          onGenerate={() => setGenerationMode("images")}
        />
      )}

      <footer>
        <span>House Notes</span>
        <p>Look now. Keep what matters. Decide later.</p>
      </footer>
      {notice && <div className="toast" role="status">{notice}</div>}
      {generationMode && (
        <ChatGPTHandoff
          mode={generationMode}
          existingIdeas={ideas.map((idea) => idea.title)}
          onClose={() => setGenerationMode(null)}
          setNotice={setNotice}
        />
      )}
      {showBatchImport && (
        <BatchImportDialog
          onClose={() => setShowBatchImport(false)}
          onImport={importIdeaBatch}
        />
      )}
    </main>
  );
}

function NavButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return <button className={active ? "active" : ""} onClick={onClick}>{children}</button>;
}

function InterestIcon({ value }: { value: InterestFilter }) {
  if (value === "all") {
    return (
      <svg className="interest-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4 5h12M4 10h12M4 15h12" />
      </svg>
    );
  }
  if (value === "love") {
    return (
      <svg className="interest-icon" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M10 16.4 4.2 11C1.2 8.2 2.7 3.7 6.5 3.7c1.6 0 2.8.9 3.5 2 .7-1.1 1.9-2 3.5-2 3.8 0 5.3 4.5 2.3 7.3L10 16.4Z" />
      </svg>
    );
  }
  if (value === "research") {
    return (
      <svg className="interest-icon" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="8.5" cy="8.5" r="4.7" />
        <path d="m12 12 4.2 4.2" />
      </svg>
    );
  }
  return (
    <svg className="interest-icon" viewBox="0 0 20 20" aria-hidden="true">
      <path d="M6.2 11.3A5.4 5.4 0 1 1 13.8 11c-1 .8-1.5 1.7-1.6 2.7H7.8c-.1-1-.6-1.8-1.6-2.4Z" />
      <path d="M8 16h4" />
    </svg>
  );
}

function QuickAddPanel({
  onAdd,
}: {
  onAdd: (input: { title: string; detail: string; category: string; interest: IdeaInterest }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [category, setCategory] = useState<IdeaCategory>("Layout & architecture");
  const [interest, setInterest] = useState<IdeaInterest>("consider");
  const [noteOpen, setNoteOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onAdd({ title, detail, category, interest });
      setTitle("");
      setDetail("");
      setNoteOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="quick-add" aria-labelledby="quick-add-title">
      <div className="quick-add-label">
        <span aria-hidden="true">＋</span>
        <div><p>Add something new</p><small>Capture it before you forget it</small></div>
      </div>
      <form onSubmit={submit}>
        <label className="quick-add-title">
          <span className="sr-only" id="quick-add-title">New house idea</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="What do you want to remember?"
          />
        </label>
        <label>
          <span className="sr-only">Category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value as IdeaCategory)}>
            {IDEA_GROUPS.map((group) => (
              <optgroup key={group.id} label={group.label}>
                {group.categories.map((item) => <option key={item}>{item}</option>)}
              </optgroup>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Interest</span>
          <select value={interest} onChange={(event) => setInterest(event.target.value as IdeaInterest)}>
            {(Object.keys(interestLabels) as IdeaInterest[]).map((value) => (
              <option key={value} value={value}>{interestLabels[value]}</option>
            ))}
          </select>
        </label>
        <button className="quick-note-toggle" type="button" onClick={() => setNoteOpen((open) => !open)}>
          {noteOpen ? "Hide note" : "+ Note"}
        </button>
        <button className="quick-add-button" disabled={saving || !title.trim()}>
          {saving ? "Adding…" : "Add idea"}
        </button>
        {noteOpen && (
          <label className="quick-add-note">
            <span className="sr-only">Optional note</span>
            <textarea
              value={detail}
              onChange={(event) => setDetail(event.target.value)}
              placeholder="Optional note, question, or detail…"
            />
          </label>
        )}
      </form>
    </section>
  );
}

function GroupedSavedIdeas({
  ideas,
  onUpdate,
}: {
  ideas: IdeaRecord[];
  onUpdate: (idea: IdeaRecord, update: Partial<IdeaRecord>, message?: string) => void;
}) {
  return (
    <div className="idea-groups">
      {IDEA_GROUPS.map((group) => {
        const groupIdeas = ideas.filter((idea) => group.categories.includes(idea.category));
        if (!groupIdeas.length) return null;
        return (
          <section className="idea-group" key={group.id} aria-labelledby={`saved-group-${group.id}`}>
            <header>
              <h2 id={`saved-group-${group.id}`}>{group.label}</h2>
              <span>{groupIdeas.length}</span>
            </header>
            <div className="compact-idea-list">
              {groupIdeas.map((idea) => (
                <SavedIdeaCard
                  key={idea.id}
                  idea={idea}
                  onUpdate={(update, message) => onUpdate(idea, update, message)}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function GroupedCandidateIdeas({
  ideas,
  onSave,
  idPrefix = "browse",
}: {
  ideas: IdeaRecord[];
  onSave: (idea: IdeaRecord) => void;
  idPrefix?: string;
}) {
  return (
    <div className="idea-groups candidate-groups">
      {IDEA_GROUPS.map((group) => {
        const groupIdeas = ideas.filter((idea) => group.categories.includes(idea.category));
        if (!groupIdeas.length) return null;
        return (
          <section className="idea-group" key={group.id} aria-labelledby={`${idPrefix}-group-${group.id}`}>
            <header>
              <h2 id={`${idPrefix}-group-${group.id}`}>{group.label}</h2>
              <span>{groupIdeas.length}</span>
            </header>
            <div className="compact-idea-list">
              {groupIdeas.map((idea) => (
                <CandidateCard key={idea.id} idea={idea} onSave={() => onSave(idea)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function IdeaToolbar({
  query,
  setQuery,
  category,
  setCategory,
  ideas,
  showCategories = true,
}: {
  query: string;
  setQuery: (value: string) => void;
  category: string;
  setCategory: (value: string) => void;
  ideas: IdeaRecord[];
  showCategories?: boolean;
}) {
  const categories = CATEGORIES.filter((item) => ideas.some((ideaItem) => ideaItem.category === item));
  return (
    <div className="toolbar">
      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <span className="sr-only">Search ideas</span>
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ideas" />
        {query && <button onClick={() => setQuery("")} aria-label="Clear search">×</button>}
      </label>
      {showCategories && (
        <div className="category-scroll" aria-label="Filter by category">
          {["All", ...categories].map((item) => (
            <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InterestSwitcher({
  active,
  ideas,
  onChange,
}: {
  active: InterestFilter;
  ideas: IdeaRecord[];
  onChange: (value: InterestFilter) => void;
}) {
  const options: Array<{ value: InterestFilter; label: string; tone: string }> = [
    { value: "all", label: "All ideas", tone: "all" },
    { value: "consider", label: "Considering", tone: "consider" },
    { value: "love", label: "Love it", tone: "love" },
    { value: "research", label: "Researching", tone: "research" },
  ];

  return (
    <div className="interest-switcher" aria-label="Filter My ideas by interest">
      <span className="interest-switcher-label">Show</span>
      <div>
        {options.map((option) => {
          const count = option.value === "all"
            ? ideas.length
            : ideas.filter((idea) => idea.interest === option.value).length;
          return (
            <button
              key={option.value}
              className={`${option.tone} ${active === option.value ? "active" : ""}`}
              onClick={() => onChange(option.value)}
              aria-pressed={active === option.value}
            >
              <InterestIcon value={option.value} />
              <span>{option.label}</span>
              <strong>{count}</strong>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SavedIdeaCard({ idea, onUpdate }: { idea: IdeaRecord; onUpdate: (update: Partial<IdeaRecord>, message?: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [draftNote, setDraftNote] = useState(idea.note);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setDraftNote(idea.note));
    return () => window.cancelAnimationFrame(frame);
  }, [idea.note]);

  function toggleExpanded() {
    if (expanded) {
      setEditingNote(false);
      setDraftNote(idea.note);
    }
    setExpanded(!expanded);
  }

  function openNote() {
    setExpanded(true);
    setDraftNote(idea.note);
    setEditingNote(!idea.note);
  }

  function saveNote() {
    const nextNote = draftNote.trim();
    onUpdate({ note: nextNote }, nextNote ? "Note saved." : "Note removed.");
    setDraftNote(nextNote);
    setEditingNote(false);
  }

  return (
    <article className={`idea-row saved-idea-row interest-${idea.interest} ${expanded ? "is-expanded" : ""}`}>
      <div className="idea-row-main">
        <button
          type="button"
          className="idea-row-toggle"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-controls={`idea-details-${idea.id}`}
        >
          <span className="idea-row-caret" aria-hidden="true">›</span>
          <span className="idea-row-title">{idea.title}</span>
        </button>
        <span className="idea-row-category">{idea.category}</span>
        <div className="row-interest-control" aria-label={`Interest level for ${idea.title}`}>
          {(Object.keys(interestLabels) as IdeaInterest[]).map((value) => (
            <button
              type="button"
              key={value}
              className={`${value} ${idea.interest === value ? "active" : ""}`}
              onClick={() => onUpdate({ interest: value }, `${idea.title}: ${interestLabels[value]}.`)}
              aria-label={`Mark ${idea.title} as ${interestLabels[value]}`}
              aria-pressed={idea.interest === value}
              title={interestLabels[value]}
            >
              <InterestIcon value={value} />
              <span>{compactInterestLabels[value]}</span>
            </button>
          ))}
        </div>
        <button type="button" className={`idea-row-note-action ${idea.note ? "has-note" : ""}`} onClick={openNote}>
          {idea.note ? "Note" : "+ Note"}
        </button>
        <button
          type="button"
          className="idea-row-remove"
          onClick={() => onUpdate({ status: "candidate" }, `Moved “${idea.title}” back to Browse ideas.`)}
        >
          Remove
        </button>
      </div>
      {expanded && (
        <div className="expanded-idea-card" id={`idea-details-${idea.id}`}>
          <div className="card-copy">
            <p className="category-label">{idea.category}</p>
            <h3>{idea.title}</h3>
            <p>{idea.detail || "A saved possibility for the house."}</p>
          </div>
          <div className="card-controls">
            <div className="interest-control" aria-label={`Interest level for ${idea.title}`}>
              {(Object.keys(interestLabels) as IdeaInterest[]).map((value) => (
                <button
                  type="button"
                  key={value}
                  className={idea.interest === value ? "active" : ""}
                  onClick={() => onUpdate({ interest: value }, `${idea.title}: ${interestLabels[value]}.`)}
                  aria-pressed={idea.interest === value}
                >
                  <InterestIcon value={value} />
                  {interestLabels[value]}
                </button>
              ))}
            </div>
            <div className="secondary-actions">
              <button type="button" onClick={() => { setDraftNote(idea.note); setEditingNote(true); }}>
                {idea.note ? "Edit note" : "Add note"}
              </button>
              <button type="button" onClick={() => onUpdate({ status: "candidate" }, `Moved “${idea.title}” back to Browse ideas.`)}>
                Remove from My ideas
              </button>
            </div>
          </div>
          {editingNote ? (
            <div className="note-editor expanded-note-editor">
              <label htmlFor={`note-${idea.id}`}>Your note</label>
              <textarea
                id={`note-${idea.id}`}
                value={draftNote}
                onChange={(event) => setDraftNote(event.target.value)}
                placeholder="What do you like about this? Anything to research?"
              />
              <div>
                <button type="button" className="small-button" onClick={saveNote}>Save note</button>
                <button type="button" onClick={() => { setDraftNote(idea.note); setEditingNote(false); }}>Cancel</button>
              </div>
            </div>
          ) : idea.note ? (
            <div className="idea-note-text expanded-note-text">
              <div><strong>Your note</strong><button type="button" onClick={() => setEditingNote(true)}>Edit note</button></div>
              <p>{idea.note}</p>
            </div>
          ) : null}
        </div>
      )}
    </article>
  );
}

function CandidateCard({ idea, onSave }: { idea: IdeaRecord; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`idea-row candidate-idea-row ${expanded ? "is-expanded" : ""}`}>
      <div className="idea-row-main">
        <button
          type="button"
          className="idea-row-toggle"
          onClick={() => setExpanded((open) => !open)}
          aria-expanded={expanded}
          aria-controls={`candidate-details-${idea.id}`}
        >
          <span className="idea-row-caret" aria-hidden="true">›</span>
          <span className="idea-row-title">{idea.title}</span>
        </button>
        <span className="idea-row-category">{idea.category}</span>
        <button type="button" className="save-row-idea" onClick={onSave}><span aria-hidden="true">＋</span> Save</button>
      </div>
      {expanded && (
        <div className="expanded-idea-card expanded-candidate-card" id={`candidate-details-${idea.id}`}>
          <div className="card-copy">
            <p className="category-label">{idea.category}</p>
            <h3>{idea.title}</h3>
            <p>{idea.detail}</p>
          </div>
          <div className="card-controls">
            <button type="button" className="expanded-save-idea" onClick={onSave}>
              <span aria-hidden="true">＋</span> Save idea
            </button>
          </div>
        </div>
      )}
    </article>
  );
}

function EmptyState({ query }: { query: string }) {
  return <div className="empty-state"><span>⌕</span><h3>No ideas found</h3><p>{query ? `Nothing matches “${query}”.` : "Try another category."}</p></div>;
}

function ImagesView({
  images,
  setImages,
  links,
  setLinks,
  setNotice,
  onGenerate,
}: {
  images: InspirationImage[];
  setImages: React.Dispatch<React.SetStateAction<InspirationImage[]>>;
  links: InspirationLink[];
  setLinks: React.Dispatch<React.SetStateAction<InspirationLink[]>>;
  setNotice: (message: string) => void;
  onGenerate: () => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [galleryDensity, setGalleryDensity] = useState(() => {
    if (typeof window === "undefined") return 2;
    const savedDensity = Number(window.localStorage.getItem(GALLERY_DENSITY_STORAGE_KEY));
    return savedDensity >= 1 && savedDensity <= 5 ? savedDensity : 2;
  });

  useEffect(() => {
    window.localStorage.setItem(GALLERY_DENSITY_STORAGE_KEY, String(galleryDensity));
  }, [galleryDensity]);

  async function uploadFiles(files: FileList | File[]) {
    const selected = Array.from(files).filter((file) => file.type.startsWith("image/"));
    if (!selected.length) return;
    setUploading(true);
    try {
      for (const file of selected) {
        const form = new FormData();
        form.append("image", file);
        form.append("caption", caption);
        const response = await fetch("/api/images", { method: "POST", body: form });
        if (!response.ok) {
          const data = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(data.error || "Upload failed");
        }
        const data = (await response.json()) as { image: InspirationImage };
        setImages((current) => [data.image, ...current]);
      }
      setCaption("");
      setNotice(selected.length === 1 ? "Image added to your gallery." : `${selected.length} images added to your gallery.`);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Those images did not upload.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function removeImage(id: string) {
    if (!window.confirm("Remove this image from your inspiration collection?")) return;
    const response = await fetch(`/api/images/${id}`, { method: "DELETE" });
    if (response.ok) {
      setImages((current) => current.filter((image) => image.id !== id));
      setNotice("Image removed.");
    } else {
      setNotice("That image could not be removed.");
    }
  }

  async function removeLink(id: string) {
    if (!window.confirm("Remove this link from your inspiration collection?")) return;
    const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
    if (response.ok) {
      setLinks((current) => current.filter((link) => link.id !== id));
      setNotice("Link removed.");
    } else {
      setNotice("That link could not be removed.");
    }
  }

  return (
    <section className="images-page" aria-labelledby="images-title">
      <header className="images-page-header">
        <div>
          <p className="eyebrow">Visual idea book</p>
          <h1 id="images-title">Images</h1>
          <p>Renderings, screenshots, materials, gardens, and rooms—all together.</p>
        </div>
        <aside className="chatgpt-image-tip">
          <span aria-hidden="true">↗</span>
          <div>
            <p><strong>Found something on Android?</strong> Tap Share, then choose House Notes. Images and web links will be added here automatically.</p>
            <button type="button" onClick={onGenerate}><span aria-hidden="true">✦</span> Generate images with ChatGPT</button>
          </div>
        </aside>
      </header>

      <section className="gallery-upload" aria-labelledby="gallery-add-title">
        <div className="gallery-upload-copy">
          <div><p className="eyebrow">Add images</p><h2 id="gallery-add-title">Drop in several at once.</h2></div>
          <label>
            Optional caption for this batch
            <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="e.g. Warm stone, deep eaves, native planting" />
          </label>
        </div>
        <div
          className={`gallery-drop-zone ${dragging ? "dragging" : ""}`}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { if (event.currentTarget === event.target) setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); uploadFiles(event.dataTransfer.files); }}
        >
          <input ref={fileInput} type="file" accept="image/*" multiple onChange={(event) => event.target.files && uploadFiles(event.target.files)} />
          <span aria-hidden="true">↑</span>
          <div><strong>{uploading ? "Adding images…" : "Drop images here"}</strong><small>JPG, PNG, WEBP, or GIF · up to 12 MB each</small></div>
          <button disabled={uploading} onClick={() => fileInput.current?.click()}>Choose images</button>
        </div>
      </section>

      <section className="gallery-section" aria-labelledby="gallery-title">
        <div className="gallery-heading">
          <div><p className="eyebrow">Your collection</p><h2 id="gallery-title">Gallery</h2></div>
          <div className="gallery-heading-tools">
            <span>{images.length + links.length + 1} item{images.length + links.length ? "s" : ""}</span>
            <div className="gallery-density-control" aria-label="Change gallery image size">
              <button
                type="button"
                onClick={() => setGalleryDensity((value) => Math.max(1, value - 1))}
                disabled={galleryDensity === 1}
                aria-label="Zoom out for a finer image grid"
              >−</button>
              <input
                type="range"
                min="1"
                max="5"
                step="1"
                value={galleryDensity}
                onChange={(event) => setGalleryDensity(Number(event.target.value))}
                aria-label="Gallery image size"
                aria-valuetext={`Size ${galleryDensity} of 5`}
              />
              <button
                type="button"
                onClick={() => setGalleryDensity((value) => Math.min(5, value + 1))}
                disabled={galleryDensity === 5}
                aria-label="Zoom in for larger images"
              >＋</button>
            </div>
          </div>
        </div>
        <div className={`gallery-grid gallery-density-${galleryDensity}`}>
          <figure>
            <a href="/house-notes-inspiration.png" target="_blank" rel="noreferrer">
              <img src="/house-notes-inspiration.png" alt="Four architectural studies: a kitchen garden, double-height room, hidden under-stair playroom, and outdoor bath" />
            </a>
            <figcaption><span>First House Notes studies</span><em>Built in</em></figcaption>
          </figure>
          {images.map((item) => (
            <figure key={item.id}>
              <a href={item.url || `/api/images/${item.id}`} target="_blank" rel="noreferrer">
                <img src={item.url || `/api/images/${item.id}`} alt={item.caption || item.filename} loading="lazy" />
              </a>
              <figcaption><span>{item.caption || item.filename}</span><button onClick={() => removeImage(item.id)}>Remove</button></figcaption>
            </figure>
          ))}
          {links.map((item) => (
            <GalleryLinkCard key={item.id} item={item} onRemove={() => removeLink(item.id)} />
          ))}
        </div>
      </section>
    </section>
  );
}

function GalleryLinkCard({ item, onRemove }: { item: InspirationLink; onRemove: () => void }) {
  let hostname = item.url;
  try {
    hostname = new URL(item.url).hostname.replace(/^www\./, "");
  } catch {
    // Stored links are validated server-side; keep the URL as a safe fallback label.
  }

  return (
    <article className="gallery-link-card">
      <a href={item.url} target="_blank" rel="noreferrer" aria-label={`Open saved link: ${item.title || hostname}`}>
        <div className="gallery-link-visual" aria-hidden="true"><span>↗</span><small>{hostname}</small></div>
        <div className="gallery-link-copy"><strong>{item.title || hostname}</strong><span>{item.url}</span></div>
      </a>
      <div className="gallery-link-footer"><em>Saved link</em><button onClick={onRemove}>Remove</button></div>
    </article>
  );
}

function ChatGPTHandoff({
  mode,
  existingIdeas,
  onClose,
  setNotice,
}: {
  mode: GenerationMode;
  existingIdeas: string[];
  onClose: () => void;
  setNotice: (message: string) => void;
}) {
  const [description, setDescription] = useState("");
  const [copyFailed, setCopyFailed] = useState(false);
  const descriptionInput = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    descriptionInput.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  const prompt = mode === "ideas"
    ? [
        "Help me brainstorm a fresh batch of house-building ideas for my House Notes project.",
        "Include a mix of design and layout, kitchen and dining, comfort and convenience, storage, bath and wellness, lighting, landscaping, efficiency, and future-proofing.",
        description.trim() ? `Please especially focus on: ${description.trim()}` : "Create 24 thoughtful, practical ideas with a few delightful or unusual ones.",
        `Do not repeat these ideas already in my collection: ${existingIdeas.join("; ")}.`,
        `Every category must exactly match one of these values: ${CATEGORIES.join("; ")}.`,
        "Return only valid JSON, with no markdown fence, introduction, or comments.",
        `Use this exact shape:\n${IDEA_BATCH_EXAMPLE}`,
        "Each item needs a concise title and a one-sentence detail. Do not include IDs, notes, status, or source fields. The batch will enter Browse ideas as unsaved candidates; nothing becomes a kept idea automatically.",
      ].join("\n\n")
    : [
        "Use image generation to create four distinct architectural or interior-design concept images for my House Notes project.",
        `The concept I want to explore is: ${description.trim() || "a warm, highly livable custom home with thoughtful architectural details"}.`,
        "Make the four images meaningfully different interpretations while keeping them realistic enough to use as design inspiration. Avoid labels or text inside the images.",
        "Show me the images here first. Do not add anything to House Notes until I have viewed them and selected the images I want to keep.",
      ].join("\n\n");

  async function copyPrompt() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(prompt);
        return true;
      }
      const temporary = document.createElement("textarea");
      temporary.value = prompt;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.appendChild(temporary);
      temporary.select();
      const copied = document.execCommand("copy");
      temporary.remove();
      return copied;
    } catch {
      return false;
    }
  }

  async function continueInChatGPT() {
    const chatWindow = window.open("https://chatgpt.com/", "_blank", "noopener,noreferrer");
    const copied = await copyPrompt();
    if (!copied) {
      setCopyFailed(true);
      setNotice("Copy was blocked. The request is available to select below.");
      return;
    }
    setNotice(chatWindow
      ? "Request copied. Open this House Notes chat and paste it."
      : "Request copied. Open ChatGPT and paste it into this House Notes chat.");
    onClose();
  }

  return (
    <div className="handoff-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="handoff-dialog" role="dialog" aria-modal="true" aria-labelledby="handoff-title">
        <button type="button" className="handoff-close" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">ChatGPT handoff</p>
        <h2 id="handoff-title">{mode === "ideas" ? "Dream up a new idea batch" : "Generate design images"}</h2>
        <p className="handoff-explanation">
          {mode === "ideas"
            ? "This asks ChatGPT for import-ready JSON. Copy its reply, return to Browse ideas, and choose Import AI batch."
            : "This prepares a tailored request and opens ChatGPT. Choose this House Notes chat there, then paste the copied request."}
        </p>
        <label className="handoff-description">
          <span>{mode === "ideas" ? "Focus, quantity, or constraints (optional)" : "Describe what you want to see"}</span>
          <textarea
            ref={descriptionInput}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={mode === "ideas"
              ? "e.g. 40 inexpensive rough-ins for a wooded lot and aging in place"
              : "e.g. a long kitchen under a low roof opening onto a small planted courtyard"}
          />
        </label>
        <details className="handoff-preview" open={copyFailed}>
          <summary>Preview the request</summary>
          <textarea value={prompt} readOnly onFocus={(event) => event.currentTarget.select()} />
        </details>
        <div className="handoff-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button type="button" className="primary-handoff-action" onClick={continueInChatGPT}>
            Copy request &amp; open ChatGPT <span aria-hidden="true">↗</span>
          </button>
        </div>
      </section>
    </div>
  );
}

function BatchImportDialog({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (payload: unknown) => Promise<IdeaBatchImportResult>;
}) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const input = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    input.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isImporting) onClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isImporting, onClose]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    let payload: unknown;
    try {
      payload = parseIdeaBatchJson(value);
    } catch {
      setError("I could not find a valid JSON object or array in that text. Copy the complete AI reply and try again.");
      return;
    }

    setIsImporting(true);
    try {
      await onImport(payload);
      onClose();
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "That batch could not be imported.");
      setIsImporting(false);
    }
  }

  return (
    <div className="handoff-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !isImporting) onClose(); }}>
      <section className="handoff-dialog batch-import-dialog" role="dialog" aria-modal="true" aria-labelledby="batch-import-title">
        <button type="button" className="handoff-close" onClick={onClose} disabled={isImporting} aria-label="Close">×</button>
        <p className="eyebrow">AI batch import</p>
        <h2 id="batch-import-title">Add ideas to Browse</h2>
        <p className="handoff-explanation">
          Paste JSON made by ChatGPT or another AI. Imported ideas stay unsaved until you choose to keep them.
        </p>
        <form onSubmit={submit}>
          <label className="handoff-description batch-import-field">
            <span>Idea batch JSON</span>
            <textarea
              ref={input}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder={IDEA_BATCH_EXAMPLE}
              spellCheck={false}
            />
          </label>
          <details className="handoff-preview batch-format-preview">
            <summary>Show the required format and categories</summary>
            <pre>{IDEA_BATCH_EXAMPLE}</pre>
            <p>Categories: {CATEGORIES.join("; ")}</p>
          </details>
          {error && <p className="batch-import-error" role="alert">{error}</p>}
          <div className="handoff-actions">
            <button type="button" onClick={onClose} disabled={isImporting}>Cancel</button>
            <button type="submit" className="primary-handoff-action" disabled={isImporting || !value.trim()}>
              {isImporting ? "Importing..." : "Import to Browse ideas"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

function parseIdeaBatchJson(value: string): unknown {
  const trimmed = value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    return JSON.parse(trimmed);
  } catch {
    const objectStart = trimmed.indexOf("{");
    const arrayStart = trimmed.indexOf("[");
    const starts = [objectStart, arrayStart].filter((index) => index >= 0);
    if (!starts.length) throw new Error("No JSON found");

    const start = Math.min(...starts);
    const opening = trimmed[start];
    const end = opening === "{" ? trimmed.lastIndexOf("}") : trimmed.lastIndexOf("]");
    if (end <= start) throw new Error("Incomplete JSON");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
