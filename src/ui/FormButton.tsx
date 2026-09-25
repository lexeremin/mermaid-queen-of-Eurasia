import { toggleForm } from '@/game/form-sim';
import { useGameStore } from '@/store/game-store';
import { useProgressStore } from '@/store/progress-store';
import { UiIcon } from '@/ui/icons';

/** Small round icon (next to Recall): change between human and mermaid form. Only once the form is unlocked. */
export function FormButton({ touch }: { touch: boolean }) {
  const unlocked = useProgressStore((s) => s.forms.includes('mermaid'));
  const mermaid = useGameStore((s) => s.form === 'mermaid');
  const blocked = useGameStore(
    (s) =>
      s.paused ||
      s.inventoryOpen ||
      !!s.questPanel ||
      s.dialogueOpen ||
      s.downed ||
      s.transitioning,
  );
  if (!unlocked) return null;
  return (
    <button
      type="button"
      className="form-btn"
      data-mermaid={mermaid ? '1' : '0'}
      disabled={blocked}
      title="Change form (F)"
      aria-label={mermaid ? 'Become human' : 'Become a mermaid'}
      onClick={() => toggleForm()}
    >
      <UiIcon id="form" size={26} />
      {!touch && <kbd>F</kbd>}
    </button>
  );
}
