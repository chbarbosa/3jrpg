package com.jrpg.season.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SeasonHistoryDTO(
        UUID uuid,
        String name,
        LocalDate startDate,
        LocalDate endDate,
        int playerBestFightsSurvived
) {}
