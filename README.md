# Project Topology

A convention and tooling specification that lets a single AI agent session understand and operate across multiple repositories and services simultaneously.

## The Problem

Engineers working across multi-repo / multi-service platforms waste time managing independent AI sessions per project. Context about how services connect, who owns them, how to run them, and where they live gets lost between sessions.

## The Solution

**`project.yml`** — a lightweight manifest that every project (workspace, service, library, frontend, or infrastructure) carries at its root. A single AI agent reading these files can:

- Discover how services depend on each other
- Know the protocol between them (`grpc`, `https`, `amqp`, `library`)
- Find environment URLs for local, review, and production
- Run any service using well-known named commands
- Identify code owners and their contact links

## Files

| File | Purpose |
|---|---|
| `project.schema.json` | JSON Schema (draft-07) validator for `project.yml` |
| `SKILL.md` | Cursor skill — drop into `.cursor/skills/` to activate |

## Quick Start

### 1. Add a `project.yml` to your project

```yaml
version: "1.0"
name: my-service
kind: service
description: Handles user authentication

runtime:
  compose_service: auth-service
  port: 3001
  health_check: http://localhost:3001/health
  commands:
    - name: dev
      script: docker compose up auth-service
    - name: test
      script: docker compose run --rm auth-service npm test

environments:
  - type: local
    name: local
    url: http://localhost:3001
  - type: production
    name: prod
    url: https://auth.example.com

depends_on:
  - name: postgres
    protocol: https
    runtime:
      compose_service: postgres
      port: 5432
      commands:
        - name: start
          script: docker compose up postgres

codeowners:
  - name: Jane Smith
    role: Tech Lead
    links:
      - type: github
        value: janesmith
      - type: slack
        value: "@jane"
```

### 2. Use the Cursor Skill

Copy `SKILL.md` and `project.schema.json` into your `.cursor/skills/project-topology/` directory. The skill triggers automatically when you ask about service relationships, environment URLs, how to run something, or who owns a project.

## Schema

The full JSON Schema is at [`project.schema.json`](./project.schema.json). It enforces:

- `version`, `name`, `kind` required on every project
- `kind` is a closed enum: `workspace | service | library | frontend | infrastructure`
- `environments[].type` is a closed enum: `local | review | production`
- `port` integer between 1–65535
- `repo` must start with `https://` or `git@`
- `additionalProperties: false` on all objects

## `project.yml` Field Reference

| Field | Required | Description |
|---|---|---|
| `version` | yes | Schema version, e.g. `"1.0"` |
| `name` | yes | Unique project name within the workspace |
| `kind` | yes | `workspace \| service \| library \| frontend \| infrastructure` |
| `description` | no | One-line description |
| `repo` | no | Git clone URL |
| `tags` | no | Free-form labels |
| `projects` | no | Child projects (workspace only) |
| `depends_on` | no | Dependencies (services, DBs, queues, etc.) |
| `runtime` | no | How to build and run the project |
| `environments` | no | Per-environment URLs and variables |
| `codeowners` | no | People responsible for the project |

See the [project.schema.json](./project.schema.json) for the full field definitions.

## Roadmap

- [ ] `frontend` and `infrastructure` example `project.yml` files
- [ ] Well-known command name conventions (`start`, `stop`, `test`, `lint`, `build`, `dev`)
- [ ] `project validate` CLI — runs JSON Schema against any `project.yml`
- [ ] `project generate` CLI — auto-generates `project.yml` from existing project files
- [ ] MCP server exposing `get_project`, `list_projects`, `trace_dependencies`, `get_environments`, `get_codeowners`

## License

MIT
