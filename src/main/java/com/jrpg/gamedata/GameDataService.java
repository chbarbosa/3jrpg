package com.jrpg.gamedata;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jrpg.gamedata.model.*;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class GameDataService {

    private final GameDataEntryRepository repository;
    private final ObjectMapper objectMapper;

    // In-memory maps populated once at startup.
    // To update: update the DB row payload, then restart
    // (or in a future production version, receive a cache-invalidation event).
    private Map<String, ClassData>  classes;
    private Map<String, EnemyData>  enemies;
    private Map<String, WeaponType> weapons;
    private Map<String, SpellData>  spells;
    private Map<String, ItemData>   items;

    @PostConstruct
    void init() {
        seedIfEmpty();
        classes = index(load("classes",  new TypeReference<List<ClassData>>()  {}), ClassData::id);
        enemies = index(load("enemies",  new TypeReference<List<EnemyData>>()  {}), EnemyData::id);
        weapons = index(load("weapons",  new TypeReference<List<WeaponType>>() {}), WeaponType::id);
        spells  = index(load("spells",   new TypeReference<List<SpellData>>()  {}), SpellData::id);
        items   = index(load("items",    new TypeReference<List<ItemData>>()   {}), ItemData::id);
        log.info("Game data loaded — {} classes, {} enemies, {} weapons, {} spells, {} items",
                classes.size(), enemies.size(), weapons.size(), spells.size(), items.size());
    }

    private void seedIfEmpty() {
        List<String> keys = List.of(
                "classes", "weapons", "spells", "items", "enemies",
                "armor-tiers", "armor-qualities", "modifiers", "augmentations", "status-effects");
        for (String key : keys) {
            if (!repository.existsByDataKey(key)) {
                GameDataEntry entry = new GameDataEntry();
                entry.setDataKey(key);
                entry.setPayload(readResource(key + ".json"));
                repository.save(entry);
                log.info("Seeded game data: {}", key);
            }
        }
    }

    private String readResource(String filename) {
        try (InputStream is = getClass().getResourceAsStream("/gamedata/" + filename)) {
            if (is == null) throw new IllegalStateException("Resource not found: /gamedata/" + filename);
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot load game data seed: " + filename, e);
        }
    }

    private <T> List<T> load(String key, TypeReference<List<T>> type) {
        GameDataEntry entry = repository.findByDataKey(key)
                .orElseThrow(() -> new IllegalStateException("Missing game data entry: " + key));
        try {
            return objectMapper.readValue(entry.getPayload(), type);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to parse game data: " + key, e);
        }
    }

    private <T> Map<String, T> index(List<T> list, Function<T, String> keyFn) {
        LinkedHashMap<String, T> map = new LinkedHashMap<>();
        list.forEach(item -> map.put(keyFn.apply(item), item));
        return Collections.unmodifiableMap(map);
    }

    // ── Lookups ───────────────────────────────────────────────────────────────────

    public Optional<ClassData>  findClass(String id)  { return Optional.ofNullable(classes.get(id)); }
    public Set<String>          allClassIds()          { return classes.keySet(); }
    public List<ClassData>      allClasses()           { return List.copyOf(classes.values()); }

    public Optional<WeaponType> findWeapon(String id)  { return Optional.ofNullable(weapons.get(id)); }

    public Optional<EnemyData>  findEnemy(String id)   { return Optional.ofNullable(enemies.get(id)); }

    public Optional<SpellData>  findSpell(String id)   { return Optional.ofNullable(spells.get(id)); }

    public Optional<ItemData>   findItem(String id)    { return Optional.ofNullable(items.get(id)); }
    public List<String>         allItemIds()            { return List.copyOf(items.keySet()); }

    public Optional<SkillData> findSkill(String weaponId, String skillId) {
        return findWeapon(weaponId)
                .flatMap(w -> w.skills().stream().filter(s -> s.id().equals(skillId)).findFirst());
    }

    /** Active enemy pool for a given monster cap: attributeSum in (cap-10, cap]. */
    public List<EnemyData> enemyPool(int cap) {
        int lo = cap - 10;
        List<EnemyData> pool = enemies.values().stream()
                .filter(e -> e.attributeSum() > lo && e.attributeSum() <= cap)
                .collect(Collectors.toList());
        if (pool.size() < 2) {
            int loFallback = lo - 10;
            pool = enemies.values().stream()
                    .filter(e -> e.attributeSum() > loFallback && e.attributeSum() <= cap)
                    .collect(Collectors.toList());
        }
        return pool;
    }
}
