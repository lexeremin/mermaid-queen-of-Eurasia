import { ActionButton } from '@/ui/ActionButton';
import { Joystick } from '@/ui/Joystick';
import { RecallButton } from '@/ui/RecallButton';

export function TouchControls() {
  return (
    <>
      <Joystick />
      <div className="action-cluster">
        <ActionButton action="attack" label="ATK" size={104} style={{ right: 0, bottom: 0 }} />
        <ActionButton action="blink" label="BLINK" size={76} style={{ right: 118, bottom: 6 }} />
        <ActionButton action="aura" label="AURA" size={76} style={{ right: 96, bottom: 116 }} />
        <ActionButton action="spell" label="SPELL" size={76} style={{ right: 4, bottom: 126 }} />
        <div className="recall-slot">
          <RecallButton touch />
        </div>
      </div>
    </>
  );
}
