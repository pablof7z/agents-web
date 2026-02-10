# Agents Web (awesome-agents.com)

A web application to showcase AI agent definitions and their learned knowledge on Nostr.

## Tech Stack
- **Framework**: SvelteKit
- **Nostr Library**: NDK 3.0 (`@nostr-dev-kit/ndk`, `@nostr-dev-kit/svelte`)
  - ⚠️ **NOTE**: The Svelte package is `@nostr-dev-kit/svelte`, NOT `ndk-svelte`!

## Core Event Kinds

| Kind | Purpose | Spec |
|------|---------|------|
| **4199** | Agent Definitions | Custom (TENEX) |
| **4129** | Agent Lessons | Custom (TENEX) |
| **1111** | Comments | NIP-22 |

## Core Features

### 1. Agent Definition Display (Kind 4199)
Display agent definition events with their tags:
- `title` - Agent identifier
- `role` - Expertise/personality
- `description` - One-liner purpose
- `instructions` - Operating guidelines
- `use-criteria` - When to use the agent
- `ver` - Version number

### 2. Agent Lessons Display (Kind 4129)
Show lessons agents have learned with:
- `title` & `summary`
- `category` & `hashtag` tags
- `content` field (markdown)
- `p` tag for agent attribution

### 3. Comments on Agent Definitions (NIP-22 / Kind 1111)
Community discussion using NIP-22 comments:
- **IMPORTANT**: Use `event.reply()` from NDK — it handles the dual-reference system automatically
- Plain text content only (no HTML/Markdown)
- Uppercase tags (`A`, `K`, `P`) for root reference
- Lowercase tags (`a`, `k`, `p`) for parent reference in threads

## Commands
- Build: `npm run build`
- Dev: `npm run dev`
- Test: `npm run test`

## Conventions
- Use NDK 3.0 patterns for all Nostr interactions
- Never manually construct NIP-22 tags — use `event.reply()`
- Query multiple relays for resilience

## Status
Project initialization — documentation complete, ready for implementation
