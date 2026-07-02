# HIPAA Technical Safeguards Guide

This guide provides detailed technical requirements for HIPAA compliance in software systems handling Protected Health Information (PHI).

---

## Overview

The HIPAA Security Rule requires covered entities and business associates to implement technical safeguards to protect electronic PHI (ePHI). Technical safeguards are the technology and policy/procedures that protect ePHI and control access to it.

---

## 1. Access Control (§164.312(a)(1)) - REQUIRED

### 1.1 Unique User Identification (Required)
**Requirement**: Assign a unique name and/or number for identifying and tracking user identity.

**Implementation**:
- Each user must have a unique identifier (username, employee ID, or email)
- No shared accounts for accessing ePHI
- Service accounts must be tied to specific applications with documented owners
- User identifiers must be retained in audit logs even after account deletion

**DO**:
```python
# Each user has unique identifier
user = User(
    user_id="U12345",  # Unique identifier
    email="john.smith@labcorp.com",
    employee_id="EMP-67890",
    okta_id="00u1abc2def3ghi4"
)

# Log access with user identity
audit_log.record_access(
    user_id=user.user_id,
    resource="patient:P123456",
    action="read",
    timestamp=datetime.utcnow()
)
```

**DON'T**:
```python
# VIOLATION: Shared account
username = "labcorp_app_user"  # Shared by all application instances

# VIOLATION: No user tracking
log.info("Patient record accessed")  # No user identity
```

### 1.2 Emergency Access Procedure (Required)
**Requirement**: Establish procedures for obtaining ePHI during an emergency.

**Implementation**:
- Document break-glass procedures for emergency access
- Emergency accounts must be monitored and reviewed
- All emergency access must be logged and justified
- Post-emergency access review within 24 hours

**Emergency Access Pattern**:
```python
class EmergencyAccessManager:
    def request_emergency_access(
        self,
        requestor_id: str,
        patient_id: str,
        justification: str
    ) -> EmergencyAccessToken:
        """Grant emergency access with full audit trail."""
        # Log emergency access request
        audit_log.record_emergency_access(
            requestor_id=requestor_id,
            patient_id=patient_id,
            justification=justification,
            timestamp=datetime.utcnow(),
            requires_review=True
        )
        
        # Alert security team
        alert_security(
            event="emergency_access_granted",
            user=requestor_id,
            patient=patient_id
        )
        
        # Issue time-limited token (4 hours)
        return EmergencyAccessToken(
            user_id=requestor_id,
            scope=f"emergency:patient:{patient_id}",
            expires_at=datetime.utcnow() + timedelta(hours=4)
        )
    
    def review_emergency_access(self, access_id: str, reviewer_id: str):
        """Mandatory review of emergency access within 24 hours."""
        access_record = get_emergency_access(access_id)
        
        if datetime.utcnow() - access_record.timestamp > timedelta(hours=24):
            escalate_to_privacy_officer(access_record)
```

### 1.3 Automatic Logoff (Addressable)
**Requirement**: Terminate an electronic session after a predetermined time of inactivity.

**Implementation**:
- Web sessions: 15 minutes of inactivity
- API tokens: Maximum 1 hour lifetime for user tokens, 4 hours for service tokens
- Database connections: Terminate idle connections after 5 minutes

**DO**:
```python
# Flask session configuration
app.config.update(
    PERMANENT_SESSION_LIFETIME=timedelta(minutes=15),
    SESSION_REFRESH_EACH_REQUEST=True
)

@app.before_request
def check_session_timeout():
    """Check for session inactivity timeout."""
    session.permanent = True
    last_activity = session.get('last_activity')
    
    if last_activity:
        inactive_time = datetime.utcnow() - datetime.fromisoformat(last_activity)
        if inactive_time > timedelta(minutes=15):
            session.clear()
            return {"error": "Session expired due to inactivity"}, 401
    
    session['last_activity'] = datetime.utcnow().isoformat()
```

### 1.4 Encryption and Decryption (Addressable)
**Requirement**: Implement a mechanism to encrypt and decrypt ePHI.

**Implementation**:
- Encryption at rest: AES-256 with customer-managed keys (CMK)
- Encryption in transit: TLS 1.2 or higher
- Database-level encryption for ePHI columns
- Encrypted backups

