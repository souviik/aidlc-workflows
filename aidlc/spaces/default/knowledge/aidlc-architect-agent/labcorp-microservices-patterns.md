# Microservices Architecture Patterns

Practical patterns for designing and implementing microservices architectures.

---

## 1. Service Decomposition Patterns

### Decompose by Business Capability

Organize services around business capabilities rather than technical layers.

**Example: Healthcare Domain**
```
Patient Management Service
├── Patient Registration
├── Patient Demographics
└── Patient Search

Appointment Service
├── Scheduling
├── Reminders
└── Cancellations

Lab Results Service
├── Order Management
├── Result Processing
└── Result Delivery

Billing Service
├── Claims Processing
├── Payment Processing
└── Insurance Verification
```

**Implementation:**
```python
# Patient Management Service
class PatientService:
    """Bounded context: Patient management."""
    
    def register_patient(self, patient_data: dict) -> str:
        """Register new patient - owns this capability."""
        patient_id = self._generate_patient_id()
        self.repository.create(patient_id, patient_data)
        
        # Publish event for other services
        self.event_bus.publish(PatientRegisteredEvent(
            patient_id=patient_id,
            mrn=patient_data['mrn'],
            timestamp=datetime.utcnow()
        ))
        
        return patient_id
    
    def update_demographics(self, patient_id: str, updates: dict):
        """Update patient demographics - owns this data."""
        self.repository.update(patient_id, updates)
        
        self.event_bus.publish(PatientUpdatedEvent(
            patient_id=patient_id,
            fields_updated=list(updates.keys())
        ))
```

### Decompose by Subdomain (DDD)

Use Domain-Driven Design to identify bounded contexts.

**Strategic DDD Mapping:**
```
Core Domain (high value, competitive advantage):
- Lab Test Processing
- Results Interpretation

Supporting Subdomain (necessary but not differentiating):
- Patient Registration
- Appointment Scheduling

Generic Subdomain (commodity, can use off-the-shelf):
- Notifications (email/SMS)
- Document Storage
- Audit Logging
```

---

## 2. Inter-Service Communication Patterns

### Synchronous: API Gateway Pattern

**Structure:**
```
Client → API Gateway → [Auth] → Service Mesh → Microservices
                      → [Rate Limit]
                      → [Routing]
                      → [Aggregation]
```

**Implementation with Kong/AWS API Gateway:**
```yaml
# API Gateway routes
routes:
  - name: patient-service
    paths:
      - /api/v1/patients
    methods: [GET, POST, PUT, DELETE]
    upstream: patient-service.internal:8080
    plugins:
      - name: jwt
        config:
          claims_to_verify: [exp, nbf]
      - name: rate-limiting
        config:
          minute: 100
          policy: local
      - name: request-transformer
        config:
          add:
            headers:
              - X-Correlation-ID: $(uuid())

  - name: lab-results-service
    paths:
      - /api/v1/lab-results
    methods: [GET, POST]
    upstream: lab-results-service.internal:8080
    plugins:
      - name: response-transformer
        config:
          remove:
            headers: [X-Internal-Token]
```

### Asynchronous: Event-Driven Pattern

**Event Bus with SNS/SQS:**
```python
from dataclasses import dataclass
from datetime import datetime
import json
import boto3

@dataclass
class DomainEvent:
    """Base class for domain events."""
    event_id: str
    event_type: str
    aggregate_id: str
    timestamp: datetime
    version: int = 1

@dataclass
class LabResultAvailableEvent(DomainEvent):
    """Published when lab result is available."""
    patient_id: str
    order_id: str
    test_code: str
    critical_flag: bool

class EventBus:
    """Event bus for publishing domain events."""
    
    def __init__(self, topic_arn: str):
        self.sns = boto3.client('sns')
        self.topic_arn = topic_arn
    
    def publish(self, event: DomainEvent):
        """Publish event to SNS topic."""
        message = {
            'event_id': event.event_id,
            'event_type': event.event_type,
            'aggregate_id': event.aggregate_id,
            'timestamp': event.timestamp.isoformat(),
            'payload': event.__dict__
        }
        
        self.sns.publish(
            TopicArn=self.topic_arn,
            Message=json.dumps(message),
            MessageAttributes={
                'event_type': {
                    'DataType': 'String',
                    'StringValue': event.event_type
                }
            }
        )

# Lab Results Service publishes event
class LabResultsService:
    def process_result(self, order_id: str, result_data: dict):
        """Process lab result and publish event."""
        # Store result
        result_id = self.repository.save_result(order_id, result_data)
        
        # Publish event
        event = LabResultAvailableEvent(
            event_id=str(uuid.uuid4()),
            event_type='LabResultAvailable',
            aggregate_id=result_id,
            timestamp=datetime.utcnow(),
            patient_id=result_data['patient_id'],
            order_id=order_id,
            test_code=result_data['test_code'],
            critical_flag=result_data.get('critical', False)
        )
        
        self.event_bus.publish(event)

# Notification Service subscribes to event
class NotificationService:
    def handle_lab_result_available(self, event: LabResultAvailableEvent):
        """Handle lab result available event."""
        if event.critical_flag:
            # Send urgent notification
            self.send_urgent_notification(
                patient_id=event.patient_id,
                message=f"Critical lab result available for order {event.order_id}"
            )
        else:
            # Send standard notification
            self.send_notification(
                patient_id=event.patient_id,
                message=f"Lab results are ready"
            )
```

