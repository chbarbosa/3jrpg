package com.jrpg.gamelogic.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record ActionRequest(
    @NotNull UUID runUuid,
    @NotNull ActionType actionType,
    @NotNull String actorId,
    String targetId,
    String skillId
) {}
