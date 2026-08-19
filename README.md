This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Credits

Page paper texture: ["Vintage Paper Texture"](https://commons.wikimedia.org/wiki/File:Vintage_Paper_Texture_(9789792113).jpg) by James Puckett, licensed under [CC BY 2.0](https://creativecommons.org/licenses/by/2.0/), via Wikimedia Commons. Resized and color-adjusted.

## Chapter release

Release is Ramp's, on their side (2026-08-19). This repo renders every
chapter: nothing here holds Chapters II–X back.

There used to be a full release system in here — one-per-day unlocking,
then timed drops held in Vercel Edge Config, a `/schedule` dashboard
behind a secret link, a `/api/gate` endpoint the reader read
cross-origin, and a teaser leaf that counted down in the reader's own
timezone. It was stripped from `main` when Ramp took release over,
because two gates in series means the stricter one wins and theirs
would never have been reached.

It is not gone. To put it back:

```bash
git revert $(git log --grep="Strip our chapter release" --format=%H -1)
```

or take the whole system as it last shipped:

```bash
git checkout gate-v1        # tag, = branch chapter-gate-v1
```

Reintegrating needs these Production env vars, all of which existed on
the dangertesting/plain-rules project: `EDGE_CONFIG`, `EDGE_CONFIG_ID`,
`VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `DASH_SLUG`. Without them the
gate fails closed to Chapter I — worth knowing before reverting onto a
deployment that doesn't have them.
