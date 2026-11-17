import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { Award, Medal, ShieldCheck, Trophy } from 'lucide-react';
import type { WorkerProfile } from '../types/brickjobs';
import {
  buildSafetyLeaderboard,
  type SafetyLeaderboardEntry,
  type WorkerSafetyQuizStats,
} from '../utils/safetyTips';
import { ProfileAvatar } from './ProfileAvatar';

interface SafetyLeaderboardCardProps {
  workerProfile: WorkerProfile;
  selectedRegion: string;
  safetyStats: WorkerSafetyQuizStats;
  lastPointsEarned?: number | null;
}

function getRankVisuals(rank: number): {
  label: string;
  cardClass: string;
  badgeClass: string;
  Icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
} {
  if (rank === 1) {
    return {
      label: '1º lugar',
      cardClass:
        'border-[#FCD34D] dark:border-[#92400E] bg-[#FFFBEB]/80 dark:bg-[#78350F]/20',
      badgeClass: 'text-[#B45309] dark:text-[#FCD34D]',
      Icon: Trophy,
    };
  }
  if (rank === 2) {
    return {
      label: '2º lugar',
      cardClass:
        'border-[#CBD5E1] dark:border-[#475569] bg-[#F8FAFC] dark:bg-[#0F172A]',
      badgeClass: 'text-[#475569] dark:text-[#CBD5E1]',
      Icon: Medal,
    };
  }
  return {
    label: '3º lugar',
    cardClass:
      'border-[#FDBA74] dark:border-[#9A3412] bg-[#FFF7ED]/80 dark:bg-[#7C2D12]/20',
    badgeClass: 'text-[#C2410C] dark:text-[#FDBA74]',
    Icon: Award,
  };
}

