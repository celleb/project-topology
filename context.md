# Project Topology — Session Export

This document captures the full context of the design session so it can be continued in a new Claude session without loss of context.

---

## Vision

Engineers working across multiple repositories waste time managing independent AI sessions per project. The goal was to design a convention that allows a single AI agent session to understand and operate across a multi-repo/multi-service platform.

### Requirements (original)
- One AI session to work on multiple projects/repositories
- Context and instructions from related projects contribute to solutions
- Agents can discover project relationships
- Agents understand how projects are connected locally, on review, and production
- Agents respect per-project instructions without mixing them up
- Agents know contributors and code owners
- Agents understand how to spin up each project (e.g. Docker)
- Agents understand how to connect relevant resources

---

## What We Built

### 1. `project.yml` — The Manifest

A unified manifest file that lives at the root of every project (workspace or service). The schema is identical across all project kinds — `kind` determines which fields apply.

**Key design decisions:**
- `kind: workspace` — a shell project with no code, only `projects` listing child services
- `kind: service | library | frontend | infrastructure` — real projects with full field set
- `projects` — workspace-only field listing child projects (formerly `members`)
- `depends_on` — typed array covering everything a project needs: other services (`type: service`), libraries, databases, caches, queues, external APIs. Each entry optionally carries its own `runtime` and `environments` so dependency context is available inline.
- `environments` — typed array (`local | review | production`). Use `name` qualifier for multiple of same type (e.g. multi-region prod)
- `runtime.commands` — array of `{name, script}` instead of a flat map
- `environments[].variables` — free-form map of env var names to values/Vault paths
- `codeowners` — flat list of people with typed `links` (`github`, `slack`, `pagerduty`, etc.)
- `consumed_by` was removed — considered a data integrity risk, tooling should derive it by scanning all files
- `language` was removed — lives implicitly in `agents` stack or `runtime.commands`
- `agents` block was removed — keep repo-specific conventions in `AGENTS.md` per repo
- `rules` were removed from workspace level
- `workflows` section was removed

### 2. `project.schema.json` — JSON Schema Validator

A JSON Schema (draft-07) that validates any `project.yml`. Uses `$defs` for shared definitions (`runtime`, `environment`, `command`, `codeowner`, `link`). Validated and working.

**Key constraints enforced:**
- `version`, `name`, `kind` required on every project
- `kind` is a closed enum
- `environments[].type` is a closed enum (`local | review | production`)
- `port` integer between 1–65535
- `repo` must start with `https://` or `git@`
- `additionalProperties: false` on all objects
- `link.type` is open-ended (no enum) — teams add `pagerduty`, `linear`, `jira` freely

### 3. `project-topology` Skill

A skill that enables any AI agent to discover and use `project.yml` without being told it exists.

**Structure:**
```
project-topology/
├── SKILL.md                      # trigger + 4 lines of instruction
├── schema/
│   └── project.schema.json       # JSON Schema (same file as #2 above)
└── guides/
    └── generate.md               # how to generate project.yml from an existing project
```

**How it works:**
- `SKILL.md` frontmatter triggers the skill when the agent is asked about service relationships, running services, environments, ownership, or generating a `project.yml`
- Body tells the agent to read `project.yml` and use the schema to interpret it
- `generate.md` tells the agent how to produce a `project.yml` from an existing project by inspecting `package.json`, `Dockerfile`, `docker-compose.yml`, `.env.example`, `CODEOWNERS`, and CI/CD files

---

## Final Schema

```yaml
version: string
name: string
kind: string                # workspace | service | library | frontend | infrastructure
description?: string
repo?: string
tags?: [string]

projects?:                  # workspace only
  - name: string
    description: string
    path?: string
    repo?: string

depends_on?:
  - name: string
    path?: string
    repo?: string
    protocol?: string       # grpc | https | amqp | library
    runtime?:
      compose_service: string
      port?: int
      health_check?: string
      commands:
        - name: string
          script: string
    environments?:
      - type: string        # local | review | production
        name: string
        url?: string
        description?: string
        variables?: {}

runtime?:
  dockerfile?: string
  compose_service: string
  port?: int
  health_check?: string
  commands:
    - name: string
      script: string

environments?:
  - type: string
    name: string
    url?: string
    description?: string
    variables?: {}

codeowners?:
  - name: string
    team?: string
    role?: string
    links?:
      - type: string
        value: string
```

---

## Recommendations Not Yet Acted On

From the review session, these were flagged but not implemented:

1. **`version` field** — added to schema, not yet discussed whether to increment to `1.1` etc.
2. **`contacts` / team channel** — `codeowners[].links` covers this but no oncall channel field at project level
3. **Well-known `runtime.commands` names** — `start`, `stop`, `logs`, `build`, `dev`, `test`, `lint` are implied conventions but not enforced by schema
4. **`frontend` and `infrastructure` kind examples** — spec only shows `workspace`, `service`, and `library` examples
5. **CI/CD integration** — no field linking a service to its pipeline URL or artifact registry
6. **MCP server** — discussed as a future enhancement. Would expose `get_project`, `list_projects`, `trace_dependencies`, `get_environments`, `get_runtime_commands`, `get_codeowners` as tools. Deferred.

---

## Files in This Export

| File | Purpose |
|---|---|
| `context.md` | This document |
| `project-yml-spec.md` | Full spec with examples for all project kinds |
| `project.schema.json` | JSON Schema validator |
| `project-topology/SKILL.md` | Skill entrypoint |
| `project-topology/schema/project.schema.json` | Schema resource (same as above) |
| `project-topology/guides/generate.md` | Generation guide |

---

## Suggested Next Steps

- Add `frontend` and `infrastructure` example `project.yml` files to the spec
- Decide on well-known command name conventions (`start`, `stop`, `test`, `lint`, `build`, `dev`)
- Add a `project validate` CLI command that runs the JSON Schema against any `project.yml`
- Add a `project generate` CLI command that runs the generation guide automatically
- Consider a `contacts` field at project level for oncall/team channels
- Build the MCP server when ready
