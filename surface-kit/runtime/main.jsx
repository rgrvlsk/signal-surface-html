import { render } from "preact";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "preact/hooks";

const statusMeta = {
  pending: { label: "Awaiting review", icon: "circle" },
  approved: { label: "Approved", actionLabel: "Approve", icon: "check" },
  rejected: { label: "Rejected", actionLabel: "Reject", icon: "x" },
  deferred: { label: "Deferred", actionLabel: "Defer", icon: "clock" },
  needs_change: { label: "Needs changes", actionLabel: "Request changes", icon: "edit" }
};

const reviewActionStatuses = ["approved", "rejected", "deferred", "needs_change"];

const shortcutCatalog = {
  prompt: { hint: "P", aria: "P", label: "Prompt" },
  copy: { hint: "C", aria: "C", label: "Copy" },
  help: { hint: "?", aria: "?", label: "Keys" },
  close: { hint: "Esc", aria: "Escape", label: "Close" },
  addItem: { hint: "N", aria: "N", label: "New item" },
  sections: { hint: "1-9", aria: "1 2 3 4 5 6 7 8 9", label: "Section" },
  cardNext: { hint: "J", aria: "J", label: "Next block" },
  cardPrevious: { hint: "K", aria: "K", label: "Prev block" },
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
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "light", label: "Light", icon: "sun" }
];
const themeValues = themeOptions.map((option) => option.value);
const skillTitles = {
  "adr-navigator": "ADR Navigator",
  "feature-storyboard": "Feature Storyboard",
  "keynote-canvas": "Keynote Canvas",
  "migration-map": "Migration Map",
  "plan-studio": "Plan Studio",
  "qa-triage-wall": "QA Triage Wall",
  "research-atlas": "Research Atlas",
  "risk-radar": "Risk Radar",
  "roadmap-council": "Roadmap Council",
  "verdict-rundown": "Verdict Rundown"
};
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
  const [superKeyActive, setSuperKeyActive] = useState(false);
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
  const isPlanStudio = surface.artifactType === "plan-studio";
  const skillTitle = skillTitleForArtifact(surface.artifactType);
  const promptText = useMemo(
    () => buildPrompt({ surface, documentState, comments, nextAction }),
    [surface, documentState, comments, nextAction]
  );

  useEffect(() => {
    const next = resolveTheme(themePreference);
    setResolvedTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.themePreference = themePreference;
    writeThemePreference(themePreference);
  }, [themePreference]);

  useEffect(() => {
    function syncSuperKey(event) {
      setSuperKeyActive(Boolean(event.metaKey || event.ctrlKey));
    }

    function clearSuperKey() {
      setSuperKeyActive(false);
    }

    window.addEventListener("keydown", syncSuperKey);
    window.addEventListener("keyup", syncSuperKey);
    window.addEventListener("blur", clearSuperKey);
    return () => {
      window.removeEventListener("keydown", syncSuperKey);
      window.removeEventListener("keyup", syncSuperKey);
      window.removeEventListener("blur", clearSuperKey);
    };
  }, []);

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
        selectItem(activeItemIndex + 1);
      } else if (key === "k" && activeItem) {
        event.preventDefault();
        selectItem(activeItemIndex - 1);
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

  function updateBlock(sectionId, blockId, patch) {
    const nextPatch = typeof patch === "string" ? { body: patch } : patch;
    patchSection(sectionId, (section) => ({
      ...section,
      blocks: (section.blocks || []).map((block) => block.id === blockId ? { ...block, ...nextPatch } : block)
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

  function upsertComment(targetId, commentId, text, options = {}) {
    const clean = text.trim();
    setComments((current) => {
      const existing = current[targetId] || [];

      if (!clean && !options.keepEmpty) {
        return {
          ...current,
          [targetId]: existing.filter((comment) => comment.id !== commentId)
        };
      }

      const nextComment = {
        id: commentId,
        text: clean,
        createdAt: existing.find((comment) => comment.id === commentId)?.createdAt || new Date().toISOString()
      };
      const hasExisting = existing.some((comment) => comment.id === commentId);

      if (!hasExisting && options.afterId) {
        const afterIndex = existing.findIndex((comment) => comment.id === options.afterId);
        const nextComments = [...existing];
        nextComments.splice(afterIndex >= 0 ? afterIndex + 1 : existing.length, 0, nextComment);
        return {
          ...current,
          [targetId]: nextComments
        };
      }

      return {
        ...current,
        [targetId]: hasExisting
          ? existing.map((comment) => comment.id === commentId ? nextComment : comment)
          : [...existing, nextComment]
      };
    });
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
          <span class="brand-mark">
            <BrandIcon />
          </span>
          <div>
            <strong>Surface Signal HTML</strong>
            <span>{skillTitle}</span>
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
        </header>

        {sections.length ? (
          isPlanStudio ? (
            <PlanStudioDocument
              sections={sections}
              capabilities={capabilities}
              activeItem={activeItem}
              comments={comments}
              onSelectSection={setActiveSection}
              onSelectItem={setActiveItemId}
              onUpdateBlock={updateBlock}
              onUpdateItem={updateItem}
              onAddItem={addItem}
              onChangeComment={upsertComment}
              showShortcutBadges={shortcutOpen || superKeyActive}
            />
          ) : active ? (
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
                {capabilities.comments && <CommentBox targetId={block.id} comments={comments[block.id]} onChange={upsertComment} />}
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
                    {capabilities.decisions && (
                      <DecisionActions
                        isActive={isActiveItem}
                        onSelect={(status) => updateItem(active.id, item.id, { status })}
                      />
                    )}
                  </div>
                  {capabilities.comments && <CommentBox targetId={item.id} comments={comments[item.id]} onChange={upsertComment} />}
                </article>
                );
              })}
            </div>
          </section>
          ) : (
            <section class="empty-state">No sections found.</section>
          )
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

function PlanStudioDocument({
  sections,
  capabilities,
  activeItem,
  comments,
  onSelectSection,
  onSelectItem,
  onUpdateBlock,
  onUpdateItem,
  onAddItem,
  onChangeComment,
  showShortcutBadges
}) {
  return (
    <div class="plan-document">
      {sections.map((section, sectionIndex) => {
        const blockCount = (section.blocks || []).length + (section.items || []).length;

        return (
          <details
            class={`doc-section section-tone-${sectionIndex % 5}`}
            key={section.id}
            open
            onToggle={() => onSelectSection(section.id)}
          >
            <summary class="doc-section-summary">
              <span class="doc-section-number">{sectionIndex + 1}</span>
              <span class="doc-section-title">
                <strong>{section.title}</strong>
                <span>{blockCount} {blockCount === 1 ? "block" : "blocks"}</span>
              </span>
              {capabilities.addRemoveItems && (
                <ActionButton
                  className="doc-section-action icon-button-round"
                  type="button"
                  icon="plus"
                  shortcut={shortcutCatalog.addItem}
                  title="Add block"
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectSection(section.id);
                    onAddItem(section.id);
                  }}
                >
                  Add block
                </ActionButton>
              )}
            </summary>

            <div class="doc-section-body">
              {(section.blocks || []).map((block) => (
                <article class="doc-block text-doc-block" key={block.id}>
                  <div class="doc-block-head">
                    {block.title && (
                      capabilities.editText ? (
                        <EditableText
                          as="h3"
                          className="doc-editable doc-editable-title"
                          value={block.title}
                          singleLine
                          ariaLabel={`${block.title} title`}
                          onInput={(title) => onUpdateBlock(section.id, block.id, { title })}
                        />
                      ) : (
                        <h3>{block.title}</h3>
                      )
                    )}
                  </div>
                  {capabilities.editText ? (
                    <BodyEditor
                      value={block.body}
                      ariaLabel={block.title || "Editable block"}
                      onInput={(body) => onUpdateBlock(section.id, block.id, { body })}
                    />
                  ) : (
                    <p>{block.body}</p>
                  )}
                  {capabilities.comments && <CommentBox targetId={block.id} comments={comments[block.id]} onChange={onChangeComment} />}
                </article>
              ))}

              {(section.items || []).map((item) => {
                const isActiveItem = item.id === activeItem?.id;
                const selectItem = () => {
                  onSelectSection(section.id);
                  onSelectItem(item.id);
                };

                return (
                  <article
                    class={`doc-block reviewable-block status-${item.status || "pending"} ${isActiveItem ? "active-card" : ""}`}
                    key={item.id}
                    tabIndex={0}
                    aria-current={isActiveItem ? "true" : undefined}
                    onClick={selectItem}
                    onFocus={selectItem}
                  >
                    <div class="doc-block-content">
                      <div class="doc-block-head">
                        <div>
                          {capabilities.editText ? (
                            <EditableText
                              as="h3"
                              className="doc-editable doc-editable-title"
                              value={item.title}
                              singleLine
                              ariaLabel={`${item.title} title`}
                              onInput={(title) => onUpdateItem(section.id, item.id, { title })}
                            />
                          ) : (
                            <h3>{item.title}</h3>
                          )}
                          {(item.impact || capabilities.editText) && (
                            capabilities.editText ? (
                              <EditableText
                                as="p"
                                className="doc-editable doc-editable-summary"
                                value={item.impact || ""}
                                singleLine
                                ariaLabel={`${item.title} summary`}
                                onInput={(impact) => onUpdateItem(section.id, item.id, { impact })}
                              />
                            ) : (
                              <p>{item.impact}</p>
                            )
                          )}
                        </div>
                      </div>

                      {capabilities.editText ? (
                        <BodyEditor
                          value={item.body}
                          ariaLabel={`${item.title} body`}
                          onInput={(body) => onUpdateItem(section.id, item.id, { body })}
                        />
                      ) : (
                        <p>{item.body}</p>
                      )}
                      {item.details && (
                        capabilities.editText ? (
                          <EditableText
                            className="doc-editable doc-editable-details"
                            value={item.details}
                            ariaLabel={`${item.title} details`}
                            onInput={(details) => onUpdateItem(section.id, item.id, { details })}
                          />
                        ) : (
                          <p class="doc-details-text">{item.details}</p>
                        )
                      )}
                    </div>
                    {capabilities.decisions && (
                      <DecisionDock
                        status={item.status}
                        reviewComment={item.reviewComment || ""}
                        isActive={isActiveItem}
                        showShortcutBadges={showShortcutBadges}
                        onActivate={selectItem}
                        onSelect={(status) => onUpdateItem(section.id, item.id, { status })}
                        onSaveComment={(reviewComment) => onUpdateItem(section.id, item.id, { reviewComment })}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          </details>
        );
      })}
    </div>
  );
}

function DecisionDock({
  status = "pending",
  reviewComment = "",
  isActive,
  showShortcutBadges,
  onActivate,
  onSelect,
  onSaveComment
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState(reviewComment);
  const noteInputRef = useRef(null);
  const currentStatus = status || "pending";
  const meta = statusMeta[currentStatus] || statusMeta.pending;
  const showEditor = editorOpen && isActive;

  useEffect(() => {
    if (!isActive && editorOpen) {
      onSaveComment(draft.trim());
      setEditorOpen(false);
    }
  }, [draft, editorOpen, isActive]);

  useEffect(() => {
    if (!editorOpen) {
      setDraft(reviewComment || "");
    }
  }, [editorOpen, reviewComment]);

  useEffect(() => {
    if (showEditor) {
      noteInputRef.current?.focus();
    }
  }, [showEditor]);

  function openEditor(event) {
    event?.stopPropagation();
    onActivate?.();
    setDraft(reviewComment || "");
    setEditorOpen(true);
  }

  function saveComment(event) {
    event.preventDefault();
    onSaveComment(draft.trim());
    setEditorOpen(false);
  }

  return (
    <aside class={`decision-dock decision-${currentStatus} ${isActive ? "decision-active" : "decision-inactive"}`} aria-label="Review decision">
      <div class="decision-status-stack">
        <span class={`decision-status-icon decision-${currentStatus}`} aria-label={meta.label}>
          <Icon name={meta.icon} />
        </span>
        {reviewComment && !showEditor && (
          <button class="decision-note" type="button" onClick={openEditor}>
            {reviewComment}
          </button>
        )}
        {!reviewComment && currentStatus !== "pending" && !showEditor && (
          <button class="decision-note-trigger" type="button" onClick={openEditor}>
            Add note
          </button>
        )}
      </div>
      <div class="decision-dock-actions" aria-label="Review decision actions">
        {reviewActionStatuses.map((nextStatus) => {
          const nextMeta = statusMeta[nextStatus];
          const shortcut = isActive ? statusShortcuts[nextStatus] : null;

          return (
            <button
              class={`decision-round decision-${nextStatus} ${currentStatus === nextStatus ? "selected" : ""}`}
              type="button"
              key={nextStatus}
              aria-label={nextMeta.actionLabel}
              aria-keyshortcuts={shortcut?.aria}
              title={nextMeta.actionLabel}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(nextStatus);
                openEditor();
              }}
            >
              <Icon name={nextMeta.icon} />
              {showShortcutBadges && shortcut && <kbd class="decision-keycap" aria-hidden="true">{shortcut.hint}</kbd>}
            </button>
          );
        })}
      </div>
      {showEditor && (
        <form class="decision-note-form" onSubmit={saveComment}>
          <textarea
            ref={noteInputRef}
            class="decision-note-input"
            rows={3}
            value={draft}
            onClick={(event) => event.stopPropagation()}
            onInput={(event) => setDraft(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                setEditorOpen(false);
              }
            }}
            placeholder="Add note"
            aria-label="Decision note"
            autoFocus
          />
          <button class="decision-note-save" type="submit" aria-label="Save note" title="Save note">
            <Icon name="plus" />
          </button>
        </form>
      )}
    </aside>
  );
}

function BodyEditor({ value, ariaLabel, onInput }) {
  const list = parseListBody(value);

  if (list) {
    return (
      <EditableList
        type={list.type}
        items={list.items}
        ariaLabel={ariaLabel}
        onInput={onInput}
      />
    );
  }

  return (
    <EditableText
      className="doc-editable doc-editable-body"
      value={value}
      ariaLabel={ariaLabel}
      onInput={onInput}
    />
  );
}

function EditableList({ type, items, ariaLabel, onInput }) {
  const [dragIndex, setDragIndex] = useState(null);
  const listClass = type === "ordered" ? "doc-list doc-list-ordered" : "doc-list doc-list-unordered";
  const ListTag = type === "ordered" ? "ol" : "ul";

  function emit(nextItems) {
    onInput(serializeListBody(type, nextItems));
  }

  function updateListItem(index, text) {
    const nextItems = [...items];
    nextItems[index] = text;
    emit(nextItems);
  }

  function removeListItem(index) {
    emit(items.filter((item, itemIndex) => itemIndex !== index));
  }

  function addListItem(event) {
    event.preventDefault();
    event.stopPropagation();
    emit([...items, "New item"]);
  }

  function startDrag(event, index) {
    setDragIndex(index);
    event.dataTransfer?.setData("text/plain", String(index));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "move";
    }
  }

  function dropItem(event, index) {
    event.preventDefault();
    const payload = event.dataTransfer?.getData("text/plain");
    const fromIndex = payload === "" || payload == null ? dragIndex : Number(payload);

    if (fromIndex == null || Number.isNaN(fromIndex)) {
      return;
    }

    emit(moveListItem(items, fromIndex, index));
    setDragIndex(null);
  }

  return (
    <ListTag class={listClass} aria-label={ariaLabel}>
      {items.map((item, index) => (
        <li
          class="doc-list-row"
          draggable
          key={`${type}-${index}`}
          onDragStart={(event) => startDrag(event, index)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => dropItem(event, index)}
          onDragEnd={() => setDragIndex(null)}
        >
          <span class="doc-list-handle" aria-hidden="true" />
          <span class="doc-list-marker" aria-hidden="true">
            {type === "ordered" ? `${index + 1}.` : ""}
          </span>
          <EditableText
            className="doc-editable doc-list-text"
            value={item}
            singleLine
            ariaLabel={`List item ${index + 1}`}
            onInput={(text) => updateListItem(index, text)}
          />
          <button
            class="doc-list-remove"
            type="button"
            aria-label="Remove list item"
            title="Remove list item"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              removeListItem(index);
            }}
          >
            <Icon name="x" />
          </button>
        </li>
      ))}
      <li class="doc-list-add-row">
        <button class="doc-list-add" type="button" onClick={addListItem}>
          <Icon name="plus" />
          Add item
        </button>
      </li>
    </ListTag>
  );
}

function parseListBody(value = "") {
  const lines = String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    return null;
  }

  const isOrdered = lines.every((line) => /^\d+[.)]\s+/.test(line));
  const isUnordered = lines.every((line) => /^[-*]\s+/.test(line));

  if (!isOrdered && !isUnordered) {
    return null;
  }

  const markerPattern = isOrdered ? /^\d+[.)]\s+/ : /^[-*]\s+/;
  return {
    type: isOrdered ? "ordered" : "unordered",
    items: lines.map((line) => line.replace(markerPattern, "").trim()).filter(Boolean)
  };
}

