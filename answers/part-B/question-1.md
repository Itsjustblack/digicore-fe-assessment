# Multi-Bank Custom UI Engine: High Level Design

## Bank Identity: Hybrid Approach (Subdomain + Auth Token)

The bank is identified in two phases, one before login and one after, to balance UX and security.

**Phase 1: Subdomain (before login)**

- Read the subdomain (e.g. `bankA.app.com`) on app start
- Fetch the **public config** (no auth) to brand the login screen
- A competitor visiting `bankB.app.com` sees only a branded login screen. Nothing private is exposed
- An unknown subdomain shows a generic error screen, never a blank page

**Phase 2: Auth token (after login)**

- User logs in. The token carries a verified `bankId`
- Fetch the **full config** (auth-gated) for that bank
- The token is the source of truth. It overrides the subdomain if they disagree

### Config Schema: Two Levels

**Public Config.** Fetched by subdomain, no auth. Safe to expose before login, and holds no sensitive data.

```json
{
	"bankId": "bank-a",
	"theme": {
		"primary-color": "#003366"
	},
	"logoUrl": "https://cdn.app.com/banks/bank-a/logo.svg"
}
```

**Full Config.** Auth-gated. Extends the public config with everything needed to run the app after login.

```json
{
	"bankId": "bank-a",
	"version": "1.0",
	"theme": { "...": "..." },
	"logoUrl": "https://cdn.app.com/banks/bank-a/logo.svg",
	"layout": {
		"dashboard": ["AccountSummary", "TransactionList", "QuickTransfer"],
		"payments": ["QuickTransfer", "BulkPayments"],
		"settings": ["ProfileCard", "SecuritySettings"]
	},
	"onboarding": [
		{ "key": "personal-details", "active": true },
		{
			"key": "id-verification",
			"active": true,
			"extensions": ["biometric-check"]
		},
		{ "key": "account-preferences", "active": false }
	],
	"features": {
		"bulk-payments": true,
		"fx-transfers": false,
		"overdraft-requests": true,
		"export-statements": false
	}
}
```

The two levels are fetched and stored separately, so the app never uses partial config before login.

---

## Bootstrap Flow

```
Phase 1 - Before login
----------------------
  User visits bankA.app.com
            |
            v
  Read subdomain
            |
            v
  Fetch public config  (no auth, no sensitive data)
            |
            v
  Apply theme to CSS variables
            |
            v
  Render branded login screen
            |
            v

Phase 2 - After login
---------------------
  User logs in  (SSO/SAML or standard)
            |
            v
  Auth token carries verified bankId
            |
            v
  Fetch full config  (auth-gated)
            |
            v
  Config stored --> Feature flags loaded
            |
            v

Phase 3 - App Shell
-------------------
  Layout Renderer renders components by config order
  Nav shows flag-enabled links only
  Route guards activated
  Flow Orchestrator steps through onboarding
  Validation Factory builds field validators
```

---

## UI Layout: Component Registry + Config-Driven Order

Every UI component is built once and registered in a **ComponentRegistry**, a map of string keys to components. No bank has its own component.

For each page, the config's `layout` block holds a list of component keys in the order they should appear. A **Layout Renderer** reads that list and renders each component by its key.

```json
{
	"layout": {
		"dashboard": ["AccountSummary", "TransactionList", "QuickTransfer"],
		"payments": ["QuickTransfer", "BulkPayments"],
		"settings": ["ProfileCard", "SecuritySettings"]
	}
}
```

So banks get different layouts purely from config, with no new code. Two safeguards keep it robust:

- **Lazy loading.** Each key maps to a lazy import, so only the components a bank actually uses are downloaded, no matter how many exist in total.
- **Unknown key.** A **fallback placeholder** renders in that slot, so one bad key doesn't break the page.

**Angular mechanics.** Keys map to lazy loaders (`() => import('./account-summary.component')…`), and the Layout Renderer renders each resolved component with `ngComponentOutlet`. Adding a component is one registry entry, with no per-bank template branching.

---

## Theming: CSS Custom Properties

All components style themselves with **CSS variables** (e.g. `var(--primary-color)`), never hardcoded colours. The values come from the `theme` block in the config:

```json
{
	"theme": {
		"primary-color": "#003366"
	}
}
```

At runtime, code writes each `theme` entry onto a CSS custom property on the document root, so every component picks up the active bank's brand automatically, with zero style duplication across banks.

- **Public config** applies the base theme at bootstrap, so the login screen is branded before auth
- **Full config** can extend or override it post-auth

---

## Onboarding Flow: Step Orchestrator

