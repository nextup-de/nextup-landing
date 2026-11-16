import { describe, expect, it } from "vitest";
import { CLIMB, RAIL, railY } from "@/features/tower/world";

describe("the rail corridor", () => {
  it("lies in the cut east of the climb and on the viaduct west of it", () => {
    expect(railY(RAIL.xTo)).toBe(RAIL.y);
    expect(railY(CLIMB.from)).toBe(RAIL.y);
    expect(railY(CLIMB.to)).toBe(CLIMB.top);
    expect(railY(RAIL.xFrom)).toBe(CLIMB.top);
  });

  it("climbs without a step, and only upward going west", () => {
    let last = railY(RAIL.xTo);
    for (let x = RAIL.xTo; x >= RAIL.xFrom; x -= 2) {
      const y = railY(x);
      expect(y).toBeGreaterThanOrEqual(last - 1e-9);
      expect(y - last).toBeLessThan(0.2);
      last = y;
    }
  });

  it("leaves the cut where the rails reach the street", () => {
    expect(Math.abs(railY(CLIMB.cutEnd))).toBeLessThan(1);
  });
});
