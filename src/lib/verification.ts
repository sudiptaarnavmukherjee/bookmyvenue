export type KycDocument = {
  label: string;
  url: string;
};

export type CatererVerificationMeta = {
  status?: "REQUESTED" | "APPROVED" | "REJECTED";
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  ownerNote?: string;
  adminReviewNote?: string;
  kycDocuments: KycDocument[];
};

export function parseCatererVerificationNotes(notes?: string | null): CatererVerificationMeta | null {
  if (!notes) return null;

  try {
    const parsed = JSON.parse(notes) as Partial<CatererVerificationMeta>;
    if (!parsed || !Array.isArray(parsed.kycDocuments)) return null;

    const kycDocuments = parsed.kycDocuments.filter((doc): doc is KycDocument => {
      return !!doc && typeof doc.label === "string" && typeof doc.url === "string";
    });

    return {
      status: parsed.status,
      submittedAt: parsed.submittedAt,
      approvedAt: parsed.approvedAt,
      rejectedAt: parsed.rejectedAt,
      ownerNote: parsed.ownerNote,
      adminReviewNote: parsed.adminReviewNote,
      kycDocuments,
    };
  } catch {
    return null;
  }
}

export function buildCatererVerificationNotes(meta: CatererVerificationMeta): string {
  return JSON.stringify(meta);
}
