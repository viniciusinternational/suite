export type AccountTransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer_in'
  | 'transfer_out'
  | 'payment';

export interface Account {
  id: string;
  name: string;
  code: string;
  currency: string;
  balance: number;
  allowNegativeBalance: boolean;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  type: AccountTransactionType;
  amount: number;
  currency: string;
  description?: string;
  reference?: string;
  paymentId?: string;
  fromAccountId?: string;
  toAccountId?: string;
  createdById?: string;
  createdAt: string;
  account?: Pick<Account, 'id' | 'name' | 'code'>;
  payment?: { id: string; totalAmount: number; status: string };
}

export interface AccountAnalytics {
  balance: number;
  inflowTotal: number;
  outflowTotal: number;
  transactionCount: number;
  paymentCount: number;
  balanceByPeriod?: { period: string; balance: number }[];
}
