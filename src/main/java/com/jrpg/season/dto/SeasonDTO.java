package com.jrpg.season.dto;

import java.time.LocalDate;
import java.util.UUID;

public record SeasonDTO(UUID uuid, String name, LocalDate startDate, LocalDate endDate) {}
