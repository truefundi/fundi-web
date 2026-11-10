import { env } from '@/config/env';
import { api, ApiError, unwrap } from '../client';

export type DocumentReviewStatus = 'REVIEWING' | 'ACCEPTED' | 'DENIED';

export interface TechnicianDocumentRecord {
  id: string;
  technicianId: string;
  type: 'NATIONAL_ID' | 'CERTIFICATE';
  title: string;
  certificateType?: string | null;
  originalFileName: string;
  mimeType: string;
  status: 'SUBMITTED' | DocumentReviewStatus;
  reviewNote?: string | null;
  category?: { id: string; name: string } | null;
  customCategoryName?: string | null;
}

export interface VerificationChecklistItem {
  key: string;
  label: string;
  satisfied: boolean;
  detail: string;
}

export interface VerificationChecklistResponse {
  complete: boolean;
  items: VerificationChecklistItem[];
}

export const technicianDocumentsApi = {
  async uploadProfilePicture(technicianId: string, file: File): Promise<void> {
    const form = new FormData();
    form.append('file', file);
    await unwrap(api.put(`/admin/technicians/${technicianId}/picture`, form));
  },

  async uploadDocument(technicianId: string, file: File, type: 'NATIONAL_ID' | 'CERTIFICATE', title: string, options?: { certificateType?: string; customCategoryName?: string }): Promise<TechnicianDocumentRecord> {
    const form = new FormData();
    form.append('file', file);
    form.append('type', type);
    form.append('title', title);
    if (options?.certificateType) form.append('certificateType', options.certificateType);
    if (options?.customCategoryName) form.append('customCategoryName', options.customCategoryName);
    return unwrap(api.post(`/admin/technicians/${technicianId}/documents`, form));
  },

  async list(technicianId: string): Promise<TechnicianDocumentRecord[]> {
    return unwrap(api.get(`/admin/technicians/${technicianId}/documents`));
  },

  async checklist(technicianId: string): Promise<VerificationChecklistResponse> {
    return unwrap(api.get(`/admin/technicians/${technicianId}/verification-checklist`));
  },

  async review(
    documentId: string,
    status: DocumentReviewStatus,
    reviewNote?: string,
  ): Promise<TechnicianDocumentRecord> {
    return unwrap(
      api.patch(`/admin/technician-documents/${documentId}/review`, {
        status,
        ...(reviewNote ? { reviewNote } : {}),
      }),
    );
  },

  async download(documentId: string): Promise<Blob> {
    const response = await fetch(`${env.apiUrl}/admin/technician-documents/${documentId}/download`, {
      credentials: 'include',
      headers: { 'ngrok-skip-browser-warning': 'true' },
    });
    if (!response.ok) {
      throw new ApiError(`Could not open the document (${response.status}).`, response.status);
    }
    return response.blob();
  },
};
