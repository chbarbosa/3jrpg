package com.jrpg.player;

import com.jrpg.player.dto.AvatarOption;
import com.jrpg.player.dto.ProfileResponse;
import com.jrpg.player.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class PlayerController {

    private final PlayerService playerService;

    @GetMapping("/api/player/profile")
    public ResponseEntity<ProfileResponse> getProfile(Authentication auth) {
        return ResponseEntity.ok(playerService.getProfile(playerUuid(auth)));
    }

    @PutMapping("/api/player/profile")
    public ResponseEntity<ProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication auth) {
        return ResponseEntity.ok(playerService.updateProfile(playerUuid(auth), request));
    }

    @GetMapping("/api/player/avatars")
    public ResponseEntity<List<AvatarOption>> getAvatars() {
        return ResponseEntity.ok(playerService.getAvailableAvatars());
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }

    private UUID playerUuid(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
