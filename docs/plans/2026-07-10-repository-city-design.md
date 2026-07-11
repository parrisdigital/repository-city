# Repository City design

Repository City turns a public GitHub repository into an interactive isometric city. Top-level folders become districts, files become buildings, file size controls height, and file category controls color.

## MVP

- Accept a GitHub URL or `owner/repository`.
- Support public repositories without user accounts.
- Fetch repository metadata and a recursive Git tree through a server route.
- Filter binary, generated, vendor, lock, and build artifacts.
- Aggregate large repositories to a safe rendering budget.
- Generate a deterministic, non-overlapping district layout.
- Render the model using an orthographic React Three Fiber scene.
- Support hover details, file links, filters, reset view, sharing, and PNG export.
- Provide useful empty, loading, rate-limit, not-found, oversized, and WebGL fallback states.
- Create shareable `/city/[owner]/[repository]` routes.

## Visual system

The accepted design references are stored in `docs/design/`. The interface uses a graphite canvas, bone-white typography, chartreuse selection, cobalt source buildings, violet tests, cyan docs, and lime configuration buildings. Desktop uses a compact information rail; mobile uses touch controls and a bottom sheet.

## Architecture

The Next.js application contains a thin server API and a browser-rendered Three.js scene. No database is required. GitHub credentials remain server-only. The data transformation and layout are pure TypeScript modules with unit tests.

## Out of scope

Private repositories, GitHub OAuth, commit history, repository comparison, collaboration, saved accounts, and server-rendered WebGL are post-MVP ideas.

## Inspiration

This project is inspired by [radiumcoders/Isometric-Github-Contributions](https://github.com/radiumcoders/Isometric-Github-Contributions), which demonstrates how GitHub contribution data can become a shareable 3D landscape. Repository City applies the data-to-geometry idea to repository structure with an original implementation and visual system.
