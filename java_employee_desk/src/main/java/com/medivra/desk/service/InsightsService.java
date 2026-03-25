package com.medivra.desk.service;

import com.medivra.desk.model.Employee;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class InsightsService {

    public List<Employee> filterEmployees(List<Employee> employees, String queryText, String aiMode, Integer minSalary, Integer maxSalary) {
        List<Employee> filtered = new ArrayList<>(employees);

        if ("high-salary".equals(aiMode) && !filtered.isEmpty()) {
            List<Integer> salaryValues = filtered.stream().map(Employee::getSalary).sorted().toList();
            int thresholdIndex = Math.max(0, (salaryValues.size() * 3) / 4 - 1);
            int threshold = salaryValues.get(thresholdIndex);
            filtered = filtered.stream().filter(employee -> employee.getSalary() >= threshold).toList();
        }

        if ("salary-range".equals(aiMode)) {
            if (minSalary != null) {
                filtered = filtered.stream().filter(employee -> employee.getSalary() >= minSalary).toList();
            }
            if (maxSalary != null) {
                filtered = filtered.stream().filter(employee -> employee.getSalary() <= maxSalary).toList();
            }
        }

        String normalized = queryText == null ? "" : queryText.trim().toLowerCase();
        if (normalized.isEmpty()) {
            return filtered;
        }

        return filtered.stream().filter(employee -> {
            String text = String.join(" ",
                String.format("EMP-%04d", employee.getId()),
                String.valueOf(employee.getId()),
                employee.getName(),
                employee.getEmail(),
                employee.getDepartment(),
                employee.getManager(),
                employee.getGeoLocation()).toLowerCase();
            return text.contains(normalized);
        }).toList();
    }

    public Map<String, Object> buildInsightsPayload(List<Employee> employees, String queryText) {
        int visibleCount = employees.size();
        if (visibleCount == 0) {
            return Map.of(
                "visible_count", 0,
                "department_count", 0,
                "average_salary", 0,
                "top_manager", null,
                "summary", "No records match the current view. Clear the filter or add a new employee to generate AI guidance.",
                "actions", List.of("Clear filters to restore the full workforce view.", "Add an employee record to rebuild live insights."),
                "distributions", Map.of("departments", Map.of(), "managers", Map.of(), "locations", Map.of())
            );
        }

        Map<String, Long> departments = employees.stream().collect(Collectors.groupingBy(Employee::getDepartment, Collectors.counting()));
        Map<String, Long> managers = employees.stream().collect(Collectors.groupingBy(Employee::getManager, Collectors.counting()));
        Map<String, Long> locations = employees.stream().collect(Collectors.groupingBy(Employee::getGeoLocation, Collectors.counting()));

        int avgSalary = (int) Math.round(employees.stream().mapToInt(Employee::getSalary).average().orElse(0));
        Employee highest = employees.stream().max(Comparator.comparingInt(Employee::getSalary)).orElse(null);
        Map.Entry<String, Long> topDept = departments.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null);
        Map.Entry<String, Long> topManager = managers.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null);
        Map.Entry<String, Long> topLocation = locations.entrySet().stream().max(Map.Entry.comparingByValue()).orElse(null);

        List<String> actions = new ArrayList<>();
        if (topDept != null && (double) topDept.getValue() / visibleCount >= 0.5) {
            actions.add("Department mix is concentrated in " + topDept.getKey() + ". Review whether other teams need additional hiring coverage.");
        }
        if (topManager != null && topManager.getValue() >= 3) {
            actions.add(topManager.getKey() + " manages " + topManager.getValue() + " visible employees. Consider checking workload balance across managers.");
        }
        if (highest != null && highest.getSalary() >= avgSalary * 1.35) {
            actions.add("Compensation spread is wide. Compare " + highest.getName() + "'s package against the team average for role alignment.");
        }
        if (queryText != null && !queryText.trim().isEmpty()) {
            actions.add("These insights are based on the active filter. Clear the filter to compare against the full employee roster.");
        }
        if (actions.isEmpty()) {
            actions = List.of(
                "The current workforce view looks balanced. Use sorting by salary or department to inspect outliers and growth areas.",
                "Search or filter by manager and location to spot team distribution patterns faster."
            );
        }

        String summary = "The current view covers " + visibleCount + " employees across " + departments.size() + " departments. " +
            "Average salary is $" + String.format("%,d", avgSalary) +
            (highest == null ? "." : ", with " + highest.getName() + " currently highest at $" + String.format("%,d", highest.getSalary()) + ".") +
            (topDept == null ? "" : " " + topDept.getKey() + " is the largest department in view with " + topDept.getValue() + " employees.") +
            (topLocation == null ? "" : " " + topLocation.getKey() + " has the strongest location presence with " + topLocation.getValue() + " records.");

        Map<String, Object> response = new HashMap<>();
        response.put("visible_count", visibleCount);
        response.put("department_count", departments.size());
        response.put("average_salary", avgSalary);
        response.put("top_manager", topManager == null ? null : Map.of("name", topManager.getKey(), "count", topManager.getValue()));
        response.put("summary", summary);
        response.put("actions", actions);
        response.put("distributions", Map.of(
            "departments", topN(departments, 5),
            "managers", topN(managers, 5),
            "locations", topN(locations, 5)
        ));
        return response;
    }

    private Map<String, Long> topN(Map<String, Long> source, int n) {
        return source.entrySet().stream()
            .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
            .limit(n)
            .collect(Collectors.toMap(Map.Entry::getKey, Map.Entry::getValue, (a, b) -> a, LinkedHashMap::new));
    }
}
