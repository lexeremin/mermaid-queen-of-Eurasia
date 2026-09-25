import { AVATARS } from '@/data/avatars';
import { NPC_BY_ID } from '@/data/npcs';
import { useDialogueStore } from '@/store/dialogue-store';
import { useGameStore } from '@/store/game-store';
import { useNpcStore } from '@/store/npc-store';

/** Shown only while someone follows Rosa; opens his dialogue menu wherever he is. */
export function FollowerButton() {
  const followingId = useNpcStore(
    (s) => Object.entries(s.npcs).find(([, n]) => n.following)?.[0] ?? null,
  );
  const blocked = useGameStore(
    (s) => s.paused || s.inventoryOpen || !!s.questPanel || s.dialogueOpen || s.downed,
  );
  const open = useDialogueStore((s) => s.open);
  const npc = followingId ? NPC_BY_ID.get(followingId) : undefined;
  if (!npc || blocked) return null;

  return (
    <button
      type="button"
      className="follower-btn"
      aria-label={`Talk to ${npc.name}`}
      onClick={() => open(npc.id)}
    >
      <span className="follower-portrait" style={{ background: npc.accent }}>
        {AVATARS[npc.id] ? (
          <img src={AVATARS[npc.id]} alt="" draggable={false} />
        ) : (
          npc.name.replace('Uncle ', '')[0]
        )}
      </span>
    </button>
  );
}
