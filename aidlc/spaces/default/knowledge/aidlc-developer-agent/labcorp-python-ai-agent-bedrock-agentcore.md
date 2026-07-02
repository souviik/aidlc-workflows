# Python AI Agent Development: Bedrock AgentCore + Strands

Worked reference for a Labcorp AI agent application: **Python** agent with **Strands framework** on **Amazon Bedrock AgentCore**, deployed with **Terraform**. Use when tech-stack-decisions.md or project.md specifies Python AI agent development with AWS Bedrock.

This file is self-contained: full-stack layout, Labcorp Python coding rules, agent architecture, capability wiring, testing, and brownfield scan guidance for Python agent codebases.

For stack catalogs, see [labcorp-backend-stacks.md](labcorp-backend-stacks.md) (Python section). For REST API development (FastAPI), see [labcorp-backend-stacks.md](labcorp-backend-stacks.md) → Python (FastAPI). For coding rules, see [labcorp-coding-standards.md](labcorp-coding-standards.md). For AgentCore security MUST rules, see [labcorp-agentcore-safety-standards.md](../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md).

---

## Stack at a Glance

| Layer | Technology | Role |
|-------|------------|------|
| Agent Framework | Strands (Python) | Agent orchestration, tool calling, conversation management |
| Agent Runtime | Amazon Bedrock AgentCore | Managed runtime for deploying AI agents |
| Foundation Model | Anthropic Claude (Bedrock) | LLM for reasoning and generation |
| Capabilities | Modular Python modules | Memory, Gateway, Identity, Policy, Tools, Guardrails |
| Infrastructure | Terraform | AWS resource provisioning and configuration |
| Container | Docker (ARM64) | Agent packaging for Bedrock AgentCore |
| Configuration | Environment variables | Feature flags and resource handles |
| Testing | pytest | Unit and integration tests |

**Default versions:** Python 3.11+, Strands 1.0+, bedrock-agentcore 0.1+, Terraform 1.9+

---

## Solution Layout

### Repository Topology

```
<repo-root>/
├── src/
│   └── agent/                         # Python agent - all code here only
│       ├── main.py                    # BedrockAgentCoreApp entrypoint
│       ├── config.py                  # Settings with feature flags
│       ├── capabilities/              # One module per capability
│       │   ├── __init__.py
│       │   ├── memory.py
│       │   ├── gateway.py
│       │   ├── identity.py
│       │   ├── policy.py
│       │   ├── tools.py
│       │   └── guardrails.py
│       ├── prompts/
│       │   └── system.md              # Base system prompt
│       ├── requirements.txt           # Runtime dependencies
│       └── Dockerfile                 # ARM64 container image
├── infra/                             # Terraform - all IaC here only
│   ├── modules/                       # One module per capability
│   │   ├── runtime/
│   │   ├── runtime-build/
│   │   ├── memory/
│   │   ├── gateway/
│   │   ├── identity/
│   │   ├── policy/
│   │   ├── tools/
│   │   ├── guardrails/
│   │   └── observability/
│   ├── environments/                  # Environment stacks
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   └── terraform.tfvars       # Feature flags per env
│   │   ├── staging/
│   │   └── prod/
│   └── examples/                      # Standalone examples
│       ├── runtime-only/
│       └── runtime-memory/
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/
│   ├── invoke_agent.py                # Test invocation script
│   └── deploy.sh
├── docs/                              # Progressive tutorial guides
│   ├── 00-prerequisites.md
│   ├── 01-runtime.md
│   ├── 02-memory.md
│   └── ...
├── pyproject.toml                     # Python project config
├── README.md
└── AGENTS.md                          # Project charter for AI agents
```

**Rules:**

- Never write infrastructure code under src/ or agent code under infra/.
- A capability spans both layers: src/agent/capabilities/{name}.py plus infra/modules/{name}/.
- Co-design capability contracts: Python code consumes what Terraform provisions.
- Every capability ships with its own Terraform module and can be toggled via feature flag.
- Agent runtime is deployed to Bedrock AgentCore (managed service) - no EC2/ECS management.
- All configuration flows via environment variables from Terraform to agent code.

---

## Agent Architecture

### Capability Map

```
Caller (App/User)
    ↓
    invoke_agent_runtime()
    ↓
Runtime (Always deployed)
    ├── Strands Agent
    ├── BedrockAgentCoreApp
    └── Claude Model
    ↓
Optional Capabilities (Toggle with enable_* flags)
    ├── Memory (long-term conversation state)
    ├── Gateway (MCP tools for external APIs)
    ├── Identity (authentication, on-behalf-of tokens)
    ├── Policy (Cedar authorization for tool calls)
    ├── Tools (code interpreter, browser)
    ├── Guardrails (content safety, PII detection)
    └── Observability (tracing, metrics)
```

