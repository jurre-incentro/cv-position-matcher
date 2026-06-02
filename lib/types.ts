export type ScanStatus = "queued" | "processing" | "completed" | "failed";

export type CvSource = {
  id: string;
  drive_file_id: string;
  file_name: string;
  mime_type: string;
  modified_time: string | null;
  text_hash: string | null;
  last_scanned_at: string | null;
  created_at: string;
};

export type MatchResult = {
  id: string;
  scan_job_id: string;
  cv_source_id: string | null;
  candidate_name: string;
  role_title: string | null;
  score: number;
  rank: number;
  match_reasons: string[];
  risks: string[];
  missing_requirements: string[];
  evidence: string[];
  created_at: string;
  cv_sources?: Pick<CvSource, "file_name" | "drive_file_id"> | null;
};

export type ScanJob = {
  id: string;
  email_message_id: string | null;
  email_from: string | null;
  email_subject: string | null;
  request_summary: string | null;
  structured_request: StructuredPositionRequest | null;
  status: ScanStatus;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
  match_results?: MatchResult[];
};

export type StructuredPositionRequest = {
  title: string;
  seniority?: string;
  must_have_skills: string[];
  nice_to_have_skills: string[];
  domain_context?: string;
  location?: string;
  availability?: string;
  language_requirements: string[];
  contract_details?: string;
  summary: string;
};

export type CvDocument = {
  driveFileId: string;
  fileName: string;
  mimeType: string;
  modifiedTime: string | null;
  text: string;
  textHash: string;
};

export type CandidateMatch = {
  candidate_name: string;
  role_title?: string;
  score: number;
  match_reasons: string[];
  risks: string[];
  missing_requirements: string[];
  evidence: string[];
};
