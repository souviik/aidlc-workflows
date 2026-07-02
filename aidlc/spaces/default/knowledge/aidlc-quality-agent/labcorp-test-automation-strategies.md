# Test Automation Strategies and Best Practices

Comprehensive guide to effective test automation for software quality assurance.

---

## 1. Test Pyramid Strategy

### The Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /    \     - Slow, expensive
     /------\    - Test critical user journeys
    /        \   
   / Integration \ Integration Tests (20%)
  /    Tests     \  - Test component interactions
 /--------------\ - API contracts, database
/                \
/   Unit Tests    \ Unit Tests (70%)
/------------------\ - Fast, cheap
                     - Test business logic
```

### Distribution Guidelines

**Unit Tests (70%)**
- Test individual functions, classes, methods
- No external dependencies (mocked)
- Fast execution (< 1ms per test)
- High code coverage (>80%)

**Integration Tests (20%)**
- Test component interactions
- Real database, message queues
- API contract testing
- Medium execution time (< 100ms per test)

**E2E Tests (10%)**
- Test critical user journeys
- Full stack, browser automation
- Slow execution (seconds per test)
- Focus on business-critical flows

---

## 2. Unit Testing Best Practices

### Test Structure: Arrange-Act-Assert

```python
import pytest
from datetime import datetime, timedelta

class TestPatientService:
    """Unit tests for PatientService."""
    
    def test_calculate_age_from_dob(self):
        """Test age calculation from date of birth."""
        # Arrange
        service = PatientService()
        dob = datetime(1980, 5, 15)
        reference_date = datetime(2024, 5, 15)
        
        # Act
        age = service.calculate_age(dob, reference_date)
        
        # Assert
        assert age == 44
    
    def test_calculate_age_before_birthday(self):
        """Test age calculation before birthday in current year."""
        # Arrange
        service = PatientService()
        dob = datetime(1980, 12, 25)
        reference_date = datetime(2024, 6, 15)  # Before birthday
        
        # Act
        age = service.calculate_age(dob, reference_date)
        
        # Assert
        assert age == 43  # Not yet 44
    
    def test_is_eligible_for_screening_age_50_plus(self):
        """Test screening eligibility for patients 50+."""
        # Arrange
        service = PatientService()
        patient = Patient(date_of_birth=datetime(1970, 1, 1))
        
        # Act
        eligible = service.is_eligible_for_screening(patient, "colonoscopy")
        
        # Assert
        assert eligible is True
    
    def test_is_eligible_for_screening_under_age(self):
        """Test screening not eligible for patients under 50."""
        # Arrange
        service = PatientService()
        patient = Patient(date_of_birth=datetime(2000, 1, 1))
        
        # Act
        eligible = service.is_eligible_for_screening(patient, "colonoscopy")
        
        # Assert
        assert eligible is False
```

### Mocking External Dependencies

```python
from unittest.mock import Mock, patch, MagicMock
import pytest

class TestLabResultProcessor:
    """Test lab result processing with mocked dependencies."""
    
    @patch('services.lab_system.LabSystemClient')
    def test_fetch_lab_results_success(self, mock_lab_client):
        """Test successful lab result fetching."""
        # Arrange
        mock_client = Mock()
        mock_client.get_results.return_value = [
            {"test": "CBC", "result": "Normal", "date": "2024-01-15"}
        ]
        mock_lab_client.return_value = mock_client
        
        processor = LabResultProcessor()
        
        # Act
        results = processor.fetch_lab_results(patient_id="P123")
        
        # Assert
        assert len(results) == 1
        assert results[0]["test"] == "CBC"
        mock_client.get_results.assert_called_once_with(patient_id="P123")
    
    @patch('services.lab_system.LabSystemClient')
    def test_fetch_lab_results_retry_on_failure(self, mock_lab_client):
        """Test retry logic on lab system failure."""
        # Arrange
        mock_client = Mock()
        mock_client.get_results.side_effect = [
            ConnectionError("Timeout"),
            ConnectionError("Timeout"),
            [{"test": "CBC", "result": "Normal"}]  # Success on 3rd attempt
        ]
        mock_lab_client.return_value = mock_client
        
        processor = LabResultProcessor(max_retries=3)
        
        # Act
        results = processor.fetch_lab_results(patient_id="P123")
        
        # Assert
        assert len(results) == 1
        assert mock_client.get_results.call_count == 3
