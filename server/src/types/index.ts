export interface CalculationRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  session_id: string;
  data: string;
}

export interface CalculationSummaryRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  article_count: number;
}

export interface CreateCalculationBody {
  name: string;
  session_id: string;
  articles?: unknown[];
}

export interface UpdateCalculationBody {
  name?: string;
  session_id: string;
  articles?: unknown[];
}
