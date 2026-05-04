package com.jrpg.season.dto;

import java.util.List;

public record LeaderboardEntryDTO(
        int rank,
        String nickname,
        String avatarId,
        int fightsSurvived,
        List<String> teamSummary
) {}
