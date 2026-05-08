package com.group11.compostsystem.controller;

import com.group11.compostsystem.dto.AuthResponse;
import com.group11.compostsystem.dto.LoginRequest;
import com.group11.compostsystem.dto.RegisterRequest;
import com.group11.compostsystem.dto.UserResponse;
import com.group11.compostsystem.service.AuthService;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = {
        "http://localhost:5173",
        "http://127.0.0.1:5173"
})
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        try {
            UserResponse user = authService.register(request);
            return ResponseEntity.ok(
                    new AuthResponse(true, "Registration successful.", user)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new AuthResponse(false, e.getMessage(), null)
            );
        } catch (DataAccessException e) {
            return ResponseEntity.badRequest().body(
                    new AuthResponse(false, "Registration failed: " + e.getMostSpecificCause().getMessage(), null)
            );
        }
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody LoginRequest request) {
        try {
            UserResponse user = authService.login(request);
            return ResponseEntity.ok(
                    new AuthResponse(true, "Login successful.", user)
            );
        } catch (EmptyResultDataAccessException e) {
            return ResponseEntity.status(401).body(
                    new AuthResponse(false, "Invalid email or password.", null)
            );
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    new AuthResponse(false, e.getMessage(), null)
            );
        } catch (DataAccessException e) {
            return ResponseEntity.badRequest().body(
                    new AuthResponse(false, "Login failed: " + e.getMostSpecificCause().getMessage(), null)
            );
        }
    }
}