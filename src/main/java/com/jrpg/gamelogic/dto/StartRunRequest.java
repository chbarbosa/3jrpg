package com.jrpg.gamelogic.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StartRunRequest(
    @NotNull @Size(min = 3, max = 3) @Valid List<HeroConfig> team
) {}
