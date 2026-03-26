from collections import Counter
from datetime import datetime
from functools import wraps
import json
import os
from pathlib import Path
import re
import sqlite3
from urllib import error as urllib_error
from urllib import request as urllib_request

from dotenv import load_dotenv
from flask import Flask, jsonify, request, render_template, redirect, session, url_for

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "medivra-local-secret-key")

DATABASE_PATH = BASE_DIR / 'employees.db'
EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$")
MIN_SALARY = 1000
MAX_SALARY = 10000000

SAMPLE_EMPLOYEES = [
    {
        "name": "John Doe",
        "email": "john.doe@company.com",
        "salary": 75000,
        "department": "Engineering",
        "manager": "Sarah Smith",
        "geo_location": "New York, USA",
    },
    {
        "name": "Jane Smith",
        "email": "jane.smith@company.com",
        "salary": 85000,
        "department": "Product",
        "manager": "Michael Brown",
        "geo_location": "San Francisco, USA",
    },
    {
        "name": "Alice Johnson",
        "email": "alice.johnson@company.com",
        "salary": 95000,
        "department": "Engineering",
        "manager": "Sarah Smith",
        "geo_location": "Seattle, USA",
    },
    {
        "name": "Bob Wilson",
        "email": "bob.wilson@company.com",
        "salary": 70000,
        "department": "Marketing",
        "manager": "Emily Davis",
        "geo_location": "Boston, USA",
    },
    {
        "name": "Sarah Smith",
        "email": "sarah.smith@company.com",
        "salary": 120000,
        "department": "Engineering",
        "manager": "Michael Brown",
        "geo_location": "New York, USA",
    },
]

DEMO_LOGIN_USERNAME = os.environ.get("MEDIVRA_APP_USERNAME", "admin")
DEMO_LOGIN_PASSWORD = os.environ.get("MEDIVRA_APP_PASSWORD", "medivra123")


def login_required(view):
    @wraps(view)
    def wrapped_view(*args, **kwargs):
        if not session.get("is_authenticated"):
            return redirect(url_for("login"))
        return view(*args, **kwargs)

    return wrapped_view


def get_db_connection():
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def row_to_employee(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "salary": row["salary"],
        "department": row["department"],
        "manager": row["manager"],
        "geo_location": row["geo_location"],
    }


def create_database():
    connection = get_db_connection()
    connection.execute(
        """
        CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            salary INTEGER NOT NULL,
            department TEXT NOT NULL,
            manager TEXT NOT NULL,
            geo_location TEXT NOT NULL
        )
        """
    )
    connection.commit()
    connection.close()


def seed_database():
    connection = get_db_connection()
    row = connection.execute("SELECT COUNT(*) AS count FROM employees").fetchone()

    if row["count"] == 0:
        connection.executemany(
            """
            INSERT INTO employees (name, email, salary, department, manager, geo_location)
            VALUES (:name, :email, :salary, :department, :manager, :geo_location)
            """,
            SAMPLE_EMPLOYEES,
        )
        connection.commit()

    connection.close()


def get_employee_by_id(emp_id):
    connection = get_db_connection()
    row = connection.execute("SELECT * FROM employees WHERE id = ?", (emp_id,)).fetchone()
    connection.close()
    return row_to_employee(row) if row else None


def get_all_employees_from_db():
    connection = get_db_connection()
    rows = connection.execute("SELECT * FROM employees ORDER BY id ASC").fetchall()
    connection.close()
    return [row_to_employee(row) for row in rows]


