package com.medivra.desk.service;

import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AppSettingsService {
    private final Map<String, String> dotenvValues = new HashMap<>();

    public AppSettingsService() {
        loadDotEnv();
    }

    public String getDemoUsername() {
        return getValue("MEDIVRA_APP_USERNAME", "admin");
    }

    public String getDemoPassword() {
        return getValue("MEDIVRA_APP_PASSWORD", "medivra123");
    }

    public String getGithubToken() {
        return getValue("GITHUB_TOKEN", "");
    }

    public String getGithubBaseUrl() {
        return getValue("GITHUB_MODELS_BASE_URL", "https://models.inference.ai.azure.com");
    }

    public String getGithubModel() {
        String model = getValue("GITHUB_COPILOT_MODEL", "");
        if (model.isBlank()) {
            model = getValue("GITHUB_MODEL", "gpt-4o-mini");
        }
        return model;
    }

    private String getValue(String key, String fallback) {
        String env = System.getenv(key);
        if (env != null && !env.isBlank()) {
            return env.trim();
        }
        String dotEnv = dotenvValues.get(key);
        if (dotEnv != null && !dotEnv.isBlank()) {
            return dotEnv.trim();
        }
        return fallback;
    }

    private void loadDotEnv() {
        Path dotEnvPath = Path.of(".env");
        if (!Files.exists(dotEnvPath)) {
            return;
        }

        try {
            List<String> lines = Files.readAllLines(dotEnvPath);
            for (String line : lines) {
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#") || !trimmed.contains("=")) {
                    continue;
                }
                String[] parts = trimmed.split("=", 2);
                dotenvValues.put(parts[0].trim(), parts[1].trim());
            }
        } catch (IOException ignored) {
            // Keep defaults if .env cannot be read.
        }
    }
}
