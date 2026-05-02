package com.jrpg.gamelogic;

import com.jrpg.gamelogic.dto.*;
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
@RequestMapping("/api/run")
@RequiredArgsConstructor
public class RunController {

    private final GameLogicService gameLogicService;

    @PostMapping("/start")
    public ResponseEntity<BattleStateResponse> startRun(
            @Valid @RequestBody StartRunRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.startRun(playerUuid, request));
    }

    @PostMapping("/action")
    public ResponseEntity<ActionResultResponse> action(
            @Valid @RequestBody ActionRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.processAction(playerUuid, request));
    }

    @PostMapping("/fight/next")
    public ResponseEntity<BattleStateResponse> nextFight(
            @RequestParam UUID runUuid,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.nextFight(playerUuid, runUuid));
    }

    @PostMapping("/prep")
    public ResponseEntity<PrepResultResponse> startPrep(
            @RequestParam UUID runUuid,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.startPrep(playerUuid, runUuid));
    }

    @PostMapping("/prep/assign-loot")
    public ResponseEntity<List<HeroStateDTO>> assignLoot(
            @Valid @RequestBody LootAssignRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.assignLoot(playerUuid, request));
    }

    @PostMapping("/prep/action")
    public ResponseEntity<List<HeroStateDTO>> prepAction(
            @Valid @RequestBody PrepActionRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.processPrepAction(playerUuid, request));
    }

    @PostMapping("/giveup")
    public ResponseEntity<Map<String, Object>> giveUp(
            @Valid @RequestBody GiveUpRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.giveUp(playerUuid, request));
    }

    @PostMapping("/restart")
    public ResponseEntity<BattleStateResponse> restart(
            @Valid @RequestBody RestartRequest request,
            Authentication auth) {
        UUID playerUuid = UUID.fromString(auth.getName());
        return ResponseEntity.ok(gameLogicService.restart(playerUuid, request));
    }

    // Handle 410 Gone for session timeout (service throws 410 with JSON body in message)
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Object> handleStatusException(ResponseStatusException ex) {
        if (ex.getStatusCode() == HttpStatus.GONE) {
            try {
                // Parse the JSON message embedded in the exception
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Object body = mapper.readValue(ex.getReason(), Object.class);
                return ResponseEntity.status(HttpStatus.GONE).body(body);
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.GONE).body(Map.of("timeout", true));
            }
        }
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }
}
