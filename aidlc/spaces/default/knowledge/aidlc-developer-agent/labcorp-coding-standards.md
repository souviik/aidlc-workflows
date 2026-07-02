# Labcorp Coding Standards and Best Practices

Language-agnostic coding standards and best practices for software development at Labcorp.

---

## 1. Code Quality Principles

### SOLID Principles

**Single Responsibility Principle (SRP)**
```python
# BAD: Class doing too many things
class PatientManager:
    def create_patient(self, data): pass
    def send_email(self, patient_id): pass
    def generate_report(self, patient_id): pass
    def process_payment(self, patient_id): pass

# GOOD: Each class has single responsibility
class PatientRepository:
    def create(self, data): pass
    def update(self, patient_id, data): pass
    def get_by_id(self, patient_id): pass

class NotificationService:
    def send_email(self, recipient, message): pass

class ReportGenerator:
    def generate_patient_report(self, patient_id): pass

class PaymentProcessor:
    def process_payment(self, payment_details): pass
```

**Open/Closed Principle (OCP)**
```python
# BAD: Modifying existing code for new requirements
class LabResultFormatter:
    def format(self, result, format_type):
        if format_type == "PDF":
            return self._format_pdf(result)
        elif format_type == "HTML":
            return self._format_html(result)
        # Adding new format requires modifying this class

# GOOD: Open for extension, closed for modification
from abc import ABC, abstractmethod

class ResultFormatter(ABC):
    @abstractmethod
    def format(self, result): pass

class PDFFormatter(ResultFormatter):
    def format(self, result):
        return self._to_pdf(result)

class HTMLFormatter(ResultFormatter):
    def format(self, result):
        return self._to_html(result)

class JSONFormatter(ResultFormatter):
    def format(self, result):
        return json.dumps(result)

# Usage - add new formatters without changing existing code
formatter = JSONFormatter()  # Easy to add new formatters
output = formatter.format(result)
```

**Dependency Inversion Principle (DIP)**
```python
# BAD: High-level module depends on low-level module
class PatientService:
    def __init__(self):
        self.db = PostgreSQLDatabase()  # Concrete dependency
    
    def get_patient(self, patient_id):
        return self.db.query(f"SELECT * FROM patients WHERE id = {patient_id}")

# GOOD: Depend on abstractions
class PatientRepository(ABC):
    @abstractmethod
    def get_by_id(self, patient_id): pass

class PostgreSQLPatientRepository(PatientRepository):
    def get_by_id(self, patient_id):
        return self.db.query("SELECT * FROM patients WHERE id = %s", (patient_id,))

class PatientService:
    def __init__(self, repository: PatientRepository):
        self.repository = repository  # Depends on abstraction
    
    def get_patient(self, patient_id):
        return self.repository.get_by_id(patient_id)

# Easy to swap implementations
service = PatientService(PostgreSQLPatientRepository())
# or
service = PatientService(DynamoDBPatientRepository())
```

---

## 2. Error Handling

### Use Specific Exceptions

```python
# BAD: Generic exceptions
def process_lab_order(order_id):
    try:
        order = get_order(order_id)
        if not order:
            raise Exception("Not found")
        return process(order)
    except Exception as e:
        log.error(f"Error: {e}")
        raise

# GOOD: Specific exceptions
class OrderNotFoundError(Exception):
    """Raised when lab order is not found."""
    pass

class OrderProcessingError(Exception):
    """Raised when order processing fails."""
    pass

class InvalidOrderStateError(Exception):
    """Raised when order is in invalid state for operation."""
    pass

def process_lab_order(order_id: str) -> ProcessedOrder:
    """Process lab order.
    
    Args:
        order_id: Unique order identifier
        
    Returns:
        ProcessedOrder object
        
    Raises:
        OrderNotFoundError: If order doesn't exist
        InvalidOrderStateError: If order not in processable state
        OrderProcessingError: If processing fails
    """
    order = get_order(order_id)
    
    if not order:
        raise OrderNotFoundError(f"Order {order_id} not found")
    
    if order.status != OrderStatus.PENDING:
        raise InvalidOrderStateError(
            f"Order {order_id} in state {order.status}, expected PENDING"
        )
    
    try:
        return process(order)
    except ProcessingException as e:
        raise OrderProcessingError(f"Failed to process order {order_id}") from e
```

