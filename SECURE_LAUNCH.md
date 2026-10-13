# Luma Store — secure commercial launch checklist

## Blockers to first sale
1. Configure PayPal seller account with PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET (server-side).
2. Create **private** Cloudflare R2 bucket, upload six PDFs using original product IDs as object names: planner-bundle.pdf, wellness-journal.pdf, ai-prompts.pdf, budget-templates.pdf, social-templates.pdf, ebook-bundle.pdf.
3. Configure R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET. The R2 API token requires object read permission for this bucket. Do not expose credentials to the browser.
4. Configure DOWNLOAD_SIGNING_SECRET (random 32+ characters). Set PAYPAL_ENV=sandbox first; change to live after successful end-to-end verification.
5. Test successful and cancelled PayPal payments, price tampering, missing PDF, download link expiration, duplicate capture, responsive mobile purchase.
6. Deploy on a platform supporting Node.js API routes. Static export alone will not work.
7. Confirm merchant region eligibility and customer support/refund requirements before launch.
8. Verify every PDF matches its advertised contents; replace/remove unverifiable ratings and claims.

## Security model
All prices are calculated server-side from product catalog. PayPal orders are created and captured on the server. Only a verified completed capture generates 15-minute HMAC download grants. PDF objects must remain private in R2. Do not restore any files under public/downloads.

## Known limitations / next improvements
- Download grants currently survive only on the success page; add database-backed orders, email receipts, and a recovery route before scaling.
- Add durable replay/idempotency handling, rate limiting, payment webhooks, fraud monitoring, and audit trail.
- No production payment has been tested or authorized. Merge only after CI and sandbox testing.