### Saga Pattern for Distributed Transactions

**Choreography-Based Saga:**
```python
# Appointment Booking Saga (choreography)

# 1. Appointment Service
class AppointmentService:
    def create_appointment(self, appointment_data: dict):
        """Create appointment - start of saga."""
        appointment_id = self._create_tentative_appointment(appointment_data)
        
        # Publish event
        self.event_bus.publish(AppointmentCreatedEvent(
            appointment_id=appointment_id,
            patient_id=appointment_data['patient_id'],
            slot_id=appointment_data['slot_id'],
            timestamp=datetime.utcnow()
        ))
        
        return appointment_id
    
    def handle_payment_failed(self, event: PaymentFailedEvent):
        """Compensate - cancel appointment if payment fails."""
        self.cancel_appointment(event.appointment_id)

# 2. Slot Service
class SlotService:
    def handle_appointment_created(self, event: AppointmentCreatedEvent):
        """Reserve slot when appointment created."""
        try:
            self.reserve_slot(event.slot_id)
            
            self.event_bus.publish(SlotReservedEvent(
                slot_id=event.slot_id,
                appointment_id=event.appointment_id
            ))
        except SlotUnavailableError:
            # Publish compensation event
            self.event_bus.publish(SlotReservationFailedEvent(
                appointment_id=event.appointment_id,
                reason="Slot no longer available"
            ))
    
    def handle_payment_failed(self, event: PaymentFailedEvent):
        """Release slot if payment fails."""
        self.release_slot(event.slot_id)

# 3. Payment Service
class PaymentService:
    def handle_slot_reserved(self, event: SlotReservedEvent):
        """Charge patient after slot reserved."""
        try:
            self.charge_copay(event.appointment_id)
            
            self.event_bus.publish(PaymentSucceededEvent(
                appointment_id=event.appointment_id
            ))
        except PaymentError as e:
            # Trigger compensation
            self.event_bus.publish(PaymentFailedEvent(
                appointment_id=event.appointment_id,
                slot_id=event.slot_id,
                reason=str(e)
            ))
```

---

## 3. Data Management Patterns

### Database per Service

Each service owns its data and schema.

**Anti-Pattern (shared database):**
```
❌ Multiple services → Single shared database
   - Tight coupling
   - Schema changes affect all services
   - No independent deployment
```

**Correct Pattern:**
```
✅ Patient Service → Patient DB (PostgreSQL)
✅ Appointment Service → Appointment DB (PostgreSQL)
✅ Lab Results Service → Results DB (DynamoDB)
✅ Notification Service → Message Queue (SQS)
```

### CQRS (Command Query Responsibility Segregation)

Separate read and write models for scalability.

