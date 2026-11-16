import { describe, expect, it } from "vitest";
import { FLAPS, LANDING_STATIONS, PRODUCT_STATIONS, boardText, flapStep, ride } from "@/components/berlin/line";

describe("the Berlin line", () => {
  it("starts in the scene and ends at the plant", () => {
    expect(LANDING_STATIONS[0]).toMatchObject({ id: "story", dark: true });
    expect(LANDING_STATIONS.at(-1)).toMatchObject({ id: "close", kind: "terminus" });
    expect(new Set(LANDING_STATIONS.map((s) => s.id)).size).toBe(LANDING_STATIONS.length);
  });

  it("runs /product from the raise box to the same terminus", () => {
    expect(PRODUCT_STATIONS[0]).toMatchObject({ id: "try" });
    expect(PRODUCT_STATIONS.at(-1)).toMatchObject({ id: "close", kind: "terminus" });
    expect(new Set(PRODUCT_STATIONS.map((s) => s.id)).size).toBe(PRODUCT_STATIONS.length);
  });

  it("changes to /product only at an interchange", () => {
    for (const s of [...LANDING_STATIONS, ...PRODUCT_STATIONS]) if (s.to) expect(s.kind).toBe("interchange");
    expect(LANDING_STATIONS.find((s) => s.id === "product")).toMatchObject({ kind: "interchange", to: "/product" });
  });

  it("puts the train between the stations the reading line is between", () => {
    const tops = [0, 1000, 2000, 3000];
    expect(ride(tops, 0)).toEqual({ index: 0, along: 0 });
    expect(ride(tops, 500)).toEqual({ index: 0, along: 0.5 });
    expect(ride(tops, 2250)).toEqual({ index: 2, along: 0.25 });
    expect(ride(tops, 9000)).toEqual({ index: 3, along: 0 });
    expect(ride(tops, 1200, true)).toEqual({ index: 3, along: 0 });
  });

  it("never runs to a station that is not on the page", () => {
    const tops = [0, 1000, Number.POSITIVE_INFINITY];
    const { index, along } = ride(tops, 1500);
    expect(index).toBe(1);
    expect(along).toBe(0);
  });
});

describe("the departure board", () => {
  it("writes a row in upper case, blanks what it cannot show and pads to the cells", () => {
    expect(boardText("5 working days", 16)).toBe("5 WORKING DAYS  ");
    expect(boardText("Grüne", 6)).toBe("GR NE ");
  });

  it("shows the end of a long text", () => {
    const row = boardText("The decision that always takes weeks", 12);
    expect(row).toHaveLength(12);
    expect(row.endsWith("TAKES WEEKS")).toBe(true);
    expect(row.startsWith("…")).toBe(true);
  });

  it("turns every flap to its letter in a bounded number of steps", () => {
    const target = boardText("Your plant", 12);
    let shown = " ".repeat(12);
    let steps = 0;
    while (shown !== target && steps < 50) { shown = flapStep(shown, target); steps++; }
    expect(shown).toBe(target);
    expect(steps).toBeLessThanOrEqual(9);
    for (const c of shown) expect(FLAPS.includes(c) || c === "…").toBe(true);
  });
});