**DO**:
```python
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2

class PHIEncryption:
    def __init__(self, kms_key_id: str):
        """Initialize with KMS-managed key."""
        self.kms_client = boto3.client('kms')
        self.kms_key_id = kms_key_id
    
    def encrypt_phi(self, plaintext: str) -> dict:
        """Encrypt PHI using KMS."""
        response = self.kms_client.encrypt(
            KeyId=self.kms_key_id,
            Plaintext=plaintext.encode('utf-8')
        )
        
        return {
            'ciphertext': base64.b64encode(response['CiphertextBlob']).decode('utf-8'),
            'key_id': response['KeyId']
        }
    
    def decrypt_phi(self, ciphertext_b64: str) -> str:
        """Decrypt PHI using KMS."""
        ciphertext = base64.b64decode(ciphertext_b64)
        
        response = self.kms_client.decrypt(
            CiphertextBlob=ciphertext
        )
        
        return response['Plaintext'].decode('utf-8')

# Usage
encryptor = PHIEncryption(kms_key_id="arn:aws:kms:us-east-1:123:key/xxx")
encrypted_ssn = encryptor.encrypt_phi("123-45-6789")

# Store encrypted in database
db.execute(
    "INSERT INTO patients (patient_id, ssn_encrypted) VALUES (%s, %s)",
    (patient_id, encrypted_ssn['ciphertext'])
)
```

---

## 2. Audit Controls (§164.312(b)) - REQUIRED

### 2.1 Audit Logging Requirements
**Requirement**: Implement hardware, software, and/or procedural mechanisms that record and examine activity in information systems that contain or use ePHI.

**What Must Be Logged**:
- All ePHI access (read, write, update, delete)
- Authentication events (login, logout, failed attempts)
- Authorization decisions (granted, denied)
- Administrative actions (user creation, permission changes)
- Security events (firewall blocks, intrusion attempts)
- System changes (configuration updates, software deployments)

**Log Retention**: Minimum 6 years per HIPAA

**Implementation**:
```python
import json
from datetime import datetime
import hashlib

class HIPAAAuditLogger:
    def __init__(self, stream_name: str):
        self.kinesis = boto3.client('kinesis')
        self.stream_name = stream_name
    
    def log_phi_access(
        self,
        user_id: str,
        user_role: str,
        action: str,
        resource_type: str,
        resource_id: str,
        outcome: str,
        ip_address: str,
        user_agent: str = None,
        justification: str = None
    ):
        """Log ePHI access in HIPAA-compliant format."""
        audit_record = {
            # Required fields
            "event_type": "phi_access",
            "timestamp": datetime.utcnow().isoformat(),
            "event_id": str(uuid.uuid4()),
            
            # User information
            "user_id": user_id,
            "user_role": user_role,
            "ip_address": ip_address,
            "user_agent": user_agent,
            
            # Action details
            "action": action,  # read, write, update, delete
            "resource_type": resource_type,  # patient, lab_result, prescription
            "resource_id": self._hash_identifier(resource_id),  # Hashed for privacy
            "outcome": outcome,  # success, denied, error
            
            # Optional fields
            "justification": justification,
            
            # Technical details
            "application": "labcorp-portal",
            "environment": "production",
            "session_id": self._get_session_id()
        }
        
        # Send to immutable audit stream
        self.kinesis.put_record(
            StreamName=self.stream_name,
            Data=json.dumps(audit_record).encode('utf-8'),
            PartitionKey=user_id
        )
        
        return audit_record['event_id']
    
    def _hash_identifier(self, identifier: str) -> str:
        """Hash identifiers for privacy while maintaining uniqueness."""
        return hashlib.sha256(identifier.encode('utf-8')).hexdigest()[:16]

# Usage
audit_logger = HIPAAAuditLogger(stream_name="hipaa-audit-logs")

@app.route("/api/patients/<patient_id>")
@require_auth
def get_patient(patient_id):
    user = get_current_user()
    
    # Log access attempt
    audit_logger.log_phi_access(
        user_id=user.id,
        user_role=user.role,
        action="read",
        resource_type="patient",
        resource_id=patient_id,
        outcome="success",
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent')
    )
    
    return get_patient_data(patient_id)
```

### 2.2 Audit Log Protection
**Requirements**:
- Audit logs must be tamper-proof (write-once-read-many)
- Access to audit logs must be restricted
- Audit logs must be backed up
- Integrity verification must be possible

