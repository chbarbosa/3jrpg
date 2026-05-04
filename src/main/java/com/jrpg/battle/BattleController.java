package com.jrpg.battle;

import com.jrpg.battle.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BattleController {

    private final BattleService battleService;

    // ── Run endpoints ─────────────────────────────────────────────────────

    @PostMapping("/api/run/start")
    public ResponseEntity<BattleStateResponse> startRun(
            @Valid @RequestBody StartRunRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.startRun(playerUuid(auth), request));
    }

    @PostMapping("/api/run/action")
    public ResponseEntity<ActionResultResponse> action(
            @Valid @RequestBody ActionRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.processAction(playerUuid(auth), request));
    }

    @PostMapping("/api/run/fight/next")
    public ResponseEntity<BattleStateResponse> nextFight(
            @RequestParam UUID runUuid,
            Authentication auth) {
        return ResponseEntity.ok(battleService.nextFight(playerUuid(auth), runUuid));
    }

    @PostMapping("/api/run/prep")
    public ResponseEntity<PrepResultResponse> startPrep(
            @RequestParam UUID runUuid,
            Authentication auth) {
        return ResponseEntity.ok(battleService.startPrep(playerUuid(auth), runUuid));
    }

    @PostMapping("/api/run/prep/assign-loot")
    public ResponseEntity<List<HeroStateDTO>> assignLoot(
            @Valid @RequestBody LootAssignRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.assignLoot(playerUuid(auth), request));
    }

    @PostMapping("/api/run/prep/action")
    public ResponseEntity<List<HeroStateDTO>> prepAction(
            @Valid @RequestBody PrepActionRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.processPrepAction(playerUuid(auth), request));
    }

    @PostMapping("/api/run/giveup")
    public ResponseEntity<Map<String, Object>> giveUp(
            @Valid @RequestBody GiveUpRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.giveUp(playerUuid(auth), request));
    }

    @PostMapping("/api/run/restart")
    public ResponseEntity<BattleStateResponse> restart(
            @Valid @RequestBody RestartRequest request,
            Authentication auth) {
        return ResponseEntity.ok(battleService.restart(playerUuid(auth), request));
    }

    // ── Player endpoint ───────────────────────────────────────────────────

    @GetMapping("/api/player/profile")
    public ResponseEntity<Map<String, Object>> profile(Authentication auth) {
        return ResponseEntity.ok(battleService.getProfile(playerUuid(auth)));
    }

    // ── Exception handlers ────────────────────────────────────────────────

    @ExceptionHandler(TimeoutException.class)
    public ResponseEntity<Map<String, Object>> handleTimeout(TimeoutException ex) {
        return ResponseEntity.status(HttpStatus.GONE)
                .body(Map.of("timeout", true, "fightsSurvived", ex.getFightsSurvived()));
    }

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }

    // ── Private helpers ───────────────────────────────────────────────────

    private UUID playerUuid(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
