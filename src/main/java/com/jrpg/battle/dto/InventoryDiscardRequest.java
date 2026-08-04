package com.jrpg.battle.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record InventoryDiscardRequest(
        @NotNull UUID runUuid,
        @NotBlank String heroId,
        @NotBlank String itemUuid
) {}
