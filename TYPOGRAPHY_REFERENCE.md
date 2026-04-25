# KB1 Typography System Reference

## Quick Reference - Semantic Variables

### Font Sizes (in order)
```css
--kb1-font-tiny: 0.625rem;      /* 10px - tiny badges, info icons */
--kb1-font-badge: 0.65rem;      /* 10.4px - small badges */
--kb1-font-caption: 0.6875rem;  /* 11px - captions, hints */
--kb1-font-small: 0.7rem;       /* 11.2px - small secondary text */
--kb1-font-label: 0.75rem;      /* 12px - STANDARD labels, controls, body text */
--kb1-font-body: 0.75rem;       /* 12px - same as label */
--kb1-font-input: 0.8125rem;    /* 13px - input fields (legacy, may deprecate) */
--kb1-font-medium: 0.875rem;    /* 14px - slightly larger body text */
--kb1-font-large: 0.9375rem;    /* 15px - emphasized text */
--kb1-font-subhead: 1rem;       /* 16px - section subheadings */
--kb1-font-heading: 1.25rem;    /* 20px - section headings */
--kb1-font-title: 1.5rem;       /* 24px - modal/page titles */
--kb1-font-display-sm: 2rem;    /* 32px - small display text */
--kb1-font-display-lg: 4rem;    /* 64px - large display text */
```

### Font Weights
```css
--kb1-font-weight-light: 300;
--kb1-font-weight-normal: 400;     /* Standard for labels */
--kb1-font-weight-medium: 500;
--kb1-font-weight-semibold: 600;
--kb1-font-weight-bold: 700;
```

### Letter Spacing
```css
--kb1-letter-spacing-tight: -0.025em;
--kb1-letter-spacing-normal: 0;
--kb1-letter-spacing-wide: 0.05em;    /* Standard for uppercase labels */
--kb1-letter-spacing-wider: 0.1em;
```

### Text Transform
```css
--kb1-text-transform-none: none;
--kb1-text-transform-uppercase: uppercase;   /* Standard for labels */
--kb1-text-transform-lowercase: lowercase;
--kb1-text-transform-capitalize: capitalize;
```

### Border Radius
```css
--kb1-radius-sm: 4px;
--kb1-radius-md: 6px;
--kb1-radius-lg: 8px;
--kb1-radius-xl: 12px;
--kb1-radius-full: 9999px;
```

## Migration Guide

### Replace Hardcoded Values

**Font Family:**
```css
/* OLD */
font-family: 'Roboto Mono';
font-family: 'Roboto Mono', monospace;

/* NEW */
font-family: var(--kb1-font-family);
```

**Font Sizes:**
```css
/* OLD → NEW */
font-size: 0.625rem;   → var(--kb1-font-tiny)
font-size: 0.65rem;    → var(--kb1-font-badge)
font-size: 0.6875rem;  → var(--kb1-font-caption)
font-size: 0.7rem;     → var(--kb1-font-small)
font-size: 0.75rem;    → var(--kb1-font-label)    /* NEW STANDARD */
font-size: 0.8125rem;  → var(--kb1-font-input)    /* or --kb1-font-label to modernize */
font-size: 0.875rem;   → var(--kb1-font-medium)
font-size: 0.9375rem;  → var(--kb1-font-large)
font-size: 1rem;       → var(--kb1-font-subhead)
font-size: 1.25rem;    → var(--kb1-font-heading)
font-size: 1.5rem;     → var(--kb1-font-title)
font-size: 2rem;       → var(--kb1-font-display-sm)
font-size: 4rem;       → var(--kb1-font-display-lg)
```

**Font Weights:**
```css
/* OLD → NEW */
font-weight: 300;  → var(--kb1-font-weight-light)
font-weight: 400;  → var(--kb1-font-weight-normal)
font-weight: 500;  → var(--kb1-font-weight-medium)
font-weight: 600;  → var(--kb1-font-weight-semibold)
font-weight: 700;  → var(--kb1-font-weight-bold)
```

**Border Radius:**
```css
/* OLD → NEW */
border-radius: 4px;   → var(--kb1-radius-sm)
border-radius: 6px;   → var(--kb1-radius-md)
border-radius: 8px;   → var(--kb1-radius-lg)
border-radius: 12px;  → var(--kb1-radius-xl)
border-radius: 50%;   → var(--kb1-radius-full) /* for circles */
```

**Text Transform & Letter Spacing:**
```css
/* OLD → NEW */
text-transform: uppercase;  → var(--kb1-text-transform-uppercase)
letter-spacing: 0.05em;     → var(--kb1-letter-spacing-wide)
```

## Standard Label Pattern

**Complete pattern for uppercase labels (most common):**
```css
.label {
  font-family: var(--kb1-font-family);
  font-size: var(--kb1-font-label);           /* 12px */
  font-weight: var(--kb1-font-weight-normal); /* 400 */
  text-transform: var(--kb1-text-transform-uppercase);
  letter-spacing: var(--kb1-letter-spacing-wide);
}
```

## Benefits

✅ **Single source of truth** - Change once, updates everywhere
✅ **Semantic naming** - Clear intent (label, heading, caption)
✅ **Consistent sizing** - No more random values
✅ **Easy theme switching** - Future light mode ready
✅ **Designer-friendly** - CSS variables only, no code changes

## Last Updated

April 25, 2026 - Complete typography system established
