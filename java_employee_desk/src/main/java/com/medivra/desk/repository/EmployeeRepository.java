package com.medivra.desk.repository;

import com.medivra.desk.model.Employee;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class EmployeeRepository {
    private final JdbcTemplate jdbcTemplate;

    private final RowMapper<Employee> employeeMapper = (rs, rowNum) -> new Employee(
        rs.getInt("id"),
        rs.getString("name"),
        rs.getString("email"),
        rs.getInt("salary"),
        rs.getString("department"),
        rs.getString("manager"),
        rs.getString("geo_location")
    );

    public EmployeeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createTableIfNeeded() {
        jdbcTemplate.execute("""
            CREATE TABLE IF NOT EXISTS employees (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                salary INTEGER NOT NULL,
                department TEXT NOT NULL,
                manager TEXT NOT NULL,
                geo_location TEXT NOT NULL
            )
            """);
    }

    public int count() {
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees", Integer.class);
        return count == null ? 0 : count;
    }

    public void seedDataIfEmpty() {
        if (count() > 0) {
            return;
        }

        List<Map<String, Object>> sample = List.of(
            Map.of("name", "John Doe", "email", "john.doe@company.com", "salary", 75000, "department", "Engineering", "manager", "Sarah Smith", "geo_location", "New York, USA"),
            Map.of("name", "Jane Smith", "email", "jane.smith@company.com", "salary", 85000, "department", "Product", "manager", "Michael Brown", "geo_location", "San Francisco, USA"),
            Map.of("name", "Alice Johnson", "email", "alice.johnson@company.com", "salary", 95000, "department", "Engineering", "manager", "Sarah Smith", "geo_location", "Seattle, USA"),
            Map.of("name", "Bob Wilson", "email", "bob.wilson@company.com", "salary", 70000, "department", "Marketing", "manager", "Emily Davis", "geo_location", "Boston, USA"),
            Map.of("name", "Sarah Smith", "email", "sarah.smith@company.com", "salary", 120000, "department", "Engineering", "manager", "Michael Brown", "geo_location", "New York, USA")
        );

        for (Map<String, Object> row : sample) {
            jdbcTemplate.update(
                "INSERT INTO employees (name, email, salary, department, manager, geo_location) VALUES (?, ?, ?, ?, ?, ?)",
                row.get("name"), row.get("email"), row.get("salary"), row.get("department"), row.get("manager"), row.get("geo_location")
            );
        }
    }

    public List<Employee> findAll() {
        return jdbcTemplate.query("SELECT * FROM employees ORDER BY id ASC", employeeMapper);
    }

    public Optional<Employee> findById(int id) {
        List<Employee> results = jdbcTemplate.query("SELECT * FROM employees WHERE id = ?", employeeMapper, id);
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public boolean emailExists(String email, Integer excludeId) {
        Integer count;
        if (excludeId == null) {
            count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees WHERE email = ?", Integer.class, email);
        } else {
            count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM employees WHERE email = ? AND id != ?", Integer.class, email, excludeId);
        }
        return count != null && count > 0;
    }

    public Employee insert(Employee employee) {
        jdbcTemplate.update(
            "INSERT INTO employees (name, email, salary, department, manager, geo_location) VALUES (?, ?, ?, ?, ?, ?)",
            employee.getName(), employee.getEmail(), employee.getSalary(), employee.getDepartment(), employee.getManager(), employee.getGeoLocation()
        );
        Integer id = jdbcTemplate.queryForObject("SELECT last_insert_rowid()", Integer.class);
        return findById(id == null ? -1 : id).orElseThrow();
    }

    public Employee update(int id, Employee employee) {
        jdbcTemplate.update(
            "UPDATE employees SET name = ?, email = ?, salary = ?, department = ?, manager = ?, geo_location = ? WHERE id = ?",
            employee.getName(), employee.getEmail(), employee.getSalary(), employee.getDepartment(), employee.getManager(), employee.getGeoLocation(), id
        );
        return findById(id).orElseThrow();
    }

    public void delete(int id) {
        jdbcTemplate.update("DELETE FROM employees WHERE id = ?", id);
    }
}
