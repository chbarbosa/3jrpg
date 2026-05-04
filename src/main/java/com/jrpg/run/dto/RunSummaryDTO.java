package com.jrpg.run.dto;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record RunSummaryDTO(
        UUID uuid,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        int fightsSurvived,
        String endReason,
        List<String> heroClasses
) {}
