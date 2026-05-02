package com.jrpg.gamelogic.dto;

import java.util.List;

public record LootItemDTO(
    String itemType,
    String name,
    String quality,
    List<String> modifiers,
    String description
) {}
