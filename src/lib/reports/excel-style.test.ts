import { describe, expect, it } from "vitest";
import { columnLetter } from "./excel-style";

describe("columnLetter", () => {
  it("converte índices simples (A-Z)", () => {
    expect(columnLetter(1)).toBe("A");
    expect(columnLetter(2)).toBe("B");
    expect(columnLetter(26)).toBe("Z");
  });

  it("converte índices com duas letras (AA em diante)", () => {
    expect(columnLetter(27)).toBe("AA");
    expect(columnLetter(28)).toBe("AB");
    expect(columnLetter(52)).toBe("AZ");
    expect(columnLetter(53)).toBe("BA");
  });

  it("cobre uma planilha larga (92 colunas, ex.: bateria de 90 dias)", () => {
    expect(columnLetter(92)).toBe("CN");
  });
});
