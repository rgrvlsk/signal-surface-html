import { render } from "preact";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

const statusMeta = {
  pending: { label: "Pending", icon: "circle" },
  approved: { label: "Approved", icon: "check" },
  rejected: { label: "Rejected", icon: "x" },
  deferred: { label: "Deferred", icon: "clock" },
  needs_change: { label: "Needs change", icon: "edit" }
};

const shortcutCatalog = {
  prompt: { hint: "P", aria: "P", label: "Prompt" },
  copy: { hint: "C", aria: "C", label: "Copy" },
  help: { hint: "?", aria: "?", label: "Keys" },
  close: { hint: "Esc", aria: "Escape", label: "Close" },
  addItem: { hint: "N", aria: "N", label: "New item" },
  sections: { hint: "1-9", aria: "1 2 3 4 5 6 7 8 9", label: "Section" },
  cardNext: { hint: "J", aria: "J", label: "Next card" },
  cardPrevious: { hint: "K", aria: "K", label: "Prev card" },
  moveCardDown: { hint: "⇧J", aria: "Shift+J", label: "Move down" },
  moveCardUp: { hint: "⇧K", aria: "Shift+K", label: "Move up" },
  approve: { hint: "A", aria: "A", label: "Approve" },
  reject: { hint: "R", aria: "R", label: "Reject" },
  defer: { hint: "D", aria: "D", label: "Defer" },
  change: { hint: "E", aria: "E", label: "Needs change" }
};

const statusShortcuts = {
  approved: shortcutCatalog.approve,
  rejected: shortcutCatalog.reject,
  deferred: shortcutCatalog.defer,
  needs_change: shortcutCatalog.change
};

const themeStorageKey = "surface-signal-html-theme";
const themeOptions = [
  { value: "auto", label: "Auto", icon: "auto" },
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "light", label: "Light", icon: "sun" }
];
const themeValues = themeOptions.map((option) => option.value);
let runtimeIcons = {};

export function mountSurface(data) {
  runtimeIcons = data.icons || {};
  render(<Surface initial={data} />, document.getElementById("app"));
}