### Configuration Contract

Terraform sets environment variables → Agent reads flags at startup → Capabilities wire up dynamically.

| Terraform Flag | Agent Env Var | Resource Handle(s) | Python Module |
|---------------|--------------|-------------------|---------------|
| enable_memory | ENABLE_MEMORY | MEMORY_ID | capabilities/memory.py |
| enable_gateway | ENABLE_GATEWAY | GATEWAY_URL, GATEWAY_ID | capabilities/gateway.py |
| enable_identity | ENABLE_IDENTITY | IDENTITY_WORKLOAD_NAME | capabilities/identity.py |
| enable_policy | ENABLE_POLICY | POLICY_STORE_ID | capabilities/policy.py |
| enable_tools | ENABLE_TOOLS | CODE_INTERPRETER_ID, BROWSER_ID | capabilities/tools.py |
| enable_guardrails | ENABLE_GUARDRAILS | GUARDRAIL_ID, GUARDRAIL_VERSION | capabilities/guardrails.py |
| enable_observability | ENABLE_OBSERVABILITY | (platform-side) | N/A |

**No code changes required to change feature set** - only Terraform tfvars.

---

## Code Generation Rules

### Agent Entrypoint

- **Main module**: src/agent/main.py with BedrockAgentCoreApp
- **Entrypoint decorator**: @app.entrypoint for the invoke function
- **Streaming support**: async generator yielding text deltas
- **Build function**: build_agent(settings) assembles capabilities
- **Local server**: app.run() for development testing
- **Port**: 8080 for /invocations and /ping endpoints

```python
from bedrock_agentcore.runtime import BedrockAgentCoreApp
from strands import Agent
from strands.models import BedrockModel

app = BedrockAgentCoreApp()

def build_agent(settings: Settings | None = None):
    settings = settings or Settings.load()
    contributions = _collect_capabilities(settings)
    
    system_prompt = _base_system_prompt()
    tools = []
    hooks = []
    
    for contribution in contributions:
        if contribution.system_prompt:
            system_prompt += "\n\n" + contribution.system_prompt
        tools.extend(contribution.tools)
        hooks.extend(contribution.hooks)
    
    model = BedrockModel(
        model_id=settings.model_id,
        region_name=settings.region,
        streaming=settings.streaming,
    )
    
    return Agent(
        model=model,
        system_prompt=system_prompt,
        tools=tools,
        hooks=hooks,
    )

@app.entrypoint
async def invoke(payload: dict):
    prompt = payload.get("prompt") or payload.get("message") or ""
    if not prompt:
        yield "Please provide a 'prompt' field in the request body."
        return
    
    if not _settings.streaming:
        yield str(_agent(prompt))
        return
    
    async for event in _agent.stream_async(prompt):
        if isinstance(event, dict) and event.get("data"):
            yield event["data"]
```

### Configuration Management

- **Dataclass with frozen=True**: Immutable settings
- **Environment variable loading**: All config from env vars
- **Feature flags dataclass**: Separate class for boolean flags
- **Type hints**: Full typing for all fields
- **Factory method**: classmethod load() to read from environment
- **No defaults in production**: Required values must be set

```python
from dataclasses import dataclass, field
import os

def _flag(name: str, default: bool = False) -> bool:
    raw = os.getenv(name)
    if raw is None:
        return default
    return raw.strip().lower() in {"1", "true", "yes", "on"}

@dataclass(frozen=True)
class CapabilityFlags:
    memory: bool = False
    gateway: bool = False
    identity: bool = False
    policy: bool = False
    tools: bool = False
    guardrails: bool = False
    
    @classmethod
    def from_env(cls) -> "CapabilityFlags":
        return cls(
            memory=_flag("ENABLE_MEMORY"),
            gateway=_flag("ENABLE_GATEWAY"),
            identity=_flag("ENABLE_IDENTITY"),
            policy=_flag("ENABLE_POLICY"),
            tools=_flag("ENABLE_TOOLS"),
            guardrails=_flag("ENABLE_GUARDRAILS"),
        )

@dataclass(frozen=True)
class Settings:
    region: str = "us-east-1"
    model_id: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    streaming: bool = True
    flags: CapabilityFlags = field(default_factory=CapabilityFlags)
    
    memory_id: str | None = None
    gateway_url: str | None = None
    policy_store_id: str | None = None
    guardrail_id: str | None = None
    
    @classmethod
    def load(cls) -> "Settings":
        return cls(
            region=os.getenv("AWS_REGION", "us-east-1"),
            model_id=os.getenv("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0"),
            streaming=_flag("ENABLE_STREAMING", default=True),
            flags=CapabilityFlags.from_env(),
            memory_id=os.getenv("MEMORY_ID") or None,
            gateway_url=os.getenv("GATEWAY_URL") or None,
            policy_store_id=os.getenv("POLICY_STORE_ID") or None,
            guardrail_id=os.getenv("GUARDRAIL_ID") or None,
        )

    def enabled_capabilities(self) -> list[str]:
        """Return names of capability flags that are enabled."""
        return [
            name
            for name, enabled in (
                ("memory", self.flags.memory),
                ("gateway", self.flags.gateway),
                ("identity", self.flags.identity),
                ("policy", self.flags.policy),
                ("tools", self.flags.tools),
                ("guardrails", self.flags.guardrails),
            )
            if enabled
        ]
```

