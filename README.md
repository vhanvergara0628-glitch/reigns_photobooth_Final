# reigns_photobooth_Final

A photobooth web app built with React (Create React App) + Tailwind CSS.

Capture 4 photos with a photobooth-style countdown timer and full-screen flash,
then claim and "print" your photo strip. Before downloading it as a PNG you can
edit the strip: footer brand text, border/paper colors, photo filters, and
pixel-art stickers (tap to place, drag to move).

## Scripts

- `npm start` — run locally at http://localhost:3000
- `npm run build` — production build into `build/`
- `npm test` — run tests

## Deployment

Pushing to `main` triggers the GitHub Actions workflow
(`.github/workflows/deploy.yml`), which installs dependencies, runs the
production build, and deploys `build/` to GitHub Pages:

https://vhanvergara0628-glitch.github.io/reigns_photobooth_Final/

Note: the webcam (getUserMedia) requires HTTPS, which GitHub Pages provides.