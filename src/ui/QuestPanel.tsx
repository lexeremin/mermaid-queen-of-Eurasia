import { useState } from 'react';
import { ITEMS } from '@/data/items';
import { NPCS } from '@/data/npcs';
import { QUESTS, RANKS, type QuestDef } from '@/data/quests';
import { acceptQuestAction, claimQuestAction, worldView } from '@/game/quest-actions';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';
import { useProgressStore } from '@/store/progress-store';
import { useQuestStore } from '@/store/quest-store';
import {
  objectiveStates,
  rankIndex,
  rankName,
  reputation,
  statusOf,
  type QuestProgress,
  type QuestStatus,
} from '@/systems/quests';

type Tab = 'quests' | 'kingdom';

const ORDER: QuestStatus[] = ['ready', 'active', 'available', 'locked'];
const EMPTY: QuestProgress = { counts: [], visited: [] };

function rewardText(def: QuestDef): string {
  const parts = [`${def.reward.xp} XP`, `${def.reward.rep} rep`];
  for (const item of def.reward.items ?? [])
    parts.push(item.qty > 1 ? `${ITEMS[item.id].name} x${item.qty}` : ITEMS[item.id].name);
  return parts.join(' · ');
}

export function QuestPanel() {
  const mode = useGameStore((s) => s.questPanel);
  const close = useGameStore((s) => s.closeQuestPanel);
  const log = useQuestStore((s) => s.log);
  useProgressStore((s) => s.bag);
  useProgressStore((s) => s.level);
  const npcs = useNpcStore((s) => s.npcs);
  const [tab, setTab] = useState<Tab>('quests');
  if (!mode) return null;

  const view = worldView();
  const rep = reputation(log, view.joinedCount);
  const rank = rankIndex(rep);
  const nextRank = RANKS[rank + 1];
  const atBoard = mode === 'board';

  const entries = QUESTS.map((def) => ({ def, status: statusOf(def, log, view, rank) }));
  const shown = ORDER.flatMap((status) => entries.filter((e) => e.status === status));
  const done = entries.filter((e) => e.status === 'completed');
  const subjects = NPCS.filter((n) => npcs[n.id]?.joined);

  return (
    <div className="overlay">
      <div
        className="panel quests"
        role="dialog"
        aria-label={atBoard ? 'Notice board' : 'Quest log'}
      >
        <div className="inv-head">
          <h2>{atBoard ? 'Notice Board' : 'Quest Log'}</h2>
          <span className="inv-level">{rankName(rank)}</span>
        </div>

        <div className="tabs" role="tablist">
          {(['quests', 'kingdom'] as const).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              className="tab"
              data-active={tab === t ? '1' : '0'}
              onClick={() => setTab(t)}
            >
              {t === 'quests' ? 'Quests' : 'Kingdom'}
            </button>
          ))}
        </div>

        <div className="quest-scroll">
          {tab === 'quests' && (
            <>
              {!atBoard && (
                <p className="hint">Accept and claim quests at the notice board in the square.</p>
              )}
              {shown.map(({ def, status }) => {
                const progress = log.active[def.id] ?? EMPTY;
                const states = objectiveStates(def, progress, view);
                return (
                  <div key={def.id} className="quest-card" data-status={status}>
                    <strong>{def.title}</strong>
                    {status === 'locked' ? (
                      <p className="quest-locked">Needs rank: {RANKS[def.minRank]?.name ?? '?'}</p>
                    ) : (
                      <>
                        <p>{def.blurb}</p>
                        <ul className="objectives">
                          {states.map((o, i) => (
                            <li key={i} data-done={o.done ? '1' : '0'}>
                              {o.done ? '✓' : '○'} {o.text}
                              {o.countable && o.need > 1 ? ` (${o.have}/${o.need})` : ''}
                            </li>
                          ))}
                        </ul>
                        <p className="bonus">{rewardText(def)}</p>
                      </>
                    )}
                    {atBoard && status === 'available' && (
                      <button
                        type="button"
                        className="hud-btn quest-btn"
                        onClick={() => acceptQuestAction(def.id)}
                      >
                        ACCEPT
                      </button>
                    )}
                    {atBoard && status === 'ready' && (
                      <button
                        type="button"
                        className="hud-btn quest-btn quest-claim"
                        onClick={() => claimQuestAction(def.id)}
                      >
                        CLAIM REWARD
                      </button>
                    )}
                    {!atBoard && status === 'ready' && (
                      <p className="bonus">Ready. Claim it at the board.</p>
                    )}
                  </div>
                );
              })}
              {done.length > 0 && (
                <p className="hint">
                  Completed ({done.length}/{QUESTS.length}):{' '}
                  {done.map((e) => e.def.title).join(', ')}
                </p>
              )}
            </>
          )}

          {tab === 'kingdom' && (
            <div className="kingdom">
              <div className="rank-name">{rankName(rank)}</div>
              <div className="bar bar-xp rep-bar" aria-label={`Reputation ${rep}`}>
                <div
                  className="bar-fill"
                  style={{
                    width: `${nextRank ? ((rep - (RANKS[rank]?.min ?? 0)) / (nextRank.min - (RANKS[rank]?.min ?? 0))) * 100 : 100}%`,
                  }}
                />
                <span>{nextRank ? `${rep} / ${nextRank.min}` : `${rep} MAX`}</span>
              </div>
              <p className="hint">
                {nextRank ? `Next rank: ${nextRank.name}. ` : ''}Reputation comes from finished
                quests and every person who joins your kingdom.
              </p>
              <h3>
                Subjects ({subjects.length}/{NPCS.length})
              </h3>
              {subjects.length === 0 && (
                <p className="hint">No one has joined yet. Sing to them.</p>
              )}
              <ul className="subjects">
                {subjects.map((n) => (
                  <li key={n.id}>
                    <b style={{ color: n.accent }}>{n.name}</b> · {n.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button type="button" className="hud-btn big" onClick={close}>
          CLOSE
        </button>
      </div>
    </div>
  );
}
