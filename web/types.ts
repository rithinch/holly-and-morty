
export enum ProfileStatus {
  INCOMPLETE = "incomplete",
  PARTIAL = "partial",
  COMPLETE = "complete",
  VERIFIED = "verified",
  NEW = "new"
}

export enum EmploymentStatus {
  EMPLOYED = "employed",
  SELF_EMPLOYED = "self_employed",
  UNEMPLOYED = "unemployed",
  RETIRED = "retired",
  STUDENT = "student"
}

export enum MaritalStatus {
  SINGLE = "single",
  MARRIED = "married",
  CIVIL_PARTNERSHIP = "civil_partnership",
  DIVORCED = "divorced",
  WIDOWED = "widowed"
}

export enum RiskAttitude {
  VERY_LOW = "very_low",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  VERY_HIGH = "very_high"
}

export enum TimeHorizon {
  SHORT_TERM = "short_term",
  MEDIUM_TERM = "medium_term",
  LONG_TERM = "long_term"
}

export interface PersonalInfo {
  title?: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  date_of_birth?: string;
  national_insurance_number?: string;
  marital_status?: MaritalStatus;
  number_of_dependents?: number;
  email?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  postcode?: string;
  country?: string;
}

export interface EmploymentDetails {
  employment_status?: EmploymentStatus;
  employer_name?: string;
  job_title?: string;
  industry?: string;
  years_in_current_role?: number;
  annual_salary?: number;
  bonus_income?: number;
  dividend_income?: number;
  rental_income?: number;
  pension_income?: number;
  other_income?: number;
  total_annual_income?: number;
  tax_code?: string;
  expected_tax_bracket?: string;
}

export interface Asset {
  asset_type: string;
  description?: string;
  current_value?: number;
  provider?: string;
}

export interface Liability {
  liability_type: string;
  description?: string;
  outstanding_balance?: number;
  monthly_payment?: number;
}

export interface MonthlyExpenses {
  housing_mortgage_rent?: number;
  utilities?: number;
  groceries?: number;
  transport?: number;
  total_monthly_expenses?: number;
}

export interface FinancialPosition {
  assets: Asset[];
  liabilities: Liability[];
  monthly_expenses?: MonthlyExpenses;
  total_assets?: number;
  total_liabilities?: number;
  net_worth?: number;
  monthly_surplus?: number;
}

export interface FinancialGoal {
  goal_type: string;
  description: string;
  target_amount?: number;
  target_date?: string;
  priority?: number;
  time_horizon?: TimeHorizon;
}

export interface GoalsAndObjectives {
  primary_goals: FinancialGoal[];
  retirement_age?: number;
  desired_retirement_income?: number;
  legacy_wishes?: string;
}

export interface RiskProfile {
  risk_attitude?: RiskAttitude;
  capacity_for_loss?: string;
  investment_experience?: string;
  investment_knowledge_level?: string;
  risk_score?: number;
}

export interface HealthInfo {
  smoker?: boolean;
  health_conditions?: string;
  life_insurance_coverage?: number;
  critical_illness_coverage?: number;
  has_will?: boolean;
}

export interface UserProfile {
  id?: string;
  user_id: string;
  status: ProfileStatus;
  created_at?: string;
  updated_at?: string;
  personal_info: PersonalInfo;
  employment?: EmploymentDetails;
  financial_position?: FinancialPosition;
  goals_and_objectives?: GoalsAndObjectives;
  risk_profile?: RiskProfile;
  health_and_protection?: HealthInfo;
  notes?: string;
  advisor_notes?: string;
}

export type AuthStep = 'PHONE' | 'PROFILE_SETUP' | 'SUCCESS';

export interface ApiError {
  message: string;
  status?: number;
}