```

### Parameterized Tests

```python
import pytest

class TestDosageCalculator:
    """Test medication dosage calculations."""
    
    @pytest.mark.parametrize("weight_kg,expected_dose", [
        (50, 250),   # 50kg * 5mg/kg = 250mg
        (70, 350),   # 70kg * 5mg/kg = 350mg
        (100, 500),  # 100kg * 5mg/kg = 500mg
        (150, 750),  # 150kg * 5mg/kg = 750mg
    ])
    def test_calculate_weight_based_dose(self, weight_kg, expected_dose):
        """Test weight-based dosage calculation."""
        calculator = DosageCalculator()
        
        dose = calculator.calculate_dose(
            weight_kg=weight_kg,
            dose_per_kg=5
        )
        
        assert dose == expected_dose
    
    @pytest.mark.parametrize("age,expected_category", [
        (2, "pediatric"),
        (12, "pediatric"),
        (18, "adult"),
        (65, "adult"),
        (75, "geriatric"),
        (85, "geriatric"),
    ])
    def test_patient_category_by_age(self, age, expected_category):
        """Test patient categorization by age."""
        calculator = DosageCalculator()
        
        category = calculator.get_patient_category(age)
        
        assert category == expected_category
```

---

## 3. Integration Testing

### Database Integration Tests

```python
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

@pytest.fixture(scope="function")
def db_session():
    """Create test database session."""
    # Use test database
    engine = create_engine("postgresql://test:test@localhost/test_db")
    
    # Create tables
    Base.metadata.create_all(engine)
    
    Session = sessionmaker(bind=engine)
    session = Session()
    
    yield session
    
    # Cleanup after test
    session.rollback()
    session.close()
    Base.metadata.drop_all(engine)

class TestPatientRepository:
    """Integration tests for PatientRepository."""
    
    def test_create_and_retrieve_patient(self, db_session):
        """Test creating and retrieving patient from database."""
        # Arrange
        repo = PatientRepository(db_session)
        patient_data = {
            "mrn": "MRN12345",
            "first_name": "John",
            "last_name": "Doe",
            "date_of_birth": datetime(1980, 5, 15)
        }
        
        # Act
        patient_id = repo.create_patient(patient_data)
        retrieved = repo.get_patient_by_id(patient_id)
        
        # Assert
        assert retrieved.mrn == "MRN12345"
        assert retrieved.first_name == "John"
        assert retrieved.last_name == "Doe"
    
    def test_update_patient_contact_info(self, db_session):
        """Test updating patient contact information."""
        # Arrange
        repo = PatientRepository(db_session)
        patient_id = repo.create_patient({
            "mrn": "MRN12345",
            "email": "old@example.com",
            "phone": "555-0100"
        })
        
        # Act
        repo.update_patient(patient_id, {
            "email": "new@example.com",
            "phone": "555-0200"
        })
        
        # Assert
        updated = repo.get_patient_by_id(patient_id)
        assert updated.email == "new@example.com"
        assert updated.phone == "555-0200"
    
    def test_search_patients_by_name(self, db_session):
        """Test patient search functionality."""
        # Arrange
        repo = PatientRepository(db_session)
        repo.create_patient({"mrn": "MRN001", "first_name": "John", "last_name": "Smith"})
        repo.create_patient({"mrn": "MRN002", "first_name": "Jane", "last_name": "Smith"})
        repo.create_patient({"mrn": "MRN003", "first_name": "John", "last_name": "Doe"})
        
        # Act
        results = repo.search_patients(last_name="Smith")
        
        # Assert
        assert len(results) == 2
        assert all(p.last_name == "Smith" for p in results)
```

### API Contract Testing

```python
import pytest
import requests
from jsonschema import validate