**Implementation:**
```python
# Write Model (Command Side)
class LabOrderCommandService:
    """Handles writes - optimized for consistency."""
    
    def __init__(self, write_db, event_bus):
        self.write_db = write_db  # PostgreSQL for ACID
        self.event_bus = event_bus
    
    def create_order(self, order_data: dict) -> str:
        """Create lab order (write operation)."""
        order_id = str(uuid.uuid4())
        
        # Write to transactional DB
        self.write_db.execute("""
            INSERT INTO lab_orders (order_id, patient_id, test_code, status, created_at)
            VALUES (%s, %s, %s, 'pending', NOW())
        """, (order_id, order_data['patient_id'], order_data['test_code']))
        
        # Publish event to update read model
        self.event_bus.publish(LabOrderCreatedEvent(
            order_id=order_id,
            patient_id=order_data['patient_id'],
            test_code=order_data['test_code']
        ))
        
        return order_id

# Read Model (Query Side)
class LabOrderQueryService:
    """Handles reads - optimized for performance."""
    
    def __init__(self, read_db):
        self.read_db = read_db  # Elasticsearch for fast queries
    
    def get_patient_orders(self, patient_id: str) -> list:
        """Get patient's lab orders (read operation)."""
        # Query denormalized read model
        results = self.read_db.search(
            index='lab_orders',
            body={
                'query': {
                    'bool': {
                        'must': [
                            {'term': {'patient_id': patient_id}},
                            {'range': {'created_at': {'gte': 'now-1y'}}}
                        ]
                    }
                },
                'sort': [{'created_at': 'desc'}]
            }
        )
        
        return [hit['_source'] for hit in results['hits']['hits']]
    
    def search_orders_by_test_code(self, test_code: str, facility_id: str) -> list:
        """Complex query across multiple dimensions."""
        # Read model is denormalized for fast queries
        results = self.read_db.search(
            index='lab_orders',
            body={
                'query': {
                    'bool': {
                        'must': [
                            {'term': {'test_code': test_code}},
                            {'term': {'facility_id': facility_id}},
                            {'term': {'status': 'completed'}}
                        ]
                    }
                },
                'aggs': {
                    'avg_turnaround_time': {
                        'avg': {'field': 'turnaround_time_hours'}
                    }
                }
            }
        )
        
        return results

# Event Handler - Updates Read Model
class LabOrderProjector:
    """Projects write model events to read model."""
    
    def handle_order_created(self, event: LabOrderCreatedEvent):
        """Update read model when order created."""
        self.elasticsearch.index(
            index='lab_orders',
            id=event.order_id,
            body={
                'order_id': event.order_id,
                'patient_id': event.patient_id,
                'test_code': event.test_code,
                'status': 'pending',
                'created_at': event.timestamp.isoformat()
            }
        )
```

### Event Sourcing

Store all changes as events rather than current state.

```python
# Event Store
class EventStore:
    """Store domain events as source of truth."""
    
    def append(self, aggregate_id: str, events: list[DomainEvent]):
        """Append events to aggregate stream."""
        for event in events:
            self.db.execute("""
                INSERT INTO event_store (
                    aggregate_id, event_type, event_data, version, timestamp
                )
                VALUES (%s, %s, %s, %s, %s)
            """, (
                aggregate_id,
                event.event_type,
                json.dumps(event.__dict__),
                event.version,
                event.timestamp
            ))
    
    def get_events(self, aggregate_id: str) -> list[DomainEvent]:
        """Retrieve all events for an aggregate."""
        rows = self.db.query("""
            SELECT event_type, event_data, version, timestamp
            FROM event_store
            WHERE aggregate_id = %s
            ORDER BY version ASC
        """, (aggregate_id,))
        
        return [self._deserialize_event(row) for row in rows]

# Aggregate rebuilt from events
class LabOrder:
    """Lab order aggregate - rebuilt from events."""
    
    def __init__(self, order_id: str):
        self.order_id = order_id
        self.patient_id = None
        self.status = None
        self.test_code = None
        self.version = 0
    
    @classmethod
    def from_events(cls, events: list[DomainEvent]) -> 'LabOrder':
        """Reconstitute aggregate from event stream."""
        order = cls(events[0].aggregate_id)
        
        for event in events:
            order._apply(event)
        
        return order
    
    def _apply(self, event: DomainEvent):
        """Apply event to update state."""
        if isinstance(event, OrderCreatedEvent):
            self.patient_id = event.patient_id
            self.test_code = event.test_code
            self.status = 'pending'
        
        elif isinstance(event, SampleCollectedEvent):
            self.status = 'collected'
            self.sample_id = event.sample_id
        
        elif isinstance(event, ResultsPublishedEvent):
            self.status = 'completed'
            self.results = event.results
        
        self.version = event.version
```

---

## 4. Resilience Patterns

### Circuit Breaker

Prevent cascading failures when a service is down.

