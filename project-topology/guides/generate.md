# Generating a project.yml

Inspect the project's existing files to infer fields. Populate only what you can verify — do not guess or invent values.

## Step 1: Include the schema

Add the following comment to the first line of project.yaml

```yaml
# yaml-language-server: $schema=https://celleb.github.io/project-topology/schema-v1.0.0.json
```

## Step 1: Determine `kind`

| If the project has…                       | Set `kind` to…   |
| ----------------------------------------- | ---------------- |
| No source code, lists other repos         | `workspace`      |
| A backend API or server                   | `service`        |
| A React / Vue / Angular / Next.js app     | `frontend`       |
| An npm / pip / gem / Go module            | `library`        |
| Terraform / CDK / CloudFormation / Pulumi | `infrastructure` |

## Step 2: Gather basic fields

- `version`: Always `"1.0"`.
- `name`: Use the directory name, `package.json#name`, or repo slug.
- `description`: Use `package.json#description`, the README first sentence, or a one-line summary.
- `repo`: Run `git remote get-url origin`. Must start with `https://` or `git@`.
- `tags`: Extract from `package.json#keywords` or leave omitted.

## Step 3: Infer `runtime`

Check `docker-compose.yml` or `compose.yml`:

- `compose_service`: The key under `services:` that runs this project.
- `port`: The host-side port from `ports: ["HOST:CONTAINER"]`.
- `health_check`: Use `healthcheck.test` URL if present, otherwise `http://localhost:<port>/health`.
- `dockerfile`: Path to the Dockerfile if non-standard.

Map well-known `package.json` scripts to `runtime.commands`:

| script name         | command `name` | example `script`                                  |
| ------------------- | -------------- | ------------------------------------------------- |
| `dev` / `start:dev` | `dev`          | `docker compose up <service>`                     |
| `start`             | `start`        | `docker compose up <service>`                     |
| `test`              | `test`         | `docker compose run --rm <service> npm test`      |
| `build`             | `build`        | `docker compose run --rm <service> npm run build` |
| `lint`              | `lint`         | `docker compose run --rm <service> npm run lint`  |

## Step 4: Infer `environments`

Inspect `.env`, `.env.example`, `.env.local`, `.env.staging`, and CI/CD config files.

- `local` → `http://localhost:<port>`
- `review` / `staging` → staging URL from CI env vars or `.env.staging`
- `production` → production URL from CI env vars or deployment config

For `variables`: include non-secret variables from `.env.example` (omit anything that looks like a secret, token, or password).

## Step 5: Infer `depends_on`

Check `docker-compose.yml` → `services.<name>.depends_on` for direct service dependencies.

For each dependency, set `protocol` based on what it is:

| Dependency type         | `protocol` |
| ----------------------- | ---------- |
| HTTP / REST API         | `https`    |
| gRPC service            | `grpc`     |
| RabbitMQ / Kafka / SQS  | `amqp`     |
| npm / pip / gem package | `library`  |

Include an inline `runtime` block only if you can find the compose service details. Include `environments` only if you can find actual URLs.

Also check: connection strings in `.env.example`, import statements, and network calls in source code.

## Step 6: Infer `codeowners`

- Check `CODEOWNERS` (GitHub format: `path @user @team`) — extract usernames as `links[type=github]`.
- Check `package.json#author` and `contributors`.
- Check `git log --format='%an <%ae>'` for frequent recent contributors.

For each owner, populate `name`, optionally `role`, and `links[]` with typed entries (`github`, `slack`, `pagerduty`, etc.).

## Step 7: Validate

After generating, validate the file against the schema:

```bash
node scripts/validate.js path/to/project.yml
```

## Gotchas

- `port` is an integer — `3000` not `"3000"`.
- `repo` must start with `https://` or `git@` — bare names are invalid.
- `projects` is only valid on `kind: workspace` — omit it from all other kinds.
- `depends_on[].runtime` is optional — only include if you can verify the details.
- `environments[].name` is a free-form label — it does not need to match `environments[].type`.
- Do not include secrets, tokens, or passwords in `environments[].variables`.
