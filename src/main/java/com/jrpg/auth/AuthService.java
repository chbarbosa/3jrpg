package com.jrpg.auth;

import com.jrpg.dto.AuthResponse;
import com.jrpg.dto.LoginRequest;
import com.jrpg.dto.RegisterRequest;
import com.jrpg.entity.Player;
import com.jrpg.repository.PlayerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final PlayerRepository playerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthResponse register(RegisterRequest req) {
        if (playerRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already in use");
        }
        Player player = new Player();
        player.setEmail(req.getEmail());
        player.setNickname(req.getNickname());
        player.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        player.setAvatarId("warrior");
        Player saved = playerRepository.save(player);
        log.info("New player registered: {}", saved.getNickname());
        return toResponse(saved);
    }

    public AuthResponse login(LoginRequest req) {
        Player player = playerRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> {
                    log.warn("Failed login attempt for email: {}", req.getEmail());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
                });
        if (!passwordEncoder.matches(req.getPassword(), player.getPasswordHash())) {
            log.warn("Failed login attempt for email: {}", req.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }
        log.info("Player logged in: {}", player.getNickname());
        return toResponse(player);
    }

    private AuthResponse toResponse(Player player) {
        return new AuthResponse(
                jwtUtil.generateToken(player),
                player.getNickname(),
                player.getAvatarId(),
                player.getUuid());
    }
}
