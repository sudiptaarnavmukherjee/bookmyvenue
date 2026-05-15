export type PartnerStatus = "LISTED" | "CLAIMED" | "VERIFIED" | "PREFERRED_PARTNER";

export function getPartnerStatus(input: {
  isVerified?: boolean | null;
  bookingEnabled?: boolean | null;
  isAdminListed?: boolean | null;
  taggedToOwnerId?: string | null;
}): PartnerStatus {
  const isVerified = Boolean(input.isVerified);
  const bookingEnabled = Boolean(input.bookingEnabled);
  const isAdminListed = input.isAdminListed ?? true;
  const hasClaimOwner = Boolean(input.taggedToOwnerId);

  if (isVerified && bookingEnabled) {
    return "PREFERRED_PARTNER";
  }

  if (isVerified) {
    return "VERIFIED";
  }

  // Owner-created listings or admin-listed inventories tagged to an owner are treated as claimed.
  if (!isAdminListed || hasClaimOwner) {
    return "CLAIMED";
  }

  return "LISTED";
}

export function getPartnerStatusLabel(status: PartnerStatus): string {
  switch (status) {
    case "LISTED":
      return "Listed";
    case "CLAIMED":
      return "Claimed";
    case "VERIFIED":
      return "Verified";
    case "PREFERRED_PARTNER":
      return "Preferred Partner";
    default:
      return "Listed";
  }
}
