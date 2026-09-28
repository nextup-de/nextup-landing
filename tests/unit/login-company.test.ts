// /login's company lookup rules. Pure - no network.
import { describe, expect, it } from "vitest";
import { companyError, companyUrl, readCompany } from "@/features/login/company";

describe("readCompany", () => {
  it("takes the bare name, the address or a full URL", () => {
    expect(readCompany("acme")).toBe("acme");
    expect(readCompany("  ACME ")).toBe("acme");
    expect(readCompany("acme.sellux.ch")).toBe("acme");
    expect(readCompany("https://acme.sellux.ch/login?x=1")).toBe("acme");
  });

  it("turns a name with spaces into a slug", () => {
    expect(readCompany("Acme Maschinenbau")).toBe("acme-maschinenbau");
    expect(readCompany("--Globex  AG--")).toBe("globex-ag");
  });
});

describe("companyError", () => {
  it("accepts a company slug", () => {
    expect(companyError("acme")).toBeNull();
    expect(companyError("acme-2")).toBeNull();
  });

  it("asks for a name when empty", () => {
    expect(companyError("")).toMatch(/Enter/);
  });

  it("refuses reserved names and bad shapes", () => {
    for (const s of ["admin", "automation", "www", "a", "x".repeat(33)]) expect(companyError(s)).not.toBeNull();
  });
});

describe("companyUrl", () => {
  it("fills the pattern", () => {
    expect(companyUrl("acme", "https://{slug}.sellux.ch")).toBe("https://acme.sellux.ch");
    expect(companyUrl("acme", "http://localhost:8080/")).toBe("http://localhost:8080");
  });
});
