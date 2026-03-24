from collections import Counter
from datetime import datetime
from functools import wraps
import json
import os
from pathlib import Path
import re
import sqlite3
from urllib import error as url_error
from urllib import request as url_request

from flask import Flask, jsonify, request, render_template, redirect, session, url_for

app = Flask(__name__)
app.secret_key = os.environ.get("FLASK_SECRET_KEY", "medivra-local-secret-key")

BASE_DIR = Path(__file__).resolve().parent
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
GEMINI_MODEL = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash")


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


def query_gemini_text(prompt):
    gemini_api_key = (os.environ.get("GEMINI_API_KEY") or "").strip()
    if not gemini_api_key:
        return None, "Gemini API key is missing. Set GEMINI_API_KEY in your environment."

    endpoint = (
        f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={gemini_api_key}"
    )
    payload = {
        "contents": [
            {
                "parts": [
                    {
                        "text": prompt,
                    }
                ]
            }
        ]
    }

    http_request = url_request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with url_request.urlopen(http_request, timeout=20) as response:
            response_payload = json.loads(response.read().decode("utf-8"))
    except url_error.HTTPError as error:
        try:
            error_payload = json.loads(error.read().decode("utf-8"))
            error_message = error_payload.get("error", {}).get("message", "Gemini request failed.")
        except Exception:
            error_message = "Gemini request failed."
        return None, error_message
    except Exception as error:
        return None, str(error)

    candidates = response_payload.get("candidates") or []
    if not candidates:
        return None, "Gemini did not return a response."

    parts = (candidates[0].get("content") or {}).get("parts") or []
    output_text = "\n".join(part.get("text", "") for part in parts if part.get("text", "")).strip()
    if not output_text:
        return None, "Gemini returned an empty response."

    return output_text, None


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

    if not prompt:
        return jsonify({
            "status": "error",
            "message": "Prompt is required.",
            "timestamp": datetime.now().isoformat()
        }), 400

    reply, error_message = query_gemini_text(prompt)
    if error_message:
        return jsonify({
            "status": "error",
            "message": error_message,
            "timestamp": datetime.now().isoformat()
        }), 502

    return jsonify({
        "status": "success",
        "data": {
            "reply": reply,
            "model": GEMINI_MODEL,
        },
        "timestamp": datetime.now().isoformat()
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
