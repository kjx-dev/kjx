# Responsive Images Implementation

## Goals
- Make images adapt to screen sizes without distortion
- Optimize loading and formats for performance
- Preserve visual quality and avoid layout shifts

## CSS Techniques
- Global rule: `img { max-width: 100%; height: auto; }`
- Component rules keep aspect ratios via `object-fit: cover` where needed
- Utility classes:
  - `.upload__grid`, `.upload__tile` for compact thumbnails
  - `.img__featured img`, `.details__image img` handle galleries

## HTML/JS Usage
- Prefer Next.js `Image` for local assets
  - Provide `width`, `height`
  - Set `sizes` for responsive behavior
  - Use `priority` only for above-the-fold images
- For external URLs or dynamic previews:
  - Use `<img loading="lazy" decoding="async">`
  - Keep `object-fit` in CSS to preserve ratios
- Use `<picture>` for art direction
  - Example: webp source + fallback `<img>`

## Performance
- Lazy-loading: default with Next `Image`, and `<img loading="lazy">` for plain images
- Formats: use WebP for static assets; Next `Image` can serve modern formats automatically
- `sizes` attribute to guide responsive loading

## Breakpoints to Test
- Mobile: 320–768px
- Tablet: 768–1024px
- Desktop: 1024px+

## Quality Assurance
- Check no pixelation or blurriness on thumbnails and banners
- Verify aspect ratios preserved in cards and galleries
- Ensure reserved space (width/height for Next `Image`) to avoid layout shifts

## Notes
- External domains require Next `next.config.js` `images.domains` to enable optimization; otherwise use `unoptimized`
- Keep large hero/banners optimized with `sizes` and avoid stretching beyond containers