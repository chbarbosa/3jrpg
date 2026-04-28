package com.jrpg.dto;

import java.util.UUID;

public record AuthResponse(String token, String nickname, String avatarId, UUID playerUuid) {}
