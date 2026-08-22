import { describe, expect, it } from "vitest";
import { calculateGoal, classifyTransaction, computeBudgetUsage, filterTransactions, parseMoney, shortDate } from "@/lib/finance";
import type { Transaction } from "@/lib/types";

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

  it("soma apenas despesas da categoria, moeda e mês do orçamento", () => {
    const base: Transaction = {
      id: "1", source: "PLUGGY", accountId: "account", description: "Compra", amountCents: 30_000,
      currency: "BRL", date: "2026-08-10", flow: "EXPENSE", kind: "CARD",
      category: "Lazer", originalCategory: "Outros",
    };
    const [usage] = computeBudgetUsage([
      base,
      { ...base, id: "2", amountCents: 20_000, date: "2026-07-10" },
      { ...base, id: "3", amountCents: 15_000, flow: "INCOME" },
      { ...base, id: "4", amountCents: 10_000, currency: "USD" },
    ], [{ id: "budget", category: "Lazer", monthlyLimitCents: 50_000, currency: "BRL" }], new Date("2026-08-22T12:00:00"));
    expect(usage.spentCents).toBe(30_000);
    expect(usage.percentage).toBe(60);
  });

  it("combina busca, período, categoria e conta", () => {
    const base: Transaction = {
      id: "1", source: "PLUGGY", accountId: "conta-a", description: "Compra semanal",
      merchant: "Mercado Central", amountCents: 10_000, currency: "BRL", date: "2026-08-10",
      flow: "EXPENSE", kind: "CARD", category: "Alimentação", originalCategory: "Alimentação",
    };
    const result = filterTransactions([
      base,
      { ...base, id: "2", merchant: "Outra loja", date: "2026-08-12" },
      { ...base, id: "3", accountId: "conta-b" },
      { ...base, id: "4", date: "2026-07-31" },
    ], {
      search: "mercado central",
      dateFrom: "2026-08-01",
      dateTo: "2026-08-31",
      category: "Alimentação",
      accountId: "conta-a",
    });

    expect(result.map((item) => item.id)).toEqual(["1"]);
  });
});
