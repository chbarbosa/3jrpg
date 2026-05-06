import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { theme } from '../styles/theme';
import { useAuth } from '../hooks/useAuth.jsx';
import { getCurrentSeason, getLeaderboard, getPlayerSeasonRank, getSeasonHistory, getActiveRun } from '../services/api';
import SeasonHeader from '../components/season/SeasonHeader';
import LeaderboardTable from '../components/season/LeaderboardTable';
import PlayerRankBanner from '../components/season/PlayerRankBanner';
import SeasonHistoryList from '../components/season/SeasonHistoryList';

const PAGE_SIZE = 20;

export default function SeasonPage() {
  const { player } = useAuth();
  const navigate = useNavigate();

  const [season, setSeason] = useState(null);
  const [entries, setEntries] = useState([]);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [rankData, setRankData] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeRun, setActiveRun] = useState(null);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [seasonData, leaderboardData, rankResult, historyData, runData] = await Promise.allSettled([
          getCurrentSeason(),
          getLeaderboard(0, PAGE_SIZE),
          getPlayerSeasonRank(),
          getSeasonHistory(),
          getActiveRun(),
        ]);

        if (cancelled) return;

        if (seasonData.status === 'fulfilled') setSeason(seasonData.value);
        if (leaderboardData.status === 'fulfilled') {
          const list = Array.isArray(leaderboardData.value) ? leaderboardData.value : [];
          setEntries(list);
          setHasNextPage(list.length === PAGE_SIZE);
        }
        if (rankResult.status === 'fulfilled') setRankData(rankResult.value);
        if (historyData.status === 'fulfilled') {
          const list = Array.isArray(historyData.value) ? historyData.value : [];
          setHistory(list);
        }
        if (runData.status === 'fulfilled' && runData.value) setActiveRun(runData.value);
      } catch (err) {
        if (!cancelled) setError('Failed to load season data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  async function loadPage(newPage) {
    setPageLoading(true);
    try {
      const list = await getLeaderboard(newPage, PAGE_SIZE);
      const arr = Array.isArray(list) ? list : [];
      setEntries(arr);
      setHasNextPage(arr.length === PAGE_SIZE);
      setPage(newPage);
    } catch {
      // keep current page on error
    } finally {
      setPageLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="page-centered">
        <div className="loading-text">Loading season data…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-centered">
        <div className="loading-text" style={{ color: theme.colors.barHP }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="page-centered">
      <div className="page-content-wide">
        {/* Active run banner */}
        {activeRun && (
          <div className="active-run-banner">
            <div className="active-run-banner-msg">
              You have an active run in progress!
            </div>
            <button
              className="btn-return-to-battle"
              onClick={() => navigate('/battle', { state: { runState: activeRun } })}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.colors.actionHover; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = theme.colors.borderGold; }}
            >
              Return to Battle
            </button>
          </div>
        )}

        {/* Season header */}
        <SeasonHeader season={season} />

        {/* Player rank */}
        {rankData && <PlayerRankBanner rankData={rankData} />}

        {/* Leaderboard */}
        <div>
          <div className="season-section-title">Leaderboard</div>
          <div style={{ opacity: pageLoading ? 0.5 : 1, transition: `opacity ${theme.transitions.normal}` }}>
            <LeaderboardTable
              entries={entries}
              page={page}
              hasNextPage={hasNextPage}
              onPrev={() => { if (page > 0) loadPage(page - 1); }}
              onNext={() => { if (hasNextPage) loadPage(page + 1); }}
              currentPlayerNickname={player?.nickname ?? null}
            />
          </div>
        </div>

        {/* Season history */}
        {(history.length > 0 || season) && (
          <div>
            <div className="season-section-title">Past Seasons</div>
            <SeasonHistoryList
              history={history}
              currentSeason={season}
              currentPlayerFightsSurvived={rankData?.fightsSurvived ?? null}
            />
          </div>
        )}
      </div>
    </div>
  );
}
