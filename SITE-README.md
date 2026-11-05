# PROMAXX Engineering website

Static website built from the Claude Design handoff in `promaxx-website/` (Home + Contact Us).
No build step and no framework: plain HTML, CSS and JavaScript. Works on any static host
(Hostinger, Netlify, Cloudflare Pages, GitHub Pages, cPanel).

## What is where

| Path | What it is |
|---|---|
| `site/index.html` | Home: hero, intro, services, workforce, why PROMAXX, approach, footer |
| `site/contact.html` | Contact Us: hero, call/email cards, enquiry form, footer |
| `site/css/style.css` | All styles (design tokens at the top) |
| `site/js/main.js` | Nav, scroll reveals, hero parallax, ambient image motion, form |
| `site/img/` | WebP images (20 MB of PNGs reduced to 1.25 MB) |
| `site/favicon*`, `icon-*`, `apple-touch-icon.png`, `og-image.jpg` | Icons and link-preview image |
| `site/robots.txt`, `site/sitemap.xml`, `site/site.webmanifest` | SEO and app metadata (domain set to promaxxeng.com) |
| `tools/optimize_images.py` | Rebuilds `site/img` and the icons from `promaxx-website/project/assets` |

## Preview locally

```bash
python -m http.server 5173 --directory site
```

Then open http://localhost:5173

## Deploy: Netlify + Hostinger DNS (chosen 5 Nov 2026)

The upload package is `deploy/promaxx-site/`, also zipped as `deploy/promaxx-site.zip`.
It leaves out `.claude/` and includes Netlify's `_redirects` (old `/contact` link still works),
`_headers` (security headers plus image caching) and `404.html`.
After changing anything in `site/`, rebuild the package before uploading again.

**1. Put the site on Netlify (on a computer)**
1. Sign up at https://app.netlify.com.
2. Open https://app.netlify.com/drop and drag the `deploy/promaxx-site` folder onto the page.
3. Netlify gives the site an address like `something-123.netlify.app`. Open it and check it.
4. Optional: in **Site configuration → Change site name**, rename it, e.g. `promaxx-engineering.netlify.app`.

**2. Add the domain in Netlify**
**Domain management → Add a domain** → enter `promaxxeng.com`. Choose **external DNS**, not Netlify DNS.
Netlify adds `www.promaxxeng.com` too.

**3. Point the domain in Hostinger**
Go to hPanel → Domains → promaxxeng.com → **DNS / Nameservers → DNS records**.

| Action | Type | Name | Value now (Framer) | New value |
|---|---|---|---|---|
| Delete | A | `@` | `31.43.160.6` | — |
| Delete | A | `@` | `31.43.161.6` | — |
| Add | A | `@` | — | `75.2.60.5` |
| Edit | CNAME | `www` | `sites.framer.app` | `your-site-name.netlify.app` |

Do **not** touch the MX records (`mail.protonmail.ch`, `mailsec.protonmail.ch`) or the TXT records
(`protonmail-verification…`, `v=spf1 include:_spf.protonmail.ch ~all`). They run @promaxxeng.com email.
If Hostinger has an ALIAS record type, `@` ALIAS → `apex-loadbalancer.netlify.com` is Netlify's
preferred choice. The A record above is the standard fallback and works fine.

**4. HTTPS**
Back in Netlify, go to **Domain management → HTTPS → Verify DNS configuration**. The free
Let's Encrypt certificate is issued automatically, usually within minutes. DNS changes can take
up to a few hours to reach everyone.

**5. Afterwards**
In Framer, remove promaxxeng.com from the project and switch off the plan's auto-renew. It is
paid to 7 Mar 2027.

## Other hosts

Upload the contents of `deploy/promaxx-site/` to the web root (for example `public_html`).

## Contact form: needs one setting before launch

Until a form backend is set up, **Submit** opens the visitor's email app with the message
already addressed to info@promaxxeng.com. Nothing is lost, but the visitor still has to press send.

To have the form send by itself:

1. Create a free form key at https://web3forms.com, using info@promaxxeng.com.
2. In `site/contact.html`, on the `<form id="contact-form">` tag, set
   `data-endpoint="https://api.web3forms.com/submit"`.
3. Paste the key into `<input type="hidden" name="access_key" value="">`.

Formspree also works: set `data-endpoint` to your `https://formspree.io/f/...` URL and leave `access_key` empty.
If sending fails, the form shows an error with the email address and phone number, so the visitor can still reach you.

## Changes from the design file

- **Contact form:** Email and Phone now sit in two equal columns. The design's grid left an
  empty third column on wide screens.
- **Phones:** the "Why PROMAXX" text no longer runs into the slanted divider. The
  "How We Work" pictures now span the full card instead of showing as a small thumbnail.
  The footer picture is darkened so the address stays readable.
- **Footer:** added a copyright line.
- **Hero video:** `hero.mp4` was in the bundle, but the final design uses the still tank-farm
  photo, so the video is not used.