### Fail Fast

```python
# BAD: Late validation
def schedule_appointment(patient_id, date, time, facility_id):
    appointment = Appointment()
    appointment.patient_id = patient_id
    appointment.date = date
    appointment.time = time
    appointment.facility_id = facility_id
    
    # Validation happens late, after object creation
    if not patient_exists(patient_id):
        raise ValueError("Patient not found")
    
    if not is_valid_date(date):
        raise ValueError("Invalid date")
    
    return save_appointment(appointment)

# GOOD: Validate early
def schedule_appointment(
    patient_id: str,
    date: datetime.date,
    time: datetime.time,
    facility_id: str
) -> Appointment:
    """Schedule appointment with early validation."""
    
    # Fail fast - validate immediately
    if not patient_id:
        raise ValueError("patient_id is required")
    
    if not patient_exists(patient_id):
        raise PatientNotFoundError(f"Patient {patient_id} not found")
    
    if date < datetime.date.today():
        raise ValueError("Cannot schedule appointment in the past")
    
    if not facility_exists(facility_id):
        raise FacilityNotFoundError(f"Facility {facility_id} not found")
    
    # All validations passed, proceed with business logic
    appointment = Appointment(
        patient_id=patient_id,
        date=date,
        time=time,
        facility_id=facility_id
    )
    
    return save_appointment(appointment)
```

---

## 3. Defensive Programming

### Validate Inputs

```python
from typing import Optional
import re

def create_patient(
    mrn: str,
    first_name: str,
    last_name: str,
    date_of_birth: datetime.date,
    email: Optional[str] = None,
    phone: Optional[str] = None
) -> str:
    """Create patient with input validation.
    
    Args:
        mrn: Medical Record Number (format: MRN followed by 6 digits)
        first_name: Patient first name (1-50 characters)
        last_name: Patient last name (1-50 characters)
        date_of_birth: Patient date of birth (must be in past)
        email: Optional email address
        phone: Optional phone number (10 digits)
        
    Returns:
        Patient ID
        
    Raises:
        ValueError: If any input validation fails
    """
    # Validate MRN format
    if not re.match(r'^MRN\d{6}$', mrn):
        raise ValueError("MRN must be in format MRN######")
    
    # Validate name fields
    if not first_name or len(first_name) > 50:
        raise ValueError("First name must be 1-50 characters")
    
    if not last_name or len(last_name) > 50:
        raise ValueError("Last name must be 1-50 characters")
    
    # Validate date of birth
    if date_of_birth >= datetime.date.today():
        raise ValueError("Date of birth must be in the past")
    
    age = (datetime.date.today() - date_of_birth).days / 365.25
    if age > 150:
        raise ValueError("Invalid date of birth - age exceeds 150 years")
    
    # Validate optional email
    if email:
        if not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
            raise ValueError("Invalid email format")
    
    # Validate optional phone
    if phone:
        digits_only = re.sub(r'\D', '', phone)
        if len(digits_only) != 10:
            raise ValueError("Phone must be 10 digits")
    
    # All validations passed
    patient_id = _create_patient_record(mrn, first_name, last_name, date_of_birth, email, phone)
    
    return patient_id
```

### Guard Against Null/None

```python
# BAD: No null checks
def calculate_bmi(weight_kg, height_m):
    return weight_kg / (height_m ** 2)

# GOOD: Guard against null/invalid values
def calculate_bmi(weight_kg: Optional[float], height_m: Optional[float]) -> Optional[float]:
    """Calculate BMI with null guards.
    
    Returns None if inputs are invalid or missing.
    """
    if weight_kg is None or height_m is None:
        return None
    
    if weight_kg <= 0 or height_m <= 0:
        return None
    
    if height_m > 3.0 or weight_kg > 500:  # Sanity check
        return None
    
    return round(weight_kg / (height_m ** 2), 1)

# Usage
bmi = calculate_bmi(patient.weight, patient.height)
if bmi is not None:
    print(f"BMI: {bmi}")
else:
    print("Unable to calculate BMI - missing or invalid data")
```

