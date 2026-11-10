import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { technicianDocumentsApi } from '@/lib/api';
import type { DocumentReviewStatus } from '@/lib/api/endpoints/technician-documents';

export const technicianDocumentKeys = {
  all: ['technician-documents'] as const,
  list: (technicianId: string) => ['technician-documents', 'list', technicianId] as const,
  checklist: (technicianId: string) => ['technician-documents', 'checklist', technicianId] as const,
};

export function useTechnicianDocuments(technicianId: string) {
  return useQuery({
    queryKey: technicianDocumentKeys.list(technicianId),
    queryFn: () => technicianDocumentsApi.list(technicianId),
  });
}

export function useTechnicianVerificationChecklist(technicianId: string) {
  return useQuery({
    queryKey: technicianDocumentKeys.checklist(technicianId),
    queryFn: () => technicianDocumentsApi.checklist(technicianId),
  });
}

export function useReviewTechnicianDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ documentId, status, reviewNote }: { documentId: string; status: DocumentReviewStatus; reviewNote?: string }) =>
      technicianDocumentsApi.review(documentId, status, reviewNote),
    onSuccess: (document) => {
      queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.list(document.technicianId) });
      queryClient.invalidateQueries({ queryKey: technicianDocumentKeys.all });
    },
  });
}