export const SafetyLeaderboardCard: React.FC<SafetyLeaderboardCardProps> = ({
  workerProfile,
  selectedRegion,
  safetyStats,
  lastPointsEarned = null,
}) => {
  const leaderboard = useMemo(
    () =>
      buildSafetyLeaderboard({
        workerName: workerProfile.nomeCompleto,
        workerRole: workerProfile.funcaoPrincipal,
        workerRegion: selectedRegion,
        stats: safetyStats,
      }),
    [
      workerProfile.nomeCompleto,
      workerProfile.funcaoPrincipal,
      selectedRegion,
      safetyStats,
    ]
  );

  const { topThree, currentUserEntry, totalParticipants, pointsToTopThree } =
    leaderboard;

  return (
    <section
      aria-labelledby="safety-leaderboard-heading"
      data-testid="safety-leaderboard-card"
      className="bg-white dark:bg-[#111827] border border-[#E5E7EB] dark:border-[#1E293B] rounded-2xl p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-[#F3F4F6] dark:border-[#1E293B]">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C93B1E] dark:text-[#F06449]">
            <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Competição saudável na obra · Rondonópolis-MT</span>
          </div>
          <h2
            id="safety-leaderboard-heading"
            className="font-display text-lg sm:text-xl font-bold text-[#111827] dark:text-[#F8FAFC] mt-1"
          >
            Top 3 em Segurança no Trabalho
          </h2>
          <p className="text-sm text-[#4B5563] dark:text-[#94A3B8] mt-1">
            Operários com maior pontuação acumulada nos mini-quizzes diários de EPIs e prevenção de acidentes.
          </p>
        </div>

        <div
          data-testid="safety-leaderboard-user-summary"
          className="px-3.5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#334155] bg-[#F9FAFB] dark:bg-[#0F172A] shrink-0 self-start text-left sm:text-right"
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#4B5563] dark:text-[#94A3B8]">
            Sua colocação
          </p>
          <p className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums">
            {currentUserEntry.rank}º lugar · {currentUserEntry.points} pts
          </p>
          {typeof lastPointsEarned === 'number' && lastPointsEarned > 0 && (
            <p className="text-[11px] font-semibold text-[#047857] dark:text-[#34D399] tabular-nums">
              +{lastPointsEarned} pts no último quiz
            </p>
          )}
        </div>
      </div>

      {/* Top 3 Podium Cards */}
      <ol
        data-testid="safety-leaderboard-top3"
        className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3.5"
      >
        {topThree.map((entry: SafetyLeaderboardEntry) => {
          const visuals = getRankVisuals(entry.rank);
          const RankIcon = visuals.Icon;
          return (
            <motion.li
              key={entry.id}
              layout
              transition={{ duration: 0.2 }}
              data-testid={`safety-leaderboard-rank-${entry.rank}`}
              className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${visuals.cardClass} ${
                entry.isCurrentUser
                  ? 'ring-2 ring-[#C93B1E]/35 dark:ring-[#F06449]/45'
                  : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <RankIcon
                    className={`w-4 h-4 shrink-0 ${visuals.badgeClass}`}
                    aria-hidden={true}
                  />
                  <span className={`text-xs font-bold ${visuals.badgeClass}`}>
                    {visuals.label}
                  </span>
                  {entry.isCurrentUser && (
                    <span
                      data-testid="safety-leaderboard-you-badge"
                      className="px-1.5 py-0.5 rounded bg-[#C93B1E] text-white text-[10px] font-bold uppercase tracking-wide"
                    >
                      Você
                    </span>
                  )}
                </div>

                <span className="font-display text-base font-bold text-[#111827] dark:text-[#F8FAFC] tabular-nums whitespace-nowrap">
                  {entry.points} pts
                </span>
              </div>

              <div className="flex items-center gap-3 min-w-0">
                <ProfileAvatar
                  name={entry.name}
                  photoUrl={entry.isCurrentUser ? workerProfile.fotoPerfilUrl : undefined}
                  entityType="worker"
                  size="sm"
                  testId={`safety-leaderboard-avatar-${entry.rank}`}
                />
                <div className="min-w-0">
                  <h3 className="font-display text-sm sm:text-base font-bold text-[#111827] dark:text-[#F8FAFC] truncate">
                    {entry.name}
                  </h3>
                  <p className="text-xs text-[#4B5563] dark:text-[#94A3B8] truncate mt-0.5">
                    {entry.role} · {entry.neighborhood}
                  </p>
                </div>
              </div>

              <div className="pt-2.5 border-t border-black/5 dark:border-white/10 flex items-center justify-between gap-2 text-xs text-[#374151] dark:text-[#CBD5E1] tabular-nums">
                <span>
                  {entry.quizzesCompleted}{' '}
                  {entry.quizzesCompleted === 1 ? 'quiz' : 'quizzes'}
                </span>
                <span className="font-semibold text-[#047857] dark:text-[#34D399]">
                  {entry.accuracyPct}% de acerto
                </span>
              </div>
            </motion.li>
          );
        })}
      </ol>

      {/* Footer Encouragement / Scoring Legend */}
      <div className="mt-4 pt-3 border-t border-[#F3F4F6] dark:border-[#1E293B] flex flex-wrap items-center justify-between gap-2 text-xs text-[#4B5563] dark:text-[#94A3B8]">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldCheck
            className="w-4 h-4 text-[#047857] dark:text-[#34D399] shrink-0"
            aria-hidden="true"
          />
          <p data-testid="safety-leaderboard-status" className="min-w-0">
            {currentUserEntry.rank <= 3
              ? `Parabéns! Você está no Top 3 (${currentUserEntry.rank}º lugar entre ${totalParticipants} operários).`
              : `Você está em ${currentUserEntry.rank}º lugar. Faltam ${pointsToTopThree} pts para entrar no Top 3.`}
          </p>
        </div>

        <span className="tabular-nums font-medium">
          +10 pts por acerto · +5 pts ao gabaritar
        </span>
      </div>
    </section>
  );
};