function Surface({ initial }) {
  const [documentState, setDocumentState] = useState(initial.document || { sections: [] });
  const [comments, setComments] = useState({});
  const [activeSection, setActiveSection] = useState(documentState.sections?.[0]?.id || "");
  const [activeItemId, setActiveItemId] = useState("");
  const [nextAction, setNextAction] = useState("Revise the source project using the selected decisions and comments, then rebuild the artifact.");
  const [themePreference, setThemePreference] = useState(readThemePreference);
  const [resolvedTheme, setResolvedTheme] = useState(() => resolveTheme(readThemePreference()));
  const [promptOpen, setPromptOpen] = useState(false);
  const [selectPromptOnOpen, setSelectPromptOnOpen] = useState(false);
  const [shortcutOpen, setShortcutOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const promptRef = useRef(null);
  const surface = initial.surface || {};
  const capabilities = surface.capabilities || {};
  const sections = documentState.sections || [];
  const activeIndex = Math.max(0, sections.findIndex((section) => section.id === activeSection));
  const active = sections[activeIndex] || sections[0];
  const activeItems = active?.items || [];
  const activeItemIndex = Math.max(0, activeItems.findIndex((item) => item.id === activeItemId));
  const activeItem = activeItems[activeItemIndex] || activeItems[0];
  const promptText = useMemo(
    () => buildPrompt({ surface, documentState, comments, nextAction }),
    [surface, documentState, comments, nextAction]
  );

  useEffect(() => {
    const media = window.matchMedia?.("(prefers-color-scheme: light)");
    const updateTheme = () => {
      const next = resolveTheme(themePreference);
      setResolvedTheme(next);
      document.documentElement.dataset.theme = next;
      document.documentElement.dataset.themePreference = themePreference;
    };

    updateTheme();
    writeThemePreference(themePreference);

    if (themePreference === "auto" && media) {
      media.addEventListener?.("change", updateTheme);
      return () => media.removeEventListener?.("change", updateTheme);
    }
  }, [themePreference]);

  useEffect(() => {
    if (!activeItems.length) {
      if (activeItemId) {
        setActiveItemId("");
      }
      return;
    }

    if (!activeItems.some((item) => item.id === activeItemId)) {
      setActiveItemId(activeItems[0].id);
    }
  }, [activeItemId, activeItems]);

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.defaultPrevented) {
        return;
      }

      if (isTypingTarget(event.target)) {
        return;
      }

      if (event.key === "Escape") {
        if (promptOpen || shortcutOpen) {
          event.preventDefault();
          setPromptOpen(false);
          setShortcutOpen(false);
        }
        return;
      }

      const key = event.key.toLowerCase();
      if (key === "?") {
        event.preventDefault();
        setShortcutOpen((value) => !value);
      } else if (key === "p") {
        event.preventDefault();
        setPromptOpen((value) => !value);
      } else if (key === "c") {
        event.preventDefault();
        copyPrompt();
      } else if (key === "n" && capabilities.addRemoveItems && active) {
        event.preventDefault();
        addItem(active.id);
      } else if (key === "j" && activeItem) {
        event.preventDefault();
        if (event.shiftKey && capabilities.reorderItems) {
          moveItem(active.id, activeItem.id, 1);
        } else {
          selectItem(activeItemIndex + 1);
        }
      } else if (key === "k" && activeItem) {
        event.preventDefault();
        if (event.shiftKey && capabilities.reorderItems) {
          moveItem(active.id, activeItem.id, -1);
        } else {
          selectItem(activeItemIndex - 1);
        }
      } else if (capabilities.decisions && activeItem && statusShortcutForKey(key)) {
        event.preventDefault();
        updateItem(active.id, activeItem.id, { status: statusShortcutForKey(key) });
      } else if (/^[1-9]$/.test(key)) {
        const index = Number(key) - 1;
        if (sections[index]) {
          event.preventDefault();
          selectSection(index);
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    active,
    activeItem,
    activeItemIndex,
    capabilities.addRemoveItems,
    capabilities.decisions,
    capabilities.reorderItems,
    promptOpen,
    sections,
    shortcutOpen,
    promptText
  ]);

  useEffect(() => {
    if (promptOpen && selectPromptOnOpen) {
      requestAnimationFrame(() => {
        selectPromptText();
        setSelectPromptOnOpen(false);
      });
    }
  }, [promptOpen, selectPromptOnOpen, promptText]);

  function changeTheme(preference) {
    const next = resolveTheme(preference);
    setThemePreference(preference);
    setResolvedTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePreference = preference;
    writeThemePreference(preference);
  }

  function selectSection(index) {
    if (!sections.length) {
      return;
    }
    const bounded = Math.max(0, Math.min(sections.length - 1, index));
    setActiveSection(sections[bounded].id);
  }

  function selectItem(index) {
    if (!activeItems.length) {
      return;
    }
    const bounded = Math.max(0, Math.min(activeItems.length - 1, index));
    setActiveItemId(activeItems[bounded].id);
  }

  function patchSection(sectionId, patcher) {
    setDocumentState((current) => ({
      ...current,
      sections: (current.sections || []).map((section) => (
        section.id === sectionId ? patcher(section) : section
      ))
    }));
  }

  function updateBlock(sectionId, blockId, body) {
    patchSection(sectionId, (section) => ({
      ...section,
      blocks: (section.blocks || []).map((block) => block.id === blockId ? { ...block, body } : block)
    }));
  }

  function updateItem(sectionId, itemId, patch) {
    patchSection(sectionId, (section) => ({
      ...section,
      items: (section.items || []).map((item) => item.id === itemId ? { ...item, ...patch } : item)
    }));
  }

  function addItem(sectionId) {
    const id = `${sectionId}-item-${Date.now()}`;
    patchSection(sectionId, (section) => ({
      ...section,
      items: [
        ...(section.items || []),
        {
          id,
          title: "New item",
          body: "",
          status: "pending",
          impact: ""
        }
      ]
    }));
    setActiveItemId(id);
  }

  function removeItem(sectionId, itemId) {
    const items = sections.find((section) => section.id === sectionId)?.items || [];
    const index = items.findIndex((item) => item.id === itemId);
    const nextItem = items[index + 1] || items[index - 1];

    patchSection(sectionId, (section) => ({
      ...section,
      items: (section.items || []).filter((item) => item.id !== itemId)
    }));

    if (activeItemId === itemId) {
      setActiveItemId(nextItem?.id || "");
    }
  }

  function moveItem(sectionId, itemId, direction) {
    patchSection(sectionId, (section) => {
      const items = [...(section.items || [])];
      const index = items.findIndex((item) => item.id === itemId);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
        return section;
      }
      const [item] = items.splice(index, 1);
      items.splice(nextIndex, 0, item);
      return { ...section, items };
    });
  }

  function addComment(targetId, text) {
    const clean = text.trim();
    if (!clean) {
      return;
    }
    setComments((current) => ({
      ...current,
      [targetId]: [
        ...(current[targetId] || []),
        {
          id: `${targetId}-comment-${Date.now()}`,
          text: clean,
          createdAt: new Date().toISOString()
        }
      ]
    }));
  }

  function openPrompt(selectText = false) {
    if (selectText) {
      setSelectPromptOnOpen(true);
    }
    setPromptOpen(true);
  }

  function selectPromptText() {
    promptRef.current?.focus();
    promptRef.current?.select();
  }

  async function copyPrompt() {
    setCopyStatus("");
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(promptText);
        setCopyStatus("Copied");
        window.setTimeout(() => setCopyStatus(""), 1800);
        return;
      } catch {
        setCopyStatus("Select and copy");
      }
    } else {
      setCopyStatus("Select and copy");
    }
    openPrompt(true);
  }

  return (
    <div class="surface-shell">
      <aside class="surface-nav">
        <div class="brand">
          <span class="brand-mark" aria-hidden="true">S</span>
          <div>
            <strong>Surface Signal HTML</strong>
            <span>{surface.artifactType || "artifact"}</span>
          </div>
        </div>
        <nav aria-label="Sections">
          {sections.map((section, index) => (
            <button
              key={section.id}
              class={section.id === active?.id ? "nav-item active" : "nav-item"}
              type="button"
              onClick={() => setActiveSection(section.id)}
            >
              <span>{index + 1}. {section.title}</span>
              <b>{(section.items || []).length}</b>
            </button>
          ))}
        </nav>
      </aside>

      <main class="surface-main">
        <header class="surface-header">
          <div class="title-group">
            <h1>{surface.title || "Surface Signal HTML"}</h1>
            {surface.summary && <p>{surface.summary}</p>}
          </div>
          <div class="header-tools">
            <ThemeSwitch
              preference={themePreference}
              resolved={resolvedTheme}
              onChange={changeTheme}
            />
            <ActionButton type="button" icon="panel" shortcut={shortcutCatalog.prompt} onClick={() => openPrompt(false)}>
              Prompt
            </ActionButton>
            <ActionButton className="primary" type="button" icon="copy" shortcut={shortcutCatalog.copy} onClick={copyPrompt}>
              Copy
            </ActionButton>
          </div>
          <dl class="surface-meta">
            <div><dt>Artifact</dt><dd>{surface.artifactId || "n/a"}</dd></div>
            <div><dt>Hash</dt><dd>{surface.sourceHash || "n/a"}</dd></div>
            <div><dt>Generated</dt><dd>{surface.generatedAt || "n/a"}</dd></div>
            <div><dt>Project</dt><dd>{surface.projectRoot || "n/a"}</dd></div>
          </dl>
        </header>

        {active ? (
          <section class="content-section" aria-labelledby={`${active.id}-title`}>
            <div class="section-title">
              <h2 id={`${active.id}-title`}>{active.title}</h2>
              {capabilities.addRemoveItems && (
                <ActionButton className="secondary" type="button" icon="plus" shortcut={shortcutCatalog.addItem} onClick={() => addItem(active.id)}>
                  Add item
                </ActionButton>
              )}
            </div>

            {(active.blocks || []).map((block) => (
              <article class="text-block" key={block.id}>
                {block.title && <h3>{block.title}</h3>}
                {capabilities.editText ? (
                  <textarea
                    value={block.body}
                    onInput={(event) => updateBlock(active.id, block.id, event.currentTarget.value)}
                    aria-label={block.title || "Editable block"}
                  />
                ) : (
                  <p>{block.body}</p>
                )}
                {capabilities.comments && <CommentBox targetId={block.id} comments={comments[block.id]} onAdd={addComment} />}
              </article>
            ))}

            <div class="item-list">
              {(active.items || []).map((item) => {
                const isActiveItem = item.id === activeItem?.id;

                return (
                <article
                  class={`decision-item status-${item.status || "pending"} ${isActiveItem ? "active-card" : ""}`}
                  key={item.id}
                  tabIndex={0}
                  aria-current={isActiveItem ? "true" : undefined}
                  onClick={() => setActiveItemId(item.id)}
                  onFocus={() => setActiveItemId(item.id)}
                >
                  <div class="item-head">
                    <div>
                      <h3>{item.title}</h3>
                      {item.impact && <p>{item.impact}</p>}
                    </div>
                    <span class="status-badge">
                      <Icon name={statusMeta[item.status]?.icon || "circle"} />
                      {statusMeta[item.status]?.label || item.status || "Pending"}
                    </span>
                  </div>
                  {capabilities.editText ? (
                    <textarea
                      value={item.body}
                      onInput={(event) => updateItem(active.id, item.id, { body: event.currentTarget.value })}
                      aria-label={`${item.title} body`}
                    />
                  ) : (
                    <p>{item.body}</p>
                  )}
                  {item.details && (
                    <details>
                      <summary>Details</summary>
                      <pre>{item.details}</pre>
                    </details>
                  )}
                  <div class="item-actions">
                    {capabilities.decisions && Object.entries(statusMeta).map(([status, meta]) => (
                      <ActionButton
                        key={status}
                        type="button"
                        icon={meta.icon}
                        shortcut={isActiveItem ? statusShortcuts[status] : null}
                        onClick={() => updateItem(active.id, item.id, { status })}
                      >
                        {meta.label}
                      </ActionButton>
                    ))}
                    {capabilities.reorderItems && (
                      <>
                        <ActionButton
                          type="button"
                          icon="arrow-up"
                          shortcut={isActiveItem ? shortcutCatalog.moveCardUp : null}
                          onClick={() => moveItem(active.id, item.id, -1)}
                        >
                          Up
                        </ActionButton>
                        <ActionButton
                          type="button"
                          icon="arrow-down"
                          shortcut={isActiveItem ? shortcutCatalog.moveCardDown : null}
                          onClick={() => moveItem(active.id, item.id, 1)}
                        >
                          Down
                        </ActionButton>
                      </>
                    )}
                    {capabilities.addRemoveItems && (
                      <ActionButton type="button" icon="trash" onClick={() => removeItem(active.id, item.id)}>
                        Remove
                      </ActionButton>
                    )}
                  </div>
                  {capabilities.comments && <CommentBox targetId={item.id} comments={comments[item.id]} onAdd={addComment} />}
                </article>
                );
              })}
            </div>
          </section>
        ) : (
          <section class="empty-state">No sections found.</section>
        )}
      </main>

      <PromptDrawer
        open={promptOpen}
        promptRef={promptRef}
        promptText={promptText}
        nextAction={nextAction}
        copyStatus={copyStatus}
        onClose={() => setPromptOpen(false)}
        onCopy={copyPrompt}
        onNextAction={setNextAction}
        onSelect={selectPromptText}
      />

      <ShortcutLegend
        open={shortcutOpen}
        capabilities={capabilities}
        onToggle={() => setShortcutOpen((value) => !value)}
      />
    </div>
  );
}

