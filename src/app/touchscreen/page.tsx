import { Prototype } from "@/components/touchscreen/Prototype";
import { isScene } from "@/touchscreen/scenes";
import type { NotebookBits } from "@/touchscreen/types";

const MODES = new Set(["000", "001", "010", "011", "100", "101", "110", "111"]);

export default function TouchscreenPage({ searchParams }: { searchParams: { mode?: string; speed?: string; scene?: string; paused?: string } }) {
  const mode = (MODES.has(searchParams.mode ?? "") ? searchParams.mode : "011") as NotebookBits;
  const speed = Math.min(60, Math.max(1, Number(searchParams.speed) || 60));
  return (
    <main className="ts-page box-border flex items-center justify-center bg-[var(--void)] p-4">
      <Prototype mode={mode} speed={speed} scene={isScene(searchParams.scene) ? searchParams.scene : undefined} paused={searchParams.paused != null} />
    </main>
  );
}
