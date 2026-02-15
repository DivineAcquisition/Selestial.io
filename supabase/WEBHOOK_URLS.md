# Selestial — Webhook Endpoint Reference

Use these URLs when setting up webhook integrations for each client.

## Stripe Webhook
**URL:** `https://thbegonbonhswsbgszxi.supabase.co/functions/v1/stripe-webhook`
**Events to subscribe:**
- `payment_intent.succeeded`
- `customer.subscription.created`
- `customer.subscription.deleted`
- `charge.refunded`

## GHL (GoHighLevel) Webhook
**URL:** `https://thbegonbonhswsbgszxi.supabase.co/functions/v1/ghl-webhook`
**Triggers to subscribe:**
- Contact Create
- Contact Update
- Opportunity Status Update
- Form Submission

## Telnyx Webhook
**URL:** `https://thbegonbonhswsbgszxi.supabase.co/functions/v1/telnyx-webhook`
**Configuration:**
- Messaging > Your Number > Inbound Settings > Webhook URL
- Call Control > Webhook URL

## Deployment Notes
All edge functions must be deployed with `--no-verify-jwt` flag since external services (Stripe, GHL, Telnyx) send raw HTTP requests, not authenticated Supabase requests.

```bash
npx supabase functions deploy stripe-webhook --no-verify-jwt
npx supabase functions deploy ghl-webhook --no-verify-jwt
npx supabase functions deploy telnyx-webhook --no-verify-jwt
npx supabase functions deploy scoring-engine
npx supabase functions deploy workflow-engine
```
