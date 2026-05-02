package com.jrpg.gamedata.model;

import java.util.List;

public record AugmentationType(
    String id,
    String name,
    List<String> availableTo,
    List<AugmentationAdvantage> advantages,
    String tradeoff
) {}
