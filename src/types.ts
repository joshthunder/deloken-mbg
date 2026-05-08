export type UserRole = 'user' | 'admin';
export type UserCategory = 'student' | 'parent' | 'teacher' | 'public';
export type ReportStatus = 'pending' | 'reviewed' | 'completed';

export interface User {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  school_name?: string;
  category: UserCategory;
  role: UserRole;
  created_at: string;
}

export interface School {
  id: string;
  name: string;
  province: string;
  city: string;
}

export interface SPPG {
  id: string;
  name: string;
  province: string;
  city: string;
  average_rating: number;
  total_reports: number;
}

export interface Report {
  id: string;
  user_id: string;
  school_id?: string;
  school_name: string;
  sppg_id?: string;
  sppg_name: string;
  province: string;
  city: string;
  report_date: string;
  food_delivered: boolean;
  on_time: boolean;
  portion_enough: boolean;
  rating: number;
  complaint?: string;
  photo_url?: string;
  status: ReportStatus;
  admin_note?: string;
  created_at: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}
