package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ActionRequest(
        @NotNull UUID runUuid,
        @NotNull ActionType actionType,
        @NotBlank String actorId,
        String targetId,
        String skillId,
        String spellId,
        String itemId
) {}
