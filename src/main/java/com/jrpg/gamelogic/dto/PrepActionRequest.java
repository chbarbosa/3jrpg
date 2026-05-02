package com.jrpg.gamelogic.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record PrepActionRequest(
    @NotNull UUID runUuid,
    @NotNull String heroId,
    @NotNull PrepActionType actionType,
    String itemId,
    String targetHeroId
) {}