---

## 4. Naming Conventions

### Clear, Descriptive Names

```python
# BAD: Unclear names
def proc(d):
    r = []
    for i in d:
        if i['s'] == 'p':
            r.append(i)
    return r

# GOOD: Clear, descriptive names
def get_pending_lab_orders(orders: list[dict]) -> list[dict]:
    """Filter lab orders to return only pending orders."""
    pending_orders = []
    
    for order in orders:
        if order['status'] == 'pending':
            pending_orders.append(order)
    
    return pending_orders
```

### Naming Standards

```python
# Classes: PascalCase
class PatientRepository:
    pass

class LabResultProcessor:
    pass

# Functions/Methods: snake_case
def calculate_age(date_of_birth: datetime.date) -> int:
    pass

def process_lab_result(result_data: dict) -> ProcessedResult:
    pass

# Constants: UPPER_SNAKE_CASE
MAX_RETRY_ATTEMPTS = 3
DATABASE_TIMEOUT_SECONDS = 30
DEFAULT_PAGE_SIZE = 50

# Private methods: _leading_underscore
class PatientService:
    def get_patient(self, patient_id: str) -> Patient:
        return self._fetch_from_db(patient_id)
    
    def _fetch_from_db(self, patient_id: str) -> Patient:
        """Private helper method."""
        pass

# Boolean variables: is_, has_, can_, should_
is_valid = validate_input(data)
has_permission = user.has_role('admin')
can_edit = check_edit_permission(user, resource)
should_retry = attempt < MAX_RETRY_ATTEMPTS
```

---

## 5. Function Design

### Keep Functions Small and Focused

```python
# BAD: Long function doing too much
def process_appointment(appointment_id):
    # Get appointment
    appointment = db.query("SELECT * FROM appointments WHERE id = %s", (appointment_id,))
    
    # Get patient
    patient = db.query("SELECT * FROM patients WHERE id = %s", (appointment['patient_id'],))
    
    # Send reminder email
    email_body = f"Dear {patient['first_name']}, your appointment is on {appointment['date']}"
    smtp.send(patient['email'], "Appointment Reminder", email_body)
    
    # Update status
    db.execute("UPDATE appointments SET status = 'confirmed' WHERE id = %s", (appointment_id,))
    
    # Log activity
    db.execute("INSERT INTO activity_log (appointment_id, action) VALUES (%s, 'confirmed')", (appointment_id,))
    
    return {"status": "success"}

# GOOD: Small, focused functions
def process_appointment(appointment_id: str) -> dict:
    """Process appointment confirmation."""
    appointment = get_appointment(appointment_id)
    patient = get_patient(appointment.patient_id)
    
    send_appointment_reminder(patient, appointment)
    confirm_appointment(appointment_id)
    log_appointment_activity(appointment_id, 'confirmed')
    
    return {"status": "success", "appointment_id": appointment_id}

def get_appointment(appointment_id: str) -> Appointment:
    """Retrieve appointment by ID."""
    return appointment_repository.get_by_id(appointment_id)

def get_patient(patient_id: str) -> Patient:
    """Retrieve patient by ID."""
    return patient_repository.get_by_id(patient_id)

def send_appointment_reminder(patient: Patient, appointment: Appointment):
    """Send appointment reminder email to patient."""
    message = EmailMessage(
        to=patient.email,
        subject="Appointment Reminder",
        body=render_template('appointment_reminder.html', patient, appointment)
    )
    email_service.send(message)

def confirm_appointment(appointment_id: str):
    """Update appointment status to confirmed."""
    appointment_repository.update_status(appointment_id, AppointmentStatus.CONFIRMED)

def log_appointment_activity(appointment_id: str, action: str):
    """Log appointment activity."""
    activity_logger.log(appointment_id, action, timestamp=datetime.utcnow())
```