def filter_employees(employees, query_text="", ai_mode="all", min_salary=None, max_salary=None):
    filtered_employees = list(employees)

    if ai_mode == "high-salary" and filtered_employees:
        salary_values = sorted(employee["salary"] for employee in filtered_employees)
        threshold_index = max(0, (len(salary_values) * 3) // 4 - 1)
        threshold = salary_values[threshold_index]
        filtered_employees = [employee for employee in filtered_employees if employee["salary"] >= threshold]

    if ai_mode == "salary-range":
        if min_salary is not None:
            filtered_employees = [employee for employee in filtered_employees if employee["salary"] >= min_salary]
        if max_salary is not None:
            filtered_employees = [employee for employee in filtered_employees if employee["salary"] <= max_salary]

    normalized_query = (query_text or "").strip().lower()
    if not normalized_query:
        return filtered_employees

    def matches(employee):
        searchable_text = " ".join([
            f"EMP-{employee['id']:04d}",
            str(employee["id"]),
            employee["name"],
            employee["email"],
            employee["department"],
            employee["manager"],
            employee["geo_location"],
        ]).lower()
        return normalized_query in searchable_text

    return [employee for employee in filtered_employees if matches(employee)]


def build_insights_payload(employees, query_text=""):
    visible_count = len(employees)

    if visible_count == 0:
        return {
            "visible_count": 0,
            "department_count": 0,
            "average_salary": 0,
            "top_manager": None,
            "summary": "No records match the current view. Clear the filter or add a new employee to generate AI guidance.",
            "actions": [
                "Clear filters to restore the full workforce view.",
                "Add an employee record to rebuild live insights.",
            ],
            "distributions": {
                "departments": {},
                "managers": {},
                "locations": {},
            },
        }

    department_counts = Counter(employee["department"] for employee in employees)
    manager_counts = Counter(employee["manager"] for employee in employees)
    location_counts = Counter(employee["geo_location"] for employee in employees)
    average_salary = round(sum(employee["salary"] for employee in employees) / visible_count)
    highest_paid_employee = max(employees, key=lambda employee: employee["salary"])
    top_department = department_counts.most_common(1)[0] if department_counts else None
    top_manager = manager_counts.most_common(1)[0] if manager_counts else None
    top_location = location_counts.most_common(1)[0] if location_counts else None

    summary_parts = [
        f"The current view covers {visible_count} employee{'s' if visible_count != 1 else ''} across {len(department_counts)} department{'s' if len(department_counts) != 1 else ''}.",
        f"Average salary is ${average_salary:,.0f}, with {highest_paid_employee['name']} currently highest at ${highest_paid_employee['salary']:,.0f}.",
    ]
    if top_department:
        summary_parts.append(
            f"{top_department[0]} is the largest department in view with {top_department[1]} employee{'s' if top_department[1] != 1 else ''}."
        )
    if top_location:
        summary_parts.append(
            f"{top_location[0]} has the strongest location presence with {top_location[1]} record{'s' if top_location[1] != 1 else ''}."
        )

    actions = []
    if top_department and top_department[1] / visible_count >= 0.5:
        actions.append(
            f"Department mix is concentrated in {top_department[0]}. Review whether other teams need additional hiring coverage."
        )
    if top_manager and top_manager[1] >= 3:
        actions.append(
            f"{top_manager[0]} manages {top_manager[1]} visible employees. Consider checking workload balance across managers."
        )
    if highest_paid_employee["salary"] >= average_salary * 1.35:
        actions.append(
            f"Compensation spread is wide. Compare {highest_paid_employee['name']}'s package against the team average for role alignment."
        )
    if (query_text or "").strip():
        actions.append("These insights are based on the active filter. Clear the filter to compare against the full employee roster.")
    if not actions:
        actions = [
            "The current workforce view looks balanced. Use sorting by salary or department to inspect outliers and growth areas.",
            "Search or filter by manager and location to spot team distribution patterns faster.",
        ]

    return {
        "visible_count": visible_count,
        "department_count": len(department_counts),
        "average_salary": average_salary,
        "top_manager": {
            "name": top_manager[0],
            "count": top_manager[1],
        } if top_manager else None,
        "summary": " ".join(summary_parts),
        "actions": actions,
        "distributions": {
            "departments": dict(department_counts.most_common(5)),
            "managers": dict(manager_counts.most_common(5)),
            "locations": dict(location_counts.most_common(5)),
        },
    }


def query_local_chatbot(prompt):
    employees = get_all_employees_from_db()
    prompt_text = (prompt or "").strip()
    prompt_lower = prompt_text.lower()

    if not prompt_text:
        return "Please ask me something. I can help with employee queries or general questions."

    department_counts = Counter(employee["department"] for employee in employees) if employees else {}
    manager_counts = Counter(employee["manager"] for employee in employees) if employees else {}

    if employees:
        average_salary = round(sum(employee["salary"] for employee in employees) / len(employees))
        highest_paid_employee = max(employees, key=lambda employee: employee["salary"])
        top_department = department_counts.most_common(1)[0] if department_counts else None
        top_manager = manager_counts.most_common(1)[0] if manager_counts else None
    else:
        average_salary = 0
        highest_paid_employee = None
        top_department = None
        top_manager = None

    if any(keyword in prompt_lower for keyword in ["hello", "hi", "hey", "how are you"]):
        return (
            f"Hello! I'm your Medivra AI assistant. I can help with employee data analysis "
            f"and general questions. {f'I have {len(employees)} employees in the system.' if employees else 'No employees in system yet.'}"
        )

    if any(keyword in prompt_lower for keyword in ["help", "what can you do", "capabilities"]):
        help_text = """
📋 LOCAL MEDIVRA PATTERN GUIDE

🎯 GREETING
Patterns: "hello", "hi", "hey", "how are you"
Try: hello
Returns: Employee count and general greeting

❓ HELP/CAPABILITIES
Patterns: "help", "what can you do", "capabilities"
Returns: Lists available functions

📊 SUMMARY/INSIGHTS
Patterns: "summary", "summarize", "overview", "insight", "insights"
Try: summary
Returns: Employee count, departments, average salary, top department/manager, highest paid employee

🏢 DEPARTMENT ANALYSIS
Patterns: Any department name (e.g., "Engineering", "Marketing", "Product")
Try: Engineering team
Returns: Department headcount and average salary

👔 MANAGER ANALYSIS
Patterns: Any manager name (e.g., "Sarah Smith", "Michael Brown")
Try: manager Sarah Smith
Returns: Direct reports count and team preview

💰 SALARY RANGE
Patterns: "between/from $X and/to $Y" (e.g., "between 50000 and 100000")
Try: between 70000 and 100000
Returns: Count of employees in salary range

📈 SALARY ABOVE THRESHOLD
Patterns: "above/over/greater than/more than $X"
Try: salary above 80000
Returns: Count of employees above threshold

📉 SALARY BELOW THRESHOLD
Patterns: "below/under/less than $X"
Try: salary below 75000
Returns: Count of employees below threshold

👋 POLITE CLOSING
Patterns: "thanks", "thank you", "goodbye", "bye"
Try: thanks
Returns: Acknowledgment

🌤️ WEATHER QUERIES
Patterns: "weather", "temperature", "forecast", "rain", "humidity"
Returns: Not available; redirects to employee analytics

ℹ️ DEFAULT BEHAVIOR
For unrelated queries, I'll forward to GitHub Copilot for broader assistance.
        """
        return help_text.strip()

    if any(keyword in prompt_lower for keyword in ["summary", "summarize", "overview", "insight", "insights"]):
        if not employees:
            return "I can summarize your workforce once employee records are added."
        return (
            f"Workforce summary: {len(employees)} employees across {len(department_counts)} departments. "
            f"Average salary is ${average_salary:,.0f}. "
            f"Top department is {top_department[0]} ({top_department[1]} employees). "
            f"Top manager is {top_manager[0]} ({top_manager[1]} reports). "
            f"Highest paid employee is {highest_paid_employee['name']} at ${highest_paid_employee['salary']:,.0f}."
        )

    if employees and top_department:
        for department in department_counts:
            dept_pattern = r"\b" + re.escape(department.lower()) + r"\b"
            if re.search(dept_pattern, prompt_lower):
                department_employees = [employee for employee in employees if employee["department"] == department]
                department_avg_salary = round(
                    sum(employee["salary"] for employee in department_employees) / len(department_employees)
                )
                return (
                    f"Department {department} has {len(department_employees)} employees "
                    f"with average salary ${department_avg_salary:,.0f}."
                )

    if employees and top_manager:
        for manager in manager_counts:
            manager_pattern = r"\b" + re.escape(manager.lower()) + r"\b"
            if re.search(manager_pattern, prompt_lower):
                managed_employees = [employee for employee in employees if employee["manager"] == manager]
                names_preview = ", ".join(employee["name"] for employee in managed_employees[:4])
                return (
                    f"{manager} manages {len(managed_employees)} employees. "
                    f"Team preview: {names_preview or 'No names available'}."
                )

    salary_between_match = re.search(r"(?:between|from)\s+(\d{3,})\s+(?:and|to)\s+(\d{3,})", prompt_lower)
    salary_above_match = re.search(r"(?:above|over|greater than|more than)\s+(\d{3,})", prompt_lower)
    salary_below_match = re.search(r"(?:below|under|less than)\s+(\d{3,})", prompt_lower)

    if salary_between_match and employees:
        min_salary = int(salary_between_match.group(1))
        max_salary = int(salary_between_match.group(2))
        if min_salary > max_salary:
            min_salary, max_salary = max_salary, min_salary
        matched = [
            employee for employee in employees
            if min_salary <= employee["salary"] <= max_salary
        ]
        return (
            f"Found {len(matched)} employees with salary between ${min_salary:,.0f} and ${max_salary:,.0f}."
        )

    if salary_above_match and employees:
        min_salary = int(salary_above_match.group(1))
        matched = [employee for employee in employees if employee["salary"] >= min_salary]
        return f"Found {len(matched)} employees with salary above ${min_salary:,.0f}."

    if salary_below_match and employees:
        max_salary = int(salary_below_match.group(1))
        matched = [employee for employee in employees if employee["salary"] <= max_salary]
        return f"Found {len(matched)} employees with salary below ${max_salary:,.0f}."

    if any(keyword in prompt_lower for keyword in ["thanks", "thank you", "goodbye", "bye"]):
        return "You're welcome! Feel free to ask any other questions."

    if any(keyword in prompt_lower for keyword in ["weather", "temperature", "forecast", "rain", "humidity"]):
        return "I do not have live weather access in this assistant mode, but I can help with employee analytics."

    return (
        "I can answer questions about your workforce, help with writing and documents, "
        "or assist with general inquiries. What can I help you with?"
    )


def query_github_copilot(prompt):
    token = (os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_MODELS_TOKEN") or "").strip()
    if not token:
        raise RuntimeError("GitHub token not configured. Set GITHUB_TOKEN in .env to use GitHub Copilot mode.")

    base_url = (os.environ.get("GITHUB_MODELS_BASE_URL") or "https://models.inference.ai.azure.com").strip().rstrip("/")
    model = (os.environ.get("GITHUB_COPILOT_MODEL") or os.environ.get("GITHUB_MODEL") or "gpt-4o-mini").strip()

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are Medivra AI assistant. Provide concise and practical answers for HR and workforce workflows.",
            },
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.4,
        "max_tokens": 700,
    }

    request_body = json.dumps(payload).encode("utf-8")
    request_obj = urllib_request.Request(
        url=f"{base_url}/chat/completions",
        data=request_body,
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "medivra-ai-client/1.0",
        },
    )

    try:
        with urllib_request.urlopen(request_obj, timeout=45) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except urllib_error.HTTPError as exc:
        try:
            details = exc.read().decode("utf-8")
        except Exception:
            details = str(exc)
        raise RuntimeError(f"GitHub Copilot request failed ({exc.code}). {details}") from exc
    except Exception as exc:
        raise RuntimeError(f"GitHub Copilot request failed. {exc}") from exc

    choices = response_payload.get("choices") or []
    if not choices:
        raise RuntimeError("GitHub Copilot returned an empty response.")

    message = choices[0].get("message") or {}
    content = message.get("content")

    if isinstance(content, list):
        text_parts = [
            part.get("text", "")
            for part in content
            if isinstance(part, dict) and part.get("type") == "text"
        ]
        reply = "\n".join(part for part in text_parts if part).strip()
    else:
        reply = str(content or "").strip()

    if not reply:
        raise RuntimeError("GitHub Copilot returned no text reply.")

    return {
        "reply": reply,
        "model": response_payload.get("model") or model,
        "provider": "github-copilot",
    }


