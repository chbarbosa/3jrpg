package com.jrpg.gamelogic.dto;

import java.util.List;

public record PrepResultResponse(
    List<RegenDTO> regenResults,
    LootItemDTO lootDrop,
    int prepActionsRemaining
) {}
