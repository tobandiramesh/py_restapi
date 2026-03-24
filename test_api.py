"""
Test script for Employee REST API
Run: python test_api.py
"""

import requests
import json

BASE_URL = "http://localhost:5000/api"

def print_response(response):
    """Pretty print API response"""
    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")
    print("-" * 80)

def test_health_check():
    """Test health check endpoint"""
    print("\n1. TESTING HEALTH CHECK")
    print("=" * 80)
    response = requests.get(f"{BASE_URL}/health")
    print_response(response)

def test_get_all_employees():
    """Test get all employees"""
    print("\n2. TESTING GET ALL EMPLOYEES")
    print("=" * 80)
    response = requests.get(f"{BASE_URL}/employees")
    print_response(response)

def test_get_employee_by_id(emp_id):
    """Test get employee by ID"""
    print(f"\n3. TESTING GET EMPLOYEE BY ID ({emp_id})")
    print("=" * 80)
    response = requests.get(f"{BASE_URL}/employees/{emp_id}")
    print_response(response)

def test_get_invalid_employee():
    """Test get invalid employee"""
    print("\n4. TESTING GET INVALID EMPLOYEE")
    print("=" * 80)
    response = requests.get(f"{BASE_URL}/employees/999")
    print_response(response)

def test_create_employee():
    """Test create employee"""
    print("\n5. TESTING CREATE EMPLOYEE")
    print("=" * 80)
    employee_data = {
        "name": "Charlie Brown",
        "email": "charlie.brown@company.com",
        "salary": 72000,
        "department": "Sales",
        "manager": "Sarah Smith",
        "geo_location": "Denver, USA"
    }
    response = requests.post(f"{BASE_URL}/employees", json=employee_data)
    print_response(response)
    return response.json().get('data', {}).get('id') if response.status_code == 201 else None

def test_create_employee_missing_field():
    """Test create employee with missing fields"""
    print("\n6. TESTING CREATE EMPLOYEE WITH MISSING FIELDS")
    print("=" * 80)
    employee_data = {
        "name": "Incomplete Employee",
        "email": "incomplete@company.com"
    }
    response = requests.post(f"{BASE_URL}/employees", json=employee_data)
    print_response(response)

def test_create_employee_invalid_email():
    """Test create employee with invalid email"""
    print("\n7. TESTING CREATE EMPLOYEE WITH INVALID EMAIL")
    print("=" * 80)
    employee_data = {
        "name": "Invalid Email Employee",
        "email": "invalid-email-format",
        "salary": 65000,
        "department": "Support",
        "manager": "Sarah Smith",
        "geo_location": "Austin, USA"
    }
    response = requests.post(f"{BASE_URL}/employees", json=employee_data)
    print_response(response)

def test_create_employee_invalid_salary():
    """Test create employee with invalid salary"""
    print("\n8. TESTING CREATE EMPLOYEE WITH INVALID SALARY")
    print("=" * 80)
    employee_data = {
        "name": "Invalid Salary Employee",
        "email": "invalid.salary@company.com",
        "salary": 500,
        "department": "Support",
        "manager": "Sarah Smith",
        "geo_location": "Austin, USA"
    }
    response = requests.post(f"{BASE_URL}/employees", json=employee_data)
    print_response(response)

def test_update_employee(emp_id):
    """Test update employee"""
    print(f"\n7. TESTING UPDATE EMPLOYEE (ID: {emp_id})")
    print("=" * 80)
    update_data = {
        "salary": 95000,
        "department": "Senior Engineering"
    }
    response = requests.put(f"{BASE_URL}/employees/{emp_id}", json=update_data)
    print_response(response)

def test_update_invalid_employee():
    """Test update invalid employee"""
    print("\n8. TESTING UPDATE INVALID EMPLOYEE")
    print("=" * 80)
    update_data = {
        "salary": 100000
    }
    response = requests.put(f"{BASE_URL}/employees/999", json=update_data)
    print_response(response)

def test_update_employee_invalid_email(emp_id):
    """Test update employee with invalid email"""
    print(f"\n9. TESTING UPDATE EMPLOYEE WITH INVALID EMAIL (ID: {emp_id})")
    print("=" * 80)
    update_data = {
        "email": "bad-email"
    }
    response = requests.put(f"{BASE_URL}/employees/{emp_id}", json=update_data)
    print_response(response)

def test_delete_employee(emp_id):
    """Test delete employee"""
    print(f"\n9. TESTING DELETE EMPLOYEE (ID: {emp_id})")
    print("=" * 80)
    response = requests.delete(f"{BASE_URL}/employees/{emp_id}")
    print_response(response)

def test_delete_invalid_employee():
    """Test delete invalid employee"""
    print("\n10. TESTING DELETE INVALID EMPLOYEE")
    print("=" * 80)
    response = requests.delete(f"{BASE_URL}/employees/999")
    print_response(response)

if __name__ == "__main__":
    try:
        print("\n" + "=" * 80)
        print("EMPLOYEE REST API - TEST SUITE")
        print("=" * 80)
        
        # Run tests
        test_health_check()
        test_get_all_employees()
        test_get_employee_by_id(1)
        test_get_invalid_employee()
        new_emp_id = test_create_employee()
        test_create_employee_missing_field()
        test_create_employee_invalid_email()
        test_create_employee_invalid_salary()
        
        if new_emp_id:
            test_update_employee(new_emp_id)
            test_update_employee_invalid_email(new_emp_id)
            test_delete_employee(new_emp_id)
        
        test_update_invalid_employee()
        test_delete_invalid_employee()
        
        print("\n" + "=" * 80)
        print("TEST SUITE COMPLETED")
        print("=" * 80)
        
    except requests.exceptions.ConnectionError:
        print("\nERROR: Could not connect to API server.")
        print("Make sure the server is running with: python app.py")
    except Exception as e:
        print(f"\nERROR: {str(e)}")