function serializeListBody(type, items) {
  const cleanItems = items.map((item) => String(item || "").trim()).filter(Boolean);

  if (type === "ordered") {
    return cleanItems.map((item, index) => `${index + 1}. ${item}`).join("\n");
  }

  return cleanItems.map((item) => `- ${item}`).join("\n");
}

function moveListItem(items, fromIndex, toIndex) {
  if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= items.length || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function EditableText({
  as: Tag = "div",
  className = "",
  value = "",
  singleLine = false,
  ariaLabel,
  onInput
}) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (readEditableText(node, singleLine) !== (value || "")) {
      node.textContent = value || "";
    }
  }, [singleLine, value]);

  return (
    <Tag
      ref={ref}
      class={className}
      contentEditable
      role="textbox"
      aria-label={ariaLabel}
      aria-multiline={singleLine ? undefined : "true"}
      tabIndex={0}
      suppressContentEditableWarning
      onInput={(event) => onInput(readEditableText(event.currentTarget, singleLine))}
      onKeyDown={(event) => {
        if (singleLine && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    />
  );
}

function readEditableText(node, singleLine) {
  const text = (node.innerText ?? node.textContent ?? "").replace(/\u00a0/g, " ");
  const withoutBrowserTrailingBreak = text.endsWith("\n") ? text.slice(0, -1) : text;
  return singleLine ? withoutBrowserTrailingBreak.replace(/\s*\n\s*/g, " ") : withoutBrowserTrailingBreak;
}

function DecisionActions({ className = "", isActive, onSelect }) {
  const classes = ["review-actions", className].filter(Boolean).join(" ");
  return (
    <div class={classes}>
      {reviewActionStatuses.map((status) => {
        const meta = statusMeta[status];
        return (
          <ActionButton
            key={status}
            type="button"
            icon={meta.icon}
            shortcut={isActive ? statusShortcuts[status] : null}
            onClick={() => onSelect(status)}
          >
            {meta.actionLabel}
          </ActionButton>
        );
      })}
    </div>
  );
}

function ThemeSwitch({ preference, resolved, onChange }) {
  return (
    <div class="theme-switch" role="group" aria-label={`Theme, currently ${resolved}`}>
      {themeOptions.map((option) => (
        <button
          key={option.value}
          type="button"
          class={resolved === option.value ? "theme-option active" : "theme-option"}
          data-icon={option.icon}
          onClick={() => onChange(option.value)}
          aria-label={`${option.label} theme`}
          aria-pressed={resolved === option.value}
          title={`${option.label} theme`}
        >
          <Icon name={option.icon} />
        </button>
      ))}
    </div>
  );
}

function BrandIcon() {
  return (
    <svg class="brand-icon" viewBox="0 0 64 64" role="img" aria-label="Surface Signal" focusable="false">
      <rect width="64" height="64" rx="14" />
      <path class="brand-icon-face" d="M15 44 32 17l17 27H15z" />
      <path class="brand-icon-shade" d="M32 17 49 44H32V17z" />
      <path class="brand-icon-base" d="M16 50h32" />
      <circle class="brand-icon-dot" cx="32" cy="17" r="4" />
    </svg>
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
      title={title || label || shortcut?.label || ""}
    >
      {icon && <Icon name={icon} />}
      <span class="button-label">{children}</span>
      {shortcut && <kbd class="shortcut-hint" aria-hidden="true">{shortcut.hint}</kbd>}
    </button>
  );
}

function skillTitleForArtifact(artifactType) {
  if (skillTitles[artifactType]) {
    return skillTitles[artifactType];
  }

  return String(artifactType || "artifact")
    .split("-")
    .filter(Boolean)
    .map((part) => part.toLowerCase() === "qa" ? "QA" : `${part.slice(0, 1).toUpperCase()}${part.slice(1)}`)
    .join(" ") || "Artifact";
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
      <button type="button" class="legend-toggle" onClick={onToggle} aria-expanded={open} aria-label="Keyboard shortcuts" title="Keyboard shortcuts">?</button>
      {open && (
        <div class="legend-panel" role="status">
          <ShortcutLegendRow shortcut={shortcutCatalog.sections} />
          <ShortcutLegendRow shortcuts={[shortcutCatalog.cardNext, shortcutCatalog.cardPrevious]} label="Blocks" />
          {capabilities.decisions && (
            <ShortcutLegendRow
              shortcuts={[shortcutCatalog.approve, shortcutCatalog.reject, shortcutCatalog.defer, shortcutCatalog.change]}
              label="Active block"
            />
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

function CommentBox({ targetId, comments = [], onChange }) {
  const [draftId, setDraftId] = useState(`${targetId}-comment-${Date.now()}`);
  const listRef = useRef(null);
  const promotedCommentIds = useRef(new Set());
  const pendingFocus = useRef(null);

  useLayoutEffect(() => {
    if (!pendingFocus.current) {
      return;
    }

    const { id, offset } = pendingFocus.current;
    pendingFocus.current = null;
    focusCommentRow(id, offset);
  });

  function handleCommentInput(commentId, text, isPlaceholder = false) {
    onChange(targetId, commentId, text);
    if (isPlaceholder && text.trim() && !promotedCommentIds.current.has(commentId)) {
      promotedCommentIds.current.add(commentId);
      pendingFocus.current = { id: commentId, offset: text.length };
      setDraftId(`${targetId}-comment-${Date.now()}`);
    }
  }

  function handleCommentKeyDown(event, commentId, isPlaceholder = false) {
    if (event.key === "Enter") {
      event.preventDefault();
      const newId = `${targetId}-comment-${Date.now()}`;
      onChange(targetId, newId, "", { keepEmpty: true, afterId: isPlaceholder ? undefined : commentId });
      requestAnimationFrame(() => focusCommentRow(newId, 0));
      return;
    }

    if (event.key === "Backspace" && !readEditableText(event.currentTarget, false).trim()) {
      const previous = previousCommentRow(listRef.current, event.currentTarget);
      if (!previous) {
        return;
      }
      event.preventDefault();
      if (!isPlaceholder) {
        onChange(targetId, commentId, "");
      }
      requestAnimationFrame(() => focusCommentRow(previous, previous.textContent.length));
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      const sibling = event.key === "ArrowUp"
        ? previousCommentRow(listRef.current, event.currentTarget)
        : nextCommentRow(listRef.current, event.currentTarget);
      if (!sibling) {
        return;
      }
      event.preventDefault();
      focusCommentRow(sibling, getCaretOffset(event.currentTarget));
    }
  }

  const commentRows = [
    ...comments.map((comment) => (
      <EditableComment
        key={comment.id}
        id={comment.id}
        value={comment.text}
        ariaLabel={`Comment for ${targetId}`}
        onInput={(text) => handleCommentInput(comment.id, text)}
        onKeyDown={(event) => handleCommentKeyDown(event, comment.id)}
        onBlur={(text) => {
          if (!text.trim()) {
            onChange(targetId, comment.id, "");
          }
        }}
      />
    )),
    <EditableComment
      key={draftId}
      id={draftId}
      className="is-placeholder"
      value=""
      placeholder="Add comment"
      ariaLabel={`Add comment for ${targetId}`}
      onInput={(text) => handleCommentInput(draftId, text, true)}
      onKeyDown={(event) => handleCommentKeyDown(event, draftId, true)}
    />
  ];

  return (
    <div class={comments.length ? "comments has-comments" : "comments"}>
      <ul ref={listRef} class="comment-list">
        {commentRows}
      </ul>
    </div>
  );
}

function EditableComment({ id, value = "", placeholder = "", className = "", ariaLabel, onInput, onKeyDown, onBlur }) {
  const ref = useRef(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }

    if (document.activeElement === node) {
      return;
    }

    if (readEditableText(node, false) !== (value || "")) {
      node.textContent = value || "";
    }
  }, [value]);

  return (
    <li
      ref={ref}
      class={`comment-list-row ${className}`.trim()}
      data-comment-id={id}
      contentEditable
      role="textbox"
      aria-label={ariaLabel}
      data-placeholder={placeholder}
      suppressContentEditableWarning
      onInput={(event) => onInput(readEditableText(event.currentTarget, false))}
      onKeyDown={onKeyDown}
      onBlur={(event) => onBlur?.(readEditableText(event.currentTarget, false))}
    />
  );
}

function previousCommentRow(list, row) {
  const rows = commentRows(list);
  return rows[rows.indexOf(row) - 1] || null;
}

function nextCommentRow(list, row) {
  const rows = commentRows(list);
  return rows[rows.indexOf(row) + 1] || null;
}

function commentRows(list) {
  return list ? Array.from(list.querySelectorAll(".comment-list-row")) : [];
}

function focusCommentRow(target, offset = 0) {
  const row = typeof target === "string"
    ? document.querySelector(`[data-comment-id="${target}"]`)
    : target;
  if (!row) {
    return;
  }

  row.focus();
  const selection = window.getSelection?.();
  if (!selection) {
    return;
  }

  const textNode = ensureTextNode(row);
  const bounded = Math.max(0, Math.min(offset, textNode.textContent.length));
  const range = document.createRange();
  range.setStart(textNode, bounded);
  range.collapse(true);
  selection.removeAllRanges();
  selection.addRange(range);
}

function getCaretOffset(node) {
  const selection = window.getSelection?.();
  if (!selection || !selection.rangeCount) {
    return 0;
  }

  const range = selection.getRangeAt(0).cloneRange();
  range.selectNodeContents(node);
  range.setEnd(selection.anchorNode, selection.anchorOffset);
  return range.toString().length;
}

function ensureTextNode(node) {
  if (!node.firstChild || node.firstChild.nodeType !== Node.TEXT_NODE) {
    node.textContent = node.textContent || "";
  }
  return node.firstChild || node.appendChild(document.createTextNode(""));
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
    return themeValues.includes(stored) ? stored : resolveSystemTheme();
  } catch {
    return resolveSystemTheme();
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
  return resolveSystemTheme();
}

function resolveSystemTheme() {
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
