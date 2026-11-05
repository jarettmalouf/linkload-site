/**
 * App layer: navigation rules that sit on top of the machine.
 */
import { describe, expect, it } from "vitest";
import { canQueueInSetup, createApp, draftInput, draftPreview, setupNote, showWelcome, step, timingStatus, type AppState } from "../app";
import { leds, reduce } from "../machine";
import { SCENES } from "../scenes";
import { timeOfDay } from "../scheduler";
import { overlayScreen } from "../screens";
import { activeStatuses, canQueueAnother, clearanceView, finishView, sleepView } from "../view";

const greeted = (...args: Parameters<typeof createApp>): AppState => step(createApp(...args), { type: "WELCOME" });
const withSleep = { idleSleepSec: 30 };

describe("Simulation has no sleep mode", () => {
  it("stays awake however long nobody touches it", () => {
    let s = step(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "TICK", realSec: 3600, speed: 1 });
    expect(overlayScreen(s.machine)).toBeNull();
    expect(s.nav).toEqual(["setup"]);
  });

  it("when sleep is turned on, a setup in progress survives it", () => {
    let s = step(greeted("010", undefined, withSleep), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "bedding" });
    s = step(s, { type: "TICK", realSec: 31, speed: 1 });
    expect(overlayScreen(s.machine)).toBe("sleep");
    s = step(s, { type: "MACHINE", event: { type: "APPROACH" } });
    expect(s.nav).toEqual(["setup"]);
    expect(s.draft?.loads[0].program).toBe("bedding");
    expect(leds(s.machine).washer).toBe(true);
  });
});

describe("Welcome", () => {
  it("greets first, and tapping it gets to home", () => {
    let s = createApp("011");
    expect(showWelcome(s)).toBe(true);
    s = step(s, { type: "WELCOME" });
    expect(showWelcome(s)).toBe(false);
  });

  it("doesn't greet over a running cycle", () => {
    expect(showWelcome(SCENES.progress())).toBe(false);
  });
});

