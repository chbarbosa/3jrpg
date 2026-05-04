package com.jrpg.run.dto;

import java.time.LocalDateTime;

public record RunEventDTO(
        String eventType,
        String payload,
        LocalDateTime occurredAt
) {}