### Limit Function Parameters

```python
# BAD: Too many parameters
def create_lab_order(patient_id, test_code, priority, physician_id, 
                     facility_id, insurance_id, fasting_required, 
                     collection_date, notes, consent_signed):
    pass

# GOOD: Use data objects
@dataclass
class LabOrderRequest:
    patient_id: str
    test_code: str
    physician_id: str
    facility_id: str
    priority: OrderPriority = OrderPriority.ROUTINE
    insurance_id: Optional[str] = None
    fasting_required: bool = False
    collection_date: Optional[datetime.date] = None
    notes: Optional[str] = None
    consent_signed: bool = False

def create_lab_order(request: LabOrderRequest) -> str:
    """Create lab order from request object."""
    validate_order_request(request)
    
    order_id = order_repository.create(request)
    
    event_bus.publish(LabOrderCreatedEvent(
        order_id=order_id,
        patient_id=request.patient_id,
        test_code=request.test_code
    ))
    
    return order_id
```

---

## 6. Comments and Documentation

### When to Comment

```python
# BAD: Obvious comments
# Get patient by ID
patient = get_patient(patient_id)

# Loop through results
for result in results:
    process(result)

# GOOD: Comments explain WHY, not WHAT
def calculate_renal_function(creatinine: float, age: int, is_female: bool) -> float:
    """Calculate estimated GFR using CKD-EPI equation.
    
    Using CKD-EPI equation (2009) as recommended by NKDEP.
    More accurate than MDRD formula, especially for GFR > 60.
    
    Reference: https://www.kidney.org/content/ckd-epi-creatinine-equation-2009
    """
    # Apply gender-specific coefficient
    # Female patients have lower muscle mass, affecting creatinine baseline
    kappa = 0.7 if is_female else 0.9
    alpha = -0.329 if is_female else -0.411
    
    # Gender coefficient accounts for physiological differences
    gender_coeff = 1.018 if is_female else 1.0
    
    return 141 * min(creatinine / kappa, 1) ** alpha * \
           max(creatinine / kappa, 1) ** -1.209 * \
           0.993 ** age * gender_coeff

# Explain non-obvious business rules
def is_eligible_for_screening(patient: Patient, test_code: str) -> bool:
    """Check if patient is eligible for preventive screening.
    
    Eligibility rules based on USPSTF recommendations and insurance coverage:
    - Colonoscopy: Age 45-75 (changed from 50 in 2021)
    - Mammogram: Age 40+ for average risk, 30+ for high risk (BRCA+)
    - PSA: Age 55-69, shared decision making required (Grade C)
    """
    pass
```

### Docstring Standards

```python
def process_lab_result(
    order_id: str,
    result_data: dict,
    reviewed_by: str
) -> ProcessedResult:
    """Process and validate lab result data.
    
    Performs the following operations:
    1. Validates result data against test specifications
    2. Calculates reference range flags (normal/abnormal/critical)
    3. Checks for delta values (significant change from previous)
    4. Stores result in database
    5. Publishes ResultAvailable event
    
    Args:
        order_id: Unique lab order identifier (format: ORD######)
        result_data: Dictionary containing test values and units
            Expected keys: test_code, value, unit, timestamp
        reviewed_by: Technician ID who reviewed the result
    
    Returns:
        ProcessedResult object containing:
            - result_id: Generated unique identifier
            - flags: List of clinical flags (e.g., 'HIGH', 'CRITICAL')
            - delta_check: Delta change indicator if applicable
    
    Raises:
        OrderNotFoundError: If order_id doesn't exist
        ValidationError: If result_data is invalid or incomplete
        ReferenceRangeError: If reference range not found for test
    
    Example:
        >>> result_data = {
        ...     'test_code': 'GLU',
        ...     'value': 110,
        ...     'unit': 'mg/dL',
        ...     'timestamp': datetime.utcnow()
        ... }
        >>> processed = process_lab_result('ORD123456', result_data, 'TECH001')
        >>> print(processed.flags)
        ['HIGH']
    """
    pass
```

