/**
 * Seed count of community members that predates the on-platform user table
 * (early Feishu/WeChat members never written to the DB). The live backend user
 * count is added on top of this — see `app/api/stats/members/route.ts`. The
 * label itself is UI chrome and lives in `lib/i18n` as `hero.statMembers`.
 */
export const MEMBER_BASE = 776;