function ThemeSwitch({ preference, resolved, onChange }) {
  return (
    <div class="theme-switch" role="group" aria-label={`Theme, currently ${preference === "auto" ? `auto ${resolved}` : preference}`}>
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          class={preference === option.value ? "theme-option active" : "theme-option"}
          data-icon={option.icon}
          onClick={() => onChange(option.value)}
          aria-pressed={preference === option.value}
          title={`${option.label} theme`}
        >
          <Icon name={option.icon} />
          <span class="button-label">{option.label}</span>
        </button>
      ))}
    </div>
  );
}

function ActionButton({ children, className = "", icon, shortcut, title, ...props }) {
  const classes = ["action-button", className].filter(Boolean).join(" ");
  const label = typeof children === "string" ? children : title;
  return (
    <button
      {...props}
      class={classes}
      data-icon={icon || ""}
      aria-keyshortcuts={shortcut?.aria}
      title={title || label || ""}
    >
      {icon && <Icon name={icon} />}
      <span class="button-label">{children}</span>
      {shortcut && <kbd class="shortcut-hint" aria-hidden="true">{shortcut.hint}</kbd>}
    </button>
  );
}

function Icon({ name }) {
  const svg = runtimeIcons.svg?.[name];

  if (svg) {
    return (
      <span
        class="action-icon-host"
        data-icon-source={runtimeIcons.provider?.name || "inline"}
        data-icon-name={name}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
    );
  }

  const paths = {
    plus: ["M8 3.25v9.5", "M3.25 8h9.5"],
    copy: ["M6 5.25h6.25v7H6z", "M3.75 10.75V3.75h6.5"],
    panel: ["M3 4h10v8H3z", "M5 6h6", "M5 8h4"],
    close: ["M4.25 4.25l7.5 7.5", "M11.75 4.25l-7.5 7.5"],
    check: ["M3.5 8.25l3 3 6-6.5"],
    x: ["M4.25 4.25l7.5 7.5", "M11.75 4.25l-7.5 7.5"],
    circle: ["M8 3.75a4.25 4.25 0 1 0 0 8.5 4.25 4.25 0 0 0 0-8.5z"],
    clock: ["M8 3.5a4.5 4.5 0 1 0 0 9 4.5 4.5 0 0 0 0-9z", "M8 5.75V8.4l1.9 1.1"],
    edit: ["M4 11.75l2.6-.55 5.15-5.15-2.05-2.05-5.15 5.15z", "M8.95 4.75l2.05 2.05"],
    "arrow-up": ["M8 12V4", "M4.75 7.25 8 4l3.25 3.25"],
    "arrow-down": ["M8 4v8", "M4.75 8.75 8 12l3.25-3.25"],
    trash: ["M4.25 5h7.5", "M6 5V3.75h4V5", "M5.25 5l.45 7.25h4.6L10.75 5"],
    auto: ["M8 3.25a4.75 4.75 0 0 1 0 9.5z", "M8 3.25a4.75 4.75 0 1 0 0 9.5"],
    moon: ["M11.75 10.25A4.75 4.75 0 0 1 5.75 4a5.25 5.25 0 1 0 6 6.25z"],
    sun: ["M8 4.5v-1", "M8 12.5v-1", "M4.5 8h-1", "M12.5 8h-1", "M5.5 5.5l-.7-.7", "M11.2 11.2l-.7-.7", "M10.5 5.5l.7-.7", "M4.8 11.2l.7-.7", "M8 5.75a2.25 2.25 0 1 0 0 4.5 2.25 2.25 0 0 0 0-4.5z"]
  };

  return (
    <svg class="action-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
      {(paths[name] || paths.circle).map((path, index) => <path key={`${name}-${index}`} d={path} />)}
    </svg>
  );
}

