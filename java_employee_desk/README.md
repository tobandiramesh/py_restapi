# Java Medivra Employee Desk (Spring Boot + Maven)

This project is a Java/Spring Boot implementation of the Python `py_restapi` app with the same core functionality:

- Login page with session-based auth
- Employee CRUD REST APIs
- Insights API for dashboard stats/charts
- AI chat/status APIs (local and GitHub provider)
- Same dashboard UI/UX ported from the Python version

## Stack

- Java 17
- Spring Boot 3
- Maven
- SQLite (`employees.db`)
- Thymeleaf

## Run

1. Install JDK 17+
2. From `java_employee_desk` run using Maven Wrapper:

```bash
# Windows
mvnw.cmd spring-boot:run

# macOS/Linux
./mvnw spring-boot:run
```

Alternative if Maven is installed globally:

```bash
mvn spring-boot:run
```

The app runs at:

- Login: `http://localhost:8081/login`
- Dashboard: `http://localhost:8081/`

## Default Login

- Username: `admin`
- Password: `medivra123`

You can override with environment variables or `.env` in `java_employee_desk`:

```env
MEDIVRA_APP_USERNAME=admin
MEDIVRA_APP_PASSWORD=medivra123
GITHUB_TOKEN=
GITHUB_MODELS_BASE_URL=https://models.inference.ai.azure.com
GITHUB_COPILOT_MODEL=gpt-4o-mini
```

## API Compatibility

Implemented endpoints:

- `GET /api/health`
- `GET /api/employees`
- `GET /api/employees/{id}`
- `POST /api/employees`
- `PUT /api/employees/{id}`
- `DELETE /api/employees/{id}`
- `GET /api/insights`
- `POST /api/ai/chat` (login required)
- `GET /api/ai/status` (login required)

`geo_location` is preserved in request/response JSON to keep frontend compatibility.
