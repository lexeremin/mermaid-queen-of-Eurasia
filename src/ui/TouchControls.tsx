import { ActionButton } from '@/ui/ActionButton';
import { Joystick } from '@/ui/Joystick';

export function TouchControls() {
  return (
    <>
      <Joystick />
      <div className="action-cluster">
        <ActionButton action="attack" label="ATK" size={104} style={{ right: 0, bottom: 0 }} />
        <ActionButton action="dash" label="DASH" size={76} style={{ right: 118, bottom: 6 }} />
        <ActionButton action="aura" label="AURA" size={76} style={{ right: 96, bottom: 116 }} />
        <ActionButton
          action="teleport"
          label="BLINK"
          size={60}
          style={{ right: 12, bottom: 214 }}
        />
        <ActionButton action="spell" label="SPELL" size={76} style={{ right: 4, bottom: 126 }} />
      </div>
    </>
  );
}