function PromptDrawer({ open, promptRef, promptText, nextAction, copyStatus, onClose, onCopy, onNextAction, onSelect }) {
  if (!open) {
    return null;
  }

  return (
    <>
      <button class="drawer-backdrop" type="button" aria-label="Close prompt" onClick={onClose} />
      <aside class="prompt-drawer" aria-label="Agent prompt">
        <div class="drawer-head">
          <h2>Agent prompt</h2>
          <ActionButton type="button" icon="close" shortcut={shortcutCatalog.close} onClick={onClose}>
            Close
          </ActionButton>
        </div>
        <label>
          Next action
          <textarea value={nextAction} onInput={(event) => onNextAction(event.currentTarget.value)} />
        </label>
        <textarea
          ref={promptRef}
          class="prompt-output"
          value={promptText}
          readOnly
          onFocus={onSelect}
          onClick={onSelect}
          aria-label="Prompt text"
        />
        <div class="drawer-actions">
          <ActionButton className="primary" type="button" icon="copy" shortcut={shortcutCatalog.copy} onClick={onCopy}>
            Copy
          </ActionButton>
          {copyStatus && <span role="status">{copyStatus}</span>}
        </div>
      </aside>
    </>
  );
}

function ShortcutLegend({ open, capabilities, onToggle }) {
  return (
    <div class="shortcut-legend">
      <button type="button" class="legend-toggle" onClick={onToggle} aria-expanded={open} aria-label="Keyboard shortcuts">?</button>
      {open && (
        <div class="legend-panel" role="status">
          <ShortcutLegendRow shortcut={shortcutCatalog.sections} />
          <ShortcutLegendRow shortcuts={[shortcutCatalog.cardNext, shortcutCatalog.cardPrevious]} label="Cards" />
          {capabilities.decisions && (
            <ShortcutLegendRow
              shortcuts={[shortcutCatalog.approve, shortcutCatalog.reject, shortcutCatalog.defer, shortcutCatalog.change]}
              label="Active card"
            />
          )}
          {capabilities.reorderItems && (
            <ShortcutLegendRow shortcuts={[shortcutCatalog.moveCardUp, shortcutCatalog.moveCardDown]} label="Reorder" />
          )}
          {capabilities.addRemoveItems && <ShortcutLegendRow shortcut={shortcutCatalog.addItem} />}
          <ShortcutLegendRow shortcut={shortcutCatalog.prompt} />
          <ShortcutLegendRow shortcut={shortcutCatalog.copy} />
          <ShortcutLegendRow shortcut={shortcutCatalog.help} />
          <ShortcutLegendRow shortcut={shortcutCatalog.close} />
        </div>
      )}
    </div>
  );
}

