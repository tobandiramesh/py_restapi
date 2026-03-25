package com.medivra.desk.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.medivra.desk.model.Employee;
import com.medivra.desk.repository.EmployeeRepository;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiService {
    private final EmployeeRepository employeeRepository;
    private final AppSettingsService settings;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(15)).build();

    public AiService(EmployeeRepository employeeRepository, AppSettingsService settings) {
        this.employeeRepository = employeeRepository;
        this.settings = settings;
    }

    public String localReply(String prompt) {
        List<Employee> employees = employeeRepository.findAll();
        String lower = prompt == null ? "" : prompt.trim().toLowerCase();
        if (lower.isBlank()) {
            return "Please ask me something. I can help with employee queries or general questions.";
        }
        if (lower.contains("hello") || lower.contains("hi") || lower.contains("hey")) {
            return "Hello! I'm your Medivra AI assistant. I can help with employee data analysis and general questions.";
        }
        if (lower.contains("summary") || lower.contains("insight") || lower.contains("overview")) {
            if (employees.isEmpty()) {
                return "I can summarize your workforce once employee records are added.";
            }
            int avg = (int) Math.round(employees.stream().mapToInt(Employee::getSalary).average().orElse(0));
            Employee highest = employees.stream().max((a, b) -> Integer.compare(a.getSalary(), b.getSalary())).orElse(null);
            return "Workforce summary: " + employees.size() + " employees. Average salary is $" + String.format("%,d", avg) +
                (highest == null ? "." : ". Highest paid employee is " + highest.getName() + " at $" + String.format("%,d", highest.getSalary()) + ".");
        }
        if (lower.contains("thanks") || lower.contains("thank you") || lower.contains("bye")) {
            return "You're welcome! Feel free to ask any other questions.";
        }
        return "I can answer workforce questions, summarize employees, and help with practical HR workflows.";
    }

    public Map<String, Object> githubReply(String prompt) {
        String token = settings.getGithubToken();
        if (token.isBlank()) {
            throw new RuntimeException("GitHub token not configured. Set GITHUB_TOKEN in .env to use GitHub Copilot mode.");
        }

        String model = settings.getGithubModel();
        String baseUrl = settings.getGithubBaseUrl().replaceAll("/+$", "");

        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("model", model);
            payload.put("messages", List.of(
                Map.of("role", "system", "content", "You are Medivra AI assistant. Provide concise and practical answers for HR and workforce workflows."),
                Map.of("role", "user", "content", prompt)
            ));
            payload.put("temperature", 0.4);
            payload.put("max_tokens", 700);

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .header("User-Agent", "medivra-ai-client/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .timeout(Duration.ofSeconds(45))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new RuntimeException("GitHub Copilot request failed (" + response.statusCode() + "). " + response.body());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new RuntimeException("GitHub Copilot returned an empty response.");
            }
            String reply = choices.get(0).path("message").path("content").asText("").trim();
            if (reply.isEmpty()) {
                throw new RuntimeException("GitHub Copilot returned no text reply.");
            }

            return Map.of(
                "reply", reply,
                "model", root.path("model").asText(model),
                "provider", "github-copilot"
            );
        } catch (Exception ex) {
            throw new RuntimeException("GitHub Copilot request failed. " + ex.getMessage(), ex);
        }
    }

    public Map<String, Object> githubStatus() {
        String token = settings.getGithubToken();
        if (token.isBlank()) {
            return Map.of(
                "state", "setup-required",
                "label", "Setup Required",
                "message", "Set GITHUB_TOKEN in .env to enable GitHub Copilot mode."
            );
        }

        String model = settings.getGithubModel();
        String baseUrl = settings.getGithubBaseUrl().replaceAll("/+$", "");

        try {
            Map<String, Object> payload = Map.of(
                "model", model,
                "messages", List.of(Map.of("role", "user", "content", "ping")),
                "temperature", 0,
                "max_tokens", 1
            );

            HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(baseUrl + "/chat/completions"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + token)
                .header("User-Agent", "medivra-ai-client/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload)))
                .timeout(Duration.ofSeconds(12))
                .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return Map.of(
                    "state", "ready",
                    "label", "Ready",
                    "message", "GitHub Copilot is reachable with model " + model + "."
                );
            }
            return Map.of(
                "state", "error",
                "label", "Error",
                "message", "GitHub Copilot check failed (" + response.statusCode() + "). " + response.body()
            );
        } catch (Exception ex) {
            return Map.of(
                "state", "error",
                "label", "Error",
                "message", "GitHub Copilot check failed. " + ex.getMessage()
            );
        }
    }
}
