# Labcorp AgentCore Safety Standards

These standards govern all AI agent development on Amazon Bedrock AgentCore at Labcorp.
Code that violates any MUST/MUST NOT rule below is non-compliant and must be remediated before merge.

---

## 1. Allowed and Prohibited AWS Services

### 1.1 Approved Services
Only the following AWS services may be used in Terraform configurations:

- Compute: EC2, ECS, EKS, Lambda, Fargate
- Storage: S3, EBS, EFS
- Database: RDS, DynamoDB, ElastiCache, Aurora
- Networking: VPC, ALB/NLB, Route 53, CloudFront (internal only), API Gateway
- Security: IAM, KMS, Secrets Manager, ACM, WAF, Security Hub, GuardDuty
- AI/ML: Bedrock, SageMaker, Bedrock AgentCore
- Messaging: SQS, SNS, EventBridge, Step Functions
- Monitoring: CloudWatch, CloudTrail, X-Ray
- IaC/Deployment: CodeBuild, CodePipeline, ECR, CodeDeploy

### 1.2 Prohibited Services
The following services are NOT permitted without explicit Architecture Board approval:

- AWS Braket (Quantum Computing)
- AWS Ground Station
- AWS RoboMaker
- AWS Nimble Studio
- AWS GameLift
- AWS IoT Core / IoT Greengrass (unless project-specific approval)
- AWS Mechanical Turk
- AWS Outposts
- Any service not listed in Section 1.1

### DO:
```hcl
resource "aws_lambda_function" "agent_handler" {
  function_name = "review-agent-handler"
  runtime       = "python3.11"
  handler       = "lambda_function.handler"
  role          = aws_iam_role.lambda_exec.arn

  vpc_config {
    subnet_ids         = var.private_subnet_ids
    security_group_ids = [aws_security_group.lambda_sg.id]
  }
}
```

### DON'T:
```hcl
# VIOLATION: AWS Braket is a prohibited service
resource "aws_braket_quantum_task" "experiment" {
  action          = jsonencode({...})
  device_arn      = "arn:aws:braket:::device/quantum-simulator/amazon/sv1"
  output_s3_bucket = aws_s3_bucket.results.id
}
```

---

## 2. Authentication and Identity

### 2.1 Okta Requirement
MUST: All agent inbound authentication MUST use Okta as the identity provider.
MUST: AgentCore Identity configurations MUST reference Okta OIDC/OAuth endpoints.
MUST NOT: Agents MUST NOT use Amazon Cognito, Entra ID, or any other IdP as the primary authenticator (Cognito may be used as a token broker only if it federates to Okta).
MUST NOT: Agents MUST NOT accept unauthenticated requests.

### 2.2 OAuth Configuration
MUST: All agent endpoints MUST require Bearer token authentication.
MUST: OAuth scopes MUST follow least-privilege per tool/action.
MUST NOT: Client credentials (client_secret) MUST NOT be hardcoded in source code. Use AWS Secrets Manager or environment variables injected at runtime.

### DO:
```python
# AgentCore Identity with Okta
from bedrock_agentcore.identity import AgentCoreIdentity

identity = AgentCoreIdentity(
    idp_type="OKTA",
    issuer_url="https://labcorp.okta.com/oauth2/default",
    audience="api://agentcore",
    scopes=["agent:invoke", "tools:read"]
)
```

### DON'T:
```python
# VIOLATION: Using Cognito directly as IdP (not federated through Okta)
identity = AgentCoreIdentity(
    idp_type="COGNITO",
    user_pool_id="us-east-1_abc123",
)

# VIOLATION: Hardcoded credentials
CLIENT_SECRET = "super-secret-value-12345"
```

---

## 3. Database Access Controls

### 3.1 Read-Only by Default
MUST: Agent database connections MUST use read-only credentials unless write access is explicitly approved.
MUST: IAM policies for DynamoDB MUST only grant `dynamodb:GetItem`, `dynamodb:Query`, `dynamodb:Scan` unless write is approved.
MUST: RDS connections MUST use a read-only database user.

### 3.2 Write Access
MUST: Any write access (INSERT, UPDATE, DELETE) requires documented approval in the repo's `APPROVALS.md`.
MUST: Write operations MUST be logged and auditable via CloudTrail or application logs.

