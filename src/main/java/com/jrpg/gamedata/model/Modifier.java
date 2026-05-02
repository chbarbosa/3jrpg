package com.jrpg.gamedata.model;

import java.util.List;

public record Modifier(
    String id,
    String prefix,
    String bonus,
    int bonusValue,
    List<String> availableOn
) {}
