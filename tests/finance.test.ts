import { describe, expect, it } from "vitest";
import { calculateGoal, classifyTransaction, parseMoney, shortDate } from "@/lib/finance";

describe("regras financeiras do MVP", () => {
  it("calcula dez meses para uma meta de mil reais com aporte mensal de cem", () => {
    const result = calculateGoal(100_000, 0, 10_000, "MONTHLY", new Date("2026-01-01T12:00:00Z"));
    expect(result.periods).toBe(10);
    expect(result.months).toBe(10);
    expect(result.estimatedDate).toBe("2026-11-01");
  });

  it("interpreta valores em formato brasileiro", () => {
    expect(parseMoney("R$ 1.234,56")).toBe(123_456);
  });

  it("classifica os meios de pagamento principais", () => {
    expect(classifyTransaction("PIX enviado para mercado")).toBe("PIX");
    expect(classifyTransaction("Pagamento de boleto")).toBe("BOLETO");
    expect(classifyTransaction("Loja Central", "CREDIT")).toBe("CARD");
  });

  it("tolera datas ausentes vindas de conectores", () => {
    expect(shortDate("")).toBe("data não informada");
    expect(shortDate("valor-inválido")).toBe("data não informada");
  });
});
