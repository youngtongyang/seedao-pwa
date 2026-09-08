import type { CreatableProposalType, ProposalCreatePermissions } from "./types";
import { CREATABLE_PROPOSAL_TYPES } from "./types";

/**
 * Per-type create gate. Prefer explicit `create_types[type]` when present;
 * only fall back to `can_create_any` when that key is omitted (admin /
 * legacy payloads). Never let `can_create_any` override an explicit `false`.
 */
export function canCreateProposalType(
  perms: ProposalCreatePermissions | null | undefined,
  type: CreatableProposalType,
): boolean {
  if (!perms) return false;
  if (Object.prototype.hasOwnProperty.call(perms.create_types ?? {}, type)) {
    return perms.create_types[type] === true;
  }
  return perms.can_create_any === true;
}

export function hasAnyCreatePermission(
  perms: ProposalCreatePermissions | null | undefined,
): boolean {
  if (!perms) return false;
  return CREATABLE_PROPOSAL_TYPES.some((t) => canCreateProposalType(perms, t));
}
