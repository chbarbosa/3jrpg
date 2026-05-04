package com.jrpg.battle.dto;

import java.util.List;

public record LootItemDTO(String name, String quality, String description, List<String> modifiers) {}