def get_github_copilot_status():
    token = (os.environ.get("GITHUB_TOKEN") or os.environ.get("GITHUB_MODELS_TOKEN") or "").strip()
    if not token:
        return {
            "state": "setup-required",
            "label": "Setup Required",
            "message": "Set GITHUB_TOKEN in .env to enable GitHub Copilot mode.",
        }

    base_url = (os.environ.get("GITHUB_MODELS_BASE_URL") or "https://models.inference.ai.azure.com").strip().rstrip("/")
    model = (os.environ.get("GITHUB_COPILOT_MODEL") or os.environ.get("GITHUB_MODEL") or "gpt-4o-mini").strip()
    payload = {
        "model": model,
        "messages": [
            {"role": "user", "content": "ping"},
        ],
        "temperature": 0,
        "max_tokens": 1,
    }

    request_obj = urllib_request.Request(
        url=f"{base_url}/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}",
            "User-Agent": "medivra-ai-client/1.0",
        },
    )

    try:
        with urllib_request.urlopen(request_obj, timeout=12):
            return {
                "state": "ready",
                "label": "Ready",
                "message": f"GitHub Copilot is reachable with model {model}.",
            }
    except urllib_error.HTTPError as exc:
        try:
            details = exc.read().decode("utf-8")
        except Exception:
            details = str(exc)
        return {
            "state": "error",
            "label": "Error",
            "message": f"GitHub Copilot check failed ({exc.code}). {details}",
        }
    except Exception as exc:
        return {
            "state": "error",
            "label": "Error",
            "message": f"GitHub Copilot check failed. {exc}",
        }


