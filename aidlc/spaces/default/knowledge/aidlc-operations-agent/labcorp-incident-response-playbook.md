# Labcorp Incident Response Playbook

Standard operating procedures for responding to security incidents and production outages.

---

## Labcorp Severity Examples

Severity follows the standard SEV-1…SEV-4 scale. Labcorp-specific examples:

- **SEV-1**: PHI exposed/breach, Patient Portal or Patient API fully unavailable, production database down, ransomware detected.
- **SEV-2**: Appointment Scheduling degraded, authentication service degraded.

A suspected or confirmed PHI breach is always SEV-1 and triggers the PHI Breach Response below.

---

## PHI Breach Response

### Immediate Steps (0-1 hour)

1. **Contain the breach**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block unauthorized access

2. **Assess scope**
   - How many patient records?
   - What data fields exposed (SSN, MRN, diagnosis)?
   - Who had access?
   - Duration of exposure?

3. **Notify Privacy Officer** (within 1 hour)
   ```
   TO: privacy.officer@labcorp.com
   SUBJECT: URGENT - Potential PHI Breach

   INCIDENT ID: INC-2024-001
   DISCOVERY TIME: 2024-01-15 14:30 UTC
   REPORTER: John Smith (john.smith@labcorp.com)

   PRELIMINARY ASSESSMENT:
   - Affected patients: ~100 (preliminary estimate)
   - Data exposed: Name, DOB, MRN, lab results
   - Exposure method: Unauthorized database access
   - Duration: Unknown, investigating

   IMMEDIATE ACTIONS TAKEN:
   - Database access revoked
   - System isolated
   - Forensic investigation initiated

   NEXT STEPS:
   - Complete forensic analysis
   - Determine full scope of affected individuals
   - Prepare breach notification plan
   ```

### Investigation Phase (1-72 hours)

**Forensic Analysis:**
```bash
# Analyze CloudTrail for unauthorized access
aws cloudtrail lookup-events \
  --lookup-attributes AttributeKey=EventName,AttributeValue=GetObject \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-15T23:59:59Z > cloudtrail-analysis.json

# Query database audit logs
psql -h forensic-replica -U admin -d prod -c "
SELECT
  timestamp,
  user_name,
  database_name,
  query_text,
  client_addr
FROM audit.log
WHERE timestamp >= '2024-01-01'
  AND (query_text ILIKE '%patient%' OR query_text ILIKE '%ssn%')
ORDER BY timestamp;
" > database-audit.csv

# Extract affected patient IDs
psql -h forensic-replica -U admin -d prod -c "
SELECT DISTINCT patient_id
FROM audit.log
WHERE timestamp BETWEEN '<start>' AND '<end>'
  AND user_name = 'unauthorized_user'
" > affected-patients.txt
```

### Breach Notification (60 days)

**Required Notifications:**
1. **Individual Notice** - Within 60 days of discovery
2. **HHS Secretary** - Within 60 days if > 500 individuals
3. **Media Notice** - If > 500 individuals in same state/jurisdiction

---

## PagerDuty Integration

```python
import requests

def create_incident(title, severity, description):
    """Create PagerDuty incident."""
    response = requests.post(
        'https://api.pagerduty.com/incidents',
        headers={
            'Authorization': f'Token token={PAGERDUTY_API_KEY}',
            'Content-Type': 'application/json',
            'From': 'monitoring@labcorp.com'
        },
        json={
            'incident': {
                'type': 'incident',
                'title': title,
                'service': {
                    'id': 'PSERVICE123',
                    'type': 'service_reference'
                },
                'urgency': 'high' if severity in ['SEV-1', 'SEV-2'] else 'low',
                'body': {
                    'type': 'incident_body',
                    'details': description
                }
            }
        }
    )
    return response.json()
```

---

## Runbook Index

Quick reference for common incidents:

| Incident Type | Runbook | Severity | Response Time |
|--------------|---------|----------|---------------|
| Database down | DB-001 | SEV-1 | < 15 min |
| API high error rate | API-001 | SEV-2 | < 30 min |
| Lambda throttling | LAMBDA-001 | SEV-2 | < 30 min |
| S3 access denied | S3-001 | SEV-3 | < 2 hours |
| PHI breach | SECURITY-001 | SEV-1 | Immediate |
| Unauthorized access | SECURITY-002 | SEV-1 | Immediate |
| DDoS attack | SECURITY-003 | SEV-1 | Immediate |
| Data loss | DATA-001 | SEV-1 | Immediate |

> **See also:** Post-deploy smoke validation and release support are defined in `aidlc-quality-agent/labcorp-release-process-template.md` §3.9; results land in `<record>/operation/deployment-execution/smoke-test-results.md` (Stage **4.3**).
