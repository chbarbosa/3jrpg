package com.jrpg.season;

import com.jrpg.entity.Season;
import com.jrpg.season.dto.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class SeasonController {

    private final SeasonService seasonService;
    private final SeasonResultService seasonResultService;

    // ── Season info ───────────────────────────────────────────────────────

    @GetMapping("/api/season/current")
    public ResponseEntity<SeasonDTO> getCurrent() {
        Season s = seasonService.getCurrentSeason();
        return ResponseEntity.ok(toDTO(s));
    }

    @GetMapping("/api/season/history")
    public ResponseEntity<List<SeasonHistoryDTO>> getHistory(Authentication auth) {
        return ResponseEntity.ok(seasonResultService.getSeasonHistory(playerUuid(auth)));
    }

    // ── Leaderboard ───────────────────────────────────────────────────────

    @GetMapping("/api/season/leaderboard")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboard(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Season current = seasonService.getCurrentSeason();
        return ResponseEntity.ok(seasonResultService.getLeaderboard(current.getUuid(), page, size));
    }

    @GetMapping("/api/season/leaderboard/{seasonUuid}")
    public ResponseEntity<List<LeaderboardEntryDTO>> getLeaderboardForSeason(
            @PathVariable UUID seasonUuid,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(seasonResultService.getLeaderboard(seasonUuid, page, size));
    }

    // ── Player rank ───────────────────────────────────────────────────────

    @GetMapping("/api/player/season-rank")
    public ResponseEntity<PlayerSeasonRankDTO> getPlayerRank(Authentication auth) {
        return ResponseEntity.ok(seasonResultService.getPlayerSeasonRank(playerUuid(auth)));
    }

    // ── Exception handler ─────────────────────────────────────────────────

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleStatus(ResponseStatusException ex) {
        return ResponseEntity.status(ex.getStatusCode())
                .body(Map.of("error", ex.getReason() != null ? ex.getReason() : ex.getMessage()));
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private SeasonDTO toDTO(Season s) {
        return new SeasonDTO(s.getUuid(), s.getName(), s.getStartDate(), s.getEndDate());
    }

    private UUID playerUuid(Authentication auth) {
        return UUID.fromString(auth.getName());
    }
}
