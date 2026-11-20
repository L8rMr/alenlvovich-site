# alenlvovich.com

**Lvovich Online**: Alen Lvovich's résumé site, styled as a 90s dial-up online service. Sign on, read the Buddy List, check your mail.

## Update the site

Edit anything in [`public/`](public/) and commit to `main`. The site picks up the change within about a minute.

- `public/index.html` is the whole site: HTML, CSS and JS in one file.
- `public/Alen_Lvovich_Resume.pdf` is the résumé the "Download résumé" button links to.
- `public/win95.css` and `public/win95.js` hold the shared Windows 95 look and the draggable windows.
- `public/bagel-quest/` is the Bagel Quest page (`classic/` is the original single-file version). It frames the live game from `bagel.lvovichtv.com`, which deploys from the `L8rMr/bagel-quest` repo.
- `public/tv/` is LvovichTV: a CRT set with a channel dial, volume, power, degauss, smack and a service menu. It plays ErsatzTV channels through `/iptv/`, which nginx proxies to ErsatzTV on the PC (port 8409). Edit `public/tv/channels.json` to choose which channels show, rename them or reorder the dial.
- Signal Terminal (the "ST" entry in `index.html`) links out to `signal.alenlvovich.com`, which runs from the `L8rMr/signal-terminal` repo on the same PC (port 8098, read-only public view).
- `public/trueup/` is the TrueUp demo: a from-scratch recreation of Alen's work budget platform on fictional data (`trueup-core.js` holds the data, rules, math and Excel export).
- `nginx/default.conf` is the web server config. nginx reloads within a minute when it changes.

## How it's hosted

The site runs on a home Windows PC with Docker Desktop:

1. **`alenlvovich-puller`** (alpine/git) clones this repo into the `alenlvovich-repo` volume and runs `git pull` every 60 seconds.
2. **`alenlvovich-site`** (nginx) serves `public/` on `127.0.0.1:8099`.
3. The **Cloudflare Tunnel** `lvovichtv` publishes `localhost:8099` as `alenlvovich.com` and `www.alenlvovich.com`.

To rebuild from scratch, run this in the repo folder:

```
docker compose up -d
```
