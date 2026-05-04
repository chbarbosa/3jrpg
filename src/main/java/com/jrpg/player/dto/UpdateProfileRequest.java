package com.jrpg.player.dto;

import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 3, max = 30) String nickname,
        String avatarId
) {}
