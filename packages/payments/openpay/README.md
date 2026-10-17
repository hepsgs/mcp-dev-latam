# @codespar/mcp-openpay

MCP server for [Openpay](https://www.openpay.mx), the BBVA-owned Mexican payment gateway. It supports cards, SPEI, store payments, subscriptions, webhooks, and marketplace payouts through 23 tools.

## Security defaults

- Sandbox is the default environment.
- Production requires `OPENPAY_ENABLE_PRODUCTION=true`.
- Every money-moving or state-changing tool requires `OPENPAY_ALLOW_MUTATIONS=true`.
- Payouts additionally require `OPENPAY_ALLOW_PAYOUTS=true`.
- Raw PAN and CVV values are rejected. Tokenize cards with Openpay.js first.
- Provider requests time out after 10 seconds by default and return sanitized errors.
- HTTP transport is opt-in, requires a Bearer token, rate-limits requests, and binds to loopback unless remote access is explicitly enabled.

These controls reduce accidental exposure; they do not replace PCI DSS obligations, least-privilege credentials, network controls, monitoring, or human approval for high-impact operations.

## Install

```bash
npm install @codespar/mcp-openpay
```

## Sandbox quick start

```bash
export OPENPAY_MERCHANT_ID="your-sandbox-merchant-id"
export OPENPAY_PRIVATE_KEY="sk_your_sandbox_private_key"

# Read-only stdio server. Mutations remain disabled.
npx @codespar/mcp-openpay
```

Enable mutations only after reviewing the tools your agent may call:

```bash
export OPENPAY_ALLOW_MUTATIONS=true
npx @codespar/mcp-openpay
```

Payouts need a second explicit gate:

```bash
export OPENPAY_ALLOW_MUTATIONS=true
export OPENPAY_ALLOW_PAYOUTS=true
```

## Production

Production requires an explicit environment and opt-in:

```bash
export OPENPAY_ENV=production
export OPENPAY_ENABLE_PRODUCTION=true
export OPENPAY_MERCHANT_ID="your-production-merchant-id"
export OPENPAY_PRIVATE_KEY="sk_your_production_private_key"
npx @codespar/mcp-openpay
```

Mutation and payout gates still apply in production.

## Card handling

This server never accepts raw card numbers or CVVs.

1. Tokenize the card in the browser or mobile client with Openpay.js.
2. Pass the resulting token as `token_id` to `create_card`, or as `source_id` to a card `create_charge` call.
3. Pass `customer_ip` on every charge. Production card charges also require `device_session_id`.

This is intentionally incompatible with the unsafe raw-card inputs accepted by versions through `0.2.2`.

## Authentication

Provider requests use HTTP Basic authentication with `OPENPAY_PRIVATE_KEY` as the username and an empty password. The server creates this header; clients must never send the private key as a tool argument.

HTTP transport uses a separate Bearer token from `MCP_HTTP_TOKEN`. This token protects access to the MCP server and is not sent to Openpay.

## HTTP transport

stdio is the default. To enable HTTP locally, generate a random token of at least 32 characters:

```bash
export MCP_HTTP=true
export MCP_HTTP_TOKEN="replace-with-a-random-token-at-least-32-characters"
npx @codespar/mcp-openpay --http
```

The server listens on `127.0.0.1:3000` and requires this header on `/health` and `/mcp`:

```text
Authorization: Bearer <MCP_HTTP_TOKEN>
```

Remote binding requires both a non-loopback host and `MCP_HTTP_ALLOW_REMOTE=true`. Put remote deployments behind TLS and an authenticated reverse proxy; the built-in server is plain HTTP.

## Configuration

| Variable | Default | Purpose |
|---|---:|---|
| `OPENPAY_MERCHANT_ID` | required | Merchant identifier used in the provider URL. |
| `OPENPAY_PRIVATE_KEY` | required | Secret provider key used as the HTTP Basic username. |
| `OPENPAY_ENV` | `sandbox` | `sandbox` or `production`. |
| `OPENPAY_ENABLE_PRODUCTION` | `false` | Required before production endpoints can be used. |
| `OPENPAY_ALLOW_MUTATIONS` | `false` | Enables state-changing and money-moving tools. |
| `OPENPAY_ALLOW_PAYOUTS` | `false` | Enables `create_payout`; mutations must also be enabled. |
| `OPENPAY_REQUEST_TIMEOUT_MS` | `10000` | Provider timeout, from 1,000 through 30,000 ms. |
| `OPENPAY_BASE_URL` | official environment host | HTTPS origin override for testing. |
| `OPENPAY_ALLOW_CUSTOM_BASE_URL` | `false` | Required when the override is not an official Openpay origin. |
| `MCP_HTTP` | `false` | Enables HTTP transport. `--http` also enables it. |
| `MCP_HTTP_TOKEN` | none | Required HTTP Bearer token; minimum 32 characters. |
| `MCP_HTTP_HOST` | `127.0.0.1` | HTTP bind host. |
| `MCP_HTTP_ALLOW_REMOTE` | `false` | Required for non-loopback binding. |
| `MCP_PORT` | `3000` | HTTP port. |
| `MCP_HTTP_RATE_LIMIT_PER_MINUTE` | `60` | Per-client request limit. |

Never put real credentials in MCP configuration committed to source control. A custom base URL receives the Openpay private key, so use it only for a trusted HTTPS test endpoint.

## Tools (23)

Read-only tools: `get_charge`, `get_customer`, `list_customers`, `get_card`, `list_cards`, `list_payouts`, and `list_webhooks`.

Mutation-gated tools: `create_charge`, `capture_charge`, `refund_charge`, `create_customer`, `update_customer`, `delete_customer`, `create_card`, `delete_card`, `create_bank_account`, `delete_bank_account`, `create_plan`, `create_subscription`, `cancel_subscription`, `create_webhook`, and `delete_webhook`.

`create_payout` additionally requires the payout gate.

Customer-scoped resources accept `customer_id`; otherwise supported resources use merchant scope.

## Development

```bash
npm install
npm test -w @codespar/mcp-openpay
npm run build -w @codespar/mcp-openpay
```

Tests use fake credentials and do not call Openpay.

## Official API documentation

[Openpay API documentation](https://documents.openpay.mx/docs/api/index.html)

## Enterprise

Need governance, budget limits, and audit trails for agent payments? [CodeSpar Enterprise](https://codespar.dev/enterprise) adds policy engine, payment routing, and compliance templates on top of these MCP servers.

## License

MIT
