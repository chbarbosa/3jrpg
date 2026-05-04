package com.jrpg.season;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.entity.Season;
import com.jrpg.entity.SeasonResult;
import com.jrpg.repository.PlayerRepository;
import com.jrpg.repository.RunRepository;
import com.jrpg.repository.SeasonResultRepository;
import com.jrpg.season.dto.LeaderboardEntryDTO;
import com.jrpg.season.dto.PlayerSeasonRankDTO;
import com.jrpg.season.dto.SeasonHistoryDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SeasonResultService {

    private final SeasonResultRepository seasonResultRepository;
    private final SeasonService seasonService;
    private final PlayerRepository playerRepository;
    private final RunRepository runRepository;
    private final ObjectMapper objectMapper;

    // ── Write path ────────────────────────────────────────────────────────

    /**
     * Called whenever a run ends. Updates the player's best result for the
     * current season if fightsSurvived exceeds the stored record.
     */
    public void updateResult(UUID playerUuid, UUID runUuid, int fightsSurvived) {
        Season season = seasonService.getCurrentSeason();
        SeasonResult result = seasonResultRepository
                .findBySeasonUuidAndPlayerUuid(season.getUuid(), playerUuid)
                .orElseGet(() -> {
                    SeasonResult r = new SeasonResult();
                    r.setSeasonUuid(season.getUuid());
                    r.setPlayerUuid(playerUuid);
                    r.setFightsSurvived(0);
                    return r;
                });

        if (fightsSurvived > result.getFightsSurvived()) {
            result.setFightsSurvived(fightsSurvived);
            result.setBestRunUuid(runUuid);
            seasonResultRepository.save(result);
            log.info("SeasonResult updated — player={}, season={}, fightsSurvived={}",
                    playerUuid, season.getName(), fightsSurvived);
        }
    }

    // ── Read path ─────────────────────────────────────────────────────────

    /**
     * Returns a ranked leaderboard page for the given season.
     * Primary sort: fightsSurvived DESC. Tiebreaker: playerUuid string ASC.
     */
    public List<LeaderboardEntryDTO> getLeaderboard(UUID seasonUuid, int page, int size) {
        Season season = seasonService.getSeasonByUuid(seasonUuid);
        log.info("Leaderboard requested for season: {}", season.getName());

        List<SeasonResult> results = seasonResultRepository.findBySeasonUuid(seasonUuid);
        results.sort(leaderboardOrder());

        List<LeaderboardEntryDTO> ranked = new ArrayList<>();
        for (int i = 0; i < results.size(); i++) {
            SeasonResult sr = results.get(i);
            var player = playerRepository.findByUuid(sr.getPlayerUuid()).orElse(null);
            if (player == null) continue;
            ranked.add(new LeaderboardEntryDTO(
                    i + 1,
                    player.getNickname(),
                    player.getAvatarId() != null ? player.getAvatarId() : "",
                    sr.getFightsSurvived(),
                    extractTeamClasses(sr.getBestRunUuid())));
        }

        int from = page * size;
        if (from >= ranked.size()) return List.of();
        return ranked.subList(from, Math.min(from + size, ranked.size()));
    }

    /**
     * Returns a list of all seasons (newest first) with the authenticated
     * player's best fightsSurvived for each. Returns 0 for seasons not played.
     */
    public List<SeasonHistoryDTO> getSeasonHistory(UUID playerUuid) {
        List<Season> allSeasons = seasonService.getAllSeasonsDesc();
        Map<UUID, Integer> playerBests = seasonResultRepository.findByPlayerUuid(playerUuid).stream()
                .collect(Collectors.toMap(SeasonResult::getSeasonUuid, SeasonResult::getFightsSurvived));

        return allSeasons.stream()
                .map(s -> new SeasonHistoryDTO(
                        s.getUuid(), s.getName(), s.getStartDate(), s.getEndDate(),
                        playerBests.getOrDefault(s.getUuid(), 0)))
                .collect(Collectors.toList());
    }

    /**
     * Returns the authenticated player's rank within the current season.
     * Returns rank=0, fightsSurvived=0 if the player has no result this season.
     */
    public PlayerSeasonRankDTO getPlayerSeasonRank(UUID playerUuid) {
        Season season = seasonService.getCurrentSeason();
        List<SeasonResult> results = seasonResultRepository.findBySeasonUuid(season.getUuid());
        results.sort(leaderboardOrder());

        for (int i = 0; i < results.size(); i++) {
            if (results.get(i).getPlayerUuid().equals(playerUuid)) {
                return new PlayerSeasonRankDTO(i + 1, results.get(i).getFightsSurvived(), results.size());
            }
        }
        return new PlayerSeasonRankDTO(0, 0, results.size());
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Comparator<SeasonResult> leaderboardOrder() {
        return Comparator
                .comparingInt(SeasonResult::getFightsSurvived).reversed()
                .thenComparing(r -> r.getPlayerUuid().toString());
    }

    private List<String> extractTeamClasses(UUID bestRunUuid) {
        if (bestRunUuid == null) return List.of();
        return runRepository.findByUuid(bestRunUuid)
                .map(run -> {
                    String snapshot = run.getTeamSnapshot();
                    if (snapshot == null || snapshot.isBlank()) return List.<String>of();
                    try {
                        JsonNode root = objectMapper.readTree(snapshot);
                        JsonNode heroes = root.path("heroes");
                        if (!heroes.isArray()) return List.<String>of();
                        List<String> classes = new ArrayList<>();
                        for (JsonNode hero : heroes) {
                            String classId = hero.path("classId").asText(null);
                            if (classId != null && !classId.isBlank()) classes.add(classId);
                        }
                        return List.copyOf(classes);
                    } catch (Exception e) {
                        log.warn("Failed to parse team snapshot for run {}: {}", bestRunUuid, e.getMessage());
                        return List.<String>of();
                    }
                })
                .orElse(List.of());
    }
}