def validate_employee_payload(data, partial=False, current_emp_id=None):
    if not isinstance(data, dict):
        return None, "Request body must be valid JSON."

    required_fields = ["name", "email", "salary", "department", "manager", "geo_location"]
    normalized_data = {}

    if not partial:
        missing_fields = [field for field in required_fields if field not in data]
        if missing_fields:
            return None, f"Missing required fields: {', '.join(missing_fields)}"
    elif not any(field in data for field in required_fields):
        return None, "Provide at least one employee field to update."

    for field in required_fields:
        if field not in data:
            continue

        value = data[field]

        if field == "salary":
            if isinstance(value, bool):
                return None, "Salary must be a number."

            try:
                salary = int(value)
            except (TypeError, ValueError):
                return None, "Salary must be a whole number."

            if salary < MIN_SALARY or salary > MAX_SALARY:
                return None, f"Salary must be between {MIN_SALARY} and {MAX_SALARY}."

            normalized_data[field] = salary
            continue

        if not isinstance(value, str) or not value.strip():
            return None, f"{field.replace('_', ' ').title()} is required."

        normalized_value = value.strip()

        if field == "email" and not EMAIL_PATTERN.match(normalized_value):
            return None, "Email must be in a valid format like name@company.com."

        normalized_data[field] = normalized_value

    if "email" in normalized_data:
        connection = get_db_connection()

        if current_emp_id is None:
            duplicate = connection.execute(
                "SELECT id FROM employees WHERE email = ?",
                (normalized_data["email"],),
            ).fetchone()
        else:
            duplicate = connection.execute(
                "SELECT id FROM employees WHERE email = ? AND id != ?",
                (normalized_data["email"], current_emp_id),
            ).fetchone()

        connection.close()

        if duplicate:
            return None, "Email already exists for another employee."

    return normalized_data, None