```python
from enum import Enum
import time

class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if service recovered

class CircuitBreaker:
    """Circuit breaker for service calls."""
    
    def __init__(
        self,
        failure_threshold: int = 5,
        timeout_seconds: int = 60,
        success_threshold: int = 2
    ):
        self.failure_threshold = failure_threshold
        self.timeout_seconds = timeout_seconds
        self.success_threshold = success_threshold
        
        self.failure_count = 0
        self.success_count = 0
        self.state = CircuitState.CLOSED
        self.opened_at = None
    
    def call(self, func, *args, **kwargs):
        """Execute function with circuit breaker protection."""
        if self.state == CircuitState.OPEN:
            if time.time() - self.opened_at > self.timeout_seconds:
                # Try to recover
                self.state = CircuitState.HALF_OPEN
                self.success_count = 0
            else:
                raise CircuitBreakerOpenError("Service unavailable")
        
        try:
            result = func(*args, **kwargs)
            self._on_success()
            return result
        
        except Exception as e:
            self._on_failure()
            raise
    
    def _on_success(self):
        """Handle successful call."""
        self.failure_count = 0
        
        if self.state == CircuitState.HALF_OPEN:
            self.success_count += 1
            
            if self.success_count >= self.success_threshold:
                # Service recovered
                self.state = CircuitState.CLOSED
                self.success_count = 0
    
    def _on_failure(self):
        """Handle failed call."""
        self.failure_count += 1
        
        if self.failure_count >= self.failure_threshold:
            # Open circuit
            self.state = CircuitState.OPEN
            self.opened_at = time.time()

# Usage
appointment_service_breaker = CircuitBreaker(
    failure_threshold=5,
    timeout_seconds=60
)

def get_available_slots(date: str) -> list:
    """Get available appointment slots with circuit breaker."""
    return appointment_service_breaker.call(
        appointment_service_client.get_slots,
        date=date
    )
```

### Retry with Exponential Backoff

```python
import time
import random
from functools import wraps

def retry_with_backoff(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 60.0,
    exponential_base: float = 2.0,
    jitter: bool = True
):
    """Retry decorator with exponential backoff."""
    
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                
                except (ConnectionError, TimeoutError) as e:
                    if attempt == max_retries:
                        raise
                    
                    # Calculate delay
                    delay = min(
                        base_delay * (exponential_base ** attempt),
                        max_delay
                    )
                    
                    # Add jitter to prevent thundering herd
                    if jitter:
                        delay = delay * (0.5 + random.random())
                    
                    logger.warning(
                        f"Attempt {attempt + 1} failed: {e}. "
                        f"Retrying in {delay:.2f}s..."
                    )
                    
                    time.sleep(delay)
        
        return wrapper
    return decorator

# Usage
@retry_with_backoff(max_retries=3, base_delay=1.0)
def fetch_patient_data(patient_id: str) -> dict:
    """Fetch patient data with retry."""
    response = requests.get(
        f"https://api.internal/patients/{patient_id}",
        timeout=5
    )
    response.raise_for_status()
    return response.json()
```

### Bulkhead Pattern

Isolate resources to prevent total system failure.

```python
from concurrent.futures import ThreadPoolExecutor
import threading

class BulkheadExecutor:
    """Bulkhead pattern - isolate thread pools per service."""
    
    def __init__(self):
        # Separate thread pools for each external service
        self.executors = {
            'patient_service': ThreadPoolExecutor(max_workers=10),
            'lab_service': ThreadPoolExecutor(max_workers=20),
            'billing_service': ThreadPoolExecutor(max_workers=5),
        }
    
    def execute(self, service_name: str, func, *args, **kwargs):
        """Execute function in isolated bulkhead."""
        executor = self.executors.get(service_name)
        
        if not executor:
            raise ValueError(f"Unknown service: {service_name}")
        
        future = executor.submit(func, *args, **kwargs)
        return future.result(timeout=30)

bulkhead = BulkheadExecutor()

# If lab_service is slow, it won't exhaust threads for other services
patient_data = bulkhead.execute('patient_service', fetch_patient, 'P123')
lab_results = bulkhead.execute('lab_service', fetch_lab_results, 'P123')
```

---

## 5. Observability Patterns

### Distributed Tracing

```python
from opentelemetry import trace
from opentelemetry.instrumentation.requests import RequestsInstrumentor

# Initialize tracer
tracer = trace.get_tracer(__name__)

class PatientService:
    """Patient service with distributed tracing."""
    
    def get_patient_profile(self, patient_id: str) -> dict:
        """Get complete patient profile (aggregates from multiple services)."""
        
        with tracer.start_as_current_span("get_patient_profile") as span:
            span.set_attribute("patient_id", patient_id)
            
            # Fetch patient demographics
            with tracer.start_as_current_span("fetch_demographics"):
                demographics = self._fetch_demographics(patient_id)
            
            # Fetch appointment history (external service)
            with tracer.start_as_current_span("fetch_appointments"):
                appointments = self._fetch_appointments(patient_id)
            
            # Fetch lab results (external service)
            with tracer.start_as_current_span("fetch_lab_results"):
                lab_results = self._fetch_lab_results(patient_id)
            
            profile = {
                'demographics': demographics,
                'appointments': appointments,
                'lab_results': lab_results
            }
            
            span.set_attribute("profile_sections_count", len(profile))
            
            return profile
```

