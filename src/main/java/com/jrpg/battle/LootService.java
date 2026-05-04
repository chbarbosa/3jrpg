package com.jrpg.battle;

import com.jrpg.battle.dto.LootItemDTO;
import com.jrpg.gamedata.GameData;
import com.jrpg.gamedata.GameDataService;
import com.jrpg.gamedata.model.ItemData;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class LootService {

    private static final String[] MODIFIER_NAMES = {
        "Strong", "Swift", "Wise", "Tough", "Quick", "Enduring", "Sharp", "Warded"
    };

    private final GameDataService gameDataService;

    public LootItemDTO generateLootDrop(int monsterCap) {
        List<String> qualityPool = GameData.lootQualityPool(monsterCap);
        String quality = qualityPool.get(ThreadLocalRandom.current().nextInt(qualityPool.size()));

        List<String> allItems = gameDataService.allItemIds();
        String itemId = allItems.get(ThreadLocalRandom.current().nextInt(allItems.size()));
        ItemData item = gameDataService.findItem(itemId).orElseThrow();

        List<String> modifiers = new ArrayList<>();
        if ("MAGIC".equals(quality)) {
            modifiers.add(randomModifier());
        } else if ("RARE".equals(quality)) {
            modifiers.add(randomModifier());
            modifiers.add(randomModifier());
        }

        String prefix = modifiers.isEmpty() ? "" : modifiers.get(0) + " ";
        return new LootItemDTO(prefix + item.name(), quality, item.effect(), List.copyOf(modifiers));
    }

    private String randomModifier() {
        return MODIFIER_NAMES[ThreadLocalRandom.current().nextInt(MODIFIER_NAMES.length)];
    }
}