create_database()
seed_database()


@app.route('/', methods=['GET'])
@login_required
def home():
    """
    Render web UI for employee search and creation.
    """
    return render_template('index.html')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if session.get("is_authenticated"):
        return redirect(url_for("home"))

    error_message = None

    if request.method == 'POST':
        username = (request.form.get('username') or '').strip()
        password = request.form.get('password') or ''

        if username == DEMO_LOGIN_USERNAME and password == DEMO_LOGIN_PASSWORD:
            session["is_authenticated"] = True
            session["username"] = username
            return redirect(url_for('home'))

        error_message = "Invalid username or password."

    return render_template(
        'login.html',
        error_message=error_message,
        demo_username=DEMO_LOGIN_USERNAME,
        demo_password=DEMO_LOGIN_PASSWORD,
    )


@app.route('/logout', methods=['GET'])
def logout():
    session.clear()
    return redirect(url_for('login'))


@app.route('/api/employees/<int:emp_id>', methods=['GET'])
def get_employee(emp_id):
    """
    Get employee details by employee ID
    Returns: Employee details including id, name, email, salary, department, manager, geo_location
    """
    employee = get_employee_by_id(emp_id)
    if employee:
        return jsonify({
            "status": "success",
            "data": employee,
            "timestamp": datetime.now().isoformat()
        }), 200
    else:
        return jsonify({
            "status": "error",
            "message": f"Employee with ID {emp_id} not found",
            "timestamp": datetime.now().isoformat()
        }), 404


