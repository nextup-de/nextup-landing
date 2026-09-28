// /login's company list from admin: only well-formed companies get through. Pure - no network.
import { describe, expect, it } from "vitest";
import { readDirectory } from "@/features/login/directory";

describe("readDirectory", () => {
  it("keeps valid companies, sorted by name", () => {
    expect(readDirectory({ companies: [{ slug: "globex", name: "Globex Industrie AG" }, { slug: "acme", name: "Acme Maschinenbau GmbH" }] })).toEqual([
      { slug: "acme", name: "Acme Maschinenbau GmbH" },
      { slug: "globex", name: "Globex Industrie AG" },
    ]);
  });

  it("drops bad slugs, reserved names and duplicates", () => {
    const list = readDirectory({
      companies: [{ slug: "acme", name: "A" }, { slug: "acme", name: "B" }, { slug: "admin", name: "X" }, { slug: "Evil.com/x", name: "Y" }, { slug: 3 }, null],
    });
    expect(list).toEqual([{ slug: "acme", name: "A" }]);
  });

  it("falls back to the slug for a missing name", () => {
    expect(readDirectory({ companies: [{ slug: "test1", name: "  " }] })).toEqual([{ slug: "test1", name: "test1" }]);
  });

  it("returns nothing for an answer that isn't a list", () => {
    expect(readDirectory(null)).toEqual([]);
    expect(readDirectory({ companies: "acme" })).toEqual([]);
    expect(readDirectory("oops")).toEqual([]);
  });
});
