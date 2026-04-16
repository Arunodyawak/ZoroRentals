# CSS File Naming

Use page or feature names for styles so each team member can own their area.

## Shenal - Home

- Edit: `home.input.css`
- Generated file linked by the page: `home.css`
- Script linked by the page: `../js/home.js`
- Build once: `npm run build:home-css`
- Watch while editing: `npm run watch:home-css`

## Suggested Pattern For Other Members

- User pages: `user.input.css` -> `user.css`
- Booking pages: `booking.input.css` -> `booking.css`
- Payment pages: `payment.input.css` -> `payment.css`
- Bike management pages: `bike.input.css` -> `bike.css`
- Reviews pages: `reviews.input.css` -> `reviews.css`

Each `*.input.css` file can use Tailwind:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Use shared theme names from `tailwind.config.js`, such as `bg-primary`,
`text-muted`, `font-mainf`, and `font-secondaryf`.