function ShortcutLegendRow({ shortcut, shortcuts, label }) {
  const items = shortcuts || [shortcut];
  return (
    <div>
      <span class="key-group">{items.map((item) => <kbd key={item.hint}>{item.hint}</kbd>)}</span>
      <span>{label || shortcut.label}</span>
    </div>
  );
}

function CommentBox({ targetId, comments = [], onAdd }) {
  const [value, setValue] = useState("");
  return (
    <div class="comments">
      {comments.length > 0 && (
        <ul>
          {comments.map((comment) => <li key={comment.id}>{comment.text}</li>)}
        </ul>
      )}
      <form
        class="comment-row"
        onSubmit={(event) => {
          event.preventDefault();
          onAdd(targetId, value);
          setValue("");
        }}
      >
        <input
          value={value}
          onInput={(event) => setValue(event.currentTarget.value)}
          placeholder="Add comment"
          aria-label={`Comment for ${targetId}`}
        />
        <ActionButton type="submit" icon="plus">Add</ActionButton>
      </form>
    </div>
  );
}

function buildPrompt({ surface, documentState, comments, nextAction }) {
  const payload = {
    artifactId: surface.artifactId,
    artifactType: surface.artifactType,
    title: surface.title,
    sourceProjectPath: surface.projectRoot,
    sourceHash: surface.sourceHash,
    generatedAt: surface.generatedAt,
    freshSessionContext: surface.freshSessionContext,
    sourceRule: "Edit src/, surface.json, or feedback/ in the source project and rebuild. Do not edit dist/index.html.",
    document: documentState,
    comments,
    nextAction
  };

  return [
    "Surface Signal HTML response. This is self-contained for a fresh agent session.",
    "",
    `Artifact: ${surface.artifactId || "n/a"} (${surface.artifactType || "unknown"})`,
    `Source project: ${surface.projectRoot || "n/a"}`,
    `Source hash: ${surface.sourceHash || "n/a"}`,
    "",
    "Instruction:",
    nextAction,
    "",
    "SIGNAL_SURFACE_FEEDBACK_START",
    JSON.stringify(payload, null, 2),
    "SIGNAL_SURFACE_FEEDBACK_END"
  ].join("\n");
}

function readThemePreference() {
  try {
    const stored = window.localStorage?.getItem(themeStorageKey);
    return themeValues.includes(stored) ? stored : "auto";
  } catch {
    return "auto";
  }
}

function writeThemePreference(preference) {
  try {
    window.localStorage?.setItem(themeStorageKey, preference);
  } catch {
    return;
  }
}

function resolveTheme(preference) {
  if (preference === "light" || preference === "dark") {
    return preference;
  }
  try {
    return window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

function statusShortcutForKey(key) {
  return Object.entries(statusShortcuts).find(([, shortcut]) => shortcut.hint.toLowerCase() === key)?.[0];
}

function isTypingTarget(target) {
  if (!target || !(target instanceof HTMLElement)) {
    return false;
  }
  const tag = target.tagName.toLowerCase();
  return tag === "input" || tag === "textarea" || tag === "select" || target.isContentEditable;
}
