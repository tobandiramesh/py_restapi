# Employee REST API

A simple REST API application in Python using Flask that manages employee information.

## Detailed Documentation

- Full project execution steps, implementation details, architecture, and guidelines:
  - `docs/PROJECT_EXECUTION_AND_IMPLEMENTATION_GUIDE.md`

## Features

- Get employee details by ID
- Get all employees
- Create new employee
- Update employee information
- Delete employee
- Health check endpoint
- SQLite persistence so employee data survives app restart
- Server-side validation for email format and salary bounds
- Toast notifications and richer employee management UI

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

3. Create a local environment file for secrets:
```bash
copy .env.example .env
```

Then edit `.env` and set your preferred chat mode:
```env
FLASK_SECRET_KEY=replace-with-a-local-secret

# Optional: enable in-app GitHub Copilot (API) provider in floating AI assistant
GITHUB_TOKEN=ghp_or_github_pat_here
GITHUB_MODELS_BASE_URL=https://models.inference.ai.azure.com
GITHUB_COPILOT_MODEL=gpt-4o-mini
```

## Running the Application

```bash
python app.py
```

The API will be available at: `http://localhost:5000`

Web entry point will be available at: `http://localhost:5000/login`

After successful login, the dashboard is available at: `http://localhost:5000/`

## Web UI Features

- Search employee by ID
- Add a new employee using a form
- Modify and delete employees from the table
- View employee details in a dialog
- Filter, sort, and paginate employee records
- View employee details (id, salary, email, name, geo location, department, manager)
- Floating AI assistant in the bottom-right corner with draggable chat window behavior
- Switch between in-app Local Medivra and in-app GitHub Copilot (API) responses
- Optional external chatbot handoff targets: ChatGPT, Gemini, Claude, and Perplexity

### GitHub Copilot Mode Notes

- In the floating assistant, choose `GitHub Copilot (API)` to get replies directly inside the app.
- This mode uses your server-side `GITHUB_TOKEN` and calls the configured GitHub models endpoint.
- If `GITHUB_TOKEN` is missing or invalid, the API returns a clear setup error.

## Data Storage

- Employee records are stored in a local SQLite database: `employees.db`
- The database is created automatically on first run
- Sample employee data is inserted only when the database is empty

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
  "message": "Email must be in a valid format like name@company.com.",
  "timestamp": "2024-03-24T10:30:00.123456"
}
```

Other validation errors include:

- `Salary must be between 1000 and 10000000.`
- `Email already exists for another employee.`
- `Provide at least one employee field to update.`

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
├── app.py                                 # Main Flask application and API routes
├── requirements.txt                       # Python dependencies
├── README.md                              # Project documentation
├── test_api.py                            # Scripted API checks
├── docs/
│   └── PROJECT_EXECUTION_AND_IMPLEMENTATION_GUIDE.md
├── templates/
│   ├── login.html                         # Login page
│   └── index.html                         # Authenticated dashboard UI
└── static/
  ├── style.css                          # App and login styling
  └── app.js                             # Frontend logic (table, insights, assistant)
```

## Future Enhancements

- Add role-based authorization and audit logs
- Add OpenAPI/Swagger documentation
- Add automated unit and integration tests for AI endpoints
- Add auto fallback from GitHub provider to local provider on transient failures
- Persist floating assistant chat history in local storage

## License

MIT License
