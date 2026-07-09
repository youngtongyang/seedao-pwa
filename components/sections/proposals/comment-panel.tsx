"use client";

import { Loader2, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthed } from "@/lib/auth/use-auth";
import { useT } from "@/lib/i18n";
import { createComment } from "@/lib/proposals/client";
import { appendComment, countComments } from "@/lib/proposals/comments";
import { formatDateTime } from "@/lib/proposals/constants";
import { buildProposalHistory, type HistoryLabels } from "@/lib/proposals/lifecycle";
import type { ProposalCommentItem, ProposalDetail } from "@/lib/proposals/types";
import { cn } from "@/lib/utils";
import { ProposalHistoryPanel } from "./proposal-history-panel";

function commentAuthorLabel(c: ProposalCommentItem): string {
  if (c.sns_name) return c.sns_name;
  if (c.author_wallet) return `${c.author_wallet.slice(0, 6)}…${c.author_wallet.slice(-4)}`;
  return "—";
}

function CommentComposer({
  value,
  onChange,
  onSubmit,
  onCancel,
  placeholder,
  submitting,
  showCancel,
  cancelLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  placeholder: string;
  submitting: boolean;
  showCancel?: boolean;
  cancelLabel?: string;
}) {
  return (
    <form onSubmit={(e) => void onSubmit(e)} className="flex gap-2">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
        ?
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl"
        autoFocus={showCancel}
      />
      {showCancel && onCancel && (
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      <Button type="submit" size="icon" disabled={submitting || !value.trim()}>
        {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
      </Button>
    </form>
  );
}

function CommentItem({
  comment,
  nested = false,
  commentable,
  authed,
  replyToId,
  replyText,
  submitting,
  onReply,
  onCancelReply,
  onReplyTextChange,
  onSubmitReply,
  labels,
}: {
  comment: ProposalCommentItem;
  nested?: boolean;
  commentable: boolean;
  authed: boolean;
  replyToId: number | null;
  replyText: string;
  submitting: boolean;
  onReply: (comment: ProposalCommentItem) => void;
  onCancelReply: () => void;
  onReplyTextChange: (value: string) => void;
  onSubmitReply: (e: React.FormEvent, parentId: number) => void;
  labels: {
    reply: string;
    replyPlaceholder: string;
    cancelReply: string;
  };
}) {
  const label = commentAuthorLabel(comment);
  const initial = (comment.sns_name || label).slice(0, 1).toUpperCase();
  const isReplying = replyToId === comment.id;

  return (
    <li className={cn(nested && "mt-3")}>
      <div className="flex gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {initial}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <span className="text-sm font-semibold">{label}</span>
            <time className="text-xs text-muted-foreground">
              {formatDateTime(comment.commented_at)}
            </time>
          </div>
          <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
          {commentable && authed && (
            <button
              type="button"
              onClick={() => onReply(comment)}
              className="mt-1.5 text-xs font-medium text-primary hover:underline"
            >
              {labels.reply}
            </button>
          )}
        </div>
      </div>

      {isReplying && (
        <div className="mt-3 ml-12 sm:ml-12">
          <CommentComposer
            value={replyText}
            onChange={onReplyTextChange}
            onSubmit={(e) => onSubmitReply(e, comment.id)}
            onCancel={onCancelReply}
            placeholder={labels.replyPlaceholder.replace("{name}", label)}
            submitting={submitting}
            showCancel
            cancelLabel={labels.cancelReply}
          />
        </div>
      )}

      {comment.replies && comment.replies.length > 0 && (
        <ul className="mt-3 ml-6 space-y-3 border-l-2 border-border pl-4 sm:ml-9 sm:pl-5">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              nested
              commentable={commentable}
              authed={authed}
              replyToId={replyToId}
              replyText={replyText}
              submitting={submitting}
              onReply={onReply}
              onCancelReply={onCancelReply}
              onReplyTextChange={onReplyTextChange}
              onSubmitReply={onSubmitReply}
              labels={labels}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function CommentPanel({
  proposalId,
  proposal,
  comments: initial,
  commentable = true,
  onCommentAdded,
}: {
  proposalId: number;
  proposal: ProposalDetail;
  comments: ProposalCommentItem[];
  /** When false (e.g. draft), hide the comment form. */
  commentable?: boolean;
  onCommentAdded: (c: ProposalCommentItem) => void;
}) {
  const t = useT();
  const authed = useAuthed();
  const [comments, setComments] = useState(initial);
  const [text, setText] = useState("");
  const [replyToId, setReplyToId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setComments(initial);
  }, [initial]);

  const commentCount = countComments(comments);

  const historyCount = buildProposalHistory(
    proposal,
    t.proposals.historyEvents as HistoryLabels,
  ).length;

  const replyLabels = {
    reply: t.proposals.detail.reply,
    replyPlaceholder: t.proposals.detail.replyPlaceholder,
    cancelReply: t.proposals.detail.cancelReply,
  };

  function handleReply(comment: ProposalCommentItem) {
    setReplyToId(comment.id);
    setReplyText("");
  }

  function cancelReply() {
    setReplyToId(null);
    setReplyText("");
  }

  async function submitComment(content: string, parentId?: number) {
    if (!content.trim() || !authed || !commentable) return;
    setSubmitting(true);
    const result = await createComment(proposalId, {
      content: content.trim(),
      parent_id: parentId,
    });
    setSubmitting(false);
    if (result.ok) {
      setComments((prev) => appendComment(prev, result.data));
      onCommentAdded(result.data);
      if (parentId) {
        cancelReply();
      } else {
        setText("");
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitComment(text);
  }

  async function handleSubmitReply(e: React.FormEvent, parentId: number) {
    e.preventDefault();
    await submitComment(replyText, parentId);
  }

  return (
    <div className="rounded-2xl border border-border bg-card">
      <Tabs defaultValue="comments">
        <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent px-5 pt-4">
          <TabsTrigger value="comments" className="rounded-full data-[state=active]:text-primary">
            {commentCount} {t.proposals.detail.comments}
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-full data-[state=active]:text-primary">
            {historyCount} {t.proposals.detail.history}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="mt-0 p-5">
          {comments.length === 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">{t.proposals.detail.noComments}</p>
          ) : (
            <ul className="mb-4 space-y-4">
              {comments.map((c) => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  commentable={commentable}
                  authed={authed}
                  replyToId={replyToId}
                  replyText={replyText}
                  submitting={submitting}
                  onReply={handleReply}
                  onCancelReply={cancelReply}
                  onReplyTextChange={setReplyText}
                  onSubmitReply={handleSubmitReply}
                  labels={replyLabels}
                />
              ))}
            </ul>
          )}

          {commentable && authed ? (
            <CommentComposer
              value={text}
              onChange={setText}
              onSubmit={handleSubmit}
              placeholder={t.proposals.detail.commentPlaceholder}
              submitting={submitting && replyToId === null}
            />
          ) : !commentable ? (
            <p className="text-sm text-muted-foreground">{t.proposals.detail.commentsUnavailable}</p>
          ) : (
            <p className="text-sm text-muted-foreground">{t.proposals.detail.loginToComment}</p>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-0 p-5">
          <ProposalHistoryPanel proposal={proposal} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
