# Kenji Ku — Portfolio

A responsive, static professional portfolio. No build tools required. Suitable for GitHub Pages.

## Preview locally

Open `index.html` in a browser or run:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Publish with GitHub Pages

1. Sign in to GitHub and create a **public** repository named `YOUR_USERNAME.github.io` (replace `YOUR_USERNAME` with your exact GitHub username). For a custom repo name, the URL will instead include the repository name.
2. Upload all files, including `index.html`, `style.css`, `script.js`, `assets/`, and `.nojekyll`, to the repository root. Alternatively, use `git add .`, `git commit`, and `git push`.
3. Navigate to **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, select `main`, select `/(root)`, and save.
5. Once deployed, the site will be available at `https://YOUR_USERNAME.github.io/` for the username-named repository.

## Customize before publishing

- Update the email address in `index.html` if you prefer another professional address.
- Add your actual GitHub profile link, project repositories, or demos where you have public URLs. No GitHub username is assumed here.
- Adjust project details and previously reported impact metrics as needed before publishing.
- Add a resume PDF and link it in the navigation only if you want a public download; check privacy first.
- Replace the stylized project visuals with your own approved screenshots if desired.

## Privacy and accuracy

The site intentionally does not publish a phone number, residential address, proprietary code, or internal screenshots. Professional metrics are based on previously supplied resume information and should be verified before publishing.

## Technology

Vanilla HTML, CSS, and JavaScript. No framework, paid hosting, or dependencies needed for publishing. The optional Google Fonts stylesheet falls back to system fonts if unavailable.


## CAPRI // Neon District (interactive mini-world)

The portfolio now links to **world.html**, a self-contained Three.js cyberpunk mini-game.

### Play
- Click **Enter Neon City** on the home page or open `/world.html` directly.
- Use **WASD** / arrow keys to fly, **Q/E** for altitude, **Shift** for boost, and **drag** to orbit the camera.
- Mobile users get on-screen flight buttons.
- Hover / tap the floating icons to meet Talia and D or inspect landmarks.
- Collect six floating data shards.

### Deploy to GitHub Pages
Upload the complete contents of this folder to the root of your `kukenji.github.io` repository, replacing updated `index.html` and adding `world.html`, `world.css` and `world.js`. Keep `style.css`, `script.js`, `assets/` and `.nojekyll`. Commit and verify GitHub **Settings → Pages** uses `main` and `/(root)`. The experience is at `https://kukenji.github.io/world.html` after successful deployment.

### Technical notes
- Static files only: no server, no build step.
- The game loads Three.js from jsDelivr and Google Fonts from Google's CDN. An internet connection is necessary for those dependencies.
- All city geometry, signage, vehicles and characters are generated locally by JavaScript: no copyrighted game assets, no downloaded models.
- Modern browser with WebGL support required.
- Character names Talia and D refer to original stylized mini-world NPCs.
