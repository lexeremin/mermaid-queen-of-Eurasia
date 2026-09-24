import { useToastStore } from '@/store/toast-store';

export function Toasts() {
  const toasts = useToastStore((s) => s.toasts);
  const levelUp = useToastStore((s) => s.levelUp);
  return (
    <>
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.kind}`}>
            {t.text}
          </div>
        ))}
      </div>
      {levelUp && (
        <div key={levelUp.id} className="level-up" role="status">
          <b>LEVEL UP</b>
          <span>Level {levelUp.level}</span>
        </div>
      )}
    </>
  );
}