**Implementation with S3 Object Lock**:
```python
# Create S3 bucket with Object Lock for tamper-proof audit logs
import boto3

def setup_audit_log_bucket(bucket_name: str):
    """Configure S3 bucket for HIPAA-compliant audit logs."""
    s3 = boto3.client('s3')
    
    # Create bucket with Object Lock
    s3.create_bucket(
        Bucket=bucket_name,
        ObjectLockEnabledForBucket=True
    )
    
    # Configure Object Lock retention (6 years for HIPAA)
    s3.put_object_lock_configuration(
        Bucket=bucket_name,
        ObjectLockConfiguration={
            'ObjectLockEnabled': 'Enabled',
            'Rule': {
                'DefaultRetention': {
                    'Mode': 'GOVERNANCE',  # Or COMPLIANCE for stricter control
                    'Years': 6
                }
            }
        }
    )
    
    # Enable versioning
    s3.put_bucket_versioning(
        Bucket=bucket_name,
        VersioningConfiguration={'Status': 'Enabled'}
    )
    
    # Configure lifecycle for archival
    s3.put_bucket_lifecycle_configuration(
        Bucket=bucket_name,
        LifecycleConfiguration={
            'Rules': [{
                'Id': 'archive-old-logs',
                'Status': 'Enabled',
                'Transitions': [{
                    'Days': 90,
                    'StorageClass': 'GLACIER'
                }]
            }]
        }
    )
```

---

## 3. Integrity Controls (§164.312(c)(1)) - ADDRESSABLE

### 3.1 Mechanism to Authenticate ePHI
**Requirement**: Implement electronic mechanisms to corroborate that ePHI has not been altered or destroyed in an unauthorized manner.

**Implementation**:
- Digital signatures for critical data
- Checksums/hashes for data integrity
- Version control with integrity checks
- Chain of custody tracking

**DO**:
```python
import hashlib
import hmac

class DataIntegrityManager:
    def __init__(self, signing_key: str):
        self.signing_key = signing_key.encode('utf-8')
    
    def sign_phi_record(self, record: dict) -> dict:
        """Sign PHI record to ensure integrity."""
        # Convert record to canonical JSON
        record_json = json.dumps(record, sort_keys=True, separators=(',', ':'))
        
        # Generate HMAC signature
        signature = hmac.new(
            self.signing_key,
            record_json.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        return {
            "data": record,
            "signature": signature,
            "timestamp": datetime.utcnow().isoformat(),
            "version": 1
        }
    
    def verify_phi_record(self, signed_record: dict) -> bool:
        """Verify PHI record integrity."""
        record = signed_record["data"]
        stored_signature = signed_record["signature"]
        
        # Recompute signature
        record_json = json.dumps(record, sort_keys=True, separators=(',', ':'))
        computed_signature = hmac.new(
            self.signing_key,
            record_json.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        
        # Constant-time comparison
        return hmac.compare_digest(stored_signature, computed_signature)

# Usage
integrity_mgr = DataIntegrityManager(signing_key=get_secret("integrity-key"))

# Sign before storage
patient_record = {"patient_id": "P123", "name": "John Doe", "mrn": "MRN456"}
signed_record = integrity_mgr.sign_phi_record(patient_record)
db.store_signed_record(signed_record)

# Verify on retrieval
retrieved = db.get_signed_record(patient_id)
if not integrity_mgr.verify_phi_record(retrieved):
    alert_security("Data integrity violation detected")
    raise IntegrityError("Record has been tampered with")
```

---

## 4. Person or Entity Authentication (§164.312(d)) - REQUIRED

### 4.1 Authentication Requirements
**Requirement**: Implement procedures to verify that a person or entity seeking access to ePHI is the one claimed.

**Acceptable Authentication Methods**:
1. **Something you know**: Password/PIN (with complexity requirements)
2. **Something you have**: Hardware token, smart card, authenticator app
3. **Something you are**: Biometrics (fingerprint, facial recognition)

**Multi-Factor Authentication (MFA)**:
- Required for all access to ePHI
- Required for all administrative access
- Required for remote access

**Password Requirements**:
- Minimum 12 characters
- Complexity: uppercase, lowercase, numbers, special characters
- Expiration: 90 days maximum
- History: Cannot reuse last 12 passwords
- Lockout: After 5 failed attempts

