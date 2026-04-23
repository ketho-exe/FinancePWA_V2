export type AccountKind = "current" | "savings" | "credit";

export interface AccountRecord {
  id: string;
  user_id: string;
  name: string;
  kind: AccountKind;
  balance: number;
  overdraft_limit: number | null;
}
