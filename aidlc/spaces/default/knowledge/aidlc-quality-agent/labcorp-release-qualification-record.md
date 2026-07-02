# LabCorp Release Qualification Record

> **Audience:** QA engineers, QA managers, Release Managers, and the quality agent.
> **When to create:** After **feature QA complete**, when development delivers release components/versions and QA begins snapshot deploy + release regression.
> **Living artifact:** `<record>/quality/release-qualification.md` — one record per release version.
> **Companion docs:** `labcorp-release-process-template.md` (§3.0, §3.7), `labcorp-test-plan-template.md`

Copy this template into `<record>/quality/release-qualification.md` for each release. Complete through regression pass, then **hand off to Release Manager** for release plan and **ServiceNow ITCentral change ticket (CHG)**.

**QA sign-off email:** Do **not** maintain a separate template. §7 below is auto-generated from §1–§5 when regression passes and written to `<record>/quality/qa-release-signoff-email.md` for review and send to business, engineering, product, and project teams.

**Confluence test artifacts registry:** The **Release test artifacts** URL in Document control is a **cumulative Confluence page** (one row per release). §3.1 captures this release's row from Jenkins regression output; the quality agent writes `<record>/quality/confluence-artifact-row.md` for human QA to append to that page.

---

## Document control

| Field                             | Value |
|-----------------------------------|-------|
| **Release display name**          | [e.g., MyHealthCanvas MVP+ R1.0.4] |
| **Release version**               | [e.g., 1.0.4 / R1.0.4] |
| **Fix version / Jira release**    | [Fix version name] |
| **Release items list**            | [Title + URL — e.g., Jira release board / Confluence] |
| **Release test artifacts**        | [Confluence **cumulative registry** page title + URL — append one row per release] |
| **Quality certified environment** | [QA / Stage — environment regression passed on] |
| **QA lead**                       | [Name] |
| **Release Manager**               | [Name] |
| **Status**                        | [In regression / QA qualified / Handed off / CHG created / Sign-off sent] |
| **Last updated**                  | [YYYY-MM-DD] |

---

## 1. Release components (from development)

Development provides this list **after feature QA complete**. QA uses it to create release snapshots.

