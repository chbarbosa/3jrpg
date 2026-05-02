package com.jrpg.gamelogic.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record GiveUpRequest(@NotNull UUID runUuid) {}