### DO:
```hcl
# Read-only DynamoDB policy
resource "aws_iam_policy" "agent_dynamodb_readonly" {
  name = "agent-dynamodb-readonly"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "dynamodb:GetItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:BatchGetItem"
      ]
      Resource = [aws_dynamodb_table.agent_data.arn]
    }]
  })
}
```

### DON'T:
```hcl
# VIOLATION: Full DynamoDB access including writes without approval
resource "aws_iam_policy" "agent_dynamodb_full" {
  name = "agent-dynamodb-full"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "dynamodb:*"
      Resource = "*"
    }]
  })
}
```

---

## 4. AgentCore Policy and Guardrails

### 4.1 Cedar Policy Enforcement
MUST: All AgentCore Gateways MUST have a Policy Engine attached in ENFORCE mode (not LOG_ONLY).
MUST: Every tool exposed through Gateway MUST have an explicit Cedar `permit` policy — default is deny.
MUST: Cedar policies MUST include parameter-level constraints where applicable.

### 4.2 Gateway Interceptors
MUST: Gateways exposing database tools MUST have a REQUEST interceptor for SQL injection prevention.
MUST: Gateways returning user data MUST have a RESPONSE interceptor for PII/sensitive data masking.

### 4.3 Agent System Prompts
MUST: Agent system prompts MUST include instructions to only use provided tools and never fabricate data.
MUST: Agent system prompts MUST NOT include credentials, internal URLs, or infrastructure details.

### DO:
```python
system_prompt = """You are a Labcorp assistant. You may only use the tools
provided through the gateway. Do not fabricate information. If you cannot
answer a question with available tools, say so clearly."""

agent = Agent(
    model=model,
    tools=gateway_tools,
    system_prompt=system_prompt
)
```

### DON'T:
```python
# VIOLATION: System prompt contains infrastructure details and no guardrails
system_prompt = """You are a helpful assistant. The database is at
rds-prod.internal.labcorp.com:5432, user=admin, password=labcorp123.
You can run any SQL query you want."""
```

---

## 5. Terraform Module Standards

### 5.1 Module Usage
MUST: All infrastructure MUST be defined using approved Labcorp Terraform modules.
MUST: Modules MUST be sourced from the internal Nexus registry, not public registries.
MUST: All resources MUST include standard tags: `Environment`, `Owner`, `CostCenter`, `Application`.

### 5.2 State Management
MUST: Terraform state MUST be stored in S3 with DynamoDB locking (remote backend).
MUST NOT: Local Terraform state files MUST NOT be committed to the repository.

### DO:
```hcl
terraform {
  backend "s3" {
    bucket         = "labcorp-terraform-state"
    key            = "agents/review-agent/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-locks"
    encrypt        = true
  }
}

module "vpc" {
  source = "nexus.internal.labcorp.com/terraform-modules/vpc"
  version = "3.2.0"
  # ...
}

resource "aws_lambda_function" "agent" {
  # ...
  tags = {
    Environment = var.environment
    Owner       = "architecture-team"
    CostCenter  = "CC-12345"
    Application = "review-agent"
  }
}
```

### DON'T:
```hcl
# VIOLATION: Using public Terraform registry
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.0.0"
}

# VIOLATION: No tags
resource "aws_lambda_function" "agent" {
  function_name = "my-agent"
  runtime       = "python3.11"
}
```

---

## 6. PHI/PII Data Protection in Agent Memory

### 6.1 Memory Encryption
MUST: AgentCore Memory namespaces containing patient or sensitive data MUST be encrypted at rest using a customer-managed KMS key (CMK), not the default AWS-managed key.
MUST: Memory encryption keys MUST be rotated annually.
MUST NOT: Default AWS-managed encryption keys MUST NOT be used for memory stores that may contain PHI.

### 6.2 Memory Retention and Lifecycle
MUST: Memory retention policies MUST be configured with automatic expiration — maximum 90 days for conversation history unless a longer period is justified and approved.
MUST: Long-term memory extraction strategies MUST NOT extract or persist SSN, DOB, MRN, or other HIPAA direct identifiers as standalone memory facts.
MUST: Memory cleanup procedures MUST be documented and testable — teams must demonstrate they can purge a specific patient's data within 72 hours upon request.

