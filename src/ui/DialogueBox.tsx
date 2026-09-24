import { useEffect } from 'react';
import { NPC_BY_ID } from '@/data/npcs';
import { methodLabel } from '@/data/persuasion';
import { treeFor, useDialogueStore } from '@/store/dialogue-store';
import { npcContext, useNpcStore } from '@/store/npc-store';
import { visibleChoices } from '@/systems/dialogue';
import { MESMERIZED_AT, WARMING_AT, tierOf } from '@/systems/relationship';

export function DialogueBox() {
  const active = useDialogueStore((s) => s.active);
  const choose = useDialogueStore((s) => s.choose);
  const close = useDialogueStore((s) => s.close);
  const npcState = useNpcStore((s) => (active ? s.npcs[active.npcId] : undefined));

  const npc = active ? NPC_BY_ID.get(active.npcId) : undefined;
  const node = active ? treeFor(active.npcId)?.nodes[active.nodeId] : undefined;
  const ctx = npcContext();
  const choices = node ? visibleChoices(node, ctx) : [];
  const isMenu = choices.length > 0;

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (isMenu) {
        const n = Number(e.key);
        const picked = choices[n - 1];
        if (n >= 1 && picked) {
          e.preventDefault();
          choose(picked.index);
        }
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') {
        e.preventDefault();
        choose(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!active || !npc || !node || !npcState) return null;
  const tier = tierOf(npcState.relationship);
  const speaker = node.speaker === 'rosa' ? 'Rosa' : npc.name;

  return (
    <div className="dialogue">
      <div className="dialogue-card">
        <div className="dialogue-head">
          <div className="portrait" style={{ background: npc.accent }} aria-hidden>
            {npc.name.replace('Uncle ', '')[0]}
          </div>
          <div className="dialogue-who">
            <strong>{npc.name}</strong>
            <span>{npc.title}</span>
          </div>
          <div
            className="affection"
            aria-label={`Affection ${npcState.relationship} of 100, ${tier}`}
          >
            <div className="affection-bar">
              <div className="affection-fill" style={{ width: `${npcState.relationship}%` }} />
              <i style={{ left: `${WARMING_AT}%` }} />
              <i style={{ left: `${MESMERIZED_AT}%` }} />
            </div>
            <span className={`tier tier-${tier}`}>
              {tier === 'mesmerized' || npcState.joined ? '♥ ' : ''}
              {npcState.joined ? 'joined' : tier}
            </span>
          </div>
          <button
            type="button"
            className="dialogue-close"
            onClick={close}
            aria-label="Close dialogue"
          >
            ✕
          </button>
        </div>

        <p className="dialogue-text">
          <span className="dialogue-speaker">{speaker}:</span> {node.text}
        </p>

        {isMenu ? (
          <div className="dialogue-choices">
            {choices.map(({ choice, index }, i) => (
              <button
                key={index}
                type="button"
                className="dialogue-choice"
                onClick={() => choose(index)}
              >
                <b>{i + 1}</b>
                <span>
                  {choice.method && <em>{methodLabel(choice.method)}</em>} {choice.text}
                </span>
              </button>
            ))}
          </div>
        ) : (
          <button type="button" className="hud-btn big" onClick={() => choose(null)}>
            CONTINUE
          </button>
        )}
      </div>
    </div>
  );
}
