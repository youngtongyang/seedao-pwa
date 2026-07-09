"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { addBookmark, listBookmarks, removeBookmark } from "./client";

/**
 * 收藏状态的客户端小型外部 store（`useSyncExternalStore` 模式，与
 * `lib/account` 一致）：卡片、详情页按钮与个人主页共享同一份状态，
 * 切换后所有消费方立即同步，无需各自重新拉取。
 *
 * 服务端为唯一数据源（`/api/course/bookmarks`）；这里只是会话内缓存。
 * 会话 Cookie 为 httpOnly，客户端不可读，故「是否登录」只能通过请求
 * 是否返回 401 来探测（`anonymous` 态）。
 */

export type BookmarksState =
  | { status: "unloaded" }
  | { status: "loading" }
  /** 服务端返回 401 —— 当前浏览器没有会话（游客） */
  | { status: "anonymous" }
  | { status: "ready"; ids: ReadonlySet<string> }
  | { status: "error" };

const UNLOADED: BookmarksState = Object.freeze({ status: "unloaded" });

let state: BookmarksState = UNLOADED;
const listeners = new Set<() => void>();

function setState(next: BookmarksState) {
  state = next;
  for (const l of listeners) l();
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

const getSnapshot = () => state;
const getServerSnapshot = () => UNLOADED;

function load(): Promise<void> {
  setState({ status: "loading" });
  return listBookmarks().then((r) => {
    if (r.ok) {
      setState({ status: "ready", ids: new Set(r.data.bookmarks.map((b) => b.course_id)) });
    } else if (r.status === 401) {
      setState({ status: "anonymous" });
    } else {
      setState({ status: "error" });
    }
  });
}

/** 首个消费方挂载时惰性加载一次；`anonymous`/`error` 不自动重试。 */
function ensureLoaded() {
  if (state.status === "unloaded") void load();
}

/**
 * 乐观切换收藏。PUT/DELETE 幂等，重试与竞态安全；失败回滚并上报。
 * 非 `ready` 态也会试探性 PUT —— 新标签页可能带着客户端读不到的会话
 * Cookie；401 则交由 UI 提示登录。
 */
async function toggle(courseId: string): Promise<{ ok: boolean; unauthorized?: boolean }> {
  const cur = state;

  if (cur.status === "ready") {
    const has = cur.ids.has(courseId);
    const next = new Set(cur.ids);
    if (has) next.delete(courseId);
    else next.add(courseId);
    setState({ status: "ready", ids: next });
    const r = has ? await removeBookmark(courseId) : await addBookmark(courseId);
    if (!r.ok) {
      setState({ status: "ready", ids: cur.ids });
      return { ok: false, unauthorized: r.status === 401 };
    }
    return { ok: true };
  }

  const r = await addBookmark(courseId);
  if (r.ok) {
    // 成功说明有会话；拉全量列表进入 ready
    void load();
    return { ok: true };
  }
  if (r.status === 401 && cur.status !== "anonymous") setState({ status: "anonymous" });
  return { ok: false, unauthorized: r.status === 401 };
}

/** 退出登录时调用，回到未加载态。 */
export function resetBookmarks(): void {
  setState(UNLOADED);
}

export function useBookmarks(): {
  state: BookmarksState;
  isBookmarked: (courseId: string) => boolean;
  toggle: (courseId: string) => Promise<{ ok: boolean; unauthorized?: boolean }>;
  refresh: () => void;
} {
  const s = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    ensureLoaded();
  }, []);

  const isBookmarked = useCallback(
    (courseId: string) => s.status === "ready" && s.ids.has(courseId),
    [s],
  );
  const refresh = useCallback(() => {
    void load();
  }, []);

  return { state: s, isBookmarked, toggle, refresh };
}
