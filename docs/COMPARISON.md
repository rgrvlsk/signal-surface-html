# Comparison

Surface Signal HTML is not a general skill pack. It has one job: turn complex review work into durable HTML surfaces.

## Positioning

| Pattern | What it is good at | Where Surface Signal differs |
| --- | --- | --- |
| Methodology packs | Better agent process, planning, debugging, review discipline. | Produces a review artifact, not an agent workflow. |
| Tiny single-purpose skills | Fast install, easy mental model, low risk. | Higher setup, but richer output for multi-item decisions. |
| Response-style skills | Tone, compression, formatting, persona control. | Changes the medium, not just the prose. |
| Browser/tool skills | Direct execution: click, inspect, test, scrape. | Structures human review and follow-up context. |
| Broad SDLC packs | Many skills across the development lifecycle. | Narrower scope; deeper artifact behavior. |

## Concrete Before/After

### Plan Review

Plain Markdown works until the plan has competing decisions, unresolved assumptions, and reviewer edits.

Surface Signal route: `$plan-studio`

Output: editable plan surface with sections, pending items, decision notes, comments, and prompt export for the next session.

Use something simpler when the plan is short and already approved.

### Review Queue

A checklist loses state once reviewers start approving, rejecting, deferring, and asking follow-up questions.

Surface Signal route: `$verdict-rundown`

Output: decision board with explicit item status, impact, folded details, comments, and exportable next action.

Use a normal issue tracker when the team already lives there and does not need agent handoff.

### Research Synthesis

Research notes often mix facts, inferences, confidence, and recommendations.

Surface Signal route: `$research-atlas`

Output: claim-centered surface with citations, confidence, open questions, and decision-ready conclusions.

Use a plain memo when citations and confidence do not need interactive review.

## Tradeoffs

- More moving parts than a small text skill.
- Best value appears when there are multiple reviewers, decisions, or follow-up sessions.
- Full source-backed mode needs Node.js and filesystem access.
- Standalone HTML mode keeps copied skills useful, but it is not equivalent to the full compiler/runtime.

## Short Version

Use Surface Signal when the output needs to be reviewed, changed, and handed back to an agent with context intact.
