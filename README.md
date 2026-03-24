# Employee REST API

A simple REST API application in Python using Flask that manages employee information.

## Features

- Get employee details by ID
- Get all employees
- Create new employee
- Update employee information
- Delete employee
- Health check endpoint

## Installation

### Prerequisites
- Python 3.7+
- pip

### Setup

1. Create a virtual environment (optional but recommended):
```bash
python -m venv venv
# For Windows
venv\Scripts\activate
# For macOS/Linux
source venv/bin/activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

```bash
python app.py
```

The API will be available at: `http://localhost:5000`

Web UI will be available at: `http://localhost:5000/`

## Web UI Features

- Search employee by ID
- Add a new employee using a form
- View employee details (id, salary, email, name, geo location, department, manager)

## API Endpoints

### 1. Get Employee by ID
**Request:**
```
GET /api/employees/<emp_id>
```

**Example:**
```bash
curl http://localhost:5000/api/employees/1
```

**Response:**
```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@company.com",
    "salary": 75000,
    "department": "Engineering",
    "manager": "Sarah Smith",
    "geo_location": "New York, USA"
  },
  "timestamp": "2024-03-24T10:30:00.123456"
}
```

### 2. Get All Employees
**Request:**
```
GET /api/employees
```

**Example:**
```bash
curl http://localhost:5000/api/employees
```

### 3. Create New Employee
**Request:**
```
POST /api/employees
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Test Employee",
  "email": "test@company.com",
  "salary": 80000,
  "department": "HR",
  "manager": "John Doe",
  "geo_location": "Los Angeles, USA"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/employees \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Employee",
    "email": "test@company.com",
    "salary": 80000,
    "department": "HR",
    "manager": "John Doe",
    "geo_location": "Los Angeles, USA"
  }'
```

### 4. Update Employee
**Request:**
```
PUT /api/employees/<emp_id>
Content-Type: application/json
```

**Request Body (all fields optional):**
```json
{
  "name": "Updated Name",
  "email": "updated@company.com",
  "salary": 90000,
  "department": "Finance",
  "manager": "New Manager",
  "geo_location": "Chicago, USA"
}
```

**Example:**
```bash
curl -X PUT http://localhost:5000/api/employees/1 \
  -H "Content-Type: application/json" \
  -d '{
    "salary": 90000,
    "department": "Finance"
  }'
```

### 5. Delete Employee
**Request:**
```
DELETE /api/employees/<emp_id>
```

**Example:**
```bash
curl -X DELETE http://localhost:5000/api/employees/1
```

### 6. Health Check
**Request:**
```
GET /api/health
```

**Example:**
```bash
curl http://localhost:5000/api/health
```

## Sample Employee Data

The API comes with 5 sample employees pre-loaded:

| ID | Name | Email | Salary | Department | Manager | Location |
|---|---|---|---|---|---|---|
| 1 | John Doe | john.doe@company.com | $75,000 | Engineering | Sarah Smith | New York, USA |
| 2 | Jane Smith | jane.smith@company.com | $85,000 | Product | Michael Brown | San Francisco, USA |
| 3 | Alice Johnson | alice.johnson@company.com | $95,000 | Engineering | Sarah Smith | Seattle, USA |
| 4 | Bob Wilson | bob.wilson@company.com | $70,000 | Marketing | Emily Davis | Boston, USA |
| 5 | Sarah Smith | sarah.smith@company.com | $120,000 | Engineering | Michael Brown | New York, USA |

## Error Responses

### 404 - Not Found
```json
{
  "status": "error",
  "message": "Employee with ID 999 not found",
  "timestamp": "2024-03-24T10:30:00.123456"
}
```

### 400 - Bad Request
```json
{
  "status": "error",
  "message": "Missing required fields: name, email, salary, department, manager, geo_location",
  "timestamp": "2024-03-24T10:30:00.123456"
}
```

### 500 - Internal Server Error
```json
{
  "status": "error",
  "message": "Internal server error",
  "timestamp": "2024-03-24T10:30:00.123456"
}
```

## Testing with Postman

1. Import the following requests into Postman
2. Set base URL: `http://localhost:5000`
3. Test each endpoint

## Project Structure

```
py_restapi/
├── app.py              # Main Flask application
├── requirements.txt    # Python dependencies
├── README.md          # Documentation
└── test_api.py        # Optional: Unit tests
```

## Future Enhancements

- Add database support (SQLAlchemy + PostgreSQL/MySQL)
- Add authentication & authorization
- Add input validation
- Add logging
- Add rate limiting
- Add CORS support
- Add API documentation with Swagger/OpenAPI

## License

MIT License
