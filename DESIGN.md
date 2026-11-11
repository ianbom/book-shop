# Design

## Source of truth

Status: Active. Date: 2026-11-10. Surface: admin order import only.
Reference: `Wonder Book.figcraft`, page Import pesanan, desktop frame 1398,
finance/detail overlays 2627/2653, correction frames 2684/2810/2911/3012.
Reviewed the live import review, existing React components, CSS and draft API.

## Brand

Wonder Prince Library: calm, precise, readable. Retain the existing logo. Avoid decorative
gradients, serif headings and prominent shadows on this administrative surface.

## Product goals

Help admins identify errors, correct source rows and save valid order groups.
Keep source data and actions visible. Import rules and financial calculations
remain server-owned.

## Personas and jobs

Admin reviewing historical Excel orders, checking references and resolving errors
before committing complete groups. Support desktop work and narrow-screen review.

## Information architecture

Breadcrumb/title, file metadata and warnings, order groups, source rows,
pagination, guidance. Financial details and row details use dialogs; correction
uses categorized tabs with errors. All values come from the current draft.

## Design principles

Errors must name affected fields and offer a correction action. Distinguish saved,
valid, invalid and expired states with text and icons. Preserve all source fields
and reference decisions, including fields beyond the reference's example.

## Visual language

Manrope: title 28px/600, section 18px/600, card 16px/600, body 14px,
caption 12px. Background #F6F8FB, white surfaces, text #172B4D,
primary #244F80, secondary #EAF0F7, muted #5B6B82, border #E2E8F0,
error #B42318 on #FEF3F2. Use 4/8/12/16/24/32px spacing, panel radius
12px, controls 40px, icons 20px, borders 1px, content padding 32px.
Sidebar and header use the shared admin layout without import overrides.
Subtle shadow only for dialogs.

## Components

Reuse existing Button, Input, Label and Radix Dialog. Scope tokens to
`.order-import-page` and portalled `.order-import-dialog`. Sidebar, header and
mobile drawer retain the shared admin theme. Source table pins row numbers
and actions. Source rows share one of eight pastel backgrounds per order group,
consistent across pagination; error cells retain red text and an inset outline.
No new UI dependency.

## Accessibility

Target WCAG AA: visible focus, named regions, semantic table headers, descriptive
action labels and errors associated with inputs. Dialogs trap focus, support
Escape, and return focus to their invoking control. Tabs support arrow/Home/End.

## Responsive behavior

Desktop reference: 1536×1181. At mobile widths use the existing drawer, 16px
content padding, wrapping controls and horizontal table scrolling. Dialogs fit
the viewport, scroll their contents and keep correction actions visible.

## Interaction states

Keep existing upload/commit processing guards, expiry and immutable saved-row
rules. Empty drafts and failed requests have explicit messages. Corrections are
revalidated by the server; historical errors do not prevent submitting fixes.

## Content voice

Use concise Indonesian labels and actual filenames, dates and money. Never copy
example order codes, validation counts or financial values as static content.

## Implementation constraints

React/Inertia, Tailwind 4, existing npm scripts. Restyle import only; other admin
pages retain their theme. No schema or API change. Preserve pagination and
cross-page commit semantics. Retain reference resolution controls.

## Open questions

None for this scope. Verify screenshots at desktop, 768px and 390px, existing
import tests, frontend checks and an isolated production build.
