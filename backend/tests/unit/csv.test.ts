import { describe, expect, it } from "vitest";
import { toCsv } from "@/utils/csv";

describe("toCsv", () => {
  it("writes header row from column list", () => {
    const csv = toCsv([{ a: 1, b: 2 }], ["a", "b"]);
    expect(csv.split("\n")[0]).toBe("a,b");
  });

  it("serializes rows in column order", () => {
    const csv = toCsv([{ name: "Alice", age: 30 }], ["name", "age"]);
    expect(csv).toBe("name,age\nAlice,30\n");
  });

  it("escapes fields containing commas, quotes or newlines", () => {
    const csv = toCsv([{ note: 'has, comma and "quotes"\nand newline' }], ["note"]);
    expect(csv).toBe('note\n"has, comma and ""quotes""\nand newline"\n');
  });

  it("renders null/undefined as empty string", () => {
    const csv = toCsv([{ value: null }, { value: undefined }], ["value"]);
    expect(csv).toBe("value\n\n\n");
  });

  it("serializes Date values as ISO strings", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    const csv = toCsv([{ when: date }], ["when"]);
    expect(csv).toBe("when\n2026-01-01T00:00:00.000Z\n");
  });
});