### 6.3 Memory Access Isolation
MUST: Memory semantic search results MUST be filtered by patient/user context — an agent MUST NOT return memories from Patient A when serving Patient B.
MUST: Multi-agent systems sharing memory namespaces MUST enforce identity-scoped access via AgentCore Identity tokens.

### DO:
```python
# Memory with CMK encryption and retention
memory_config = {
    "encryption": {"kms_key_id": "arn:aws:kms:us-east-1:123456789:key/mrk-xxx"},
    "retention_days": 90,
    "strategies": ["SUMMARY", "SEMANTIC"],
}
```

### DON'T:
```python
# VIOLATION: No encryption key specified (uses default), no retention policy
memory_config = {
    "strategies": ["SEMANTIC", "USER_PREFERENCES"],
}

# VIOLATION: Extracting direct identifiers into long-term memory
memory_config = {
    "strategies": ["CUSTOM"],
    "custom_extraction": "Extract patient SSN, DOB, and MRN for quick lookup"
}
```

---

## 7. HIPAA Cedar Policy Enforcement

### 7.1 PHI Access Policies
MUST: All Cedar policies controlling access to tools that read or write PHI MUST include `forbid` rules preventing access by unauthorized principals.
MUST: Tool invocations accessing patient records MUST include `context.input` constraints that validate the requesting user has a treatment relationship (mapped from JWT claims such as `department`, `role`, or `patient_panel`).
MUST: Cedar policies MUST be written with explicit `permit` rules per tool — relying on absence of `forbid` is not sufficient.

### 7.2 Policy Mode Requirements
MUST: All production AgentCore Gateway Policy Engines MUST run in ENFORCE mode.
MUST: LOG_ONLY mode is only permitted during an initial testing window of 7 calendar days maximum, with Architecture Board approval documented in the repo's `EXCEPTIONS.md`.
MUST NOT: Auto-generated Cedar policies from NL2Cedar MUST NOT be deployed to production without human review and explicit approval.

### 7.3 Policy Audit
MUST: All Cedar policy changes MUST be version-controlled in the same repository as the agent code.
MUST: Policy evaluation results (ALLOW/DENY decisions) MUST be logged to CloudWatch with the requesting user's identity.

### DO:
```cedar
// Permit clinical staff to access patient records with constraints
permit(
  principal,
  action == AgentCore::Action::"PatientLookupTarget___get_patient",
  resource == AgentCore::Gateway::"arn:aws:agentcore:us-east-1:123:gateway/gw-prod"
) when {
  principal.hasTag("department") &&
  principal.getTag("department") == "clinical" &&
  principal.hasTag("role") &&
  principal.getTag("role") in ["physician", "nurse", "pharmacist"]
};

// Explicitly deny non-clinical access to patient data
forbid(
  principal,
  action == AgentCore::Action::"PatientLookupTarget___get_patient",
  resource
) when {
  !principal.hasTag("department") ||
  principal.getTag("department") != "clinical"
};
```

### DON'T:
```cedar
// VIOLATION: No principal constraints — anyone with a valid token can access PHI
permit(
  principal,
  action,
  resource
);
```

---

## 8. Agent Code Execution Sandboxing

### 8.1 Code Interpreter Restrictions
MUST: AgentCore Code Interpreter sessions MUST NOT have direct access to production databases or PHI data stores.
MUST: Code Interpreter internet access MUST be disabled unless explicitly approved with a documented firewall allowlist.
MUST: All Code Interpreter sessions MUST have resource limits configured (max memory, max execution time, max output size).

### 8.2 Browser Tool Requirements
MUST: AgentCore Browser Tool sessions MUST use VPC connectivity mode with enterprise SSO — no anonymous browser sessions.
MUST: All Browser Tool sessions MUST be recorded (session replay enabled) for audit purposes.
MUST: Browser Tool MUST NOT be used to access external healthcare portals or patient-facing systems without explicit approval.

### 8.3 Human-in-the-Loop for Production Actions
MUST: Agent-generated code MUST NOT be auto-executed against production systems without human-in-the-loop approval.
MUST: Any agent tool that performs write operations (database writes, API mutations, file modifications) MUST require explicit user confirmation before execution.