### Capability Module Pattern

- **One file per capability**: capabilities/{name}.py
- **Single build function**: build(settings) -> CapabilityContribution
- **Lazy imports**: Only imported when flag is enabled
- **Contribution dataclass**: tools, system_prompt, hooks
- **Type hints**: Full typing on all functions
- **Docstrings**: Google-style for all public functions

```python
# capabilities/__init__.py
from dataclasses import dataclass, field
from typing import Any, Callable

@dataclass
class CapabilityContribution:
    tools: list[Callable[..., Any]] = field(default_factory=list)
    system_prompt: str = ""
    hooks: list[Any] = field(default_factory=list)

# capabilities/memory.py
from agent.capabilities import CapabilityContribution
from agent.config import Settings

def build(settings: Settings) -> CapabilityContribution:
    """Build the Memory capability.
    
    Wires up Bedrock AgentCore Memory for long-term conversation state.
    Memories persist across invocations keyed by session_id and actor_id.
    
    Args:
        settings: Runtime settings with MEMORY_ID handle
        
    Returns:
        CapabilityContribution with memory hooks
    """
    from bedrock_agentcore.memory import BedrockMemory
    
    if not settings.memory_id:
        raise ValueError("MEMORY_ID required when ENABLE_MEMORY is true")
    
    memory = BedrockMemory(
        memory_id=settings.memory_id,
        session_id="default-session",  # Override per invocation
        actor_id="default-user",       # Derive from authenticated identity
    )
    
    system_prompt = """
You have access to long-term memory across conversations.
Use memory to recall context from previous interactions with this user.
"""
    
    return CapabilityContribution(
        system_prompt=system_prompt.strip(),
        hooks=[memory],
    )
```

### Lazy Capability Loading

- **Conditional imports**: Import only when flag is enabled
- **_collect_capabilities function**: Aggregates enabled contributions
- **Optional dependencies**: Capability imports don't break if deps missing
- **No unused imports**: Never import disabled capabilities

```python
def _collect_capabilities(settings: Settings) -> list[CapabilityContribution]:
    contributions: list[CapabilityContribution] = []
    flags = settings.flags
    
    if flags.memory:
        from agent.capabilities import memory
        contributions.append(memory.build(settings))
    
    if flags.gateway:
        from agent.capabilities import gateway
        contributions.append(gateway.build(settings))
    
    if flags.identity:
        from agent.capabilities import identity
        contributions.append(identity.build(settings))
    
    if flags.policy:
        from agent.capabilities import policy
        contributions.append(policy.build(settings))
    
    if flags.tools:
        from agent.capabilities import tools
        contributions.append(tools.build(settings))
    
    if flags.guardrails:
        from agent.capabilities import guardrails
        contributions.append(guardrails.build(settings))
    
    return contributions
```

### Forbidden in Generated Code

- Using sync code for async operations
- Hardcoded AWS resource names (use environment variables)
- Mutable default arguments (use None and initialize inside)
- Global state (use dependency injection)
- print() statements (use logging.getLogger)
- Bare except: clauses (catch specific exceptions)
- Type annotations with Any (use specific types)
- Missing docstrings on public functions
- Environment variables read outside config.py
- Capability imports in main.py (use lazy loading)

### Mandated in Generated Code

- Frozen dataclasses for configuration
- Type hints on all function signatures
- Docstrings (Google style) on all public functions
- Logging via logging module, never print
- Environment variable reading only in config.py
- Lazy imports for capabilities
- Async/await for I/O operations
- Error handling with specific exception types
- Resource cleanup with context managers
- Unit tests for all capability modules