class TestPatientAPI:
    """Integration tests for Patient API."""
    
    BASE_URL = "http://localhost:8000/api"
    
    # JSON Schema for patient response
    PATIENT_SCHEMA = {
        "type": "object",
        "properties": {
            "patient_id": {"type": "string"},
            "mrn": {"type": "string", "pattern": "^MRN[0-9]+$"},
            "first_name": {"type": "string"},
            "last_name": {"type": "string"},
            "date_of_birth": {"type": "string", "format": "date"},
            "contact": {
                "type": "object",
                "properties": {
                    "email": {"type": "string", "format": "email"},
                    "phone": {"type": "string"}
                }
            }
        },
        "required": ["patient_id", "mrn", "first_name", "last_name"]
    }
    
    def test_get_patient_returns_valid_schema(self, auth_token):
        """Test GET /patients/{id} returns valid patient schema."""
        # Arrange
        patient_id = "P123"
        
        # Act
        response = requests.get(
            f"{self.BASE_URL}/patients/{patient_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Assert
        assert response.status_code == 200
        validate(instance=response.json(), schema=self.PATIENT_SCHEMA)
    
    def test_create_patient_returns_201(self, auth_token):
        """Test POST /patients creates patient and returns 201."""
        # Arrange
        patient_data = {
            "mrn": "MRN99999",
            "first_name": "Test",
            "last_name": "Patient",
            "date_of_birth": "1990-01-01"
        }
        
        # Act
        response = requests.post(
            f"{self.BASE_URL}/patients",
            json=patient_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Assert
        assert response.status_code == 201
        assert "patient_id" in response.json()
        validate(instance=response.json(), schema=self.PATIENT_SCHEMA)
    
    def test_unauthorized_access_returns_401(self):
        """Test API returns 401 without authentication."""
        # Act
        response = requests.get(f"{self.BASE_URL}/patients/P123")
        
        # Assert
        assert response.status_code == 401
```

---

## 4. End-to-End Testing

### Selenium/Playwright E2E Tests

```python
import pytest
from playwright.sync_api import Page, expect

class TestPatientPortalE2E:
    """End-to-end tests for patient portal."""
    
    def test_patient_login_and_view_results(self, page: Page):
        """Test complete flow: login, navigate, view lab results."""
        # Navigate to login page
        page.goto("https://portal.labcorp.com/login")
        
        # Login
        page.fill("#username", "test.patient@example.com")
        page.fill("#password", "TestPassword123!")
        page.click("#login-button")
        
        # Verify successful login
        expect(page.locator("#welcome-message")).to_contain_text("Welcome")
        
        # Navigate to lab results
        page.click("text=Lab Results")
        
        # Wait for results to load
        page.wait_for_selector("#lab-results-table")
        
        # Verify results are displayed
        results = page.locator("#lab-results-table tbody tr")
        expect(results).to_have_count_greater_than(0)
        
        # Click on first result to view details
        results.first.click()
        
        # Verify details page
        expect(page.locator("#result-details")).to_be_visible()
        expect(page.locator("#test-name")).not_to_be_empty()
    
    def test_appointment_scheduling_flow(self, page: Page, logged_in_page):
        """Test appointment scheduling end-to-end."""
        # Start from dashboard
        page.goto("https://portal.labcorp.com/dashboard")
        
        # Click schedule appointment
        page.click("text=Schedule Appointment")
        
        # Select location
        page.select_option("#location-select", "123 Main St, Boston, MA")
        
        # Select service
        page.click("text=Blood Work")
        
        # Select date
        page.click("#calendar-date-2024-02-15")
        
        # Select time slot
        page.click("text=10:00 AM")
        
        # Confirm appointment
        page.click("#confirm-appointment")
        
        # Verify confirmation
        expect(page.locator("#confirmation-message")).to_contain_text("Appointment confirmed")
        expect(page.locator("#appointment-date")).to_contain_text("February 15, 2024")
        expect(page.locator("#appointment-time")).to_contain_text("10:00 AM")
```

### API E2E Tests

```python
import pytest
import requests

class TestLabOrderWorkflow:
    """E2E tests for complete lab order workflow."""
    
    def test_complete_lab_order_workflow(self, api_client, auth_token):
        """Test complete workflow: create order, process, generate results."""
        # Step 1: Create patient
        patient_response = api_client.post(
            "/patients",
            json={
                "mrn": "MRN-E2E-001",
                "first_name": "E2E",
                "last_name": "Test",
                "date_of_birth": "1990-01-01"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert patient_response.status_code == 201
        patient_id = patient_response.json()["patient_id"]
        
        # Step 2: Create lab order
        order_response = api_client.post(
            "/lab-orders",
            json={
                "patient_id": patient_id,
                "test_code": "CBC",
                "priority": "routine",
                "ordering_physician": "DR123"
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert order_response.status_code == 201
        order_id = order_response.json()["order_id"]
        
        # Step 3: Verify order status
        status_response = api_client.get(
            f"/lab-orders/{order_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert status_response.json()["status"] == "pending"
        
        # Step 4: Simulate sample collection
        collection_response = api_client.post(
            f"/lab-orders/{order_id}/collect",
            json={"collected_by": "TECH001", "sample_id": "SAMPLE123"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert collection_response.status_code == 200
        
        # Step 5: Process results (simulated)
        results_response = api_client.post(
            f"/lab-orders/{order_id}/results",
            json={
                "test_code": "CBC",
                "results": {
                    "WBC": {"value": 7.5, "unit": "10^3/uL", "reference_range": "4.0-11.0"},
                    "RBC": {"value": 4.8, "unit": "10^6/uL", "reference_range": "4.5-5.5"}
                }
            },
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert results_response.status_code == 200
        
        # Step 6: Verify final order status
        final_status = api_client.get(
            f"/lab-orders/{order_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert final_status.json()["status"] == "completed"
        assert "results" in final_status.json()
```

---

## 5. Performance Testing

### Load Testing with Locust

```python
from locust import HttpUser, task, between

class PatientPortalUser(HttpUser):
    """Simulated patient portal user for load testing."""
    
    wait_time = between(1, 3)  # Wait 1-3 seconds between tasks
    
    def on_start(self):
        """Login before starting tasks."""
        response = self.client.post("/api/auth/login", json={
            "username": "test.user@example.com",
            "password": "TestPassword123!"
        })
        self.token = response.json()["access_token"]
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    @task(3)  # Weight: 3x more likely than other tasks
    def view_dashboard(self):
        """View patient dashboard."""
        self.client.get("/api/dashboard", headers=self.headers)
    
    @task(2)
    def view_lab_results(self):
        """View lab results."""
        self.client.get("/api/lab-results", headers=self.headers)
    
    @task(1)
    def view_appointments(self):
        """View appointments."""
        self.client.get("/api/appointments", headers=self.headers)
    
    @task(1)
    def update_profile(self):
        """Update patient profile."""
        self.client.put(
            "/api/profile",
            json={"phone": "555-0199"},
            headers=self.headers
        )

# Run with: locust -f load_test.py --host=https://portal.labcorp.com
```

### Performance Benchmarks

```python
import pytest
import time

class TestPerformanceBenchmarks:
    """Performance benchmark tests."""
    
    def test_patient_search_performance(self, db_session):
        """Test patient search completes within 100ms."""
        # Arrange
        repo = PatientRepository(db_session)
        
        # Seed database with 10,000 patients
        for i in range(10000):
            repo.create_patient({
                "mrn": f"MRN{i:05d}",
                "first_name": f"Patient{i}",
                "last_name": "Test"
            })
        
        # Act
        start_time = time.time()
        results = repo.search_patients(last_name="Test")
        elapsed = (time.time() - start_time) * 1000  # ms
        
        # Assert
        assert len(results) == 10000
        assert elapsed < 100, f"Search took {elapsed}ms, expected < 100ms"
    
    @pytest.mark.benchmark
    def test_dosage_calculation_performance(self, benchmark):
        """Benchmark dosage calculation speed."""
        calculator = DosageCalculator()
        
        # Benchmark function
        result = benchmark(calculator.calculate_dose, weight_kg=70, dose_per_kg=5)
        
        assert result == 350
        # Benchmark will report: mean, median, stddev, min, max
```

---

## 6. Test Data Management

### Test Fixtures and Factories

```python
import pytest
from factory import Factory, Faker, Sequence

class PatientFactory(Factory):
    """Factory for creating test patient data."""
    
    class Meta:
        model = Patient
    
    mrn = Sequence(lambda n: f"MRN{n:06d}")
    first_name = Faker("first_name")
    last_name = Faker("last_name")
    date_of_birth = Faker("date_of_birth", minimum_age=18, maximum_age=90)
    email = Faker("email")
    phone = Faker("phone_number")

@pytest.fixture
def sample_patient():
    """Provide a sample patient for tests."""
    return PatientFactory.create()

@pytest.fixture
def sample_patients(count=10):
    """Provide multiple sample patients."""
    return PatientFactory.create_batch(count)

# Usage in tests
def test_with_sample_patient(sample_patient):
    """Test using sample patient fixture."""
    assert sample_patient.mrn.startswith("MRN")
    assert "@" in sample_patient.email
```

### Test Database Seeding

```python
import pytest
from sqlalchemy import create_engine

@pytest.fixture(scope="session")
def seeded_test_db():
    """Create and seed test database."""
    engine = create_engine("postgresql://test:test@localhost/test_db")
    Base.metadata.create_all(engine)
    
    # Seed with reference data
    with engine.connect() as conn:
        # Insert test facilities
        conn.execute("""
            INSERT INTO facilities (facility_id, name, city, state)
            VALUES
                ('FAC001', 'Boston Lab', 'Boston', 'MA'),
                ('FAC002', 'New York Lab', 'New York', 'NY')
        """)
        
        # Insert test physicians
        conn.execute("""
            INSERT INTO physicians (physician_id, first_name, last_name, specialty)
            VALUES
                ('DR001', 'Jane', 'Smith', 'Internal Medicine'),
                ('DR002', 'John', 'Doe', 'Cardiology')
        """)
        
        conn.commit()
    
    yield engine
    
    # Teardown
    Base.metadata.drop_all(engine)
```

---

## 7. Test Automation Pipeline

### CI/CD Integration (GitHub Actions)

```yaml
name: Test Automation Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install -r requirements-test.txt
      
      - name: Run unit tests with coverage
        run: |
          pytest tests/unit \
            --cov=src \
            --cov-report=xml \
            --cov-report=html \
            --junitxml=junit/test-results.xml
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml
      
      - name: Publish test results
        uses: EnricoMi/publish-unit-test-result-action@v2
        if: always()
        with:
          files: junit/test-results.xml
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Run integration tests
        run: |
          pytest tests/integration \
            --junitxml=junit/integration-results.xml
        env:
          DATABASE_URL: postgresql://postgres:test@localhost/test_db
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install Playwright
        run: |
          pip install playwright pytest-playwright
          playwright install
      
      - name: Run E2E tests
        run: |
          pytest tests/e2e \
            --browser chromium \
            --video retain-on-failure
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts
          path: test-results/
```

---

## 8. Test Quality Metrics

### Coverage Requirements

- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: Cover all API endpoints
- **E2E Tests**: Cover critical user journeys (top 10 use cases)

### Test Execution Time Targets

- **Unit Tests**: < 5 minutes for full suite
- **Integration Tests**: < 15 minutes for full suite
- **E2E Tests**: < 30 minutes for full suite

### Quality Gates

```python
# pytest.ini configuration
[pytest]
markers =
    unit: Unit tests
    integration: Integration tests
    e2e: End-to-end tests
    slow: Tests that take > 1 second
    smoke: Critical smoke tests

# Fail build if coverage < 80%
addopts =
    --strict-markers
    --cov-fail-under=80
    --maxfail=5
```
