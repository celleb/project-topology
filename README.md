# Project Topology

A convention and tooling specification that lets a single AI agent session understand and operate across multiple repositories and services simultaneously.

## The Problem

Engineers working across multi-repo / multi-service platforms waste time managing independent AI sessions per project. Context about how services connect, who owns them, how to run them, and where they live gets lost between sessions.

## The Solution

**`project.yaml`** — a lightweight manifest that every project (workspace, service, library, frontend, or infrastructure) carries at its root. A single AI agent reading these files can:

- Discover how services depend on each other
- Know the protocol between them (`grpc`, `https`, `amqp`, `library`)
- Find environment URLs for local, review, and production
- Run any service using well-known named commands
- Identify code owners and their contact links

## Files

| File                                         | Purpose                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------- |
| `project-topology/assets/schema-v1.0.0.json` | JSON Schema (draft-07) validator for `project.yaml`                       |
| `project-topology/SKILL.md`                  | Agent skill entrypoint                                                    |
| `project-topology/guides/generate.md`        | Step-by-step guide for generating `project.yaml` from an existing project |
| `project-topology/scripts/validate.js`       | Script to validate a `project.yaml` against the schema                    |
| `project.yaml`                               | Full example `project.yaml` for a service                                 |

## Quick Start

### 1. Add a `project.yaml` to your project

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
  - name: Jon Manga
    role: Tech Lead
    links:
      - type: github
        value: celleb
      - type: slack
        value: "@jonmanga"
```

### 2. Install the skill

Copy the `project-topology/` directory into your `.cursor/skills/` directory:

```bash
cp -r project-topology/ ~/.cursor/skills/project-topology/
```

The skill triggers automatically when you ask about service relationships, environment URLs, how to run something, or who owns a project.

## Schema

The full JSON Schema is at [`project-topology/assets/schema-v1.0.0.json`](./project-topology/assets/schema-v1.0.0.json). It enforces:

- `version`, `name`, `kind` required on every project
- `kind` is a closed enum: `workspace | service | library | frontend | infrastructure`
- `environments[].type` is a closed enum: `local | review | production`
- `port` integer between 1–65535
- `repo` must start with `https://` or `git@`
- `additionalProperties: false` on all objects

## Validating a `project.yaml`

Run the bundled script against any `project.yaml`:

```bash
node project-topology/scripts/validate.js path/to/project.yaml
```

Or use the npm script to validate the root `project.yaml`:

```bash
npm test
```

Requires Node.js and project dependencies (`npm install`).

## `project.yaml` Field Reference

| Field          | Required | Description                                                     |
| -------------- | -------- | --------------------------------------------------------------- |
| `version`      | yes      | Schema version, e.g. `"1.0"`                                    |
| `name`         | yes      | Unique project name within the workspace                        |
| `kind`         | yes      | `workspace \| service \| library \| frontend \| infrastructure` |
| `description`  | no       | One-line description                                            |
| `repo`         | no       | Git clone URL                                                   |
| `tags`         | no       | Free-form labels                                                |
| `projects`     | no       | Child projects (workspace only)                                 |
| `depends_on`   | no       | Dependencies (services, DBs, queues, etc.)                      |
| `runtime`      | no       | How to build and run the project                                |
| `environments` | no       | Per-environment URLs and variables                              |
| `codeowners`   | no       | People responsible for the project                              |

See [`project-topology/assets/schema-v1.0.0.json`](./project-topology/assets/schema-v1.0.0.json) for the full field definitions.

## License

MIT