---

## Module Organization

Every Python module follows this structure:

1. **Module docstring** - Purpose and usage
2. **Imports** - Grouped: stdlib, third-party, local (separated by blank line)
3. **Constants** - UPPER_SNAKE_CASE at module level
4. **Type definitions** - TypedDict, Protocol, etc.
5. **Classes** - Most important first
6. **Functions** - Public functions, then private (_prefixed)

**Class member order:**

1. Class docstring
2. Class variables
3. `__init__` method
4. Public methods (alphabetized)
5. Private methods (alphabetized)
6. Dunder methods (except `__init__`)

**Imports:**

```python
# Standard library
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

# Third-party
import boto3
from strands import Agent
from strands.models import BedrockModel

# Local
from agent.capabilities import CapabilityContribution
from agent.config import Settings
```

---

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| **Modules** | snake_case | memory.py, gateway.py |
| **Classes** | PascalCase | CapabilityContribution, Settings |
| **Functions** | snake_case | build_agent, collect_capabilities |
| **Constants** | UPPER_SNAKE_CASE | MEMORY_ID, GATEWAY_URL |
| **Private functions** | _leading_underscore | _flag, _collect_capabilities |
| **Private class members** | _leading_underscore | _agent, _settings |
| **Type variables** | PascalCase | T, ModelT |
| **Environment variables** | UPPER_SNAKE_CASE | ENABLE_MEMORY, MEMORY_ID |
| **Terraform resources** | snake_case | memory_id, gateway_url |
| **Terraform modules** | kebab-case | runtime-build, memory |

**AgentCore naming rules:**

- Runtime, identity, tools, memory names: underscores only (^[a-zA-Z][a-zA-Z0-9_]{0,47}$)
- No hyphens in AgentCore resource names
- When deriving from var.project_prefix, replace hyphens: replace(var.project_prefix, "-", "_")
- Prefix everything with project_prefix for environment isolation

---

## Worked Example: Gateway Capability

### Capability Module

```python
# src/agent/capabilities/gateway.py
"""Gateway capability for exposing external APIs as MCP tools.

The Gateway provides Model Context Protocol (MCP) tools that allow the agent
to interact with external systems (databases, APIs, services) through a
unified tool-calling interface.
"""

from __future__ import annotations

import logging
from typing import Any

from agent.capabilities import CapabilityContribution
from agent.config import Settings

logger = logging.getLogger(__name__)


def build(settings: Settings) -> CapabilityContribution:
    """Build the Gateway capability.
    
    Wires up MCP tools from the configured Gateway URL. The gateway translates
    tool calls into external API requests and returns formatted responses.
    
    Args:
        settings: Runtime settings with GATEWAY_URL and GATEWAY_ID
        
    Returns:
        CapabilityContribution with gateway tools
        
    Raises:
        ValueError: If GATEWAY_URL is not set when gateway is enabled
    """
    if not settings.gateway_url:
        raise ValueError("GATEWAY_URL required when ENABLE_GATEWAY is true")
    
    # In a real implementation, fetch tool definitions from the gateway
    # and dynamically create tool functions. Simplified here for clarity.
    
    from bedrock_agentcore.gateway import GatewayClient
    
    gateway_client = GatewayClient(
        gateway_url=settings.gateway_url,
        gateway_id=settings.gateway_id,
    )
    
    tools = gateway_client.list_tools()
    
    system_prompt = f"""
You have access to external tools via the Gateway at {settings.gateway_url}.
Available tools: {', '.join(t.name for t in tools)}

Use these tools to interact with external systems, databases, and APIs.
Always validate tool parameters before calling.
"""
    
    logger.info("Gateway capability initialized with %d tools", len(tools))
    
    return CapabilityContribution(
        tools=[t.as_callable() for t in tools],
        system_prompt=system_prompt.strip(),
    )
```

### Terraform Module

```hcl
# infra/modules/gateway/main.tf
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    awscc = {
      source  = "hashicorp/awscc"
      version = "~> 1.0"
    }
  }
}

variable "project_prefix" {
  type        = string
  description = "Prefix for resource names (environment isolation)"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Tags to apply to all resources"
}

locals {
  gateway_name = replace("${var.project_prefix}_gateway", "-", "_")
}

resource "awscc_bedrockagentcore_gateway" "this" {
  name        = local.gateway_name
  description = "MCP gateway for external tool integration"
  
  tags = [
    for k, v in var.tags : {
      key   = k
      value = v
    }
  ]
}

output "gateway_id" {
  value       = awscc_bedrockagentcore_gateway.this.id
  description = "Gateway ID for agent configuration"
}

output "gateway_url" {
  value       = awscc_bedrockagentcore_gateway.this.url
  description = "Gateway URL for tool invocation"
}
```

