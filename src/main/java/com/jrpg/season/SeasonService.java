package com.jrpg.season;

import com.jrpg.entity.Season;
import com.jrpg.repository.SeasonRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class SeasonService implements ApplicationRunner {

    private final SeasonRepository seasonRepository;

    // ── ApplicationRunner ─────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        ensureCurrentSeasonExists();
    }

    /**
     * Guarantees the current season record exists in the database.
     * Called automatically at startup; safe to call again at any time.
     */
    public void ensureCurrentSeasonExists() {
        Season season = getCurrentSeason();
        log.info("Current season: {}", season.getName());
    }

    // ── Public API ────────────────────────────────────────────────────────

    /**
     * Returns the season whose date range contains today.
     * Auto-creates the record from the calendar rules if it does not exist yet.
     */
    public Season getCurrentSeason() {
        LocalDate today = LocalDate.now();
        return seasonRepository
                .findByStartDateLessThanEqualAndEndDateGreaterThanEqual(today, today)
                .orElseGet(() -> {
                    Season s = buildSeasonForDate(today);
                    Season saved = seasonRepository.save(s);
                    log.info("Created season: {} ({} – {})", saved.getName(), saved.getStartDate(), saved.getEndDate());
                    return saved;
                });
    }

    /** Finds a season by UUID; throws 404 if not found. */
    public Season getSeasonByUuid(UUID uuid) {
        return seasonRepository.findByUuid(uuid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Season not found"));
    }

    /** Returns all seasons ordered by startDate descending. */
    public List<Season> getAllSeasonsDesc() {
        return seasonRepository.findAllByOrderByStartDateDesc();
    }

    // ── Season calendar logic ─────────────────────────────────────────────

    /**
     * Derives season name and date boundaries from a calendar date:
     *
     *   Winter  — December(Y)–February(Y+1):  name "Winter Y"
     *   Spring  — March–May:                  name "Spring Y"
     *   Summer  — June–August:                name "Summer Y"
     *   Autumn  — September–November:         name "Autumn Y"
     *
     * January/February of year Y belong to "Winter (Y-1)".
     */
    private Season buildSeasonForDate(LocalDate date) {
        int month = date.getMonthValue();
        int year  = date.getYear();

        String name;
        LocalDate startDate;
        LocalDate endDate;

        if (month == 12) {
            name      = "Winter " + year;
            startDate = LocalDate.of(year, 12, 1);
            endDate   = LocalDate.of(year + 1, 2, YearMonth.of(year + 1, 2).lengthOfMonth());
        } else if (month <= 2) {
            int winterYear = year - 1;
            name      = "Winter " + winterYear;
            startDate = LocalDate.of(winterYear, 12, 1);
            endDate   = LocalDate.of(year, 2, YearMonth.of(year, 2).lengthOfMonth());
        } else if (month <= 5) {
            name      = "Spring " + year;
            startDate = LocalDate.of(year, 3, 1);
            endDate   = LocalDate.of(year, 5, 31);
        } else if (month <= 8) {
            name      = "Summer " + year;
            startDate = LocalDate.of(year, 6, 1);
            endDate   = LocalDate.of(year, 8, 31);
        } else {
            name      = "Autumn " + year;
            startDate = LocalDate.of(year, 9, 1);
            endDate   = LocalDate.of(year, 11, 30);
        }

        Season s = new Season();
        s.setName(name);
        s.setStartDate(startDate);
        s.setEndDate(endDate);
        return s;
    }
}
