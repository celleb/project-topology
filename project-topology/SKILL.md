---
name: project-topology
description: "Reads project.yaml or project.yml manifests to understand a project, multi-service and multi-repo workspaces. Use, to understand how services connect, what protocol services use, how to run or debug a service, which environment URLs to use, who owns a service, or when asked to generate a project.yaml for an existing project."
license: MIT
metadata:
  version: "1.0"
compatibility: Project-level skill. Install in .agents/skills/project-topology/ at the repository root. Requires a project.yaml or project.yml at the project root (or child project roots). Any agent that can read files and YAML.
---

# Project Topology

A `project.yaml` at each project root declares how services connect, how to run them, where they live, and who owns them. .

## Core rule

Read the `project.yaml` to understand the project's topology

Validate any `project.yaml` you read or write against [assets/schema-v1.0.0.json](assets/schema-v1.0.0.json).

## Reading workspaces

A `kind: workspace` project lists child projects in `projects[]`. Each entry may have a `path` (local clone) or `repo` (remote URL). Read the `project.yaml` in each child to get full context on that service.

## Generating a `project.yaml`

When asked to create or generate a `project.yaml` for an existing project, follow `guides/generate.md`.

## Gotchas

- `depends_on` covers everything a project needs: other services, databases, caches, queues, and external APIs — not just other `project.yaml` projects.
- `environments[].name` is a human label (e.g. `"prod"`, `"us-east"`) and need not match `environments[].type`.
- `runtime.commands` is an array of `{name, script}` objects — there is no flat command map.
- `projects` is only valid on `kind: workspace`. Do not add it to services or libraries.
