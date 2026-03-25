package com.medivra.desk.controller;

import com.medivra.desk.model.Employee;
import com.medivra.desk.repository.EmployeeRepository;
import com.medivra.desk.service.AiService;
import com.medivra.desk.service.EmployeeValidationService;
import com.medivra.desk.service.InsightsService;
import com.medivra.desk.service.ResponseBuilder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class ApiController {
    private final EmployeeRepository employeeRepository;
    private final EmployeeValidationService validationService;
    private final InsightsService insightsService;
    private final AiService aiService;
    private final ResponseBuilder responseBuilder;

    public ApiController(EmployeeRepository employeeRepository,
                         EmployeeValidationService validationService,
                         InsightsService insightsService,
                         AiService aiService,
                         ResponseBuilder responseBuilder) {
        this.employeeRepository = employeeRepository;
        this.validationService = validationService;
        this.insightsService = insightsService;
        this.aiService = aiService;
        this.responseBuilder = responseBuilder;
    }

    @GetMapping("/employees/{empId}")
    public ResponseEntity<Map<String, Object>> getEmployee(@PathVariable int empId) {
        Optional<Employee> employee = employeeRepository.findById(empId);
        if (employee.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(responseBuilder.error("Employee with ID " + empId + " not found"));
        }
        return ResponseEntity.ok(responseBuilder.successWithData(employee.get()));
    }

    @GetMapping("/employees")
    public ResponseEntity<Map<String, Object>> getAllEmployees() {
        List<Employee> employees = employeeRepository.findAll();
        Map<String, Object> response = responseBuilder.successWithData(employees);
        response.put("count", employees.size());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/employees")
    public ResponseEntity<Map<String, Object>> createEmployee(@RequestBody(required = false) Employee employee) {
        String error = validationService.validate(employee, null);
        if (error != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBuilder.error(error));
        }

        Employee created = employeeRepository.insert(employee);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(responseBuilder.successWithDataAndMessage(created, "Employee created successfully"));
    }

    @PutMapping("/employees/{empId}")
    public ResponseEntity<Map<String, Object>> updateEmployee(@PathVariable int empId,
                                                               @RequestBody(required = false) Employee employee) {
        Optional<Employee> existing = employeeRepository.findById(empId);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(responseBuilder.error("Employee with ID " + empId + " not found"));
        }

        String error = validationService.validate(employee, empId);
        if (error != null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBuilder.error(error));
        }

        Employee updated = employeeRepository.update(empId, employee);
        return ResponseEntity.ok(responseBuilder.successWithDataAndMessage(updated, "Employee updated successfully"));
    }

    @DeleteMapping("/employees/{empId}")
    public ResponseEntity<Map<String, Object>> deleteEmployee(@PathVariable int empId) {
        Optional<Employee> existing = employeeRepository.findById(empId);
        if (existing.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(responseBuilder.error("Employee with ID " + empId + " not found"));
        }

        employeeRepository.delete(empId);
        return ResponseEntity.ok(responseBuilder.successWithDataAndMessage(existing.get(), "Employee deleted successfully"));
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, Object>> getInsights(@RequestParam(value = "query", defaultValue = "") String query,
                                                           @RequestParam(value = "ai_mode", defaultValue = "all") String aiMode,
                                                           @RequestParam(value = "min_salary", required = false) Integer minSalary,
                                                           @RequestParam(value = "max_salary", required = false) Integer maxSalary) {
        List<Employee> employees = employeeRepository.findAll();
        List<Employee> filtered = insightsService.filterEmployees(employees, query, aiMode.toLowerCase(), minSalary, maxSalary);
        Map<String, Object> payload = insightsService.buildInsightsPayload(filtered, query);
        return ResponseEntity.ok(responseBuilder.successWithData(payload));
    }

    @PostMapping("/ai/chat")
    public ResponseEntity<Map<String, Object>> aiChat(@RequestBody(required = false) Map<String, Object> body) {
        String prompt = body == null ? "" : String.valueOf(body.getOrDefault("prompt", "")).trim();
        String provider = body == null ? "local" : String.valueOf(body.getOrDefault("provider", "local")).trim().toLowerCase();

        if (prompt.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(responseBuilder.error("Prompt is required."));
        }

        try {
            Map<String, Object> resultData;
            if (provider.equals("github") || provider.equals("copilot") || provider.equals("github-copilot")) {
                resultData = aiService.githubReply(prompt);
            } else {
                resultData = Map.of(
                    "reply", aiService.localReply(prompt),
                    "model", "local-medivra-assistant",
                    "provider", "local"
                );
            }
            return ResponseEntity.ok(responseBuilder.successWithData(resultData));
        } catch (RuntimeException ex) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(responseBuilder.error(ex.getMessage()));
        }
    }

    @GetMapping("/ai/status")
    public ResponseEntity<Map<String, Object>> aiStatus(@RequestParam(value = "provider", defaultValue = "local") String providerParam) {
        String provider = providerParam.trim().toLowerCase();
        Map<String, Object> status;
        if (provider.equals("github") || provider.equals("copilot") || provider.equals("github-copilot")) {
            status = aiService.githubStatus();
        } else if (provider.equals("local")) {
            status = Map.of(
                "state", "ready",
                "label", "Ready",
                "message", "Local Medivra assistant is available inside this app."
            );
        } else {
            status = Map.of(
                "state", "external",
                "label", "External",
                "message", "This provider opens in a new tab and is not checked from inside the app."
            );
        }

        Map<String, Object> data = new HashMap<>(status);
        data.put("provider", provider);
        return ResponseEntity.ok(responseBuilder.successWithData(data));
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = responseBuilder.successWithMessage("API is running");
        response.put("database", "connected");
        return ResponseEntity.ok(response);
    }
}