### DO:
```python
code_interpreter_config = {
    "internet_access": False,
    "max_execution_time_seconds": 30,
    "max_memory_mb": 512,
    "allowed_packages": ["pandas", "numpy", "matplotlib"],
}

browser_config = {
    "vpc_id": "vpc-xxx",
    "session_recording": True,
    "sso_enabled": True,
}
```

### DON'T:
```python
# VIOLATION: Unrestricted code execution with internet access
code_interpreter_config = {
    "internet_access": True,
    # No resource limits configured
}
```

---

## 9. Multi-Tenant Isolation

### 9.1 Tenant Separation
MUST: Each tenant or department handling PHI MUST have logically isolated AgentCore Runtime deployments — no shared agent instances across tenants processing different patient populations.
MUST: Agent Memory stores MUST be partitioned by tenant with separate namespaces.
MUST: Separate KMS keys MUST be used per tenant for memory encryption when tenants handle PHI.

### 9.2 Resource Controls
MUST: Token usage limits MUST be enforced per tenant to prevent resource exhaustion.
MUST: Cost allocation tags (`tenantId`, `department`, `dataClassification`) MUST be applied to all AgentCore resources.
MUST NOT: Agent tools MUST NOT be shared across tenants that handle different patient populations without Gateway-level access controls.

### DO:
```hcl
resource "aws_bedrock_agent" "tenant_a" {
  tags = {
    tenantId           = "tenant-a"
    department         = "cardiology"
    dataClassification = "PHI"
    Environment        = "production"
    Owner              = "cardiology-team"
    CostCenter         = "CC-CARD-001"
    Application        = "cardio-agent"
  }
}
```

### DON'T:
```hcl
# VIOLATION: No tenant isolation tags, shared across departments
resource "aws_bedrock_agent" "shared_agent" {
  tags = {
    Environment = "production"
  }
}
```

---

## 10. Audit Trail and Non-Repudiation

### 10.1 Invocation Audit Records
MUST: Every agent invocation MUST produce an immutable audit record containing: user identity (from Okta JWT), action taken, tools invoked, data resources accessed, timestamp, and session ID.
MUST: Agent traces MUST correlate to the originating user's Okta session — anonymous agent invocations are prohibited.
MUST: All audit records MUST include the agent version and model ID used for the invocation.

### 10.2 Tamper-Proof Storage
MUST: Audit logs MUST be shipped to a tamper-proof store: CloudWatch Logs with retention lock, or S3 with Object Lock (WORM).
MUST: Audit log retention MUST be minimum 6 years per HIPAA retention requirements.
MUST NOT: Audit logs MUST NOT be modifiable or deletable by the agent owner — a separate security role must control log lifecycle.

### 10.3 PHI Masking in Logs
MUST: PII/PHI in agent traces and CloudWatch logs MUST be masked before storage using CloudWatch Logs Data Protection policies.
MUST: Data protection policies MUST cover at minimum: patient names, SSN, MRN, DOB, email, phone, and clinical notes.

### DO:
```python
import logging

logger = logging.getLogger("agent.audit")

def audit_invocation(user_id, session_id, tools_used, agent_version):
    logger.info(json.dumps({
        "event": "agent_invocation",
        "user_id": user_id,
        "session_id": session_id,
        "tools_used": tools_used,
        "agent_version": agent_version,
        "model_id": "us.anthropic.claude-sonnet-4-6",
        "timestamp": datetime.utcnow().isoformat(),
    }))
```

### DON'T:
```python
# VIOLATION: No user identity, PHI in plaintext, no session correlation
logger.info(f"Patient John Smith (SSN 123-45-6789) asked about medications")
```

---

## 11. Secure Agent-to-Agent Communication

### 11.1 Inter-Agent Authentication
MUST: Agent-to-agent communication MUST use AgentCore Gateway with mutual authentication — no direct HTTP calls between agents.
MUST: Each agent in a multi-agent system MUST authenticate with its own identity and scoped credentials.

### 11.2 Privilege Boundaries
MUST: Each agent in a multi-agent system MUST have its own Cedar policy scope — a coordination agent MUST NOT inherit the tool permissions of a data-access agent.
MUST: Agent delegation chains MUST be limited to a maximum of 3 hops to prevent unbounded recursion and privilege escalation.

