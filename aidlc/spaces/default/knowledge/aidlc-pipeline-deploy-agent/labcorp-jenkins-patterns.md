# Labcorp Jenkins Patterns

Labcorp-specific CI patterns for **aidlc-pipeline-deploy-agent**. Extends Tier 1 framework knowledge in `.claude/knowledge/aidlc-pipeline-deploy-agent/` (generic CI/CD patterns). Tier 2 wins for Labcorp Jenkins and UCD delivery.

## Two Jenkins patterns at Labcorp

| Repo type | Jenkins pattern | Purpose |
|-----------|-----------------|---------|
| **TFCOM / TFMOD module** | `terraform.IaCTests(testConfig)` | Validate module with setup/application tests |
| **Application infra repo** | Declarative pipeline + `ucdgoals.createVersionWithArtifact` | Package Terraform and publish UCD component |

## Pattern 1 — TFCOM module CI (IaC Tests)

**Used in:** TFCOM catalog module repos.

**Reference:** `TFCOM/opensearch_serverless/Jenkinsfile`

```groovy
testDirs = [ 'setup', 'application' ]
terraformVersions = [ '1.13', '1.14' ]
testConfig = [
  testDirs: testDirs,
  terraformVersions: terraformVersions,
  "c-aoss-c": [
    [ labels: 'c-aoss-c' ],
  ]
]

terraform.IaCTests(testConfig)
```

**Requirements for module repos:**

- `testing/setup/` — prerequisite infrastructure for tests
- `testing/application/` — module under test
- `labels` value matching test config key
- Terraform versions listed must be supported by org Jenkins shared library

**When AI-DLC designs a new TFCOM-style module**, include this Jenkinsfile structure and matching `testing/` layout.

## Pattern 2 — Application infra repo (UCD upload)

**Used in:** Team-owned `tf-aws-*-infrastructure` repos.

```groovy
pipeline {
    agent { label 'buildfarm' }

    stages {
        stage('Set Environment Variables and Build Options') {
            steps {
                script {
                    commonutils.setDefaultEnvironmentVariables()
                    commonutils.loadJenkinsEnvCommonsPropertiesFile()
                    commonutils.environmentVariablesFinalSteps()
                    commonutils.setBuildOptions(...)
                    commonutils.checkoutScm()
                }
            }
        }
        stage('Prepare Terraform') {
            steps {
                script {
                    awscli.prepareTerraformBaseInfrastructure("${env.AWS_PROFILES}")
                }
            }
        }
        stage('Update UCD Component') {
            steps {
                script {
                    ucdgoals.createVersionWithArtifact(
                        "${env.UCD_COMPONENT_NAME}",
                        "${env.UCD_ARTIFACTS_TO_UPLOAD_BASE_DIRECTORY}",
                        "${env.UCD_ARTIFACTS_TO_UPLOAD_INCLUDE_FILE_PATTERN}"
                    )
                }
            }
        }
    }
    post {
        always {
            script { commonutils.publishResults("publishresults") }
        }
        success { cleanWs() }
    }
}
```

**Key Jenkins shared library steps:**

- `commonutils.*` — env setup, SCM checkout, build retention
- `awscli.prepareTerraformBaseInfrastructure` — Terraform execution context
- `ucdgoals.createVersionWithArtifact` — publish versioned artifact to UCD

Environment variables (`UCD_COMPONENT_NAME`, artifact paths, AWS profiles) come from Jenkins env commons properties — do not hardcode in repo without team standards.

## Choosing the pattern

```text
Is this a catalog module repo (TFCOM/TFMOD)?
  YES -> terraform.IaCTests
  NO  -> Is this application infrastructure for UCD deploy?
          YES -> declarative pipeline + ucdgoals.createVersionWithArtifact
          NO  -> Application code repo — `[TBD — Platform/DevOps]` (Jenkins, CodePipeline, or GitHub Actions per team)
```

## Application code pipelines

Application code repos (`.NET`, Java, Node, etc.) are **not** covered by the two patterns above. Confirm CI/CD with DevOps before designing pipelines. See `labcorp-backend-stacks.md` and `labcorp-frontend-stacks.md` for build/test conventions.

## Quality gates (typical)

Before merge to main/develop:

- `terraform fmt` / `validate` (local via TFiTOOL or CI)
- IaC tests pass for module repos
- PR review per team standards
- Security scanning (e.g. Snyk) per org policy

## AI-DLC pipeline agent outputs

When leading CI Pipeline stage, produce:

1. Correct Jenkinsfile pattern for repo type
2. Required `testing/` structure (module repos)
3. List of Jenkins env vars needed (reference, not invent values)
4. Note that UCD promotion is separate from Jenkins build success

## See also

- `labcorp-ucd-deploy-flow.md` — UCD promotion after Jenkins build
- `aidlc-aws-platform-agent/labcorp-application-tf-layout.md` — infra repo layout
- `aidlc-aws-platform-agent/labcorp-terraform-remote-state.md` — state backend used at deploy time
