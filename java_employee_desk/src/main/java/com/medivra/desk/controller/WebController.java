package com.medivra.desk.controller;

import com.medivra.desk.service.AppSettingsService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class WebController {
    private final AppSettingsService settings;

    public WebController(AppSettingsService settings) {
        this.settings = settings;
    }

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @GetMapping("/login")
    public String loginPage(HttpSession session, Model model) {
        if (Boolean.TRUE.equals(session.getAttribute("is_authenticated"))) {
            return "redirect:/";
        }
        model.addAttribute("demoUsername", settings.getDemoUsername());
        model.addAttribute("demoPassword", settings.getDemoPassword());
        model.addAttribute("usernameValue", settings.getDemoUsername());
        model.addAttribute("passwordValue", settings.getDemoPassword());
        model.addAttribute("errorMessage", null);
        return "login";
    }

    @PostMapping("/login")
    public String loginSubmit(@RequestParam("username") String username,
                              @RequestParam("password") String password,
                              HttpServletRequest request,
                              Model model) {
        if (settings.getDemoUsername().equals(username.trim()) && settings.getDemoPassword().equals(password)) {
            HttpSession session = request.getSession(true);
            session.setAttribute("is_authenticated", true);
            session.setAttribute("username", username.trim());
            return "redirect:/";
        }

        model.addAttribute("demoUsername", settings.getDemoUsername());
        model.addAttribute("demoPassword", settings.getDemoPassword());
        model.addAttribute("usernameValue", username);
        model.addAttribute("passwordValue", password);
        model.addAttribute("errorMessage", "Invalid username or password.");
        return "login";
    }

    @GetMapping("/logout")
    public String logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        return "redirect:/login";
    }
}
