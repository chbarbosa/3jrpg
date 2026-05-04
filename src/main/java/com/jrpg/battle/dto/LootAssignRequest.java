package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LootAssignRequest(
        @NotNull UUID runUuid,
        @NotBlank String recipientHeroId
) {}
