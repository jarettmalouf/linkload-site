"use client";

import { canQueueAnother, dryerTile, queuedText, washerTile, type Tile } from "@/touchscreen/view";
import type { ScreenProps } from "../types";
import { TileDry, TileWait, TileWash } from "./Animations";

function TileButton({ tile, onClick }: { tile: Tile; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={tile.action === "clear-net" ? "Clear the net" : `${tile.place === "washer" ? "Washer" : "Dryer"}, ${tile.status}, ${tile.big}`}
      onClick={onClick}
      className={`relative box-border flex flex-[1_1_0] flex-col items-center justify-center gap-0.5 overflow-hidden rounded-[40px] border-2 bg-[var(--ts-surface)] text-[var(--ts-text)] transition-colors duration-500 ${
        tile.active ? "border-[var(--ts-accent)]" : "border-transparent"
      }`}
    >
      {/* Clothes, bubbles and heat drift around the whole tile, behind the numbers. */}
      {tile.active && (tile.place === "washer" ? <TileWash /> : <TileDry />)}
      {tile.waiting && <TileWait />}
      <span className="relative text-[26px] text-[var(--ts-muted)]">{tile.status}</span>
      {tile.action === "clear-net" ? (
        // In the simulator this stands in for taking the clothes out of the net.
        <span className="relative my-6 flex h-[104px] items-center rounded-[52px] bg-[var(--ts-text)] px-14 text-[44px] font-medium tracking-[-0.5px] text-[var(--ts-bg)]">
          {tile.big}
        </span>
      ) : tile.numeric ? (
        <span className="relative text-[156px] font-light leading-[1.1] tracking-[-4px] tabular">{tile.big}</span>
      ) : (
        <span className="relative py-6 text-[76px] font-medium leading-[1.1] tracking-[-1.5px]">{tile.big}</span>
      )}
      <span className="relative h-8 text-[26px] text-[var(--ts-muted)]">{tile.type}</span>
    </button>
  );
}

/** Progress (also Waiting and Queued): wash and dry halves, Queue Another below. */
export function Progress({ app, dispatch }: ScreenProps) {
  const m = app.machine;
  const tiles = [washerTile(m), dryerTile(m)].filter((t): t is Tile => !!t);
  return (
    <div className="box-border flex h-full flex-col gap-4 p-7">
      {tiles.map((tile) => (
        <TileButton
          key={tile.place}
          tile={tile}
          onClick={() => {
            if (tile.action === "clear-net") return dispatch({ type: "MACHINE", event: { type: "NET_CLEARED" } });
            // A queued load has nothing to open yet.
            if (tile.place === "washer" && !m.washer) return;
            dispatch({ type: "OPEN_DETAIL", place: tile.place });
          }}
        />
      ))}
      {queuedText(m) && (
        <div className="flex h-24 shrink-0 items-center justify-center text-[30px] text-[var(--ts-muted)]">{queuedText(m)}</div>
      )}
      {canQueueAnother(m) && (
        <button
          type="button"
          onClick={() => dispatch({ type: "OPEN_SETUP", intent: "queue-another" })}
          className="h-24 shrink-0 rounded-[48px] border-0 bg-transparent text-[30px] font-medium text-[var(--ts-text)]"
        >
          Queue Another
        </button>
      )}
    </div>
  );
}