Banks differ most in _which fields they collect_. Hardcoding fields in components would make every change a deploy, so the config gives each bank an ordered list of steps. A step is one of two types:

- **`form`** (common case). A data-collection step whose inputs live entirely in config
- **`component`** (bespoke case). A step with real logic that isn't just inputs (ID verification, biometric, OTP, upload), referenced by key

Each step has:

- `key`: step identifier
- `type`: `"form"` or `"component"`
- `active`: on/off switch per bank
- `fields`: for `form` steps, the ordered inputs (each `{ key, label, control, validation }`)
- `extensions`: extra steps injected after this one (optional)

```json
{
	"onboarding": [
		{
			"key": "personal-details",
			"type": "form",
			"active": true,
			"fields": [
				{
					"key": "firstName",
					"label": "First name",
					"control": "text",
					"validation": [{ "type": "required" }]
				},
				{
					"key": "phoneNumber",
					"label": "Phone number",
					"control": "text",
					"validation": [
						{ "type": "required" },
						{ "type": "pattern", "value": "^[0-9]{11}$" }
					]
				}
			]
		},
		{
			"key": "id-verification",
			"type": "component",
			"active": true,
			"extensions": ["biometric-check"]
		},
		{
			"key": "account-preferences",
			"type": "form",
			"active": false,
			"fields": []
		}
	]
}
```

A **Flow Orchestrator** walks the step list, skips inactive steps, and injects each step's `extensions`, so base flows extend without a rebuild. The field-level `validation` reuses the _exact same shape_ as the Validation Factory below, not a parallel mechanism.

A `form` step renders via a generic `DynamicFormStep`, which builds a `FormGroup` by passing each field's `validation` to the Validation Factory, inheriting all three tiers with no new code. A `component` step resolves through the same lazy-loaded registry as the UI Layout.

---

## Config-Driven Validation Factory

Validation is declared **per field**, inside a form's `fields` (like the onboarding example above), never as a top-level block. Each field carries a `validation` array, and a **Validation Factory** turns it into real validators at form-build time. No validation logic is hardcoded. It handles three kinds of rule.

**1. Simple field rules.** The common case is one declarative rule (`required`, `pattern`, `min`, `email`). Each is a flat `{ type, value }` pair the factory maps to a built-in `Validators` function. Pure config.

```json
{
	"key": "phoneNumber",
	"label": "Phone number",
	"control": "text",
	"validation": [
		{ "type": "required" },
		{ "type": "pattern", "value": "^[0-9]{11}$" }
	]
}
```

**2. Custom logic rules.** Rules JSON can't express (Luhn check, IBAN checksum, "age ≥ 18 from DOB"). The logic lives in code as a **named validator**, and config references it by **string key**, the same registry pattern used for components.

```json
{
	"key": "accountNumber",
	"label": "Account number",
	"control": "text",
	"validation": [
		{ "type": "required" },
		{ "type": "custom", "validator": "luhn-check" }
	]
}
```

**3. Cross-field rules.** Outcome depends on _another_ field (e.g. "Tax ID required only when account type is business"). The rule just carries an optional `when` clause referencing a sibling field.

```json
{
	"key": "taxId",
	"label": "Tax ID",
	"control": "text",
	"validation": [
		{ "type": "required", "when": { "field": "accountType", "equals": "business" } }
	]
}
```

A `when` rule attaches at **group level** so it re-evaluates when the referenced field changes. The same `when` covers confirm-field matches, date ordering, and conditional-required fields, per-bank, with no new code.

Every tier compiles to a standard `ValidatorFn` at build time, so the form layer never knows the rules came from config.

---

## Feature Flags

Each bank's enabled features come from a `features` map in the full config.

```json
{
	"features": {
		"bulk-payments": true,
		"fx-transfers": false,
		"overdraft-requests": true,
		"export-statements": false
	}
}
```

The flag map is enforced on the UI using Angular's route guards.

---

## Config Versioning & Propagation

Every config carries a single `version` (e.g. `1.0`) that increments on each admin save (`1.0` to `1.1`).

```
  Frontend polls version endpoint
            |
            v
  remote version > local version ?
       |              |
      no             yes
       |              |
       v              v
   do nothing   reload / prompt to reload
                      |
                      v
              fetch latest config
```

The frontend polls a lightweight version endpoint and compares it against the local version it currently holds. If the remote version is higher, the config has changed, so the frontend either forces a reload or prompts the user to reload to pick up the new config.

This keeps live sessions current without depending on the user happening to refresh, and needs no persistent connection, which fits a low-frequency, admin-triggered source.

---
