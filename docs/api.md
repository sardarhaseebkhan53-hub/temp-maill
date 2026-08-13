# Haven HTTP API

Base path: `/api/v1`

Authenticate with `Authorization: Bearer tmp_live_…` or a session cookie. Errors:

```json
{ "success": false, "error": { "code": "MAILBOX_EXPIRED", "message": "This temporary mailbox has expired." } }
```

Guest UI calls use the mailbox `publicToken` as `?token=` or JSON `token`.

## Mailboxes

- `POST /mailboxes` `{ localPart?, domainId?, custom?, sandbox?, ttlMinutes? }`
- `GET /mailboxes` (registered)
- `GET /mailboxes/:id`
- `DELETE /mailboxes/:id`
- `POST /mailboxes/:id/extend` `{ minutes }`
- `GET /mailboxes/:id/qr`

## Messages

- `GET /messages?mailboxId&cursor&limit&q&sort&filter&sender`
- `GET /messages/:id`
- `PATCH /messages/:id` `{ read }`
- `DELETE /messages/:id`
- `GET /messages/:id/attachments/:attachmentId`

## Realtime

`GET /inbox/stream?mailboxId&token` — SSE. Events: `hello`, `heartbeat`, `message.received`.

## Webhooks

- `POST /webhooks` `{ url, events, sandbox? }` — secret shown once
- `GET /webhooks`
- `DELETE /webhooks/:id`

## Usage

`GET /usage`

## Inbound (providers)

`POST /inbound/{mailgun|postmark|smtp|mock}`

SMTP adapter requires `x-haven-smtp-signature: hex(hmac_sha256(AUTH_SECRET, rawBody))`.

## Examples

See `/developer-api` for curl, JavaScript, Python, and PHP.
