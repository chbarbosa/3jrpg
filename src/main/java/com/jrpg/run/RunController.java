package com.jrpg.run;

import com.jrpg.battle.BattleService;
import com.jrpg.battle.dto.BattleStateResponse;
import com.jrpg.entity.Run;
import com.jrpg.run.dto.RunEventDTO;
import com.jrpg.run.dto.RunSummaryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@Slf4j
@RequiredArgsConstructor
public class RunController {

    private final RunService runService;
    private final RunEventService runEventService;
    private final BattleService battleService;

    /**
     * Returns the current active run as a BattleStateResponse so the frontend
     * can resume an interrupted battle after a page reload. Returns 204 if the
     * player has no active run.
     */
    @GetMapping("/api/run/active")
    public ResponseEntity<BattleStateResponse> getActive(Authentication auth) {
        return battleService.getActiveRunState(playerUuid(auth))
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.noContent().build());
    }

    /**
     * Returns a paginated run history for the authenticated player (page size 10,
     * newest first). Each entry contains a class-name-only summary of the team.
     */
    @GetMapping("/api/run/history")
    public ResponseEntity<Page<RunSummaryDTO>> getHistory(
            @RequestParam(defaultValue = "0") int page,
            Authentication auth) {
        return ResponseEntity.ok(
                runService.getRunHistory(playerUuid(auth), PageRequest.of(page, 10)));
    }

    /**
     * Returns the full event log for a completed run owned by the authenticated
     * player. 404 if the run does not exist; 403 if it belongs to another player.
     */
    @GetMapping("/api/run/{runUuid}/events")
    public ResponseEntity<List<RunEventDTO>> getEvents(
            @PathVariable UUID runUuid,
            Authentication auth) {
        UUID player = playerUuid(auth);
        Run run = runService.getRunByUuid(runUuid);
        if (!run.getPlayerUuid().equals(player)) {
            log.warn("Player {} attempted to read events for run {} owned by {}",
                    player, runUuid, run.getPlayerUuid());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your run");
        }
        List<RunEventDTO> events = runEventService.getEventsForRun(runUuid).stream()
                .map(e -> new RunEventDTO(e.getEventType(), e.getPayload(), e.getOccurredAt()))
                .toList();
        return ResponseEntity.ok(events);
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
