package com.jrpg.auth;

import com.jrpg.dto.AuthResponse;
import com.jrpg.dto.LoginRequest;
import com.jrpg.dto.RegisterRequest;
import com.jrpg.entity.EndReason;
import com.jrpg.entity.Run;
import com.jrpg.repository.RunRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final RateLimiter rateLimiter;
    private final RunRepository runRepository;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(
            @Valid @RequestBody RegisterRequest req,
            HttpServletRequest httpReq) {
        enforceRateLimit(httpReq);
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(
            @Valid @RequestBody LoginRequest req,
            HttpServletRequest httpReq) {
        enforceRateLimit(httpReq);
        return ResponseEntity.ok(authService.login(req));
    }

    @GetMapping("/session-check")
    public ResponseEntity<Map<String, Object>> sessionCheck(Authentication authentication) {
        UUID playerUuid = UUID.fromString(authentication.getName());
        Optional<Run> activeRun = runRepository.findByPlayerUuidAndEndedAtIsNull(playerUuid);

        if (activeRun.isPresent()) {
            Run run = activeRun.get();
            LocalDateTime timeout = LocalDateTime.now().minusHours(1);
            if (run.getLastActionAt() != null && run.getLastActionAt().isBefore(timeout)) {
                run.setEndReason(EndReason.TIMEOUT);
                run.setEndedAt(LocalDateTime.now());
                runRepository.save(run);
                return ResponseEntity.ok(Map.of(
                        "timeout", true,
                        "fightsSurvived", run.getFightsSurvived()));
            }
        }
        return ResponseEntity.ok(Map.of("timeout", false));
    }

    private void enforceRateLimit(HttpServletRequest req) {
        String ip = req.getRemoteAddr();
        if (!rateLimiter.isAllowed(ip)) {
            log.warn("Rate limit exceeded for IP: {}", ip);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Rate limit exceeded");
        }
    }
}
