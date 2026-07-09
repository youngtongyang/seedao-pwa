import type { CreatableProposalType, ProposalCreatePermissions } from "./types";
import { CREATABLE_PROPOSAL_TYPES } from "./types";

export function canCreateProposalType(
  perms: ProposalCreatePermissions | null | undefined,
  type: CreatableProposalType,
): boolean {
  if (!perms) return false;
  if (perms.can_create_any) return true;
  return perms.create_types[type] === true;
}

export function hasAnyCreatePermission(
  perms: ProposalCreatePermissions | null | undefined,
): boolean {
  if (!perms) return false;
  if (perms.can_create_any) return true;
  return CREATABLE_PROPOSAL_TYPES.some((t) => perms.create_types[t] === true);
}
