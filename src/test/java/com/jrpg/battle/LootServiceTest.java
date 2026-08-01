package com.jrpg.battle;

import org.junit.jupiter.api.Test;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

class LootServiceTest {

    private final LootService lootService = new LootService(null);

    @Test
    void pickModifiers_forRareLootDoesNotDuplicateModifiers() {
        String[] pool = {"Strong", "Warded"};

        for (int i = 0; i < 20; i++) {
            List<String> modifiers = lootService.pickModifiers("RARE", pool);

            assertEquals(2, modifiers.size());
            assertEquals(2, new HashSet<>(modifiers).size());
        }
    }
}