---

## 7. Code Organization

### Logical Grouping

```python
# BAD: Random order
class PatientService:
    def update_address(self, patient_id, address): pass
    def create_patient(self, data): pass
    def delete_patient(self, patient_id): pass
    def get_patient(self, patient_id): pass
    def send_notification(self, patient_id): pass
    def validate_mrn(self, mrn): pass

# GOOD: Organized by functionality
class PatientService:
    """Patient management service."""
    
    # Constructor
    def __init__(self, repository, notification_service):
        self.repository = repository
        self.notification_service = notification_service
    
    # Public API - CRUD operations
    def create_patient(self, data: PatientData) -> str:
        """Create new patient."""
        pass
    
    def get_patient(self, patient_id: str) -> Patient:
        """Retrieve patient by ID."""
        pass
    
    def update_patient(self, patient_id: str, updates: dict):
        """Update patient information."""
        pass
    
    def delete_patient(self, patient_id: str):
        """Soft delete patient (archive)."""
        pass
    
    # Public API - Additional operations
    def update_contact_info(self, patient_id: str, contact: ContactInfo):
        """Update patient contact information."""
        pass
    
    def send_notification(self, patient_id: str, message: str):
        """Send notification to patient."""
        pass
    
    # Private helper methods
    def _validate_mrn(self, mrn: str) -> bool:
        """Validate MRN format."""
        pass
    
    def _check_duplicate(self, mrn: str) -> bool:
        """Check if patient with MRN already exists."""
        pass
```

### File Organization

```
src/
├── models/              # Data models
│   ├── patient.py
│   ├── appointment.py
│   └── lab_order.py
│
├── repositories/        # Data access layer
│   ├── patient_repository.py
│   ├── appointment_repository.py
│   └── lab_order_repository.py
│
├── services/           # Business logic
│   ├── patient_service.py
│   ├── appointment_service.py
│   └── lab_order_service.py
│
├── api/                # API endpoints
│   ├── patients.py
│   ├── appointments.py
│   └── lab_orders.py
│
├── utils/              # Utility functions
│   ├── validators.py
│   ├── formatters.py
│   └── date_utils.py
│
└── config/             # Configuration
    ├── database.py
    ├── logging.py
    └── settings.py
```

---

## 8. Performance Considerations

### Avoid N+1 Queries

```python
# BAD: N+1 query problem
def get_patients_with_appointments(patient_ids: list[str]) -> list[dict]:
    patients = []
    
    for patient_id in patient_ids:  # 1 query
        patient = db.query("SELECT * FROM patients WHERE id = %s", (patient_id,))
        
        # N queries - one per patient!
        appointments = db.query(
            "SELECT * FROM appointments WHERE patient_id = %s",
            (patient_id,)
        )
        
        patient['appointments'] = appointments
        patients.append(patient)
    
    return patients

# GOOD: Batch queries
def get_patients_with_appointments(patient_ids: list[str]) -> list[dict]:
    # Single query for all patients
    patients = db.query(
        "SELECT * FROM patients WHERE id = ANY(%s)",
        (patient_ids,)
    )
    
    # Single query for all appointments
    appointments = db.query(
        "SELECT * FROM appointments WHERE patient_id = ANY(%s)",
        (patient_ids,)
    )
    
    # Group appointments by patient in memory
    appointments_by_patient = {}
    for appt in appointments:
        appointments_by_patient.setdefault(appt['patient_id'], []).append(appt)
    
    # Combine data
    for patient in patients:
        patient['appointments'] = appointments_by_patient.get(patient['id'], [])
    
    return patients
```

### Use Lazy Loading When Appropriate

