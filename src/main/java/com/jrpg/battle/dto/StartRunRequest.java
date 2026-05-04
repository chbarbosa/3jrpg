package com.jrpg.battle.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;

public record StartRunRequest(
        @Valid @Size(min = 3, max = 3, message = "Team must have exactly 3 heroes")
        List<HeroConfigDTO> heroes
) {}