### Environment Configuration

```hcl
# infra/environments/dev/terraform.tfvars
project_prefix = "ai-agent-dev"

# Feature flags - toggle capabilities on/off
enable_memory        = true
enable_gateway       = true
enable_identity      = false
enable_policy        = false
enable_tools         = false
enable_guardrails    = true
enable_observability = true

# Model configuration
model_id  = "us.anthropic.claude-sonnet-4-20250514-v1:0"
streaming = true

tags = {
  Environment = "dev"
  Project     = "ai-agent"
  ManagedBy   = "terraform"
}
```

### Runtime Environment Variable Injection

```hcl
# infra/environments/dev/main.tf
locals {
  runtime_env = {
    AWS_REGION         = var.region
    BEDROCK_MODEL_ID   = var.model_id
    ENABLE_STREAMING   = var.streaming ? "true" : "false"
    
    # Capability flags
    ENABLE_MEMORY        = var.enable_memory ? "true" : "false"
    ENABLE_GATEWAY       = var.enable_gateway ? "true" : "false"
    ENABLE_IDENTITY      = var.enable_identity ? "true" : "false"
    ENABLE_POLICY        = var.enable_policy ? "true" : "false"
    ENABLE_TOOLS         = var.enable_tools ? "true" : "false"
    ENABLE_GUARDRAILS    = var.enable_guardrails ? "true" : "false"
    ENABLE_OBSERVABILITY = var.enable_observability ? "true" : "false"
    
    # Resource handles (only set when capability is enabled)
    MEMORY_ID       = var.enable_memory ? module.memory[0].memory_id : ""
    GATEWAY_URL     = var.enable_gateway ? module.gateway[0].gateway_url : ""
    GATEWAY_ID      = var.enable_gateway ? module.gateway[0].gateway_id : ""
    POLICY_STORE_ID = var.enable_policy ? module.policy[0].policy_store_id : ""
    GUARDRAIL_ID    = var.enable_guardrails ? module.guardrails[0].guardrail_id : ""
  }
}

module "runtime" {
  source = "../../modules/runtime"
  
  project_prefix          = var.project_prefix
  environment_variables   = local.runtime_env
  image_uri              = module.runtime_build.image_uri
  tags                   = var.tags
}
```

---

## Testing Standards

### Unit Test Structure

```python
# tests/unit/test_config.py
import os
import pytest
from agent.config import Settings, CapabilityFlags, _flag


class TestFlagParsing:
    """Test environment variable flag parsing."""
    
    def test_flag_true_values(self, monkeypatch):
        """Test that various true-ish strings parse as True."""
        for value in ["1", "true", "True", "TRUE", "yes", "YES", "on", "ON"]:
            monkeypatch.setenv("TEST_FLAG", value)
            assert _flag("TEST_FLAG") is True
    
    def test_flag_false_values(self, monkeypatch):
        """Test that false-ish and unknown strings parse as False."""
        for value in ["0", "false", "False", "no", "off", "invalid"]:
            monkeypatch.setenv("TEST_FLAG", value)
            assert _flag("TEST_FLAG") is False
    
    def test_flag_missing_uses_default(self, monkeypatch):
        """Test that missing env var returns the default."""
        monkeypatch.delenv("MISSING_FLAG", raising=False)
        assert _flag("MISSING_FLAG", default=False) is False
        assert _flag("MISSING_FLAG", default=True) is True


class TestSettingsLoad:
    """Test Settings.load() from environment."""
    
    def test_load_with_minimal_env(self, monkeypatch):
        """Test loading with only required env vars."""
        monkeypatch.setenv("AWS_REGION", "us-west-2")
        monkeypatch.setenv("BEDROCK_MODEL_ID", "us.anthropic.claude-3-5-sonnet-20241022-v2:0")
        
        settings = Settings.load()
        
        assert settings.region == "us-west-2"
        assert settings.model_id == "us.anthropic.claude-3-5-sonnet-20241022-v2:0"
        assert settings.streaming is True  # default
        assert settings.flags.memory is False  # no flags set
    
    def test_load_with_memory_enabled(self, monkeypatch):
        """Test loading with memory capability enabled."""
        monkeypatch.setenv("ENABLE_MEMORY", "true")
        monkeypatch.setenv("MEMORY_ID", "mem-12345")
        
        settings = Settings.load()
        
        assert settings.flags.memory is True
        assert settings.memory_id == "mem-12345"
    
    def test_enabled_capabilities_lists_active(self, monkeypatch):
        """Test enabled_capabilities returns only active capability names."""
        monkeypatch.setenv("ENABLE_MEMORY", "true")
        monkeypatch.setenv("ENABLE_GATEWAY", "true")
        
        settings = Settings.load()
        capabilities = settings.enabled_capabilities()
        
        assert "memory" in capabilities
        assert "gateway" in capabilities
        assert "policy" not in capabilities


@pytest.fixture
def clean_env(monkeypatch):
    """Fixture that clears all ENABLE_* env vars."""
    for key in list(os.environ.keys()):
        if key.startswith("ENABLE_"):
            monkeypatch.delenv(key, raising=False)
```

