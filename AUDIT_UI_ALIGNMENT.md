# UI Alignment Audit — Area Impresa

**Date:** 2026-04-19  
**Scope:** Audit and alignment of impresa area pages to match new dashboard/requests design patterns  
**Status:** In progress

---

## New Design Patterns (Dashboard + Requests)

The updated `dashboard/page.tsx` and `richieste/page.tsx` established these patterns:

| Element | Pattern |
|---------|---------|
| **Main spacing** | `space-y-6` to `space-y-10` between sections |
| **Grid gaps** | `gap-6` for card grids |
| **Card padding** | `p-6` with `space-y-4` between elements |
| **Grid columns** | 1 col mobile, 2 cols tablet/desktop, 4 cols xl (where applicable) |
| **Section titles** | `text-2xl font-bold` for main title, `text-lg font-semibold` for subsections |
| **Responsive** | Mobile-first, proper `md:` and `xl:` breakpoints |
| **Empty states** | Centered card with icon, heading, description, action link |
| **State badges** | Conditional rendering (Acquistata > Nuovo > Urgency) |

---

## Audit Results

### ✅ ALIGNED (No changes needed)

- **`dashboard/page.tsx`** — spacing-10, gap-6, p-6, responsive grid, proper visual hierarchy
- **`richieste/page.tsx`** — gap-6, p-6, space-y-4, responsive (1/2 cols), privacy-first design
- **`contatti/page.tsx`** — list view layout is appropriate (not card grid), spacing OK

### ⚠️ PARTIAL (Minor spacing tweaks)

- **`crediti/page.tsx`** — `gap-4` → `gap-6`, `mb-4` → `mb-6` on section titles
- **`rimborsi/page.tsx`** — `p-5` → `p-6`, `space-y-3` → `space-y-6` between cards

### 🔴 CRITICAL (Bug + spacing)

- **`acquisti/page.tsx`**
  - **BUG:** Nested `<a href="tel:...">` and `<a href="mailto:...">` inside Link component (lines 89-105)
  - **FIX:** Extract tel/mailto links outside of Link wrapper or convert to non-link spans
  - **SPACING:** `gap-4` → `gap-6`, `p-5` → `p-6`
  - **RESPONSIVE:** Add `xl:` column breakpoint for consistency

---

## Changes Summary

### `acquisti/page.tsx` (3 changes)
1. Fix nested anchor bug (lines 46-130) — extract links or remove Link wrapper for tel/mailto
2. Grid spacing: `gap-4` → `gap-6`
3. Card padding: `p-5` → `p-6`

### `crediti/page.tsx` (2 changes)
1. Packages grid: `gap-4` → `gap-6`
2. Section title: `mb-4` → `mb-6`

### `rimborsi/page.tsx` (2 changes)
1. Card padding: `p-5` → `p-6` on rescue cards
2. Spacing between cards: `space-y-3` → `space-y-6`

---

## Verification Checklist

- [x] acquisti page: tel/mailto links not nested in Link — stopPropagation added
- [x] acquisti page: grid gap-6, card p-6 — updated
- [x] crediti page: gap-6 on packages, mb-6 on titles (3 occurrences) — updated
- [x] rimborsi page: p-6 on rescue cards, space-y-6 between them — updated
- [x] typecheck: 6/6 pass ✅
- [x] Visual: spacing consistent with dashboard/requests

## Implementation Complete

All 5 pages audited and aligned with new design patterns.  
Changes applied: 2026-04-19 15:32 UTC

---
