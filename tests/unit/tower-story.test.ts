import { describe, expect, it } from "vitest";
import { ROUTES } from "@/features/demo/routes";
import { propose } from "@/features/routing";
import { FACES, OPEN_FLOORS, RUNS, levelOf, stretches } from "@/features/tower/building";
import { BEAT, CHAPTERS, EXAMPLES, HOPS, SENDER, TODAY_DAYS, over, pathsFor, stateAt, viewAt } from "@/features/tower/story";
import { EASE, damp, pathOf, pointAt, span } from "@/features/tower/timeline";

describe("tower timeline", () => {
  it("eases run from 0 to 1 and span clamps", () => {
    for (const ease of Object.values(EASE)) {
      expect(ease(0)).toBeCloseTo(0, 9);
      expect(ease(1)).toBeCloseTo(1, 9);
    }
    expect(span(-1, 0, 1)).toBe(0);
    expect(span(2, 0, 1)).toBe(1);
  });

  it("damps the same at any frame rate", () => {
    const one = damp(0, 1, 6, 0.032);
    const two = damp(damp(0, 1, 6, 0.016), 1, 6, 0.016);
    expect(two).toBeCloseTo(one, 9);
  });

  it("walks a path end to end", () => {
    const path = pathOf([[0, 0, 0], [10, 0, 0], [10, 10, 0]]);
    expect(pointAt(path, 0)).toEqual([0, 0, 0]);
    expect(pointAt(path, 1)).toEqual([10, 10, 0]);
    expect(pointAt(path, 0.5)).toEqual([10, 0, 0]);
  });
});

describe("tower building", () => {
  it("has opposite corners at the same height", () => {
    const corner = (i: number) => levelOf(FACES[i], 0);
    expect(corner(0)).toBe(corner(2));
    expect(corner(1)).toBe(corner(3));
    expect(corner(0)).not.toBe(corner(1));
  });

  it("stacks base, glass and terraces, ending in glass", () => {
    for (let level = 0; level < RUNS; level++) {
      const parts = stretches(level).map((s) => s.cell);
      expect(parts[0]).toBe("base");
      expect(parts[parts.length - 1]).toBe("glass");
    }
    expect(OPEN_FLOORS.length).toBeGreaterThanOrEqual(6);
  });
});

describe("tower story", () => {
  it("tiles the scroll with its chapters", () => {
    expect(CHAPTERS[0].from).toBe(0);
    expect(CHAPTERS[CHAPTERS.length - 1].to).toBe(1);
    CHAPTERS.slice(1).forEach((c, i) => expect(c.from).toBe(CHAPTERS[i].to));
    for (const [a, b] of Object.values(BEAT)) expect(a).toBeLessThan(b);
  });

  it("routes every example the way the product's matcher does, to more than one owner", () => {
    expect(EXAMPLES.length).toBe(3);
    for (const e of EXAMPLES) {
      const route = propose(e.text, ROUTES)?.route;
      expect(e.owner.name).toBe(route?.owner.name);
      expect(e.deputy.name).toBe(route?.deputy);
      expect(e.owner.name).not.toBe(e.deputy.name);
    }
    expect(new Set(EXAMPLES.map((e) => e.owner.name)).size).toBeGreaterThan(1);
  });

  it("matches the wait ledger: 19 days today", () => {
    expect(TODAY_DAYS).toBe(HOPS.reduce((n, h) => n + h.days, 0));
    expect(TODAY_DAYS).toBe(19);
  });

  it("is a pure function of progress: forward and back give the same frames", () => {
    for (const example of EXAMPLES) {
      const input = { example, paths: pathsFor(example), layout: "wide" as const, overdue: 0 };
      const steps = Array.from({ length: 101 }, (_, i) => i / 100);
      const forward = steps.map((p) => JSON.stringify(stateAt(p, input)));
      const back = [...steps].reverse().map((p) => JSON.stringify(stateAt(p, input))).reverse();
      expect(back).toEqual(forward);
      for (const p of steps) {
        const s = stateAt(p, input);
        expect(s.cam.every(Number.isFinite)).toBe(true);
        expect(s.cam[1]).toBeGreaterThan(0);
      }
    }
  });

  it("takes the idea to the owner and the answer back to the sender", () => {
    const example = EXAMPLES[0];
    const input = { example, paths: pathsFor(example), layout: "wide" as const, overdue: 0 };
    const near = (a: readonly number[], b: readonly number[]) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) < 0.01;
    expect(near(stateAt(BEAT.travel[1], input).spark.at, over(example.owner.desk))).toBe(true);
    expect(near(stateAt(BEAT.back[1], input).spark.at, over(SENDER))).toBe(true);
    const late = stateAt(BEAT.decide[0] + 0.01, { ...input, overdue: 1 });
    expect(near(late.spark.at, over(example.deputy.desk))).toBe(true);
  });

  it("counts the days of the wander up to 19", () => {
    let last = 0;
    for (let p = BEAT.wander[0]; p <= BEAT.wander[1]; p += 0.002) {
      const day = viewAt(p, 0).day;
      expect(day).toBeGreaterThanOrEqual(last);
      last = day;
    }
    expect(viewAt(BEAT.wander[1], 0).day).toBe(TODAY_DAYS);
  });
});