| # | Component | Version | Build / artifact ref | Veracode scan verified |
|---|-----------|---------|----------------------|------------------------|
| 1 | [e.g., moonshot-ui] | [x.y.z] | [Jenkins job # / URL] | [Y/N — attach PDF] |
| 2 | [e.g., moonshot-api] | [x.y.z] | | |
| 3 | [ ] | | | |

**Dev delivery date:** [YYYY-MM-DD]  
**Received by (QA):** [Name]

---

## 2. Release snapshots and qualified components (QA-created)

QA creates snapshots from §1 components, deploys to the qualified environment, and runs regression. A release may include **one or more snapshot groups** (e.g., separate product snapshots in a combined release).

### Snapshot group 1

| Field | Value |
|-------|-------|
| **Snapshot name** | [e.g., Moonshot Release 1.0.4.0.2] |
| **Created date** | [YYYY-MM-DD] |
| **Deployed to qualified environment** | [Y/N] |
| **Deploy date** | [YYYY-MM-DD] |

| Component | Version |
|-----------|---------|
| [MNS_moonshot-ui] | [release-1.0.5.17] |
| [MNS_moonshot-ai-api] | [release-1.0.4.19] |
| [ ] | [ ] |

### Snapshot group 2 *(add groups as needed)*

| Field | Value |
|-------|-------|
| **Snapshot name** | [e.g., Diagnostic Assistant Analytics Release 1.0.4.0.1] |
| **Created date** | [YYYY-MM-DD] |
| **Deployed to qualified environment** | [Y/N] |
| **Deploy date** | [YYYY-MM-DD] |

| Component | Version |
|-----------|---------|
| [DGN_lvs-moonshot-middleware] | [release-1.0.3.0.4] |
| [ ] | [ ] |

**Qualified environment:** [QA env name — must match Document control § Quality certified environment]  
**Deploy executor:** [QA engineer name]

---

## 3. Release regression — automation

| Field | Value |
|-------|-------|
| **Automation branch** | `release[version]` (e.g., `release2.4.0`) |
| **Test automation repo** | [BitBucket / repo URL] |
| **Jenkins job** | [Job name / URL] |
| **Jenkins build #** | [Build number] |
| **Regression start** | [YYYY-MM-DD HH:MM] |
| **Regression end** | [YYYY-MM-DD HH:MM] |
| **Result** | [Pass / Fail / Pass with exceptions] |

### Jenkins / test artifacts (download — do not link-only)

| Artifact | File / location |
|----------|-----------------|
| Living documentation (HTML) | [Path or attachment] |
| Cucumber report | [Path or attachment] |
| API test report | [Path or attachment] |
| UI test report | [Path or attachment] |
| Veracode scan PDF | [Path or attachment] |

### 3.1 Confluence release test artifacts row *(auto-generated)*

After Jenkins regression completes, populate this row from §3 Jenkins outputs and §4 qualification checks. The quality agent renders it to **`<record>/quality/confluence-artifact-row.md`**. Human QA **appends one row** to the cumulative Confluence page (Document control → Release test artifacts).

| Confluence column | Source / value |
|-------------------|----------------|
| **Release Version** | Document control → Release display name (e.g., ONL R1.2.0) |
| **Release Date** | §3 Regression end date (YYYY-MM-DD) |
| **General Test Artifacts** | Release items list link + living documentation / Cucumber / physical device validation report |
| **UI Test Artifacts** | §3 UI test report or Jenkins UI job link; use `N/A` if not run |
| **API Test Artifacts** | §3 API test report + Jenkins build # (e.g., `ONL R1.2.0 - API Tests - Jenkins Run Build#6`) |
| **UAT** | §4 UAT status link or `Not Needed` |
| **Performance Testing** | Perf metrics / report link or `Not Needed` |
| **Smoke Testing** | §4 / release-process smoke status or `Not Needed` |
| **Notes** | §4 exceptions, hypercare/hotfix path, or blank |

#### Structured row (edit before Confluence paste)

| Field | Value |
|-------|-------|
| Release Version | [ONL R1.2.0] |
| Release Date | [30 Jun 2026] |
| General Test Artifacts | [R1.2.0 Release Items — URL] |
| UI Test Artifacts | [ONL R1.2.0 Release Regression - UI Test Automation Run Report — URL] |
| API Test Artifacts | [ONL R1.2.0 - API Tests - Jenkins Run Build#6 — URL] |
| UAT | [Link / Not Needed] |
| Performance Testing | [ONL Performance metrics Rel 1.2.0 — URL / Not Needed] |
| Smoke Testing | [Link / Not Needed] |
| Notes | [e.g., Hypercare/hotfix — physical device validation only] |
| Confluence row appended | [Y/N — date appended by QA] |

#### AI-DLC auto-generation

| When | Who | Output |
|------|-----|--------|
| Jenkins regression complete (§3 populated) | `aidlc-quality-agent` | `<record>/quality/confluence-artifact-row.md` |
| Before sign-off / CHG handoff | Human QA | Append row to Confluence registry page |

**Generation rules:** Pull General/UI/API links from Jenkins job artifacts and §3 download paths. Use `Not Needed` for UAT, Performance, or Smoke when §4 marks N/A. Download Jenkins reports before links expire (see `labcorp-release-process-template.md` §3.6).

#### Confluence paste format *(table row)*

```
| [S.No — assign in Confluence] | [Release Version] | [Release Date] | [General Test Artifacts links] | [UI Test Artifacts links or N/A] | [API Test Artifacts links] | [UAT] | [Performance Testing] | [Smoke Testing] | [Notes] |
```

#### Example row *(illustrative)*

```
| | ONL R1.2.0 | 30 Jun 2026 | R1.2.0 Release Items | ONL R1.2.0 Release Regression - Physical Device Validation; ONL R1.2.0 Release Regression - UI Test Automation Run Report | ONL R1.2.0 - API Tests - Jenkins Run Build#6 | | ONL Performance metrics Rel 1.2.0 | | |
```

```
| | ONL R1.1.7 | 04 Jun 2026 | R1.1.7 Release Items | N/A | ONL R1.1.7 - API Tests - Jenkins Run | Not Needed | Not Needed | | This release was validated through physical device validation part of the Hypercare/Hotfix release process. |
```

---

## 4. QA qualification summary

| Check | Status | Notes |
|-------|--------|-------|
| Feature QA complete | [Y/N] | |
| Code freeze confirmed | [Y/N] | |
| Release regression passed | [Y/N] | |
| UAT complete (if in scope) | [Y/N / N/A] | |
| Performance complete (if in scope) | [Y/N / N/A] | |
| RTM complete for fix version | [Y/N] | Ref: `<record>/quality/traceability-matrix.md` |
| Defects triaged | [Y/N] | Open P0/P1: [none / list] |

**QA qualification decision:** [Qualified for release / Not qualified — reason]

**QA lead sign-off:** [Name, date]

---

## 5. Handoff to Release Manager

Release Manager uses this section to build the **release plan** and **ServiceNow ITCentral change ticket**.

| Field | Value |
|-------|-------|
| **Handoff date** | [YYYY-MM-DD] |
| **Handoff method** | [Email / ticket / meeting — include distribution list] |
| **Qualified release version** | [Version] |
| **Qualified snapshot name(s)** | [From §2] |
| **Qualified component versions** | [From §1 — or attach table] |
| **Regression evidence** | [§3 artifact bundle location] |
| **Planned stage deploy date** | [YYYY-MM-DD] |
| **Planned prod deploy date** | [YYYY-MM-DD] |
| **Downtime expected** | [Y/N — duration] |
| **Rollback contact** | [Name / runbook ref] |

### ServiceNow ITCentral change ticket

| Field | Value |
|-------|-------|
| **CHG number** | [CHG######## — Release Manager creates/updates] |
| **Short description** | [Release title] |
| **Components in CHG** | [Match §1 — versions QA qualified] |
| **Snapshot / build in CHG** | [Match §2] |
| **QA qualification attached** | [Y/N — attach this document + test artifacts] |
| **CHG status at handoff** | [Draft / Submitted / Approved] |

---

## 6. Related references

| Item | Link / path |
|------|-------------|
| Release process (master) | `<record>/quality/release-process.md` |
| Test plan | `<record>/quality/test-plan.md` |
| Release items (Jira) | [Fix version / release board URL — same as Document control] |
| Release test artifacts (Confluence) | [Cumulative registry — same as Document control; row in §3.1] |
| Confluence artifact row (generated) | `<record>/quality/confluence-artifact-row.md` |
| QA sign-off email (generated) | `<record>/quality/qa-release-signoff-email.md` |

---

## 7. QA release sign-off email *(auto-generated)*

When §4 **Release regression passed** is **Y**, the **quality agent** (or human QA) generates this section and writes the rendered body to **`<record>/quality/qa-release-signoff-email.md`**. Human QA reviews, then sends to **business + engineering + product + project** distribution lists.

### AI-DLC auto-generation trigger

| When | Who | Output |
|------|-----|--------|
| Release regression exit criteria met (§4 pass) | `aidlc-quality-agent` at Build and Test gate or release regression completion | `<record>/quality/qa-release-signoff-email.md` |
| Jenkins regression complete (§3 populated) | `aidlc-quality-agent` | `<record>/quality/confluence-artifact-row.md` (§3.1 — append to Confluence registry) |
| Before production deploy | Human QA sends email; optional QA manager approval | Email client / archive copy in Confluence |

**Generation rules:** Populate every `[placeholder]` from Document control, §2 snapshot groups, §3 Jenkins evidence, and §6 links. Do not send until human QA confirms recipients and §4 qualification decision is **Qualified for release**.

### Email metadata

| Field | Value |
|-------|-------|
| **Subject** | QA Release Sign-off — [Release display name] — Regression Complete |
| **To** | [business distro / team list] |
| **Cc** | Engineering, Product, Project, Release Manager, QA Manager |
| **Sent date** | [YYYY-MM-DD — fill when sent] |
| **Sent by** | [QA lead name] |

### Email body template

Copy below into `qa-release-signoff-email.md` with placeholders resolved:

```
Team,

QA Release Regression Testing is COMPLETE for [Release display name], and we can proceed with deploy to Production.

Release Items List: [Release items list title + URL]
Release Test Artifacts: [Release test artifacts Confluence title + URL]
Quality Certified on Environment: [Quality certified environment — e.g., QA]

Release Snapshots and Component Versions:

[Snapshot group 1 name]

Component                          Version
[component-1]                      [version-1]
[component-2]                      [version-2]

[Snapshot group 2 name — omit if single snapshot]

Component                          Version
[component-1]                      [version-1]

Automation branch: release[version] | Jenkins build: [build #] | Regression result: [Pass]
Veracode / security scan: [attached / link — from §3]

Notes: [exceptions or N/A]

[QA lead name]
[Title / Clinical Development QA]
```

### Example *(illustrative — replace with intent-specific values)*

```
Team,

QA Release Regression Testing is COMPLETE for MyHealthCanvas MVP+ R1.0.4 Release, and we can proceed with deploy to Production.

Release Items List: My Health Canvas MVP+ R1.0.4 Release Items
Release Test Artifacts: My Health Canvas - MVP+ R1.0.4 Release Test Artifacts
Quality Certified on Environment: QA

Release Snapshots and Component Versions:

Moonshot Release 1.0.4.0.2

Component                          Version
MNS_moonshot-ai-api                release-1.0.4.19
MNS_moonshot-mcp                   release-1.0.4.5
MNS_moonshot-patient-api           release-1.0.3.0.2
MNS_moonshot-ui                    release-1.0.5.17
MNS_tf-aws-database-infrastructure release-1.0.0.1

Diagnostic Assistant Analytics Release 1.0.4.0.1

Component                          Version
DGN_lvs-moonshot-middleware        release-1.0.3.0.4
```

---

*Template: LabCorp QA release qualification. Populate during Stage 3.6+ regression; auto-generate §3.1 Confluence row and §7 sign-off email before stage/prod promotion.*
