package com.jrpg.gamedata.model;

import java.util.List;

public record ItemData(
    String id,
    String name,
    String effect,
    List<String> usableIn,
    String classRestriction
) {}
