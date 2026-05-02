package com.jrpg.gamelogic.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record LootAssignRequest(
    @NotNull UUID runUuid,
    @NotNull String recipientHeroId,
    @NotNull LootItemDTO lootItem
) {}
