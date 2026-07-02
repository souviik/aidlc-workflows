# Labcorp Security Standards

These standards govern all software development at Labcorp, regardless of technology stack or deployment platform.
Code that violates any MUST/MUST NOT rule below is non-compliant and must be remediated before merge.

> **See also:** Release regression entry requires security scan completion (e.g., Veracode on release build in Jenkins) per `aidlc-quality-agent/labcorp-release-process-template.md` §3.6–§3.7, before QA proceeds to release qualification.

---

## 1. Authentication and Authorization

### 1.1 Identity Provider Requirement
MUST: All application authentication MUST use Okta as the identity provider.
MUST NOT: Applications MUST NOT accept unauthenticated requests to protected resources.
MUST NOT: Alternative IdPs (Cognito, Entra ID, Auth0) MUST NOT be used as the primary authenticator without federation to Okta.

### 1.2 OAuth and Token-Based Authentication
MUST: All API endpoints accessing protected resources MUST require Bearer token authentication.
MUST: OAuth scopes MUST follow least-privilege per operation or resource.
MUST: Token validation MUST verify issuer, audience, expiration, and signature.
MUST NOT: Long-lived API keys or basic authentication MUST NOT be used for user-facing applications.

### 1.3 Multi-Factor Authentication
MUST: All administrative access MUST require multi-factor authentication (MFA).
MUST: Production system access MUST require MFA.
MUST: MFA MUST use hardware tokens (YubiKey) or authenticator apps — SMS is not acceptable for production access.

### 1.4 Service-to-Service Authentication
MUST: Service-to-service communication MUST use mutual TLS (mTLS) or OAuth client credentials flow.
MUST: Each service MUST have its own identity and credentials — no shared service accounts.
MUST: Service account credentials MUST be rotated at least semi-annually.

### Labcorp Okta Configuration
```python
# OAuth token validation
from jose import jwt, JWTError

def validate_token(token: str) -> dict:
    """Validate JWT token from Okta."""
    try:
        decoded = jwt.decode(
            token,
            key=get_public_key(),
            audience="api://labcorp",
            issuer="https://labcorp.okta.com/oauth2/default",
            algorithms=["RS256"],
            options={"verify_signature": True, "verify_exp": True, "verify_aud": True}
        )
        return decoded
    except JWTError as e:
        raise AuthenticationError(f"Invalid token: {e}")
```

---

## 2. Database Security (PHI/PII Encryption and Access)

### 2.1 Encryption at Rest
MUST: All databases storing sensitive data MUST use encryption at rest with customer-managed keys (CMKs).
MUST: Database encryption keys MUST be rotated annually.
MUST NOT: Default platform-managed encryption keys MUST NOT be used for PHI or PII storage.

### 2.2 Access Controls
MUST: Database access MUST use the principle of least privilege — grant only required permissions.
MUST: Application database users MUST have read-only access by default unless write access is explicitly approved.
MUST: Administrative database users MUST be separate from application users.
MUST: Database access MUST be logged and auditable.

### 2.3 Network Isolation
MUST: Databases MUST be deployed in dedicated private subnets.
MUST: Database security groups MUST only allow access from application tier security groups.
MUST NOT: Databases MUST NOT be publicly accessible.

---

## 3. PHI/PII Data Protection

### 3.1 Data Classification
MUST: All data MUST be classified as: Public, Internal, Confidential, or PHI.
MUST: PHI MUST be identified and labeled in data stores and data flows.
MUST: Data handling procedures MUST be applied based on classification level.

### 3.2 Encryption at Rest
MUST: Any storage containing PHI or PII MUST be encrypted at rest using customer-managed keys (CMKs).
MUST: Encryption keys MUST be rotated annually.
MUST NOT: Default platform-managed encryption keys MUST NOT be used for PHI/PII storage.

### 3.3 Encryption in Transit
MUST: All PHI/PII data transmission MUST use TLS 1.2 or higher.
MUST: Internal service-to-service communication handling PHI MUST use TLS.

### 3.4 Data Retention and Lifecycle
MUST: Data retention policies MUST be documented and enforced via automated lifecycle rules.
MUST: PHI retention MUST not exceed 6 years unless legally required.
MUST: Data deletion procedures MUST be documented and testable — demonstrate ability to purge a specific patient's data within 72 hours.

### 3.5 PII/PHI Minimization
MUST: Applications MUST only request and store the minimum PHI/PII required for their function.
MUST NOT: Direct identifiers (SSN, MRN, DOB) MUST NOT be stored in logs, caches, or temporary storage.
MUST: PHI MUST be masked or redacted before display to unauthorized users.

### 3.6 Logging and Monitoring
MUST NOT: Logs MUST NOT contain PHI or PII in plaintext.
MUST: PHI/PII MUST be masked or hashed before logging.
MUST: Access to PHI MUST be logged with user identity for audit purposes.

### Labcorp Tagging and Purge Conventions
```python
# Data classification tagging
resource_tags = {
    "DataClassification": "PHI",
    "ComplianceScope": "HIPAA",
    "RetentionPeriod": "6years"
}

# Encrypted storage configuration
storage_config = {
    "encryption": {
        "type": "customer_managed",
        "kms_key_id": "arn:aws:kms:us-east-1:123456789:key/mrk-xxx",
        "algorithm": "AES256"
    },
    "retention_days": 2190,  # 6 years
    "lifecycle_policy": "AUTO_DELETE"
}

# Data deletion procedure (72-hour purge SLA)
def purge_patient_data(patient_id: str, requestor: str) -> None:
    """Delete all patient data in compliance with HIPAA."""
    logger.info(f"Data purge requested by {requestor} for patient {patient_id}")

    # Delete from all systems
    database.delete_patient_records(patient_id)
    cache.delete_patient_cache(patient_id)
    object_store.delete_patient_files(patient_id)
    search_index.remove_patient_documents(patient_id)

    # Audit trail
    audit_log.record_deletion(
        patient_id=patient_id,
        requestor=requestor,
        timestamp=datetime.utcnow(),
        systems_purged=["database", "cache", "object_store", "search_index"]
    )
```

---

## 4. Breach Notification
MUST: Any suspected PHI breach MUST be reported to the Privacy Officer within 24 hours.
MUST: Confirmed breaches MUST be investigated to identify affected individuals.
MUST: Breach notification to affected individuals MUST occur within 60 days per HIPAA.

---

## Appendix A: Exception Process

Repositories may request exceptions via an `EXCEPTIONS.md` file in the repository root.

**Requirements:**
1. **Authorization**: Committed by authorized approver (Architecture Board/Security Lead)
2. **Fields**: Standard section, approver, ticket ID, date, expiration date, justification
3. **Expiration**: Maximum 6 months from approval
4. **Scope**: Applies only to specific standard section
5. **Renewal**: Requires re-approval after expiration

**Format:**
```markdown
## <Section #> <Standard Name> - <Item>

- **Approved by**: <Name/Board>
- **Ticket**: <JIRA/ServiceNow ID>
- **Date**: <YYYY-MM-DD>
- **Expires**: <YYYY-MM-DD>
- **Justification**: <Why needed and mitigations>
```

---

## Appendix B: Required Resource Tagging

All resources MUST include:
- `Environment`: dev, staging, production
- `Owner`: Team or individual responsible
- `CostCenter`: Billing code
- `Application`: Application name
- `DataClassification`: public, internal, confidential, phi
- `ComplianceScope`: hipaa, sox, pci (if applicable)
- `ManagedBy`: terraform, cloudformation, manual
