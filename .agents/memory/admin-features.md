---
name: Admin features scope
description: All 9 new admin features added in one session — implementation approach and key patterns
---

## Features implemented (all DB-persisted)

1. **Dynamic categories** — stored as JSON in `admin_settings` key `craving_categories`; `DEFAULT_CRAVING_CATEGORIES` const is fallback. Product form reads from `useSiteSettings()`.
2. **Dynamic units** — product form uses `<datalist id="unit-presets">` with `UNIT_PRESETS` const; fully free-text.
3. **Product image upload** — tabbed URL/upload UI in product form; file → `FileReader.readAsDataURL()` → base64 stored in `product.image`.
4. **Slider config** — `heroSlides` const is static fallback; settings key `hero_slides` JSON overrides in Hero component.
5. **Page content / craving section editing** — settings key `craving_categories` JSON; editable from admin Settings > "Browse by craving section".
6. **Blog CRUD** — `blog_posts` DB table + `/api/blog` routes (GET/POST/PUT/:id/DELETE/:id); BlogPage/BlogPostPage fetch from API with static fallback; AdminSectionBlog component.
7. **Logo update** — file upload → base64 in settings key `logo_url`; Header renders `<img>` when set.
8. **Color theme** — color pickers save hex to settings keys `color_primary/secondary/accent`; `hexToHsl()` + `applyBrandColors()` called on load and on change; CSS vars `--primary/secondary/accent` updated via `document.documentElement.style.setProperty`.
9. **Coupon codes** — `coupon_codes` DB table + `/api/coupons` routes; AdminSectionCoupons for CRUD; CartDrawer has coupon input; `handleApplyCoupon` in SharedShell validates via `POST /api/coupons/validate`.

## Key patterns

- **SiteSettingsContext** provides `Record<string,string>` from DB; SharedShell fetches and provides via React context; any component calls `useSiteSettings()`.
- **applyBrandColors(settings)** called on mount and on `aggarwal-settings-updated` window event.
- **aggarwal-settings-updated** custom window event dispatched after any settings PUT so SharedShell re-fetches.
- Colors stored as hex in DB; CSS uses HSL without `hsl()` wrapper: `--primary: 158 46% 18%`; `hexToHsl()` helper converts.

**Why:** Settings-as-context avoids prop-drilling to deep components (Hero, CategoryRail, Header logo, BlogPage).
**How to apply:** When adding new site-wide settings, add a key to `admin_settings`, save via `PUT /api/settings/:key`, dispatch `aggarwal-settings-updated`, and read via `useSiteSettings()` in the consuming component.