### Integration Test Example

```python
# tests/integration/test_agent_invoke.py
import os

import pytest
from agent.main import build_agent
from agent.config import Settings, CapabilityFlags


@pytest.fixture
def minimal_settings():
    """Settings with no capabilities enabled."""
    return Settings(
        region="us-east-1",
        model_id="us.anthropic.claude-sonnet-4-20250514-v1:0",
        streaming=False,
        flags=CapabilityFlags(),
    )


@pytest.mark.integration
def test_agent_responds_to_simple_prompt(minimal_settings):
    """Test that agent can respond to a basic prompt."""
    agent = build_agent(minimal_settings)
    
    response = str(agent("Hello, what is 2+2?"))
    
    assert response
    assert isinstance(response, str)
    assert len(response) > 0


@pytest.mark.integration
@pytest.mark.skipif(not os.getenv("MEMORY_ID"), reason="MEMORY_ID not set")
def test_agent_with_memory_capability():
    """Test agent with memory capability enabled."""
    settings = Settings(
        region=os.getenv("AWS_REGION", "us-east-1"),
        model_id=os.getenv("BEDROCK_MODEL_ID"),
        streaming=False,
        flags=CapabilityFlags(memory=True),
        memory_id=os.getenv("MEMORY_ID"),
    )
    
    agent = build_agent(settings)
    
    # First interaction
    response1 = str(agent("My favorite color is blue."))
    assert response1
    
    # Second interaction - should recall
    response2 = str(agent("What is my favorite color?"))
    assert "blue" in response2.lower()
```

---

## Deployment Workflow

### Local Development

```bash
# 1. Install Python dependencies
python -m pip install -e ".[dev]"

# 2. Copy environment template
cp .env.example .env

# 3. Edit .env with local settings
# ENABLE_MEMORY=false
# ENABLE_GATEWAY=false
# BEDROCK_MODEL_ID=us.anthropic.claude-sonnet-4-20250514-v1:0

# 4. Run agent locally
python -m agent.main
# Serves on http://localhost:8080

# 5. Test invocation
curl -X POST http://localhost:8080/invocations \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Hello!"}'

# 6. Run tests
pytest
pytest -v tests/unit/
pytest -m integration

# 7. Lint
ruff check src scripts tests
ruff format src scripts tests
```

### Deployment to AWS

```bash
# 1. Ensure Docker is running (required for ARM64 build)
docker info

# 2. Configure AWS credentials
aws configure

# 3. Deploy to dev environment
cd infra/environments/dev
terraform init
terraform plan
terraform apply

# 4. Get runtime ARN
terraform output runtime_arn

# 5. Invoke deployed agent
cd ../../../
python scripts/invoke_agent.py \
  --runtime-arn <ARN> \
  --prompt "Hello from production!"

# 6. View logs
aws logs tail /aws/bedrock/agentcore/runtime/<runtime-name> --follow
```

### Feature Flag Changes

```bash
# Enable a new capability (e.g., guardrails)
# 1. Edit terraform.tfvars
enable_guardrails = true

# 2. Apply changes (builds new image with updated env vars)
terraform apply

# No code changes required - agent reads new flags at startup
```

---

## Brownfield: Reverse Engineering Python Agent Codebase

When scanning an existing Python agent workspace, capture:

**Project Discovery**

- Python version (pyproject.toml, .python-version)
- Package manager (Poetry, pip, uv)
- Agent framework (Strands, LangChain, LangGraph, CrewAI, AutoGen)
- Deployment target (Bedrock AgentCore, ECS, Lambda, local)
- Container platform (Docker, AWS Lambda layers)

