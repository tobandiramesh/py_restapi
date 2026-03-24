from datetime import datetime
from pathlib import Path
import re
import sqlite3

from flask import Flask, jsonify, request, render_template

app = Flask(__name__)

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
def home():
    """
    Render web UI for employee search and creation.
    """
    return render_template('index.html')


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
