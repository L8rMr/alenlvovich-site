# alenlvovich.com

**Lvovich Online**: Alen Lvovich's résumé site, styled as a 90s dial-up online service. Sign on, read the Buddy List, check your mail.

## Update the site

Edit anything in [`public/`](public/) and commit to `main`. The site picks up the change within about a minute.

- `public/index.html` is the whole site: HTML, CSS and JS in one file.
- `public/Alen_Lvovich_Resume.pdf` is the résumé the "Download résumé" button links to.

## How it's hosted

The site runs on a home Windows PC with Docker Desktop:

1. **`alenlvovich-puller`** (alpine/git) clones this repo into the `alenlvovich-repo` volume and runs `git pull` every 60 seconds.
2. **`alenlvovich-site`** (nginx) serves `public/` on `127.0.0.1:8099`.
3. The **Cloudflare Tunnel** `lvovichtv` publishes `localhost:8099` as `alenlvovich.com` and `www.alenlvovich.com`.

To rebuild from scratch, run this in the repo folder:

```
docker compose up -d
```
