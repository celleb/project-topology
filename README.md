# Project Topology

A convention and tooling specification that lets a single AI agent session understand and operate across multiple repositories and services simultaneously.

## The Problem

Engineers working across multi-repo / multi-service platforms waste time managing independent AI sessions per project. Context about how services connect, who owns them, how to run them, and where they live gets lost between sessions.

## The Solution

`**project.yaml**` — a lightweight manifest that every project (workspace, service, library, frontend, or infrastructure) carries at its root. It is the first place an AI agent should look before carrying out tasks across a multi-service platform. From a single file an agent can:

- Understand how services depend on each other and what protocols they use
- Start, test, or build any service using declared commands
- Resolve environment URLs for local, review, and production
- Identify code owners and contact details

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

`project-topology/` is an [Agent Skills](https://agentskills.io)-compatible skill that works with any supporting agent.

#### Using [skills.sh](https://skills.sh) (recommended)

```bash
npx skills add celleb/project-topology
```

Installs to `.agents/skills/` in your project by default. Add `-g` to install globally across all projects:

```bash
npx skills add celleb/project-topology -g
```

#### Manual install

Copy the `project-topology/` directory into `.agents/skills/` at your repository root:

```bash
cp -r project-topology/ .agents/skills/project-topology/
```

Most agents also support a global skills directory:

| Agent | Global skills directory |
|---|---|
| Cursor | `~/.cursor/skills/` |
| Claude Code | `~/.claude/skills/` |
| Gemini CLI | `~/.gemini/skills/` |
| OpenCode / Amp | `~/.config/agents/skills/` |

Refer to your agent's documentation for the exact path if it isn't listed above.

The skill activates automatically when working on tasks that involve running or debugging services, tracing dependencies, resolving environment URLs, or understanding who owns a project. It uses `project.yaml` as the first point of reference before falling back to other sources like `docker-compose.yml`, `package.json`, or source code.

## Schema

The schema is published at:

```
https://celleb.github.io/project-topology/schema-v1.0.0.json
```

The source is at [`project-topology/assets/schema-v1.0.0.json`](./project-topology/assets/schema-v1.0.0.json). It enforces:

- `version`, `name`, `kind` required on every project
- `kind` is a closed enum: `workspace | service | library | frontend | infrastructure`
- `environments[].type` is a closed enum: `local | review | production`
- `port` integer between 1–65535
- `repo` must start with `https://` or `git@`
- `additionalProperties: false` on all objects

## Validating a `project.yaml`

### VS Code

Install the [YAML extension](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) [![YAML](https://img.shields.io/badge/VS%20Code-YAML%20extension-blue?logo=visualstudiocode)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) to get inline validation, autocomplete, and hover docs for every `project.yaml` in your workspace.

Once the skill is installed at `.agents/skills/project-topology/`, add this to your `.vscode/settings.json`:

```json
{
  "yaml.schemas": {
    "./.agents/skills/project-topology/assets/schema-v1.0.0.json": [
      "project.yaml",
      "project.yml",
      "**/project.yaml",
      "**/project.yml"
    ]
  }
}
```

This repository already includes this config in [`.vscode/settings.json`](./.vscode/settings.json) and recommends the extension via [`.vscode/extensions.json`](./.vscode/extensions.json).

Alternatively, add a comment at the top of any `project.yaml` to enable validation in any workspace without settings:

```yaml
# yaml-language-server: $schema=https://celleb.github.io/project-topology/schema-v1.0.0.json
```

### CLI

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

See [project-topology/assets/schema-v1.0.0.json](project-topology/assets/schema-v1.0.0.json) for the full field definitions.

## License

MIT