**Capability Inventory**

Per src/agent/capabilities/{name}.py:
- Module name and purpose
- build() function signature
- Dependencies (required packages)
- Configuration requirements (env vars, resource handles)
- Tools exposed (function names, signatures)
- System prompt text
- Hooks registered

**Configuration Analysis**

- Environment variable patterns
- Feature flag mechanism (if any)
- Settings dataclass structure
- Required vs optional configuration
- Secrets management (AWS Secrets Manager, Parameter Store, .env)

**Infrastructure Mapping**

Per infra/modules/{name}/:
- Terraform module structure
- AWS resources provisioned
- Module inputs (variables)
- Module outputs (handles)
- Resource naming conventions
- IAM policies

**Integration Points**

- Model configuration (Bedrock model IDs)
- Memory backend (Bedrock Memory, DynamoDB, Redis)
- Gateway URLs and tool catalogs
- Identity providers (AWS IAM, Cognito, custom JWT)
- Policy stores (Cedar, OPA)
- Guardrail configurations

**Testing Coverage**

- Test framework (pytest, unittest)
- Unit test count and coverage
- Integration test presence
- Fixtures and mocks used
- Test data management

**Anti-patterns to Flag**

- Hardcoded AWS resource names (not from env vars)
- Mutable default arguments
- Global state
- Capability imports outside lazy loading
- Missing type hints
- Missing docstrings
- Sync code for async operations
- print() instead of logging
- Bare except: clauses
- Missing error handling

---

## Security Checklist

- [ ] AgentCore safety standards compliance (identity, policy ENFORCE, guardrails, PHI memory encryption) per [labcorp-agentcore-safety-standards.md](../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md)
- [ ] No hardcoded AWS credentials in code or version control
- [ ] IAM roles used for AWS service access
- [ ] Environment variables for all sensitive configuration
- [ ] AWS Secrets Manager for secrets (API keys, tokens)
- [ ] Guardrails enabled for content safety and PII detection
- [ ] Policy enforcement (Cedar) for tool authorization
- [ ] Identity capability for authentication
- [ ] Logging enabled with no sensitive data in logs
- [ ] Container image scanned for vulnerabilities
- [ ] Terraform state stored in S3 with encryption
- [ ] State locking via DynamoDB
- [ ] Network isolation (VPC when applicable)
- [ ] Least-privilege IAM policies
- [ ] Model guardrails for input/output filtering

See [labcorp-agentcore-safety-standards.md](../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md) (AgentCore MUST/MUST NOT rules), [labcorp-security-standards.md](../aidlc-devsecops-agent/labcorp-security-standards.md), and [labcorp-hipaa-technical-safeguards.md](../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md).

---

## When to Use This Pattern

**Use when:**

- Building conversational AI agents
- Deploying to Amazon Bedrock AgentCore
- Need modular, toggle-able capabilities
- Want infrastructure-as-code deployment
- Python is the chosen language
- Strands is the agent framework
- Multi-environment deployment (dev/staging/prod)

**Prefer a different pattern when:**

- Building REST APIs (use [labcorp-backend-stacks.md](labcorp-backend-stacks.md) → Python (FastAPI))
- Building batch processing pipelines
- Using non-Bedrock LLM platforms
- Framework mandates LangChain, LangGraph, etc.
- Runtime is ECS/Lambda (not Bedrock AgentCore)

---

## Common Pitfalls to Avoid

| Pitfall | Why Bad | Better Approach |
|---------|---------|-----------------|
| Importing all capabilities in main.py | Loads unused dependencies | Lazy import based on flags |
| Hardcoded resource names | Breaks multi-environment | Use environment variables |
| Mutable default arguments | Shared state bugs | Use None and initialize inside |
| Global agent instance | Thread safety issues | Build per request or singleton |
| Sync code for AWS calls | Blocks event loop | Use async/await with aioboto3 |
| Missing type hints | Hard to maintain | Full typing everywhere |
| print() for logging | Doesn't integrate with CloudWatch | Use logging module |
| Bare except: clauses | Hides real errors | Catch specific exceptions |
| No docstrings | Hard to understand | Google-style docstrings |
| Capability code in main.py | Violates separation | One capability = one module |

---

## Dependencies

Core runtime dependencies (requirements.txt):

```
strands-agents>=1.0.0
strands-agents-tools>=0.1.0
bedrock-agentcore>=0.1.0
boto3>=1.40.0
```

Development dependencies (pyproject.toml [project.optional-dependencies]):