@app.route('/api/employees', methods=['GET'])
def get_all_employees():
    """
    Get all employees
    """
    employees = get_all_employees_from_db()
    return jsonify({
        "status": "success",
        "count": len(employees),
        "data": employees,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/insights', methods=['GET'])
def get_employee_insights():
    employees = get_all_employees_from_db()
    query_text = request.args.get('query', '')
    ai_mode = (request.args.get('ai_mode', 'all') or 'all').strip().lower()
    min_salary = request.args.get('min_salary', default=None, type=int)
    max_salary = request.args.get('max_salary', default=None, type=int)

    filtered_employees = filter_employees(
        employees,
        query_text=query_text,
        ai_mode=ai_mode,
        min_salary=min_salary,
        max_salary=max_salary,
    )
    insights = build_insights_payload(filtered_employees, query_text=query_text)

    return jsonify({
        "status": "success",
        "data": insights,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/ai/chat', methods=['POST'])
@login_required
def ai_chat():
    payload = request.get_json(silent=True) or {}
    prompt = (payload.get("prompt") or "").strip()
    provider = (payload.get("provider") or "local").strip().lower()

    if not prompt:
        return jsonify({
            "status": "error",
            "message": "Prompt is required.",
            "timestamp": datetime.now().isoformat()
        }), 400

    # Check if Local Medivra query is related to known patterns
    if provider == "local":
        prompt_lower = prompt.lower()
        
        # Stricter: only keep these specific workforce patterns local
        local_only_patterns = [
            # Greetings
            r"\b(hello|hi|hey|how are you)\b",
            # Help/capabilities
            r"\b(help|what can you do|capabilities)\b",
            # Summary/insights
            r"\b(summary|summarize|overview|insight|insights)\b",
            # Salary queries (specific patterns)
            r"\b(salary|between|from|above|over|greater than|more than|below|under|less than)\b.*(\d+)",
            # Weather
            r"\b(weather|temperature|forecast|rain|humidity)\b",
            # Closing
            r"\b(thanks|thank you|goodbye|bye)\b",
            # Specific workforce department/manager names
            r"\b(engineering|marketing|product|sales|support|hr)\b",
            r"\b(department|manager|employee|employees|workforce)\b",
            # Location queries with specific context
            r"\b(location|based in|from)\b",
        ]
        
        is_local_query = any(re.search(pattern, prompt_lower) for pattern in local_only_patterns)
        
        # If no local patterns matched, route to GitHub Copilot
        if not is_local_query:
            try:
                result_data = query_github_copilot(prompt)
                return jsonify({
                    "status": "success",
                    "data": result_data,
                    "timestamp": datetime.now().isoformat()
                }), 200
            except RuntimeError as exc:
                return jsonify({
                    "status": "error",
                    "message": str(exc),
                    "timestamp": datetime.now().isoformat()
                }), 503

    try:
        if provider in {"github", "copilot", "github-copilot"}:
            result_data = query_github_copilot(prompt)
        else:
            result_data = {
                "reply": query_local_chatbot(prompt),
                "model": "local-medivra-assistant",
                "provider": "local",
            }
    except RuntimeError as exc:
        return jsonify({
            "status": "error",
            "message": str(exc),
            "timestamp": datetime.now().isoformat()
        }), 503

    return jsonify({
        "status": "success",
        "data": result_data,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/ai/status', methods=['GET'])
@login_required
def ai_status():
    provider = (request.args.get("provider") or "local").strip().lower()

    if provider in {"github", "copilot", "github-copilot"}:
        status_data = get_github_copilot_status()
    elif provider == "local":
        status_data = {
            "state": "ready",
            "label": "Ready",
            "message": "Local Medivra assistant is available inside this app.",
        }
    else:
        status_data = {
            "state": "external",
            "label": "External",
            "message": "This provider opens in a new tab and is not checked from inside the app.",
        }

    return jsonify({
        "status": "success",
        "data": {
            "provider": provider,
            **status_data,
        },
        "timestamp": datetime.now().isoformat(),
    }), 200


@app.route('/api/employees', methods=['POST'])
def create_employee():
    """
    Create a new employee
    Request body should contain: name, email, salary, department, manager, geo_location
    """
    try:
        data = request.get_json(silent=True)
        employee_data, validation_error = validate_employee_payload(data)

        if validation_error:
            return jsonify({
                "status": "error",
                "message": validation_error,
                "timestamp": datetime.now().isoformat()
            }), 400

        connection = get_db_connection()
        cursor = connection.execute(
            """
            INSERT INTO employees (name, email, salary, department, manager, geo_location)
            VALUES (:name, :email, :salary, :department, :manager, :geo_location)
            """,
            employee_data,
        )
        connection.commit()
        new_employee = connection.execute(
            "SELECT * FROM employees WHERE id = ?",
            (cursor.lastrowid,),
        ).fetchone()
        connection.close()
        
        return jsonify({
            "status": "success",
            "message": "Employee created successfully",
            "data": row_to_employee(new_employee),
            "timestamp": datetime.now().isoformat()
        }), 201
    except sqlite3.IntegrityError:
        return jsonify({
            "status": "error",
            "message": "Email already exists for another employee.",
            "timestamp": datetime.now().isoformat()
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 400


@app.route('/api/employees/<int:emp_id>', methods=['PUT'])
def update_employee(emp_id):
    """
    Update an existing employee
    """
    existing_employee = get_employee_by_id(emp_id)
    if not existing_employee:
        return jsonify({
            "status": "error",
            "message": f"Employee with ID {emp_id} not found",
            "timestamp": datetime.now().isoformat()
        }), 404
    
    try:
        data = request.get_json(silent=True)
        employee_data, validation_error = validate_employee_payload(data, partial=True, current_emp_id=emp_id)

        if validation_error:
            return jsonify({
                "status": "error",
                "message": validation_error,
                "timestamp": datetime.now().isoformat()
            }), 400

        assignments = ", ".join(f"{field} = ?" for field in employee_data)
        values = list(employee_data.values()) + [emp_id]

        connection = get_db_connection()
        connection.execute(
            f"UPDATE employees SET {assignments} WHERE id = ?",
            values,
        )
        connection.commit()
        updated_employee = connection.execute(
            "SELECT * FROM employees WHERE id = ?",
            (emp_id,),
        ).fetchone()
        connection.close()
        
        return jsonify({
            "status": "success",
            "message": "Employee updated successfully",
            "data": row_to_employee(updated_employee),
            "timestamp": datetime.now().isoformat()
        }), 200
    except sqlite3.IntegrityError:
        return jsonify({
            "status": "error",
            "message": "Email already exists for another employee.",
            "timestamp": datetime.now().isoformat()
        }), 400
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e),
            "timestamp": datetime.now().isoformat()
        }), 400


@app.route('/api/employees/<int:emp_id>', methods=['DELETE'])
def delete_employee(emp_id):
    """
    Delete an employee
    """
    existing_employee = get_employee_by_id(emp_id)
    if not existing_employee:
        return jsonify({
            "status": "error",
            "message": f"Employee with ID {emp_id} not found",
            "timestamp": datetime.now().isoformat()
        }), 404
    
    connection = get_db_connection()
    connection.execute("DELETE FROM employees WHERE id = ?", (emp_id,))
    connection.commit()
    connection.close()
    
    return jsonify({
        "status": "success",
        "message": "Employee deleted successfully",
        "data": existing_employee,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    try:
        connection = get_db_connection()
        connection.execute("SELECT 1")
        connection.close()
        database_status = "connected"
    except sqlite3.Error:
        database_status = "error"

    return jsonify({
        "status": "success",
        "message": "API is running",
        "database": database_status,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.errorhandler(404)
def not_found(error):
    """
    Handle 404 errors
    """
    return jsonify({
        "status": "error",
        "message": "Endpoint not found",
        "timestamp": datetime.now().isoformat()
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """
    Handle 500 errors
    """
    return jsonify({
        "status": "error",
        "message": "Internal server error",
        "timestamp": datetime.now().isoformat()
    }), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
