package com.medivra.desk.service;

import com.medivra.desk.model.Employee;
import com.medivra.desk.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.util.regex.Pattern;

@Service
public class EmployeeValidationService {
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\\\.[A-Za-z]{2,}$");
    private static final int MIN_SALARY = 1000;
    private static final int MAX_SALARY = 10000000;

    private final EmployeeRepository repository;

    public EmployeeValidationService(EmployeeRepository repository) {
        this.repository = repository;
    }

    public String validate(Employee employee, Integer currentId) {
        if (employee == null) {
            return "Request body must be valid JSON.";
        }
        if (isBlank(employee.getName())) {
            return "Name is required.";
        }
        if (isBlank(employee.getEmail())) {
            return "Email is required.";
        }
        if (!EMAIL_PATTERN.matcher(employee.getEmail().trim()).matches()) {
            return "Email must be in a valid format like name@company.com.";
        }
        if (employee.getSalary() == null) {
            return "Salary must be a whole number.";
        }
        if (employee.getSalary() < MIN_SALARY || employee.getSalary() > MAX_SALARY) {
            return "Salary must be between " + MIN_SALARY + " and " + MAX_SALARY + ".";
        }
        if (isBlank(employee.getDepartment())) {
            return "Department is required.";
        }
        if (isBlank(employee.getManager())) {
            return "Manager is required.";
        }
        if (isBlank(employee.getGeoLocation())) {
            return "Geo Location is required.";
        }
        if (repository.emailExists(employee.getEmail().trim(), currentId)) {
            return "Email already exists for another employee.";
        }

        employee.setName(employee.getName().trim());
        employee.setEmail(employee.getEmail().trim());
        employee.setDepartment(employee.getDepartment().trim());
        employee.setManager(employee.getManager().trim());
        employee.setGeoLocation(employee.getGeoLocation().trim());
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
