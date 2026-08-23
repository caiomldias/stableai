"use client";

import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  preferenceForLanguage,
  readLocalePreference,
  type AppLanguage,
  type LocalePreference,
} from "@/lib/locale";

const LOCALE_CHANGE_EVENT = "stableai-locale-change";

function subscribeToLocale(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(LOCALE_CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(LOCALE_CHANGE_EVENT, callback);
  };
}

function getClientLanguage(): AppLanguage {
  return readLocalePreference().language;
}

const messages = {
  "pt-BR": {
    "nav.home": "Início",
    "nav.expenses": "Gastos",
    "nav.plan": "Planejar",
    "nav.investments": "Investir",
    "nav.more": "Mais",
    "auth.eyebrow": "Acesse sua conta",
    "auth.welcome": "Que bom ter você aqui",
    "auth.signup": "Crie seu espaço",
    "auth.subtitle": "Escolha como prefere entrar.",
    "auth.email": "E-mail",
    "auth.password": "Senha",
    "auth.login": "Entrar",
    "auth.create": "Criar conta",
    "auth.demo": "Entrar como convidado",
    "auth.language": "Idioma e moeda",
    "auth.chooseLanguage": "Escolha antes de criar sua conta.",
    "top.switchTo": "Trocar para dólar americano e inglês",
    "dashboard.eyebrow": "Visão financeira",
    "dashboard.title": "Seu dinheiro em um só lugar.",
    "dashboard.subtitle": "Dados demonstrativos para você explorar todos os recursos.",
    "dashboard.connect": "Conectar banco",
    "dashboard.balance": "Saldo em contas",
    "dashboard.expenses": "Gastos no período",
    "dashboard.income": "Receitas no período",
    "dashboard.dollarAccount": "Conta em dólar",
    "dashboard.consolidated": "consolidado",
    "dashboard.history": "Histórico de 6 meses",
    "dashboard.accounts": "Suas contas",
    "dashboard.manage": "Gerenciar",
    "dashboard.monthlyTrend": "Evolução dos gastos",
    "dashboard.monthlyTotal": "Total mensal",
    "dashboard.byCategory": "Por categoria",
    "dashboard.whereSpent": "Onde o dinheiro foi usado",
    "dashboard.upcoming": "Próximos compromissos",
    "dashboard.billsAndRecurring": "Boletos e contas recorrentes",
    "dashboard.viewAll": "Ver todos",
    "dashboard.plan": "Planeje sem adivinhar",
    "dashboard.createPlan": "Criar um plano",
    "plan.title": "Planeje o que vem depois",
    "plan.subtitle": "Transforme intenção em um valor possível de guardar.",
    "plan.add": "Adicionar",
    "plan.vaults": "Cofrinhos",
    "plan.goals": "Metas",
    "plan.wishlist": "Desejos",
    "plan.assistant": "Instrutor",
    "expenses.title": "Gastos e movimentações",
    "expenses.subtitle": "Encontre, classifique e anote cada lançamento.",
    "expenses.add": "Adicionar lançamento",
    "expenses.budget": "Orçamento do mês",
    "expenses.newBudget": "Novo teto",
    "investments.title": "Investimentos",
    "investments.subtitle": "Patrimônio importado das instituições conectadas.",
    "more.title": "Organização e ajustes",
    "more.subtitle": "Boletos, contas recorrentes, cobranças e conexões.",
    "more.newBill": "Novo boleto",
    "assistant.open": "Abrir conversa com o Gênio",
    "assistant.title": "Converse com o Gênio",
    "assistant.description": "Uma visão rápida para organizar seu próximo passo financeiro.",
    "assistant.example": "Pergunte sobre gastos, metas ou quanto guardar.",
    "assistant.placeholder": "Ex.: Quanto posso guardar este mês?",
    "assistant.send": "Perguntar",
    "assistant.busy": "Analisando",
    "assistant.fallbackPositive": "Sua margem mensal estimada é {margin}. Uma reserva inicial de {reserve} pode ser um ponto de partida. Ajuste esse valor se houver despesas futuras.",
    "assistant.fallbackEmpty": "Ainda não há margem suficiente nos dados para sugerir um aporte. Revise as despesas essenciais antes de criar uma meta.",
  },
  "en-US": {
    "nav.home": "Home",
    "nav.expenses": "Expenses",
    "nav.plan": "Plan",
    "nav.investments": "Invest",
    "nav.more": "More",
    "auth.eyebrow": "ACCESS YOUR ACCOUNT",
    "auth.welcome": "Good to have you here",
    "auth.signup": "Create your space",
    "auth.subtitle": "Choose how you want to enter.",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.login": "Sign in",
    "auth.create": "Create account",
    "auth.demo": "Enter as guest",
    "auth.language": "Language and currency",
    "auth.chooseLanguage": "Choose before creating your account.",
    "top.switchTo": "Switch to Brazilian real and Portuguese",
    "dashboard.eyebrow": "Financial overview",
    "dashboard.title": "Your money in one place.",
    "dashboard.subtitle": "Demo data for you to explore every feature.",
    "dashboard.connect": "Connect bank",
    "dashboard.balance": "Account balance",
    "dashboard.expenses": "Expenses this period",
    "dashboard.income": "Income this period",
    "dashboard.dollarAccount": "Dollar account",
    "dashboard.consolidated": "consolidated",
    "dashboard.history": "6-month history",
    "dashboard.accounts": "Your accounts",
    "dashboard.manage": "Manage",
    "dashboard.monthlyTrend": "Expense trend",
    "dashboard.monthlyTotal": "Monthly total",
    "dashboard.byCategory": "By category",
    "dashboard.whereSpent": "Where money was spent",
    "dashboard.upcoming": "Upcoming commitments",
    "dashboard.billsAndRecurring": "Bills and recurring expenses",
    "dashboard.viewAll": "View all",
    "dashboard.plan": "Plan without guessing",
    "dashboard.createPlan": "Create a plan",
    "plan.title": "Plan what comes next",
    "plan.subtitle": "Turn intention into an achievable amount to save.",
    "plan.add": "Add",
    "plan.vaults": "Savings pots",
    "plan.goals": "Goals",
    "plan.wishlist": "Wishlist",
    "plan.assistant": "Coach",
    "expenses.title": "Expenses and activity",
    "expenses.subtitle": "Find, classify, and annotate every transaction.",
    "expenses.add": "Add transaction",
    "expenses.budget": "Monthly budget",
    "expenses.newBudget": "New limit",
    "investments.title": "Investments",
    "investments.subtitle": "Assets imported from connected institutions.",
    "more.title": "Organization and settings",
    "more.subtitle": "Bills, recurring expenses, charges, and connections.",
    "more.newBill": "New bill",
    "assistant.open": "Open a chat with Genie",
    "assistant.title": "Chat with Genie",
    "assistant.description": "A quick view to organize your next financial step.",
    "assistant.example": "Ask about expenses, goals, or how much to save.",
    "assistant.placeholder": "E.g.: How much can I save this month?",
    "assistant.send": "Ask",
    "assistant.busy": "Thinking",
    "assistant.fallbackPositive": "Your estimated monthly margin is {margin}. An initial reserve of {reserve} could be a starting point. Adjust it if future expenses are missing.",
    "assistant.fallbackEmpty": "There is not enough margin in the available data to suggest a contribution. Review essential expenses before creating a goal.",
  },
} as const;

type MessageKey = keyof typeof messages["pt-BR"];

type LocaleContextValue = LocalePreference & {
  flag: string;
  selectLanguage: (language: AppLanguage) => void;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const language = useSyncExternalStore(subscribeToLocale, getClientLanguage, () => DEFAULT_LOCALE.language);
  const preference = preferenceForLanguage(language);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function selectLanguage(language: AppLanguage) {
    const next = preferenceForLanguage(language);
    window.localStorage.setItem(LOCALE_STORAGE_KEY, JSON.stringify(next));
    document.documentElement.lang = next.language;
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  }

  const value: LocaleContextValue = {
    ...preference,
    flag: preference.language === "en-US" ? "🇺🇸" : "🇧🇷",
    selectLanguage,
    t: (key) => messages[preference.language][key],
  };

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale deve ser usado dentro de LocaleProvider.");
  return value;
}
