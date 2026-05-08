package com.jrpg.battle.dto;

import java.util.List;

public record ItemSummaryDTO(String id, String name, String itemType,
                              String uuid, String quality, List<String> modifiers, String description) {}
