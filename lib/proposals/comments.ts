import type { ProposalCommentItem } from "./types";

export function countComments(comments: ProposalCommentItem[]): number {
  return comments.reduce(
    (total, c) => total + 1 + (c.replies?.length ? countComments(c.replies) : 0),
    0,
  );
}

/** Insert a new comment or nest it under parent_id in the tree. */
export function appendComment(
  comments: ProposalCommentItem[],
  item: ProposalCommentItem,
): ProposalCommentItem[] {
  if (!item.parent_id) return [...comments, item];

  return comments.map((c) => {
    if (c.id === item.parent_id) {
      return { ...c, replies: [...(c.replies ?? []), item] };
    }
    if (c.replies?.length) {
      return { ...c, replies: appendComment(c.replies, item) };
    }
    return c;
  });
}
