package com.medivra.desk.service;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class ResponseBuilder {
    public Map<String, Object> successWithData(Object data) {
        Map<String, Object> response = base("success");
        response.put("data", data);
        return response;
    }

    public Map<String, Object> successWithDataAndMessage(Object data, String message) {
        Map<String, Object> response = base("success");
        response.put("message", message);
        response.put("data", data);
        return response;
    }

    public Map<String, Object> successWithMessage(String message) {
        Map<String, Object> response = base("success");
        response.put("message", message);
        return response;
    }

    public Map<String, Object> error(String message) {
        Map<String, Object> response = base("error");
        response.put("message", message);
        return response;
    }

    private Map<String, Object> base(String status) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", status);
        response.put("timestamp", Instant.now().toString());
        return response;
    }
}
