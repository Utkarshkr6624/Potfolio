# Utkarsh Choudhary — Portfolio

A single-page personal site for **Utkarsh Choudhary**, built as a "log book"
ledger layout: hairline rules, monospace data labels, serif headlines.

It is **zero-dependency static HTML, CSS and vanilla JavaScript**. There is no
framework, no bundler, no npm install, no CDN, and no external webfonts — the
page ships exactly the files listed below.

```
index.html         markup + inline no-flash theme script
styles.css         design tokens, layout, light/dark themes
script.js          theme toggle, nav toggle, copy-email, reveal + meters, gauge rail
robots.txt         crawler rules and the sitemap pointer
sitemap.xml        the one URL this site has, submitted to search engines
site.webmanifest   install metadata (name, colours, display mode)
photo.jpg          portrait used by the hero
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
  - PixelRush — https://pixel-rush-delta.vercel.app (live demo only, no public repo)
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

## SEO

`index.html` carries a description meta tag, Open Graph and Twitter card tags,
a `rel="canonical"`, and a JSON-LD block describing the person (name, job
title, same social profiles, `sameAs` links). `robots.txt` allows everything
and points at the sitemap; `sitemap.xml` lists the one page; the web manifest
is linked for installability. All of it is hand-written and offline — nothing
is fetched from a third party.

### The domain is a placeholder

Every absolute URL currently reads **`https://utkarshchoudhary.dev/`** so the
tags are well-formed, but no such domain is registered yet. When the real one
exists, replace it in these **nine** places and nowhere else:

*In `index.html`:*
1. the `rel="canonical"` link
2. the `og:url` meta tag
3. the `og:image` meta tag
4. the `twitter:image` meta tag
5. the `"url"` field in the JSON-LD block
6. the `"image"` field in the JSON-LD block

*Elsewhere:*
7. `robots.txt` — the `Sitemap:` line (and the filename comment above it)
8. `sitemap.xml` — the `<loc>` entry
9. `site.webmanifest` — the `"id"` field

The simplest check: search the project for `utkarshchoudhary.dev` before
deploying. If it still turns up anywhere, something was missed.

`og:image` and `twitter:image` are **absolute**, not relative. A relative
`photo.jpg` works when you open the file locally but is rejected outright by
Facebook, LinkedIn and X, which is the whole point of a share card. The photo
is also a 3:4 portrait where these platforms want 1200x630; it renders, but a
dedicated share image would look better.

## Notes

- The contact email is **`utkarsh6624@gmail.com`**. An earlier version of this
  site used `utkarsh6624@gamil.com` — that was a typo, and the address is not
  valid. If you see it anywhere, it is a mistake.
- The GitHub handle is **`github.com/Utkarshkr6624`**. The longer
  `utkarsh-choudhary-116a9736a` slug is a **LinkedIn** URL fragment
  (https://www.linkedin.com/in/utkarsh-choudhary-116a9736a), not a GitHub
  username — don't mix the two up.
