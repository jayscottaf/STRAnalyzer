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

## Environment Variables

Copy `.env.example` to `.env.local` and set:

- `OPENAI_API_KEY`: Required for AI listing extraction and analysis.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`: Optional. Enables Google Places address autocomplete in the Property Address field.

Google Places requires a Google Cloud billing account and a restricted API key. For production, restrict the key to your deployed domain. For local development, allow `localhost` / `127.0.0.1`. Google publishes current pricing and free monthly SKU details at:

- https://mapsplatform.google.com/pricing/?hl=en-US
- https://developers.google.com/maps/documentation/places/web-service/usage-and-billing

## Listing Links

The listing extractor accepts pasted text, images, PDFs, and listing URLs. The URL tab makes a best-effort normal page read with timeout and safety limits, then falls back if the listing site blocks automated access or returns too little usable text. It does not bypass CAPTCHA, log in, use proxy rotation, or work around anti-bot systems. For public or scaled use, replace direct listing-site reads with a licensed real-estate data API.

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
