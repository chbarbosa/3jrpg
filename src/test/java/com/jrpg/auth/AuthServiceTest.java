package com.jrpg.auth;

import com.jrpg.dto.AuthResponse;
import com.jrpg.dto.LoginRequest;
import com.jrpg.dto.RegisterRequest;
import com.jrpg.entity.Player;
import com.jrpg.repository.PlayerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock private PlayerRepository playerRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;

    @InjectMocks private AuthService authService;

    private static final String EMAIL = "hero@test.com";
    private static final String NICKNAME = "Hero";
    private static final String PASSWORD = "securepass123";
    private static final String HASH = "$2a$10$hashed";
    private static final String TOKEN = "eyJhbGci.test.token";

    private Player player;

    @BeforeEach
    void setUp() {
        player = new Player();
        player.setUuid(UUID.randomUUID());
        player.setEmail(EMAIL);
        player.setNickname(NICKNAME);
        player.setPasswordHash(HASH);
        player.setAvatarId("warrior");
    }

    @Test
    void register_newEmail_returnsAuthResponse() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail(EMAIL);
        req.setNickname(NICKNAME);
        req.setPassword(PASSWORD);

        when(playerRepository.findByEmail(EMAIL)).thenReturn(Optional.empty());
        when(passwordEncoder.encode(PASSWORD)).thenReturn(HASH);
        when(playerRepository.save(any(Player.class))).thenReturn(player);
        when(jwtUtil.generateToken(player)).thenReturn(TOKEN);

        AuthResponse response = authService.register(req);

        assertThat(response.token()).isEqualTo(TOKEN);
        assertThat(response.nickname()).isEqualTo(NICKNAME);
        assertThat(response.avatarId()).isEqualTo("warrior");
        assertThat(response.playerUuid()).isEqualTo(player.getUuid());
        verify(playerRepository).save(any(Player.class));
    }

    @Test
    void register_duplicateEmail_throwsConflict() {
        RegisterRequest req = new RegisterRequest();
        req.setEmail(EMAIL);
        req.setNickname(NICKNAME);
        req.setPassword(PASSWORD);

        when(playerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(player));

        assertThatThrownBy(() -> authService.register(req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.CONFLICT));

        verify(playerRepository, never()).save(any());
    }

    @Test
    void login_correctCredentials_returnsAuthResponse() {
        LoginRequest req = new LoginRequest();
        req.setEmail(EMAIL);
        req.setPassword(PASSWORD);

        when(playerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(player));
        when(passwordEncoder.matches(PASSWORD, HASH)).thenReturn(true);
        when(jwtUtil.generateToken(player)).thenReturn(TOKEN);

        AuthResponse response = authService.login(req);

        assertThat(response.token()).isEqualTo(TOKEN);
        assertThat(response.nickname()).isEqualTo(NICKNAME);
        assertThat(response.playerUuid()).isEqualTo(player.getUuid());
    }

    @Test
    void login_unknownEmail_throwsUnauthorized() {
        LoginRequest req = new LoginRequest();
        req.setEmail("ghost@test.com");
        req.setPassword(PASSWORD);

        when(playerRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }

    @Test
    void login_wrongPassword_throwsUnauthorized() {
        LoginRequest req = new LoginRequest();
        req.setEmail(EMAIL);
        req.setPassword("wrongpassword");

        when(playerRepository.findByEmail(EMAIL)).thenReturn(Optional.of(player));
        when(passwordEncoder.matches("wrongpassword", HASH)).thenReturn(false);

        assertThatThrownBy(() -> authService.login(req))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode())
                        .isEqualTo(HttpStatus.UNAUTHORIZED));
    }
}
