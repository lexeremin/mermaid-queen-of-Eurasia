import { Scene } from '@/game/Scene';
import { Hud } from '@/ui/Hud';
import { useInputBridge } from '@/ui/use-input-bridge';

export function App() {
  useInputBridge();
  return (
    <>
      <Scene />
      <Hud />
    </>
  );
}