### Health Check Endpoint

```python
from flask import Flask, jsonify
import psycopg2

app = Flask(__name__)

class HealthChecker:
    """Health check implementation."""
    
    def __init__(self, db_connection, redis_client, external_services):
        self.db = db_connection
        self.redis = redis_client
        self.external_services = external_services
    
    def check_database(self) -> dict:
        """Check database connectivity."""
        try:
            self.db.execute("SELECT 1")
            return {"status": "UP", "response_time_ms": 5}
        except Exception as e:
            return {"status": "DOWN", "error": str(e)}
    
    def check_cache(self) -> dict:
        """Check Redis cache."""
        try:
            self.redis.ping()
            return {"status": "UP"}
        except Exception as e:
            return {"status": "DOWN", "error": str(e)}
    
    def check_external_services(self) -> dict:
        """Check external service dependencies."""
        results = {}
        
        for service_name, service_url in self.external_services.items():
            try:
                response = requests.get(
                    f"{service_url}/health",
                    timeout=2
                )
                results[service_name] = {
                    "status": "UP" if response.ok else "DOWN",
                    "response_time_ms": response.elapsed.total_seconds() * 1000
                }
            except Exception as e:
                results[service_name] = {"status": "DOWN", "error": str(e)}
        
        return results
    
    def overall_health(self) -> dict:
        """Get overall service health."""
        db_health = self.check_database()
        cache_health = self.check_cache()
        external_health = self.check_external_services()
        
        # Determine overall status
        critical_down = db_health['status'] == 'DOWN'
        dependencies_down = any(
            s['status'] == 'DOWN' for s in external_health.values()
        )
        
        if critical_down:
            overall_status = 'DOWN'
        elif dependencies_down:
            overall_status = 'DEGRADED'
        else:
            overall_status = 'UP'
        
        return {
            'status': overall_status,
            'components': {
                'database': db_health,
                'cache': cache_health,
                'external_services': external_health
            }
        }

@app.route('/health')
def health_check():
    """Health check endpoint."""
    health = health_checker.overall_health()
    status_code = 200 if health['status'] == 'UP' else 503
    return jsonify(health), status_code
```

---

## 6. Deployment Patterns

### Sidecar Pattern

Deploy helper containers alongside main service container.

```yaml
# Kubernetes deployment with sidecar
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patient-service
spec:
  replicas: 3
  template:
    spec:
      containers:
        # Main application container
        - name: patient-service
          image: labcorp/patient-service:v1.2.0
          ports:
            - containerPort: 8080
          env:
            - name: LOG_LEVEL
              value: "INFO"
        
        # Sidecar: Log aggregator
        - name: log-agent
          image: fluent/fluent-bit:latest
          volumeMounts:
            - name: app-logs
              mountPath: /var/log/app
        
        # Sidecar: Metrics exporter
        - name: metrics-exporter
          image: prom/statsd-exporter:latest
          ports:
            - containerPort: 9102
      
      volumes:
        - name: app-logs
          emptyDir: {}
```

### Blue-Green Deployment

```yaml
# Blue deployment (current production)
apiVersion: v1
kind: Service
metadata:
  name: patient-service
spec:
  selector:
    app: patient-service
    version: blue  # Routes to blue
  ports:
    - protocol: TCP
      port: 80
      targetPort: 8080

---
# Blue deployment
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patient-service-blue
spec:
  replicas: 3
  selector:
    matchLabels:
      app: patient-service
      version: blue
  template:
    metadata:
      labels:
        app: patient-service
        version: blue
    spec:
      containers:
        - name: patient-service
          image: labcorp/patient-service:v1.1.0

---
# Green deployment (new version, not receiving traffic yet)
apiVersion: apps/v1
kind: Deployment
metadata:
  name: patient-service-green
spec:
  replicas: 3
  selector:
    matchLabels:
      app: patient-service
      version: green
  template:
    metadata:
      labels:
        app: patient-service
        version: green
    spec:
      containers:
        - name: patient-service
          image: labcorp/patient-service:v1.2.0

# To switch traffic to green:
# kubectl patch service patient-service -p '{"spec":{"selector":{"version":"green"}}}'
```
