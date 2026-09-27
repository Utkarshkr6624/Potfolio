# Utkarsh Choudhary — Portfolio

A single-page personal site for **Utkarsh Choudhary**, built as a "log book"
ledger layout: hairline rules, monospace data labels, serif headlines.

It is **zero-dependency static HTML, CSS and vanilla JavaScript**. There is no
framework, no bundler, no npm install, no CDN, and no external webfonts — the
page ships exactly the three files below plus one photo.

```
index.html   markup + inline no-flash theme script
styles.css   design tokens, layout, light/dark themes
script.js    theme toggle, nav toggle, copy-email, reveal + meters, gauge rail
photo.jpg    portrait used by the hero
```

## Running it

It works straight off the filesystem — just **double-click `index.html`**
(`file://` is fully supported).

If you prefer a local server:

```sh
python -m http.server 5500
# then visit http://localhost:5500
```

Nothing else to install, build or configure.

## Editing

- **Name, role, and about copy** — all in `index.html`: the hero
  (`.hero__name`, `.hero__role`, `.hero__slug`) and the opening paragraphs
  under the `.lede` in the first `.section`.
- **Projects** — the `.row` entries inside the work section of `index.html`.
  Each links to its repo:
  - CampusPulse — https://github.com/Utkarshkr6624/campuspulse
  - SwiftPDF — https://github.com/Utkarshkr6624/swift_pdf
  - Pdf-tools — https://github.com/Utkarshkr6624/Pdf-tools
- **Skills** — the `.skill-table` rows in `index.html`. Each percentage is
  written twice: `--pct` on the `.meter` drives the bar, and the same number
  appears in the `.skill-table__level` cell so the figure is never carried by
  the bar alone. Change both together.
- **Colours** — the custom properties at the top of `styles.css`: light values
  live in the `:root` block, dark values in the `:root[data-theme="dark"]`
  block. Change the token, not the individual rules that consume it.
- **Theme** — the active theme is the `theme` key in `localStorage` (`"light"`
  or `"dark"`). It is read and written by the inline script in `<head>` of
  `index.html` and by the `#themeToggle` handler in `script.js`; deleting that
  key returns the site to your OS colour-scheme preference.
- **Photo** — `photo.jpg` in this folder. Framing is tuned in `styles.css`
  under `.hero__figimg` via `object-position`; nudge that one value to
  recompose the crop without touching the markup.

## Notes

- The contact email is **`utkarsh6624@gmail.com`**. An earlier version of this
  site used `utkarsh6624@gamil.com` — that was a typo, and the address is not
  valid. If you see it anywhere, it is a mistake.
- The GitHub handle is **`github.com/Utkarshkr6624`**. The longer
  `utkarsh-choudhary-116a9736a` slug is a **LinkedIn** URL fragment
  (https://www.linkedin.com/in/utkarsh-choudhary-116a9736a), not a GitHub
  username — don't mix the two up.
