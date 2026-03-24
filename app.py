from flask import Flask, jsonify, request, render_template
from datetime import datetime

app = Flask(__name__)

# Sample Employee Database
employees = {
    1: {
        "id": 1,
        "name": "John Doe",
        "email": "john.doe@company.com",
        "salary": 75000,
        "department": "Engineering",
        "manager": "Sarah Smith",
        "geo_location": "New York, USA"
    },
    2: {
        "id": 2,
        "name": "Jane Smith",
        "email": "jane.smith@company.com",
        "salary": 85000,
        "department": "Product",
        "manager": "Michael Brown",
        "geo_location": "San Francisco, USA"
    },
    3: {
        "id": 3,
        "name": "Alice Johnson",
        "email": "alice.johnson@company.com",
        "salary": 95000,
        "department": "Engineering",
        "manager": "Sarah Smith",
        "geo_location": "Seattle, USA"
    },
    4: {
        "id": 4,
        "name": "Bob Wilson",
        "email": "bob.wilson@company.com",
        "salary": 70000,
        "department": "Marketing",
        "manager": "Emily Davis",
        "geo_location": "Boston, USA"
    },
    5: {
        "id": 5,
        "name": "Sarah Smith",
        "email": "sarah.smith@company.com",
        "salary": 120000,
        "department": "Engineering",
        "manager": "Michael Brown",
        "geo_location": "New York, USA"
    }
}


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
    if emp_id in employees:
        return jsonify({
            "status": "success",
            "data": employees[emp_id],
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
    return jsonify({
        "status": "success",
        "count": len(employees),
        "data": list(employees.values()),
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/employees', methods=['POST'])
def create_employee():
    """
    Create a new employee
    Request body should contain: name, email, salary, department, manager, geo_location
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['name', 'email', 'salary', 'department', 'manager', 'geo_location']
        if not all(field in data for field in required_fields):
            return jsonify({
                "status": "error",
                "message": f"Missing required fields: {', '.join(required_fields)}",
                "timestamp": datetime.now().isoformat()
            }), 400
        
        # Generate new ID
        new_id = max(employees.keys()) + 1 if employees else 1
        
        employees[new_id] = {
            "id": new_id,
            "name": data['name'],
            "email": data['email'],
            "salary": data['salary'],
            "department": data['department'],
            "manager": data['manager'],
            "geo_location": data['geo_location']
        }
        
        return jsonify({
            "status": "success",
            "message": "Employee created successfully",
            "data": employees[new_id],
            "timestamp": datetime.now().isoformat()
        }), 201
    
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
    if emp_id not in employees:
        return jsonify({
            "status": "error",
            "message": f"Employee with ID {emp_id} not found",
            "timestamp": datetime.now().isoformat()
        }), 404
    
    try:
        data = request.get_json()
        
        # Update fields if provided
        if 'name' in data:
            employees[emp_id]['name'] = data['name']
        if 'email' in data:
            employees[emp_id]['email'] = data['email']
        if 'salary' in data:
            employees[emp_id]['salary'] = data['salary']
        if 'department' in data:
            employees[emp_id]['department'] = data['department']
        if 'manager' in data:
            employees[emp_id]['manager'] = data['manager']
        if 'geo_location' in data:
            employees[emp_id]['geo_location'] = data['geo_location']
        
        return jsonify({
            "status": "success",
            "message": "Employee updated successfully",
            "data": employees[emp_id],
            "timestamp": datetime.now().isoformat()
        }), 200
    
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
    if emp_id not in employees:
        return jsonify({
            "status": "error",
            "message": f"Employee with ID {emp_id} not found",
            "timestamp": datetime.now().isoformat()
        }), 404
    
    deleted_employee = employees.pop(emp_id)
    
    return jsonify({
        "status": "success",
        "message": "Employee deleted successfully",
        "data": deleted_employee,
        "timestamp": datetime.now().isoformat()
    }), 200


@app.route('/api/health', methods=['GET'])
def health_check():
    """
    Health check endpoint
    """
    return jsonify({
        "status": "success",
        "message": "API is running",
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