```
pytest>=8.0.0
ruff>=0.6.0
python-dotenv>=1.0.0
bedrock-agentcore-starter-toolkit>=0.1.0
```

Capability-specific dependencies:

- **Memory**: Built into bedrock-agentcore
- **Gateway**: Built into bedrock-agentcore
- **Identity**: Built into bedrock-agentcore
- **Policy**: cedar-py (if local evaluation)
- **Tools**: strands-agents-tools
- **Guardrails**: Built into Bedrock

---

## Progressive Learning Path

| Step | Guide | Learn |
|------|-------|-------|
| 0 | Prerequisites | AWS setup, Terraform, Python, Docker |
| 1 | Runtime | Deploy bare agent to Bedrock AgentCore |
| 2 | Memory | Add long-term conversation state |
| 3 | Gateway | Expose external APIs as tools |
| 4 | Identity | Secure auth and on-behalf-of tokens |
| 5 | Policy | Enforce Cedar authorization |
| 6 | Tools | Add code interpreter and browser |
| 7 | Observability | Tracing, logging, metrics |
| 8 | Guardrails | Content safety and PII detection |

---

## See Also

### AgentCore and security

- [labcorp-agentcore-safety-standards.md](../aidlc-devsecops-agent/labcorp-agentcore-safety-standards.md) — AgentCore MUST/MUST NOT rules (production)
- [labcorp-security-standards.md](../aidlc-devsecops-agent/labcorp-security-standards.md) — General security requirements
- [labcorp-hipaa-technical-safeguards.md](../aidlc-compliance-agent/labcorp-hipaa-technical-safeguards.md) — HIPAA technical safeguards

### Stack and coding

- [labcorp-backend-stacks.md](labcorp-backend-stacks.md) — Backend stack standards (Python / FastAPI section for REST APIs)
- [labcorp-coding-standards.md](labcorp-coding-standards.md) — Language-agnostic coding rules
- [labcorp-test-automation-strategies.md](../aidlc-quality-agent/labcorp-test-automation-strategies.md) — Testing approaches

### Architecture and platform

- [labcorp-microservices-patterns.md](../aidlc-architect-agent/labcorp-microservices-patterns.md) — Microservices guidance (if applicable)
- [labcorp-module-source-and-versioning.md](../aidlc-aws-platform-agent/labcorp-module-source-and-versioning.md) — AgentCore Terraform module source (Nexus)
- `data-modelling-patterns.md` — Data modeling (tier 1 framework; if using databases)

---

## Example Project Structure (Complete)

```
ai-agent-project/
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
├── docs/
│   ├── 00-prerequisites.md
│   ├── 01-runtime.md
│   ├── 02-memory.md
│   ├── 03-gateway.md
│   ├── 04-identity.md
│   ├── 05-policy.md
│   ├── 06-tools.md
│   ├── 07-observability.md
│   ├── 08-guardrails.md
│   ├── ARCHITECTURE.md
│   └── adding-a-new-capability.md
├── infra/
│   ├── environments/
│   │   ├── dev/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── terraform.tfvars
│   │   ├── staging/
│   │   └── prod/
│   ├── modules/
│   │   ├── runtime/
│   │   │   ├── main.tf
│   │   │   ├── variables.tf
│   │   │   ├── outputs.tf
│   │   │   └── versions.tf
│   │   ├── runtime-build/
│   │   ├── memory/
│   │   ├── gateway/
│   │   ├── identity/
│   │   ├── policy/
│   │   ├── tools/
│   │   ├── guardrails/
│   │   └── observability/
│   └── examples/
│       ├── runtime-only/
│       └── runtime-memory/
├── scripts/
│   ├── invoke_agent.py
│   ├── deploy.sh
│   └── deploy.ps1
├── src/
│   └── agent/
│       ├── capabilities/
│       │   ├── __init__.py
│       │   ├── memory.py
│       │   ├── gateway.py
│       │   ├── identity.py
│       │   ├── policy.py
│       │   ├── tools.py
│       │   └── guardrails.py
│       ├── prompts/
│       │   └── system.md
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── requirements.txt
│       └── Dockerfile
├── tests/
│   ├── integration/
│   │   ├── README.md
│   │   └── test_agent_invoke.py
│   └── unit/
│       ├── test_config.py
│       └── test_capabilities.py
├── .env.example
├── .gitignore
├── .python-version
├── AGENTS.md
├── pyproject.toml
└── README.md
```

---

**Last Updated:** 2026-07-01
**Maintained By:** AI-DLC Initiative
**License:** Internal use only
