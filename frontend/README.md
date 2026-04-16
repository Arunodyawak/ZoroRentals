# Frontend Structure

This folder contains the static frontend pages and assets.

## Pages

- `index.html` - Shenal's home page
- `design-tokens.html` - shared color and font reference card

## Assets

- `assets/css/home.input.css` - Tailwind source for the home page
- `assets/css/home.css` - generated CSS used by the browser
- `assets/js/home.js` - home page interactions and scroll motion
- `assets/images/` - home page images organized by section, including `homebikes/` and `homefeedbacks/`

## Build

From the project root:

```bash
npm run build:home-css
```

While editing home styles:

```bash
npm run watch:home-css
```
