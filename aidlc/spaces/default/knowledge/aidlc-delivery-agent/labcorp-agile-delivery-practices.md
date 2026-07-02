# Labcorp Agile Delivery Practices

Standard practices for agile software delivery at Labcorp.

---

## Sprint Goals

**Good Sprint Goals:**
```
✅ "Enable patients to schedule lab appointments online"
✅ "Reduce API response time below 500ms for all endpoints"
✅ "Complete PHI encryption for all patient data at rest"
```

**Bad Sprint Goals:**
```
❌ "Complete 40 story points"
❌ "Work on various features"
❌ "Make progress on the backlog"
```

---

## Story Writing Guidelines

### User Story Template

```markdown
## User Story
As a [patient/physician/administrator]
I want [action/capability]
So that [business value/benefit]

## Acceptance Criteria
Given [context/precondition]
When [action/trigger]
Then [expected outcome]

And [additional criteria]

## Technical Notes
- Integration with Epic scheduling API required
- Must handle concurrent booking conflicts
- Performance: API response < 500ms

## Definition of Done
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests
- [ ] Security review
- [ ] API documentation updated
```

### Example: Patient Appointment Scheduling

```markdown
## User Story
As a patient
I want to schedule lab appointments online
So that I can book at my convenience without calling the clinic

## Acceptance Criteria

### Happy Path
Given I am a registered patient with verified insurance
When I select an available appointment slot
Then I receive a confirmation email within 30 seconds
And the appointment appears in my portal dashboard

### Insurance Verification
Given I select an appointment slot
When my insurance cannot be verified automatically
Then I see a message "Insurance verification pending - we'll contact you"
And the appointment is marked as pending verification

### Slot Conflict
Given I am selecting an appointment slot
When another patient books the same slot while I'm filling the form
Then I see an error "This slot is no longer available"
And the system refreshes available slots

### Cancellation
Given I have a confirmed appointment
When I cancel more than 24 hours in advance
Then I receive a cancellation confirmation
And the slot becomes available for other patients

## Technical Notes
- Epic Scheduling API integration (REST)
- Real-time slot availability check (websocket)
- Insurance verification via Availity API
- Email via SendGrid
- Maximum 1000 concurrent users

## Non-Functional Requirements
- API response time: < 500ms (p95)
- Mobile responsive
- WCAG 2.1 AA compliant
- HIPAA compliant data handling

## Definition of Done
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests with Epic API mock
- [ ] E2E tests (happy path + error scenarios)
- [ ] Security review completed
- [ ] Load testing (1000 concurrent users)
- [ ] API documentation updated
- [ ] User guide updated
- [ ] Demo ready
```

---

## Release Management

> **See also:** At AI-DLC Stage **2.8** (Delivery Planning), QA seeds `<record>/quality/release-process.md` from `aidlc-quality-agent/labcorp-release-process-template.md`. Use that living artifact for LabCorp release timeline, regression, and sign-off — this section covers agile cadence only.

### Release Types

**Hotfix Release** (Same Day):
- Critical production bug
- Security vulnerability
- PHI breach mitigation
- No code review required (pair review acceptable)
- Rollback plan mandatory

**Standard Release** (Weekly):
- Scheduled every Friday 4:00 PM ET
- Code freeze Thursday 5:00 PM ET
- Requires: Code review, QA sign-off, security scan
- Automated via CI/CD pipeline
- Rollback tested

**Major Release** (Monthly):
- Large features, breaking changes
- Requires: Architecture review, stakeholder approval
- Phased rollout (10% → 50% → 100%)
- Communication plan to users

---

## Documentation Locations

- Technical docs: `/docs` in repository
- User guides: Confluence
- Runbooks: Confluence + PagerDuty
- API specs: Swagger UI