### 11.3 Inter-Agent Data Handling
MUST: All inter-agent messages MUST be logged with full provenance (originating agent, delegating agent, executing agent, and the originating user identity).
MUST NOT: Agents MUST NOT pass raw credentials, PHI, or encryption keys in inter-agent tool call parameters — use secure references (e.g., Secrets Manager ARNs, encrypted token references).

### DO:
```python
# Agent A calls Agent B via Gateway with scoped permissions
agent_b_tool = gateway.get_tool("agent-b-query-tool")
result = agent_b_tool.invoke(
    query="Get patient summary",
    patient_ref="encrypted:ref:abc123",  # Secure reference, not raw PHI
    delegation_context={
        "originating_user": user_jwt,
        "originating_agent": "agent-a",
        "hop_count": 1,
    }
)
```

### DON'T:
```python
# VIOLATION: Direct HTTP call, no auth, raw PHI in payload, no provenance
import requests
result = requests.post("http://agent-b:8080/query", json={
    "patient_name": "John Smith",
    "ssn": "123-45-6789",
})
```

---

## 12. Agent Deployment and Change Management

### 12.1 CI/CD Requirements
MUST: All agent deployments MUST go through the CI/CD pipeline with an architecture review gate (this review agent).
MUST: Infrastructure changes (Gateway targets, Cedar policies, memory configs) MUST be defined as Terraform/CDK Infrastructure-as-Code, not created via console.
MUST NOT: Manual console changes to production agent configurations are prohibited.

### 12.2 Change Approval
MUST: System prompt changes MUST be version-controlled and require PR approval from both the agent owner and a security reviewer.
MUST: Model ID changes (e.g., switching from `claude-haiku` to `claude-sonnet`) MUST require Architecture Board approval, as they change cost and capability profile.
MUST: Cedar policy changes MUST be reviewed by the security team before merge.

### 12.3 Rollback and Deployment Safety
MUST: Agents MUST support blue/green deployment via AgentCore Runtime — ability to route traffic back to the previous version within 5 minutes.
MUST: Rollback procedures MUST be documented and tested at least quarterly.
MUST: All deployments MUST include a health check verification step before receiving production traffic.

### DO:
```hcl
# Infrastructure-as-Code for agent configuration
resource "aws_bedrock_agentcore_runtime" "agent" {
  agent_name    = "claims-assistant"
  model_id      = "us.anthropic.claude-sonnet-4-6"

  deployment_config {
    strategy    = "BLUE_GREEN"
    health_check_path = "/health"
    rollback_on_alarm = true
  }

  tags = {
    Environment = "production"
    Owner       = "claims-team"
    CostCenter  = "CC-CLAIMS-01"
    Application = "claims-assistant"
  }
}
```

### DON'T:
```bash
# VIOLATION: Manual deployment with no review gate
aws bedrock-agentcore update-agent --agent-id xxx --model-id claude-opus --no-review
```

---

## Appendix A: Standard Exception Process

Repositories may request exceptions to specific standards via an `EXCEPTIONS.md` file in the repository root. Exceptions are subject to the following rules:

1. **Authorization**: EXCEPTIONS.md MUST be committed by an authorized approver (Architecture Board member or designated security lead). The review agent verifies the git committer against an approved list.
2. **Required fields**: Each exception must include: standard section, approver, ticket ID, date, expiration date, and justification.
3. **Expiration**: All exceptions MUST have an expiration date no more than 6 months from approval. Expired exceptions are not honored.
4. **Scope**: Exceptions apply only to the specific standard section referenced, not to the entire standard.
5. **Renewal**: Expired exceptions must be re-approved through a new ticket and fresh EXCEPTIONS.md commit by an authorized approver.
6. **Audit**: All exception grants and denials are logged in the review agent's output for compliance tracking.

### EXCEPTIONS.md Format:
```markdown
## <Standard Section Number> <Standard Name> - <Specific Item>

- **Approved by**: <Approver name or board>
- **Ticket**: <JIRA/ServiceNow ticket ID>
- **Date**: <YYYY-MM-DD>
- **Expires**: <YYYY-MM-DD>
- **Justification**: <Why the exception is needed and what mitigations are in place>
```
