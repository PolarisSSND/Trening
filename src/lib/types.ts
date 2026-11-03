export type UserRole = 'trener' | 'clen';

export type AttendanceStatus = 'yes' | 'no' | 'maybe';

export type TrainingStatus = 'scheduled' | 'cancelled';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface Training {
  id: string;
  title: string;
  date_time: string;
  location: string;
  notes: string | null;
  status: TrainingStatus;
  created_by: string | null;
  created_at: string;
}

export interface Attendance {
  id: string;
  training_id: string;
  user_id: string;
  status: AttendanceStatus;
  reason: string | null;
  updated_at: string;
  profile?: Profile;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  training_id?: string | null;
  created_by: string;
  created_at: string;
  author_name?: string;
}

export interface AttendanceCounts {
  yes: number;
  no: number;
  maybe: number;
  unresponded: number;
  totalMembers: number;
}

export interface TrainingWithAttendance extends Training {
  attendances: Attendance[];
  myAttendance?: Attendance;
  counts: AttendanceCounts;
}
