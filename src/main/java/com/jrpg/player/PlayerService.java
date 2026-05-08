package com.jrpg.player;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.entity.Player;
import com.jrpg.entity.Run;
import com.jrpg.player.dto.AvatarOption;
import com.jrpg.player.dto.ProfileResponse;
import com.jrpg.player.dto.UpdateProfileRequest;
import com.jrpg.repository.PlayerRepository;
import com.jrpg.repository.RunRepository;
import com.jrpg.season.SeasonResultService;
import com.jrpg.season.dto.PlayerSeasonRankDTO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class PlayerService {

    static final List<AvatarOption> AVATARS = List.of(
            new AvatarOption("warrior",  "Warrior"),
            new AvatarOption("ranger",   "Ranger"),
            new AvatarOption("mage",     "Mage"),
            new AvatarOption("cleric",   "Cleric"),
            new AvatarOption("goblin",   "Goblin"),
            new AvatarOption("dragon",   "Dragon"),
            new AvatarOption("robo",     "Robo"),
            new AvatarOption("skeleton", "Skeleton"),
            new AvatarOption("wolf",     "Wolf"),
            new AvatarOption("troll",    "Troll")
    );

    private static final Set<String> VALID_AVATAR_IDS = AVATARS.stream()
            .map(AvatarOption::id)
            .collect(Collectors.toUnmodifiableSet());

    private final PlayerRepository playerRepository;
    private final RunRepository runRepository;
    private final SeasonResultService seasonResultService;
    private final ObjectMapper objectMapper;

    public ProfileResponse getProfile(UUID playerUuid) {
        Player player = requirePlayer(playerUuid);

        int totalRuns = runRepository.findByPlayerUuid(playerUuid).size();
        Optional<Run> bestRun = runRepository.findTopByPlayerUuidOrderByFightsSurvivedDesc(playerUuid);
        int bestFights = bestRun.map(Run::getFightsSurvived).orElse(0);
        List<String> teamSummary = bestRun.map(r -> extractHeroClasses(r.getTeamSnapshot())).orElse(List.of());

        PlayerSeasonRankDTO rank = seasonResultService.getPlayerSeasonRank(playerUuid);

        return toResponse(player, totalRuns, bestFights, teamSummary, rank);
    }

    public ProfileResponse updateProfile(UUID playerUuid, UpdateProfileRequest request) {
        if (request.nickname() == null && request.avatarId() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "At least one field must be provided");
        }

        Player player = requirePlayer(playerUuid);

        if (request.nickname() != null) {
            player.setNickname(request.nickname());
        }

        if (request.avatarId() != null) {
            if (!VALID_AVATAR_IDS.contains(request.avatarId())) {
                log.warn("Invalid avatarId '{}' attempted by player {}", request.avatarId(), playerUuid);
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Invalid avatar id: " + request.avatarId());
            }
            player.setAvatarId(request.avatarId());
        }

        playerRepository.save(player);
        log.info("Profile updated for player: {}", player.getNickname());
        return getProfile(playerUuid);
    }

    public List<AvatarOption> getAvailableAvatars() {
        return AVATARS;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private Player requirePlayer(UUID playerUuid) {
        return playerRepository.findByUuid(playerUuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Player not found"));
    }

    private ProfileResponse toResponse(Player player, int totalRuns, int bestFights,
                                        List<String> teamSummary, PlayerSeasonRankDTO rank) {
        return new ProfileResponse(
                player.getUuid(),
                player.getNickname(),
                player.getAvatarId() != null ? player.getAvatarId() : "warrior",
                player.getCreatedAt(),
                totalRuns,
                bestFights,
                teamSummary,
                rank.rank(),
                rank.fightsSurvived());
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
            log.warn("Failed to parse team snapshot: {}", e.getMessage());
            return List.of();
        }
    }
}
