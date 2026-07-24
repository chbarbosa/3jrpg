package com.jrpg.battle.dto;

import java.util.List;

public record PrepResultResponse(
        List<HeroStateDTO> heroes,
        List<String> regenLog,
        LootItemDTO lootItem,
        List<LootItemDTO> lootItems,
        List<HeroStateDTO> autoRevivedHeroes
) {}