**Implementation**:
```python
from passlib.context import CryptContext
import re

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class HIPAAAuthenticationManager:
    def __init__(self):
        self.password_history_length = 12
        self.max_failed_attempts = 5
        self.lockout_duration = timedelta(minutes=30)
    
    def validate_password_complexity(self, password: str) -> tuple[bool, str]:
        """Validate password meets HIPAA requirements."""
        if len(password) < 12:
            return False, "Password must be at least 12 characters"
        
        if not re.search(r'[A-Z]', password):
            return False, "Password must contain uppercase letter"
        
        if not re.search(r'[a-z]', password):
            return False, "Password must contain lowercase letter"
        
        if not re.search(r'\d', password):
            return False, "Password must contain number"
        
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            return False, "Password must contain special character"
        
        return True, "Password meets requirements"
    
    def check_password_history(self, user_id: str, new_password: str) -> bool:
        """Check if password was used in last 12 passwords."""
        history = db.get_password_history(user_id, limit=self.password_history_length)
        
        for old_password_hash in history:
            if pwd_context.verify(new_password, old_password_hash):
                return False  # Password was used before
        
        return True
    
    def authenticate_with_mfa(
        self,
        username: str,
        password: str,
        mfa_code: str
    ) -> tuple[bool, str]:
        """Authenticate user with password and MFA."""
        user = db.get_user_by_username(username)
        
        if not user:
            # Prevent user enumeration - same response time
            pwd_context.dummy_verify()
            return False, "Invalid credentials"
        
        # Check if account is locked
        if user.is_locked and user.lockout_until > datetime.utcnow():
            return False, "Account is locked. Try again later."
        
        # Verify password
        if not pwd_context.verify(password, user.password_hash):
            self._handle_failed_attempt(user.id)
            return False, "Invalid credentials"
        
        # Check password expiration
        if user.password_age > timedelta(days=90):
            return False, "Password expired. Please reset."
        
        # Verify MFA code
        if not self._verify_mfa_code(user.id, mfa_code):
            self._handle_failed_attempt(user.id)
            return False, "Invalid MFA code"
        
        # Reset failed attempts on successful login
        db.reset_failed_attempts(user.id)
        
        # Log successful authentication
        audit_log.record_authentication(
            user_id=user.id,
            outcome="success",
            method="password+mfa"
        )
        
        return True, "Authentication successful"
    
    def _handle_failed_attempt(self, user_id: str):
        """Handle failed authentication attempt."""
        failed_count = db.increment_failed_attempts(user_id)
        
        audit_log.record_authentication(
            user_id=user_id,
            outcome="failed",
            failed_attempt_count=failed_count
        )
        
        if failed_count >= self.max_failed_attempts:
            lockout_until = datetime.utcnow() + self.lockout_duration
            db.lock_account(user_id, lockout_until)
            
            alert_security(
                event="account_locked",
                user_id=user_id,
                reason="Too many failed attempts"
            )
```

---

## 5. Transmission Security (§164.312(e)(1)) - REQUIRED

### 5.1 Integrity Controls (Addressable)
**Requirement**: Implement security measures to ensure that electronically transmitted ePHI is not improperly modified without detection.

### 5.2 Encryption (Addressable)
**Requirement**: Implement a mechanism to encrypt ePHI whenever deemed appropriate.

**Implementation**:
- TLS 1.2 or 1.3 for all ePHI transmission
- Certificate validation required
- Strong cipher suites only
- Perfect Forward Secrecy (PFS)

**DO**:
```python
import requests
from requests.adapters import HTTPAdapter
from urllib3.poolmanager import PoolManager
import ssl

class TLSAdapter(HTTPAdapter):
    """Custom TLS adapter enforcing TLS 1.2+."""
    def init_poolmanager(self, *args, **kwargs):
        context = ssl.create_default_context()
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.set_ciphers('ECDHE+AESGCM:ECDHE+CHACHA20:DHE+AESGCM:DHE+CHACHA20:!aNULL:!MD5:!DSS')
        kwargs['ssl_context'] = context
        return super().init_poolmanager(*args, **kwargs)

# Configure HTTPS client for PHI transmission
session = requests.Session()
session.mount('https://', TLSAdapter())

# Send PHI over secure channel
response = session.post(
    'https://api.labcorp.com/phi/records',
    json={"patient_data": encrypted_phi},
    headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    },
    timeout=30,
    verify=True  # Always verify certificates
)
```

**Nginx TLS Configuration**:
```nginx
server {
    listen 443 ssl http2;
    server_name api.labcorp.com;
    
    # TLS 1.2 and 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Strong cipher suites with PFS
    ssl_ciphers 'ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    
    ssl_prefer_server_ciphers on;
    
    # HSTS header (force HTTPS)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Certificates
    ssl_certificate /etc/ssl/certs/labcorp.crt;
    ssl_certificate_key /etc/ssl/private/labcorp.key;
    
    # OCSP stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    
    location / {
        proxy_pass http://backend;
    }
}
```

---

## 6. HIPAA Compliance Checklist

### Access Control
- [ ] Unique user IDs assigned to all users
- [ ] Emergency access procedures documented and tested
- [ ] Automatic logoff after 15 minutes inactivity
- [ ] ePHI encrypted at rest with CMK
- [ ] Role-based access control (RBAC) implemented
- [ ] Least privilege principle enforced

