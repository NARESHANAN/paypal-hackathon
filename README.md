# Split

Turn a pasted group chat into an expense breakdown, a minimized set of repayments, and PayPal.Me links.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app includes a sample chat so the flow can be tried immediately.

## Parsing

Without an API key, the server uses a small local parser for clear messages such as `Raju paid 2000 for the cab`, `Priya covered dinner for 1500`, and `I paid 800 for snacks`. It recognizes explicit exclusions such as `but Dev didn't eat`. The local parser is intentionally conservative; review the extracted expenses before relying on the result.

For natural-language extraction, copy `.env.example` to `.env.local` and set `GOOGLE_GENERATIVE_AI_API_KEY` to a Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey). The chat is then sent to Google's Gemini API for parsing; this app does not persist chats. Keep the key server-side and never expose it with a `NEXT_PUBLIC_` prefix. Restart the dev server after changing the environment file.

## Settlement links

The app calculates equal shares among participants who joined each expense and minimizes the repayments. PayPal.Me links are suggestions: the recipient username is initially derived from their name, so verify or edit it to the recipient's exact PayPal.Me handle. Links open PayPal and do not initiate payments automatically.

Choose a country and currency before calculating a split. The country selects a locale and its default currency; you can change the currency separately. All amounts in one chat are assumed to use that selected currency. Mixed-currency conversion and exchange rates are not supported, so review the expenses and amounts before settling.

The app rounds equal shares to the selected currency's usual number of decimal places and distributes any indivisible minor units so the repayment ledger remains balanced. PayPal.Me currency availability may depend on the recipient's account; verify the destination and amount on PayPal before paying.

The hero preview and built-in sample chat use example names for the selected country. Switching countries updates the sample names and participants only while the form still contains its built-in sample; custom chat text and participant lists are preserved.

## Install on a phone

This is a responsive web app with a PWA manifest, so you can add it to your phone's home screen:

- **Android:** open the deployed HTTPS site in Chrome, then choose **Install app** or **Add to Home screen** from the browser menu.
- **iPhone/iPad:** open the deployed HTTPS site in Safari, tap **Share**, then **Add to Home Screen**.

For local development, use `http://localhost:3000`. A deployed install requires HTTPS. This PWA uses the same web app and is not an offline-capable native iOS/Android app.
