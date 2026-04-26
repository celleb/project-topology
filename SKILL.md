---
name: project-topology
description: "Use this skill whenever working in a multi-service or multi-repo workspace. Triggers: questions about how services connect, how to run or debug a service, which services are affected by a change, environment URLs or connection details, or who owns a service. Also triggers when asked to generate or create a project.yml for a project. A project.yml file at the workspace root is the source of truth for all of this."
---

# Project Topology

Read `project.yml` at the workspace root. Use `schema/project.schema.json` to interpret it.

Do not guess at service relationships, ports, commands, environments, or owners — they are declared in `project.yml`.

To generate a `project.yml` for an existing project, follow `guides/generate.md`.