```python
class Patient:
    """Patient model with lazy-loaded relationships."""
    
    def __init__(self, patient_id: str, first_name: str, last_name: str):
        self.patient_id = patient_id
        self.first_name = first_name
        self.last_name = last_name
        self._appointments = None  # Not loaded yet
        self._lab_results = None
    
    @property
    def appointments(self) -> list:
        """Lazy-load appointments only when accessed."""
        if self._appointments is None:
            self._appointments = appointment_repository.get_by_patient(self.patient_id)
        return self._appointments
    
    @property
    def lab_results(self) -> list:
        """Lazy-load lab results only when accessed."""
        if self._lab_results is None:
            self._lab_results = lab_result_repository.get_by_patient(self.patient_id)
        return self._lab_results
```

---

## 9. Testing

### Write Testable Code

```python
# BAD: Hard to test (tight coupling, side effects)
def process_order(order_id):
    order = PostgreSQLDB.query(f"SELECT * FROM orders WHERE id = {order_id}")
    
    if order['status'] == 'pending':
        result = requests.post("https://external-api.com/process", json=order)
        
        PostgreSQLDB.execute(f"UPDATE orders SET status = 'processed' WHERE id = {order_id}")
        
        print(f"Order {order_id} processed")

# GOOD: Testable (dependency injection, no side effects)
class OrderProcessor:
    def __init__(
        self,
        repository: OrderRepository,
        external_service: ExternalService,
        logger: Logger
    ):
        self.repository = repository
        self.external_service = external_service
        self.logger = logger
    
    def process_order(self, order_id: str) -> ProcessResult:
        """Process order - easily testable."""
        order = self.repository.get_by_id(order_id)
        
        if order.status != OrderStatus.PENDING:
            return ProcessResult(success=False, reason="Order not pending")
        
        try:
            self.external_service.process(order)
            self.repository.update_status(order_id, OrderStatus.PROCESSED)
            self.logger.info(f"Order {order_id} processed successfully")
            
            return ProcessResult(success=True)
        
        except ExternalServiceError as e:
            self.logger.error(f"Failed to process order {order_id}: {e}")
            return ProcessResult(success=False, reason=str(e))

# Easy to test with mocks
def test_process_order_success():
    mock_repo = Mock(spec=OrderRepository)
    mock_service = Mock(spec=ExternalService)
    mock_logger = Mock(spec=Logger)
    
    processor = OrderProcessor(mock_repo, mock_service, mock_logger)
    
    # Configure mocks
    mock_repo.get_by_id.return_value = Order(id="123", status=OrderStatus.PENDING)
    
    # Test
    result = processor.process_order("123")
    
    # Verify
    assert result.success
    mock_service.process.assert_called_once()
    mock_repo.update_status.assert_called_with("123", OrderStatus.PROCESSED)
```

---

## 10. Code Review Checklist

### Before Submitting PR

- [ ] Code follows SOLID principles
- [ ] Functions are small and focused (< 50 lines)
- [ ] Variables and functions have descriptive names
- [ ] All inputs are validated
- [ ] Error handling is specific and appropriate
- [ ] No hardcoded values (use constants/config)
- [ ] No secrets in code
- [ ] PHI is properly handled (encrypted, masked in logs)
- [ ] Code is DRY (Don't Repeat Yourself)
- [ ] Unit tests written and passing
- [ ] Code coverage > 80%
- [ ] No commented-out code
- [ ] Docstrings for public APIs
- [ ] Type hints used (Python/TypeScript)
- [ ] No linter warnings
- [ ] No security vulnerabilities (dependency scan)
- [ ] Performance considerations addressed
- [ ] Logging added for important operations
- [ ] Edge cases handled

### Reviewer Checklist

- [ ] Code solves the stated problem
- [ ] Design is appropriate for the problem
- [ ] No over-engineering
- [ ] Security vulnerabilities checked
- [ ] Error handling is robust
- [ ] Tests cover edge cases
- [ ] Performance impact assessed
- [ ] API changes are backward compatible
- [ ] Documentation is updated
- [ ] Database migrations are safe
