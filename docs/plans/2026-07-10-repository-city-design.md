# Repository City design

Repository City turns a public GitHub profile or repository into an interactive isometric city. A profile becomes a connected metropolis of repository neighborhoods; inside each neighborhood, files become buildings. For an individual repository, top-level folders become districts. File size controls height and file category controls color in both modes.

## MVP

- Accept a GitHub profile URL, username, repository URL, or `owner/repository`.
- Render every public profile repository as a connected neighborhood with its source files as buildings.
- Support public repositories without user accounts.
- Fetch repository metadata and a recursive Git tree through a server route.
- Filter binary, generated, vendor, lock, and build artifacts.
- Aggregate large repositories to a safe rendering budget.
- Generate a deterministic, non-overlapping district layout.
- Render the model using an orthographic React Three Fiber scene.
- Support hover details, file links, filters, reset view, sharing, and PNG export.
- Provide useful empty, loading, rate-limit, not-found, oversized, and WebGL fallback states.
- Create shareable `/city/[owner]/[repository]` and `/profile/[owner]` routes.

## Visual system

The accepted design references are stored in `docs/design/`. The interface uses a graphite canvas, bone-white typography, chartreuse selection, cobalt source buildings, violet tests, cyan docs, and lime configuration buildings. Desktop uses a compact information rail; mobile uses touch controls and a bottom sheet.

## Architecture

The Next.js application contains a thin server API and a browser-rendered Three.js scene. No database is required. GitHub credentials remain server-only. The data transformation and layout are pure TypeScript modules with unit tests.

## Out of scope

Private repositories, GitHub OAuth, commit history, repository comparison, collaboration, saved accounts, and server-rendered WebGL are post-MVP ideas.

## Inspiration

This project is inspired by [radiumcoders/Isometric-Github-Contributions](https://github.com/radiumcoders/Isometric-Github-Contributions), which demonstrates how GitHub contribution data can become a shareable 3D landscape. Repository City applies the data-to-geometry idea to repository structure with an original implementation and visual system.