### Audit Controls
- [ ] All ePHI access logged with user identity
- [ ] Authentication events logged
- [ ] Authorization decisions logged
- [ ] Audit logs stored in tamper-proof system
- [ ] 6-year retention policy configured
- [ ] Weekly audit log review process

### Integrity Controls
- [ ] Data integrity verification mechanisms implemented
- [ ] Version control for ePHI records
- [ ] Checksums/signatures for critical data

### Authentication
- [ ] Multi-factor authentication required
- [ ] Password complexity requirements enforced
- [ ] Password expiration (90 days)
- [ ] Account lockout after 5 failed attempts
- [ ] Password history (12 passwords)

### Transmission Security
- [ ] TLS 1.2+ for all ePHI transmission
- [ ] Certificate validation enforced
- [ ] Strong cipher suites configured
- [ ] Perfect Forward Secrecy enabled

### Documentation
- [ ] Security policies documented
- [ ] Procedures for all safeguards documented
- [ ] Risk assessment completed
- [ ] Business Associate Agreements (BAAs) in place
- [ ] Incident response plan documented
- [ ] Training materials created

### Training
- [ ] All workforce trained on HIPAA requirements
- [ ] Annual HIPAA training completed
- [ ] Training records maintained

---

## 7. Common HIPAA Violations to Avoid

### Critical Violations
1. **Unencrypted ePHI** - Storage or transmission without encryption
2. **Unauthorized Access** - Accessing patient records without legitimate need
3. **Improper Disposal** - Not properly destroying ePHI
4. **Missing Audit Logs** - No audit trail of ePHI access
5. **Weak Authentication** - No MFA or weak passwords
6. **No Access Controls** - Anyone can access any patient record
7. **PHI in Logs** - Plaintext PHI in application logs
8. **Expired BAAs** - Working with vendors without valid BAAs
9. **No Encryption in Transit** - Sending ePHI over HTTP
10. **Shared Accounts** - Multiple users sharing login credentials

### Enforcement and Penalties
- **Tier 1**: $100-$50,000 per violation (unknowing)
- **Tier 2**: $1,000-$50,000 per violation (reasonable cause)
- **Tier 3**: $10,000-$50,000 per violation (willful neglect, corrected)
- **Tier 4**: $50,000 per violation (willful neglect, not corrected)
- **Maximum annual penalty**: $1.5 million per violation category

---

## 8. Testing HIPAA Compliance

### Automated Testing
```python
import pytest

class TestHIPAACompliance:
    def test_unique_user_identification(self):
        """Test that all users have unique identifiers."""
        users = db.get_all_users()
        user_ids = [u.user_id for u in users]
        assert len(user_ids) == len(set(user_ids)), "Duplicate user IDs found"
    
    def test_phi_access_logged(self):
        """Test that PHI access generates audit log."""
        patient_id = "P123"
        user = create_test_user()
        
        # Access PHI
        get_patient_data(patient_id, user)
        
        # Verify audit log entry
        audit_entry = audit_log.get_latest_entry(user_id=user.id)
        assert audit_entry is not None
        assert audit_entry.resource_id == patient_id
        assert audit_entry.action == "read"
    
    def test_encryption_at_rest(self):
        """Test that PHI is encrypted in database."""
        patient_data = {"ssn": "123-45-6789"}
        patient_id = db.create_patient(patient_data)
        
        # Retrieve raw data from DB
        raw_data = db.execute("SELECT ssn FROM patients WHERE id = %s", (patient_id,))
        
        # SSN should be encrypted, not plaintext
        assert raw_data['ssn'] != "123-45-6789"
    
    def test_tls_enforcement(self):
        """Test that HTTP is rejected for PHI endpoints."""
        response = requests.get("http://api.labcorp.com/phi/patients/P123")
        
        # Should redirect to HTTPS or reject
        assert response.status_code in [301, 302, 403]
    
    def test_mfa_required(self):
        """Test that MFA is required for authentication."""
        # Try to authenticate with just password
        result = auth_manager.authenticate(username="test", password="Test123!")
        
        # Should fail without MFA
        assert not result.success
        assert "MFA required" in result.message
```

---

## Resources

- [HHS HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html)
- [NIST HIPAA Security Rule Toolkit](https://csrc.nist.gov/publications/detail/sp/800-66/rev-1/final)
- [HIPAA Security Series](https://www.hhs.gov/hipaa/for-professionals/security/guidance/index.html)