describe("Finish screen", () => {
  it("every completed load gets one, then the main page returns on its own", () => {
    let s = greeted("100");
    expect(s.draft?.intent).toBe("dry-only");
    s = step(s, { type: "PICK", program: "warm-towels" });
    s = step(s, { type: "START" });
    s = step(s, { type: "TICK", realSec: 15.5, speed: 60 }); // 15-minute dry
    expect(overlayScreen(s.machine)).toBe("finish");
    expect(finishView(s.machine)).toEqual({ title: "Your Warm Towels are done", sub: "You can find them in the dryer." });
    // A minute on the real machine; 3 seconds in the simulator at 60x.
    s = step(s, { type: "TICK", realSec: 2.9, speed: 60 });
    expect(overlayScreen(s.machine)).toBe("finish");
    s = step(s, { type: "TICK", realSec: 0.2, speed: 60 });
    expect(overlayScreen(s.machine)).toBeNull();
  });

  it("OK returns straight away", () => {
    const s = step(SCENES.finish(), { type: "MACHINE", event: { type: "FINISH_OK" } });
    expect(s.machine.finished).toEqual([]);
  });

  it("a load that moves on to the done drawer gets its screen when it lands there", () => {
    let s = step(greeted("011"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = step(s, { type: "PICK", program: "delicates" });
    s = step(s, { type: "START" });
    for (let i = 0; i < 1300 && !s.machine.finished.length; i++) s = step(s, { type: "TICK", realSec: 0.1, speed: 60 });
    expect(s.machine.drawer?.settings?.label).toBe("Normal");
    expect(finishView(s.machine)).toEqual({ title: "Your Normal load is done", sub: "You can find it in the done drawer." });
  });
});

describe("Main page shows what's running", () => {
  it("lists the running dry while the washer load waits to be set up", () => {
    let s = greeted("110");
    s = step(s, { type: "START" });
    expect(activeStatuses(s.machine)).toEqual([{ text: "Drying · Auto · 0:55", active: true }]);
  });

  it("lists what's waiting in the done drawer too", () => {
    let s = greeted("010");
    s = step(s, { type: "MACHINE", event: { type: "LOAD_PLACE", place: "drawer" } });
    expect(activeStatuses(s.machine)).toContainEqual({ text: "Done drawer · Load", active: true });
  });
});

describe("What has to be emptied", () => {
  // Queue and washer loaded, a dry load sitting in the dryer, the done drawer full.
  const crowded = () => {
    let s = greeted("111");
    s = step(s, { type: "START" }); // the dryer's load, dry only
    s = step(s, { type: "TICK", realSec: 60, speed: 60 });
    s = step(s, { type: "MACHINE", event: { type: "FINISH_OK" } });
    s = step(s, { type: "MACHINE", event: { type: "LOAD_PLACE", place: "drawer" } });
    return s;
  };

  it("one load: empty the dryer", () => {
    const s = step(crowded(), { type: "OPEN_SETUP", intent: "full-run" });
    expect(setupNote(s, draftPreview(s))).toBe("Empty the dryer before this load can start");
  });

  it("two loads: empty the dryer and the done drawer", () => {
    let s = step(crowded(), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    expect(setupNote(s, draftPreview(s))).toBe("Empty the dryer and done drawer before these loads can start");
  });

  it("after Start, a modal stays until the first load can go; the queued one is asked about when it's held", () => {
    let s = step(crowded(), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = step(s, { type: "START" });
    expect(clearanceView(s.machine)?.title).toBe("Empty the dryer and done drawer to start");
    // With the dryer empty the first load can start; the queued load's turn comes later.
    s = step(s, { type: "MACHINE", event: { type: "EMPTY_PLACE", place: "dryer" } });
    expect(clearanceView(s.machine)).toBeNull();
    expect(s.machine.washer?.status).toBe("washing");
  });

  it("matches the clearance scene", () => {
    expect(clearanceView(SCENES.clearance().machine)?.title).toBe("Empty the dryer and done drawer to start");
  });
});

describe("App navigation", () => {
  it("a raw dryer load opens its dry settings once past the welcome, with the dryer lit", () => {
    let s = createApp("110");
    expect(s.nav).toEqual([]);
    s = step(s, { type: "WELCOME" });
    expect(s.nav).toEqual(["setup"]);
    expect(s.draft?.intent).toBe("dry-only");
    expect(leds(s.machine).dryer).toBe(true);
  });

  it("after the dry starts, home offers the washer load, lit while set up", () => {
    let s = greeted("110");
    s = step(s, { type: "START" });
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    expect(s.draft?.loads[0].target).toEqual({ place: "washer", kind: "wash" });
    expect(leds(s.machine)).toEqual({ queue: false, washer: true, dryer: false });
  });

  it("Queue Another during a run lights the queue and adds the load", () => {
    let s = step(SCENES.progress(), { type: "MACHINE", event: { type: "LOAD_PLACE", place: "queue" } });
    s = step(s, { type: "OPEN_SETUP", intent: "queue-another" });
    expect(leds(s.machine).queue).toBe(true);
    s = step(s, { type: "START" });
    expect(s.machine.queue?.plan).toBe("wash-dry");
  });
});

describe("Queue Another before starting", () => {
  it("sets up both loads, moves the LED to the queue, and one Start runs both", () => {
    let s = step(greeted("011"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    expect(canQueueInSetup(s)).toBe(true);
    s = step(s, { type: "QUEUE_IN_SETUP" });
    expect(leds(s.machine)).toEqual({ queue: true, washer: false, dryer: false });
    s = step(s, { type: "PICK", program: "delicates" });
    expect(canQueueInSetup(s)).toBe(false); // only one queue drawer
    expect(draftInput(s)?.loads.map((l) => [l.place, l.settings.label])).toEqual([
      ["washer", "Normal"],
      ["queue", "Delicates"],
    ]);
    s = step(s, { type: "SELECT_LOAD", index: 0 });
    expect(leds(s.machine).washer).toBe(true);
    s = step(s, { type: "START" });
    expect(s.machine.washer?.status).toBe("washing");
    expect(s.machine.queue?.settings?.label).toBe("Delicates");
    expect(s.machine.queue?.plan).toBe("wash-dry");
  });

  it("isn't offered until there are clothes in the queue drawer", () => {
    let s = step(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" });
    expect(canQueueInSetup(s)).toBe(false);
    s = step(s, { type: "QUEUE_IN_SETUP" });
    expect(s.draft?.loads).toHaveLength(1);
    s = step(s, { type: "MACHINE", event: { type: "LOAD_PLACE", place: "queue" } });
    expect(canQueueInSetup(s)).toBe(true);
  });

  it("isn't offered during a run until the queue drawer is loaded", () => {
    let s = step(step(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" }), { type: "START" });
    expect(canQueueAnother(s.machine)).toBe(false);
    s = step(s, { type: "MACHINE", event: { type: "LOAD_PLACE", place: "queue" } });
    expect(canQueueAnother(s.machine)).toBe(true);
  });

  it("a queued load can be removed before Start", () => {
    let s = step(greeted("011"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = step(s, { type: "REMOVE_LOAD", index: 1 });
    expect(s.draft?.loads).toHaveLength(1);
    expect(leds(s.machine).washer).toBe(true);
  });
});

describe("Done By and Eco Mode", () => {
  const onTiming = (now = 12 * 60) => {
    let s = step(greeted("010", now), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    return step(s, { type: "OPEN", screen: "done-by" });
  };

  it("are independent toggles", () => {
    let s = step(onTiming(), { type: "TIMING_TOGGLE", which: "done-by" });
    s = step(s, { type: "TIMING_TOGGLE", which: "eco" });
    expect(s.draft?.timing).toMatchObject({ doneBy: true, eco: true });
    s = step(s, { type: "TIMING_TOGGLE", which: "done-by" });
    expect(s.draft?.timing).toMatchObject({ doneBy: false, eco: true });
  });

  it("Eco alone aims for the cheapest window by morning and says 'Off-peak'", () => {
    let s = step(onTiming(15 * 60), { type: "TIMING_TOGGLE", which: "eco" });
    expect(draftInput(s)?.doneBy).toBeNull();
    const seen = new Set<string>();
    for (let i = 0; i < 40; i++) {
      s = step(s, { type: "TICK", realSec: 0.137, speed: 60 });
      seen.add(timingStatus(s, draftPreview(s)));
    }
    expect([...seen]).toEqual(["Off-peak"]);
    expect(timeOfDay(draftPreview(s)!.finishAt)).toBe(6 * 60);
    expect(setupNote(s, draftPreview(s))).toBe("Off-peak");
  });

  it("Eco with Done By picks the cheapest window before that time", () => {
    let s = step(onTiming(15 * 60), { type: "TIMING_TOGGLE", which: "done-by" });
    s = step(s, { type: "TIMING_TIME", time: 23 * 60 });
    s = step(s, { type: "TIMING_TOGGLE", which: "eco" });
    const p = draftPreview(s)!;
    // Off-peak starts at 9 PM; the 102-minute run fits inside it and ends at 11 PM.
    expect(timeOfDay(p.finishAt)).toBe(23 * 60);
    expect(timingStatus(s, p)).toBe("As off-peak as possible before 11:00 PM");
    expect(setupNote(s, p)).toBe("As off-peak as possible before 11:00 PM");
  });

  it("Done By steps by 15 minutes", () => {
    let s = step(onTiming(), { type: "TIMING_TOGGLE", which: "done-by" });
    const t = s.draft!.timing.time;
    s = step(s, { type: "TIMING_TIME", time: t + 15 });
    expect(s.draft!.timing.time - t).toBe(15);
  });

  it("Set on an impossible time takes the earliest finish (rule 7)", () => {
    let s = step(onTiming(), { type: "TIMING_TOGGLE", which: "done-by" });
    s = step(s, { type: "TIMING_TIME", time: 12 * 60 + 30 });
    s = step(s, { type: "SET_DONE_BY" });
    expect(s.nav).toEqual(["setup"]);
    // 45 + 2 + 55 from noon is 1:42, offered as the next quarter hour.
    expect(s.draft?.timing.time).toBe(13 * 60 + 45);
  });

  it("the earliest finish doesn't tick along with the 60x clock", () => {
    let s = step(onTiming(), { type: "TIMING_TOGGLE", which: "done-by" });
    s = step(s, { type: "TIMING_TIME", time: 12 * 60 + 30 });
    const seen = new Set<string>();
    // Two seconds at 60x: the earliest finish moves 1:42 → 1:44, still offered as 1:45.
    for (let i = 0; i < 20; i++) {
      seen.add(timingStatus(s, draftPreview(s)));
      s = step(s, { type: "TICK", realSec: 0.1, speed: 60 });
    }
    expect([...seen]).toEqual(["Can't finish by then. Earliest is 1:45 PM"]);
  });
});

describe("Countdown continuity (with sleep turned on)", () => {
  it("sleep carries on the wash countdown to 0:00, then the dry takes over after the transfer", () => {
    let s = step(greeted("010", undefined, withSleep), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    s = step(s, { type: "START" });
    const seen: string[] = [];
    for (let i = 0; i < 700; i++) {
      s = step(s, { type: "TICK", realSec: 0.1, speed: 60 });
      const v = overlayScreen(s.machine) === "sleep" ? sleepView(s.machine) : null;
      const key = v ? `${v.label} ${v.big}` : String(overlayScreen(s.machine));
      if (seen.at(-1) !== key) seen.push(key);
    }
    expect(seen.filter((k) => k.startsWith("Washing")).at(-1)).toBe("Washing 0:00");
    const afterWash = seen.slice(seen.indexOf("Washing 0:00") + 1);
    expect(afterWash[0]).toBe("transfer");
    expect(afterWash[1]).toBe("Drying 0:55");
  });
});

describe("Scenes", () => {
  it("every scene builds", () => {
    for (const [name, build] of Object.entries(SCENES)) expect(build(), name).toBeTruthy();
  });
});

describe("Loading and unloading raw places mid-setup", () => {
  const tap = (s: AppState, type: "LOAD_PLACE" | "EMPTY_PLACE", place: "queue" | "washer" | "dryer" | "drawer") =>
    step(s, { type: "MACHINE", event: { type, place } });

  it("emptying the dryer closes the Dry Only setup it opened", () => {
    let s = greeted("000");
    s = tap(s, "LOAD_PLACE", "dryer");
    expect(s.draft?.intent).toBe("dry-only");
    s = tap(s, "EMPTY_PLACE", "dryer");
    expect(s.draft).toBeNull();
    expect(s.nav).toEqual([]);
    expect(leds(s.machine).dryer).toBe(false);
    // And it opens again when clothes go back in.
    expect(tap(s, "LOAD_PLACE", "dryer").draft?.intent).toBe("dry-only");
  });

  it("emptying the washer mid-setup closes setup; emptying the queue drops just the queued load", () => {
    let s = step(greeted("011"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = tap(s, "EMPTY_PLACE", "queue");
    expect(s.draft?.loads.map((l) => l.target.place)).toEqual(["washer"]);
    expect(leds(s.machine).washer).toBe(true);
    s = tap(s, "EMPTY_PLACE", "washer");
    expect(s.draft).toBeNull();
  });
});

describe("Clear the net", () => {
  it("the blocked washer tile is a button that clears the net and starts the wash", async () => {
    const { washerTile } = await import("../view");
    let s = step(SCENES["pro-tip"](), { type: "MACHINE", event: { type: "PRO_TIP_NOTIFY" } });
    s = { ...s, machine: (await import("../machine")).tick(s.machine, { simMin: 47.01 }) };
    s = step(s, { type: "MACHINE", event: { type: "HANG_DRY_SKIP" } });
    for (let i = 0; i < 200 && washerTile(s.machine)?.action !== "clear-net"; i++) s = step(s, { type: "TICK", realSec: 0.5, speed: 60 });
    expect(washerTile(s.machine)).toMatchObject({ big: "Clear the net", action: "clear-net" });
    s = step(s, { type: "MACHINE", event: { type: "NET_CLEARED" } });
    expect(washerTile(s.machine)?.action).toBeUndefined();
  });
});

describe("Emptying is only asked for once a load is actually held", () => {
  it("towels in the dryer, Bedding washing, Delicates queued: no warning until Delicates is held, then the done drawer", async () => {
    const { tick, nextLoadHeld } = await import("../machine");
    // Dry Only first (Warm Towels), then Bedding in the washer with Delicates queued behind it.
    let s = greeted("111");
    s = step(s, { type: "PICK", program: "warm-towels" });
    s = step(s, { type: "START" });
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "bedding" });
    s = step(s, { type: "QUEUE_IN_SETUP" });
    s = step(s, { type: "PICK", program: "delicates" });
    s = step(s, { type: "START" });
    expect(s.machine.washer?.status).toBe("washing");
    expect(clearanceView(s.machine)).toBeNull();

    let firstAsk: { now: number; held: boolean; view: ReturnType<typeof clearanceView> } | null = null;
    let m = s.machine;
    for (let i = 0; i < 400 * 4 && !firstAsk; i++) {
      m = tick(m, { simMin: 0.25, realSec: 1 });
      const view = clearanceView(m);
      if (view) firstAsk = { now: m.now, held: nextLoadHeld(m), view };
    }
    // The towels dropped into the done drawer on their own; Bedding dried; now Delicates is held.
    expect(firstAsk?.held).toBe(true);
    expect(m.drawer?.settings?.label).toBe("Warm Towels");
    expect(m.dryer?.load.settings?.label).toBe("Bedding");
    expect(firstAsk?.view?.title).toBe("Empty the done drawer to start");
    // Emptying it lets Bedding drop down and Delicates go.
    m = reduce(m, { type: "EMPTY_PLACE", place: "drawer" });
    expect(clearanceView(m)).toBeNull();
  });
});

describe("Presets", () => {
  const setupNormal = () => {
    let s = step(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "PICK", program: "normal" });
    return step(s, { type: "OPEN", screen: "advanced" });
  };
  const type = (s: AppState, text: string) =>
    text.split("").reduce((acc, c) => step(acc, { type: "PRESET_KEY", key: c }), s);

  it("saves the tuned settings under a name, picks it, and lists it in the picker", async () => {
    const { pickerOptions } = await import("../app");
    let s = setupNormal();
    const st = s.draft!.loads[0].settings;
    s = step(s, { type: "EDIT", settings: { ...st, wash: { ...st.wash, waterTemp: "cold", softenerCups: 0 } } });
    s = step(s, { type: "OPEN_NAME_PRESET" });
    s = type(s, "baby clothes");
    expect(s.presetName).toBe("Baby clothes");
    s = step(s, { type: "SAVE_PRESET" });
    expect(s.nav).toEqual(["setup"]);
    const load = s.draft!.loads[0];
    expect(load.settings).toMatchObject({ label: "Baby clothes", auto: false, wash: { waterTemp: "cold", softenerCups: 0 } });
    expect(pickerOptions(s, "wash").at(-1)).toBe(load.program);
    expect(pickerOptions(s, "dry")).toContain(load.program);
  });

  it("the same name updates the preset; Delete removes it and the load goes back to the default", () => {
    let s = setupNormal();
    s = type(step(s, { type: "OPEN_NAME_PRESET" }), "jarett");
    s = step(s, { type: "SAVE_PRESET" });
    const id = s.draft!.loads[0].program;
    s = step(s, { type: "OPEN", screen: "advanced" });
    s = step(s, { type: "OPEN_NAME_PRESET" });
    expect(s.presetName).toBe("Jarett");
    s = step(s, { type: "SAVE_PRESET" });
    expect(s.machine.presets.map((p) => p.id)).toEqual([id]);
    s = step(s, { type: "OPEN", screen: "advanced" });
    s = step(s, { type: "OPEN_NAME_PRESET" });
    s = step(s, { type: "DELETE_PRESET" });
    expect(s.machine.presets).toEqual([]);
    expect(s.draft!.loads[0].program).toBe("auto");
  });

  it("survives a new starting mode and runs like any load", () => {
    let s = setupNormal();
    s = type(step(s, { type: "OPEN_NAME_PRESET" }), "towels");
    s = step(s, { type: "SAVE_PRESET" });
    s = step(s, { type: "START" });
    expect(s.machine.washer?.load.settings?.label).toBe("Towels");
    s = step(s, { type: "MACHINE", event: { type: "SET_START_MODE", bits: "010" } });
    expect(s.machine.presets.map((p) => p.name)).toEqual(["Towels"]);
  });
});

describe("Back button", () => {
  it("Wash Only by mistake: back returns home, where Wash and dry can be picked", async () => {
    const { canGoBack } = await import("../app");
    let s = step(greeted("010"), { type: "OPEN_SETUP", intent: "wash-only" });
    expect(canGoBack(s)).toBe(true);
    s = step(s, { type: "BACK" });
    expect(s.nav).toEqual([]);
    expect(s.draft).toBeNull();
    expect(leds(s.machine).washer).toBe(false);
    s = step(s, { type: "OPEN_SETUP", intent: "full-run" });
    expect(s.draft?.intent).toBe("full-run");
  });

  it("steps back one screen at a time, and isn't offered on the Dry Only the machine opened itself", async () => {
    const { canGoBack } = await import("../app");
    let s = step(greeted("010"), { type: "OPEN_SETUP", intent: "full-run" });
    s = step(s, { type: "OPEN", screen: "advanced" });
    s = step(s, { type: "OPEN_NAME_PRESET" });
    s = step(s, { type: "BACK" });
    expect(s.nav).toEqual(["setup", "advanced"]);
    expect(canGoBack(greeted("100"))).toBe(false);
    expect(canGoBack(greeted("000"))).toBe(false);
  });
});
