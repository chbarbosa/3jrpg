package com.jrpg.run;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.entity.EndReason;
import com.jrpg.entity.Run;
import com.jrpg.repository.RunRepository;
import com.jrpg.run.dto.RunSummaryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class RunService {

    private final RunRepository runRepository;
    private final ObjectMapper objectMapper;

    /** Returns the open run for a player, or empty if none exists. */
    public Optional<Run> findActiveRun(UUID playerUuid) {
        return runRepository.findByPlayerUuidAndEndedAtIsNull(playerUuid);
    }

    /** Finds an open run by UUID, throws 404 if not found or already ended. */
    public Run getActiveRunByUuid(UUID runUuid) {
        return runRepository.findByUuid(runUuid)
                .filter(r -> r.getEndedAt() == null)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Active run not found"));
    }

    /** Finds any run by UUID regardless of state, throws 404 if missing. */
    public Run getRunByUuid(UUID runUuid) {
        return runRepository.findByUuid(runUuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Run not found"));
    }

    /** Closes a run with the given end reason and persists it. */
    public void closeRun(Run run, EndReason reason) {
        run.setEndReason(reason);
        run.setEndedAt(LocalDateTime.now());
        runRepository.save(run);
        log.info("Run {} closed — reason={}, fightsSurvived={}", run.getUuid(), reason, run.getFightsSurvived());
    }

    /** Returns true if the run's lastActionAt is more than 1 hour ago. */
    public boolean isTimedOut(Run run) {
        return run.getLastActionAt() != null
                && run.getLastActionAt().isBefore(LocalDateTime.now().minusHours(1));
    }

    /** Updates lastActionAt to now and saves. */
    public void touchRun(Run run) {
        run.setLastActionAt(LocalDateTime.now());
        runRepository.save(run);
    }

    /** Returns the run with the highest fightsSurvived for this player across all time. */
    public Optional<Run> getBestRun(UUID playerUuid) {
        return runRepository.findTopByPlayerUuidOrderByFightsSurvivedDesc(playerUuid);
    }

    /** Returns paginated closed runs for this player, newest first. */
    public Page<RunSummaryDTO> getRunHistory(UUID playerUuid, Pageable pageable) {
        return runRepository
                .findByPlayerUuidAndEndedAtIsNotNullOrderByStartedAtDesc(playerUuid, pageable)
                .map(this::toSummaryDTO);
    }

    /** Throws 403 if the run does not belong to the given player. */
    public void validateOwner(Run run, UUID playerUuid) {
        if (!run.getPlayerUuid().equals(playerUuid)) {
            log.warn("Player {} attempted to access run {} owned by {}",
                    playerUuid, run.getUuid(), run.getPlayerUuid());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your run");
        }
    }

    private RunSummaryDTO toSummaryDTO(Run run) {
        return new RunSummaryDTO(
                run.getUuid(),
                run.getStartedAt(),
                run.getEndedAt(),
                run.getFightsSurvived(),
                run.getEndReason() != null ? run.getEndReason().name() : null,
                extractHeroClasses(run.getTeamSnapshot())
        );
    }

    private List<String> extractHeroClasses(String teamSnapshot) {
        if (teamSnapshot == null || teamSnapshot.isBlank()) return List.of();
        try {
            JsonNode root = objectMapper.readTree(teamSnapshot);
            JsonNode heroes = root.path("heroes");
            if (!heroes.isArray()) return List.of();
            List<String> classes = new ArrayList<>();
            for (JsonNode hero : heroes) {
                String classId = hero.path("classId").asText(null);
                if (classId != null && !classId.isBlank()) classes.add(classId);
            }
            return List.copyOf(classes);
        } catch (Exception e) {
            log.warn("Failed to extract hero classes from snapshot: {}", e.getMessage());
            return List.of();
        }
    }
}
