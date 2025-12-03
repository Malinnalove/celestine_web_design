这是一个简单的个人博客，包括日记、图片和人生轨迹的记录。想做成一个互联网上的家一样。生活不再有交集的老友能从这里了解我的更多。
# Personal Blog

A fully componentized Next.js 14 App Router project that powers a small personal site with three post types (diary, photo gallery, and long-form articles). Content lives in simple in-memory stores, so everything feels instant without an external database.

## Features

- **Three content types** — Diary, Photo, and Article entries share the same homepage feed with per-type listing pages.
- **Dynamic post detail** — Text rendering for diary/article posts plus responsive image grids for photo sets.
- **Comments & Admin panel** — Anonymous visitors can drop comments, and the `/admin` page exposes a post-creation form with server actions for mutations.
- **Tailwind styling** — Uses TailwindCSS for layout, responsive grids, and theming.
- **Server + client components** — Read-only views stay on the server, while the admin dashboard and comment forms use client components wired to server actions.

## Getting started

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000` to view the blog. The key routes are:

- `/` – mixed feed of all posts (newest first)
- `/diary` – diary-only index
- `/photos` – photo gallery view
- `/post/[id]` – detail page with comments
- `/admin` – create new posts

Because the data layer is in-memory, restarting the dev server resets the content and comments.

## Tech stack

- Next.js 14 App Router
- TypeScript
- TailwindCSS
- Server Actions + in-memory stores
