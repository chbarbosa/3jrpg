package com.jrpg.player.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record ProfileResponse(
        UUID playerUuid,
        String nickname,
        String avatarId,
        LocalDateTime createdAt,
        int totalRuns,
        int bestRunFightsSurvived,
        List<String> bestRunTeamSummary,
        int currentSeasonRank,
        int currentSeasonFightsSurvived
) {}
