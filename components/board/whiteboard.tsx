"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useMotionValue, useSpring } from "motion/react";
import { computeMagneticBias, computeSnapCommit } from "@/components/board/post-card";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { PostCard } from "@/components/board/post-card";
import { PostFocusOverlay } from "@/components/board/post-focus-overlay";
import { StickerPeel } from "@/components/board/sticker-peel";
import { InlineCardEditor } from "@/components/board/inline-card-editor";
import { EmptyState } from "@/components/board/empty-state";
import { LiquidGlass } from "@/components/ui/glasscn/liquid-glass";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBoardActions } from "@/contexts/board-actions-context";
import { getAvatarColor } from "@/lib/avatar-color";
import {
  PresenceCursors,
  type OnlineUser,
} from "@/components/board/presence-cursors";
import { OnlineAvatars } from "@/components/board/online-avatars";
import type {
  PostType,
  PostWithRelations,
  Profile,
  Sticker,
  TaskItem,
} from "@/lib/supabase/types";

// ─── Board & calendar layout constants ───────────────────────────────────────
const BOARD_W = 19200;
const BOARD_H = 10800;
const BOARD_BOUNDS = { w: BOARD_W, h: BOARD_H } as const;

interface WhiteboardProps {
  boardId: string;
  boardName?: string;
  initialPosts: PostWithRelations[];
  initialStickers: Sticker[];
  currentUserId: string;
  currentProfile: Profile | null;
  isOwner?: boolean;
  onExportReady?: (fn: () => Promise<void>) => void;
  activeFilters?: string[];
}

interface DraftCard {
  x: number;
  y: number;
  rotation: number;
  replyTo?: { postId: string; authorName: string };
}

export function Whiteboard({
  boardId,
  boardName,
  initialPosts,
  initialStickers,
  currentUserId,
  currentProfile,
  isOwner = false,
  onExportReady,
  activeFilters = [],
}: WhiteboardProps) {
  const [posts, setPosts] = useState<PostWithRelations[]>(initialPosts);
  const [draft, setDraft] = useState<DraftCard | null>(null);
  const [replyingToPostId, setReplyingToPostId] = useState<string | null>(null);
  const [focusedPost, setFocusedPost] = useState<PostWithRelations | null>(
    null,
  );
  const overlayPanelRef = useRef<HTMLDivElement | null>(null);
  const overlayBgRef = useRef<HTMLDivElement | null>(null);
  const overlayPillsRef = useRef<HTMLDivElement | null>(null);
  const activeCardRef = useRef<HTMLElement | null>(null);
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers);
  const [zoom, setZoom] = useState(100);
  const [isExporting, setIsExporting] = useState(false);
  const [stickerPickerOpen, setStickerPickerOpen] = useState(false);
  const [stickerSrcs, setStickerSrcs] = useState<string[]>([]);
  const [stickerLoading, setStickerLoading] = useState(false);
  const [stickerError, setStickerError] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>(
    {},
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const sizeRef = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);
  const postsRef = useRef(posts);
  const boardNameRef = useRef(boardName);
  const zoomRef = useRef(zoom);
  const currentProfileRef = useRef(currentProfile);
  const wheelZoomTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastCursorRef = useRef(0);
  const cursorTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  useEffect(() => {
    postsRef.current = posts;
  }, [posts]);
  useEffect(() => {
    boardNameRef.current = boardName;
  }, [boardName]);
  useEffect(() => {
    zoomRef.current = zoom;
  }, [zoom]);
  useEffect(() => {
    currentProfileRef.current = currentProfile;
  }, [currentProfile]);

  // Load sticker sources when picker opens; re-fetch if there was a previous error
  useEffect(() => {
    if (!stickerPickerOpen || (stickerSrcs.length > 0 && !stickerError)) return;
    setStickerLoading(true);
    setStickerError(false);
    fetch("/api/stickers")
      .then((r) => {
        if (!r.ok) throw new Error("stickers fetch failed");
        return r.json();
      })
      .then(setStickerSrcs)
      .catch(() => setStickerError(true))
      .finally(() => setStickerLoading(false));
  }, [stickerPickerOpen, stickerSrcs.length, stickerError]);

  // Auto-fit all posts into view on initial load
  useEffect(() => {
    if (initialPosts.filter((p) => !p.reply_to_post_id).length === 0) return;
    const id = setTimeout(handleFitAll, 150);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootPosts = useMemo(
    () => posts.filter((p) => !p.reply_to_post_id),
    [posts],
  );

  const repliesByParentId = useMemo(() => {
    const m = new Map<string, PostWithRelations[]>();
    posts.forEach((p) => {
      if (p.reply_to_post_id) {
        const arr = m.get(p.reply_to_post_id) ?? [];
        arr.push(p);
        m.set(p.reply_to_post_id, arr);
      }
    });
    return m;
  }, [posts]);

  const spawnDraft = useCallback(() => {
    const el = canvasRef.current;
    const scrollX = el?.scrollLeft ?? 0;
    const scrollY = el?.scrollTop ?? 0;
    const w = el?.clientWidth ?? 800;
    const h = el?.clientHeight ?? 600;
    const scale = zoomRef.current / 100;
    const isMobile = window.matchMedia("(max-width: 639px)").matches;
    const x =
      (scrollX + w / 2) / scale -
      144 +
      (isMobile ? 0 : (Math.random() - 0.5) * 80);
    const y =
      (scrollY + h / 3) / scale + (isMobile ? 0 : (Math.random() - 0.5) * 60);
    setDraft({ x, y, rotation: 0 });
  }, []);

  // Keyboard shortcut N
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      if ((e.key === "n" || e.key === "N") && !draft) {
        e.preventDefault();
        spawnDraft();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [draft, zoom]);

  // Pinch-to-zoom (trackpad) and Cmd/Ctrl+scroll (mouse wheel)
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    function onWheel(e: WheelEvent) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();

      const inner = innerRef.current;
      if (!inner || !container) return;

      // Disable transition for immediate visual response during gesture
      inner.style.transition = "none";

      const oldScale = zoomRef.current / 100;
      // Normalise across deltaMode (0=px, 1=lines, 2=pages) and clamp to avoid huge per-tick jumps
      const rawDelta =
        -e.deltaY * (e.deltaMode === 1 ? 15 : e.deltaMode === 2 ? 300 : 1);
      const clampedDelta = Math.max(-50, Math.min(50, rawDelta));
      const newZoom = Math.max(
        20,
        Math.min(200, zoomRef.current * Math.exp(clampedDelta * 0.01)),
      );
      const newScale = newZoom / 100;

      // Keep the canvas point under the cursor fixed
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const contentX = (container.scrollLeft + mouseX) / oldScale;
      const contentY = (container.scrollTop + mouseY) / oldScale;

      // Apply directly to DOM — no React re-render lag
      // Also carry any simultaneous pan delta (trackpad pinch+scroll at once)
      const panX = e.ctrlKey ? 0 : e.deltaX;
      const panY = e.ctrlKey ? 0 : e.deltaY;
      inner.style.transform = `scale(${newScale})`;
      if (sizeRef.current) {
        sizeRef.current.style.width = `${BOARD_W * newScale}px`;
        sizeRef.current.style.height = `${BOARD_H * newScale}px`;
      }
      container.scrollLeft = Math.max(0, contentX * newScale - mouseX + panX);
      container.scrollTop = Math.max(0, contentY * newScale - mouseY + panY);

      zoomRef.current = newZoom;

      // Debounce syncing to React state (updates toolbar readout)
      if (wheelZoomTimeout.current) clearTimeout(wheelZoomTimeout.current);
      wheelZoomTimeout.current = setTimeout(() => {
        setZoom(Math.round(zoomRef.current));
        if (innerRef.current) {
          innerRef.current.style.transition =
            "transform 550ms cubic-bezier(0.4, 0, 0.2, 1)";
        }
      }, 200);
    }

    container.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      container.removeEventListener("wheel", onWheel);
      if (wheelZoomTimeout.current) clearTimeout(wheelZoomTimeout.current);
    };
  }, []);

  // Supabase realtime
  useEffect(() => {
    const channel = supabase
      .channel(`board:${boardId}`, {
        config: { presence: { key: currentUserId } },
      })

      // ── Broadcast: position drops ──────────────────────────────────────────
      .on("broadcast", { event: "post-move" }, ({ payload }) => {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === payload.id
              ? { ...p, pos_x: payload.x, pos_y: payload.y }
              : p,
          ),
        );
      })
      .on("broadcast", { event: "sticker-move" }, ({ payload }) => {
        setStickers((prev) =>
          prev.map((s) =>
            s.id === payload.id
              ? { ...s, pos_x: payload.x, pos_y: payload.y }
              : s,
          ),
        );
      })

      // ── Broadcast: cursor positions ────────────────────────────────────────
      .on("broadcast", { event: "cursor" }, ({ payload }) => {
        if (payload.userId === currentUserId) return;
        setOnlineUsers((prev) => ({
          ...prev,
          [payload.userId]: {
            userId: payload.userId,
            displayName: prev[payload.userId]?.displayName ?? "",
            avatarUrl: prev[payload.userId]?.avatarUrl ?? null,
            avatarColor:
              prev[payload.userId]?.avatarColor ??
              getAvatarColor(payload.userId),
            cursor: { x: payload.x, y: payload.y },
          },
        }));
        clearTimeout(cursorTimeoutsRef.current[payload.userId]);
        cursorTimeoutsRef.current[payload.userId] = setTimeout(() => {
          setOnlineUsers((prev) =>
            prev[payload.userId]
              ? {
                  ...prev,
                  [payload.userId]: { ...prev[payload.userId], cursor: null },
                }
              : prev,
          );
        }, 3000);
      })

      // ── Presence: who's online ─────────────────────────────────────────────
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{
          userId: string;
          displayName: string;
          avatarUrl: string | null;
          avatarColor: string;
        }>();
        setOnlineUsers((prev) => {
          const next: Record<string, OnlineUser> = {};
          for (const presences of Object.values(state)) {
            for (const p of presences) {
              if (p.userId === currentUserId) continue;
              next[p.userId] = {
                userId: p.userId,
                displayName: p.displayName,
                avatarUrl: p.avatarUrl,
                avatarColor: p.avatarColor,
                cursor: prev[p.userId]?.cursor ?? null,
              };
            }
          }
          return next;
        });
      })
      .on("presence", { event: "leave" }, ({ key }) => {
        setOnlineUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })

      // ── Postgres Changes: posts ────────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "posts",
          filter: `board_id=eq.${boardId}`,
        },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setPosts((prev) => prev.filter((p) => p.id !== payload.old.id));
          } else if (payload.eventType === "INSERT") {
            const { data } = await supabase
              .from("posts")
              .select("*, author:profiles(*), task_items(*), reactions(*)")
              .eq("id", payload.new.id)
              .single();
            if (data) {
              setPosts((prev) =>
                prev.some((p) => p.id === payload.new.id)
                  ? prev
                  : [...prev, data as PostWithRelations],
              );
            }
          } else if (payload.eventType === "UPDATE") {
            // Positions come via Broadcast; only apply other field changes here
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pos_x, pos_y, ...rest } = payload.new as Record<
              string,
              unknown
            >;
            setPosts((prev) =>
              prev.map((p) =>
                p.id === payload.new.id ? { ...p, ...rest } : p,
              ),
            );
          }
        },
      )

      // ── Postgres Changes: stickers ─────────────────────────────────────────
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stickers",
          filter: `board_id=eq.${boardId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setStickers((prev) =>
              prev.some((s) => s.id === payload.new.id)
                ? prev
                : [...prev, payload.new as Sticker],
            );
          } else if (payload.eventType === "UPDATE") {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { pos_x, pos_y, ...rest } = payload.new as Record<
              string,
              unknown
            >;
            setStickers((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? { ...s, ...rest } : s,
              ),
            );
          } else if (payload.eventType === "DELETE") {
            setStickers((prev) => prev.filter((s) => s.id !== payload.old.id));
          }
        },
      )

      // ── Postgres Changes: task_items ───────────────────────────────────────
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_items" },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            setPosts((prev) =>
              prev.map((p) => ({
                ...p,
                task_items: p.task_items?.map((t) =>
                  t.id === payload.new.id ? { ...t, ...payload.new } : t,
                ),
              })),
            );
          } else if (payload.eventType === "INSERT") {
            setPosts((prev) =>
              prev.map((p) => {
                if (p.id !== payload.new.post_id) return p;
                if (p.task_items?.some((t) => t.id === payload.new.id))
                  return p;
                return {
                  ...p,
                  task_items: [...(p.task_items ?? []), payload.new as any],
                };
              }),
            );
          } else if (payload.eventType === "DELETE") {
            setPosts((prev) =>
              prev.map((p) => ({
                ...p,
                task_items: p.task_items?.filter(
                  (t) => t.id !== payload.old.id,
                ),
              })),
            );
          }
        },
      )

      .subscribe(async (status, err) => {
        if (err) console.error("[realtime] subscription error", err);
        if (status === "CHANNEL_ERROR")
          console.error("[realtime] channel error");
        if (status === "TIMED_OUT")
          console.warn("[realtime] subscription timed out");
        if (status === "SUBSCRIBED") {
          const profile = currentProfileRef.current;
          await channel.track({
            userId: currentUserId,
            displayName: profile?.display_name ?? "Unknown",
            avatarUrl: profile?.avatar_url ?? null,
            avatarColor: getAvatarColor(currentUserId),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      Object.values(cursorTimeoutsRef.current).forEach(clearTimeout);
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [boardId, currentUserId, supabase]);

  const handleReply = useCallback((post: PostWithRelations) => {
    if (window.matchMedia("(max-width: 639px)").matches) {
      setDraft({
        x: post.pos_x + 20,
        y: post.pos_y + 20,
        rotation: 0,
        replyTo: {
          postId: post.id,
          authorName: post.author?.display_name ?? "Unknown",
        },
      });
    } else {
      setReplyingToPostId(post.id);
    }
  }, []);

  const handleSaveReply = useCallback(
    async (data: { content: string; imageFile?: File | null }) => {
      const parentId = replyingToPostId;
      const parentPost = posts.find((p) => p.id === parentId);
      if (!parentPost) return;
      setReplyingToPostId(null);

      let imageUrl: string | null = null;
      if (data.imageFile) {
        const ext = data.imageFile.name.split(".").pop() ?? "jpg";
        const path = `${boardId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, data.imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: PostWithRelations = {
        id: optimisticId,
        board_id: boardId,
        author_id: currentUserId,
        author: currentProfile as any,
        type: "note",
        title: null,
        content: data.content || null,
        image_url: imageUrl,
        map_location: null,
        pos_x: parentPost.pos_x + 20,
        pos_y: parentPost.pos_y + 20,
        rotation: 0,
        reply_to_post_id: parentId,
        label_color: null,
        task_items: [],
        reactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPosts((prev) => [...prev, optimistic]);

      try {
        const { data: post, error } = await supabase
          .from("posts")
          .insert({
            board_id: boardId,
            author_id: currentUserId,
            type: "note",
            title: null,
            content: data.content || null,
            image_url: imageUrl,
            map_location: null,
            pos_x: parentPost.pos_x + 20,
            pos_y: parentPost.pos_y + 20,
            rotation: 0,
            reply_to_post_id: parentId,
          })
          .select("*, author:profiles(*)")
          .single();

        if (error) throw error;

        setPosts((prev) => {
          const mapped = prev.map((p) =>
            p.id === optimisticId
              ? ({
                  ...post,
                  task_items: [],
                  reactions: [],
                } as PostWithRelations)
              : p,
          );
          const seen = new Set<string>();
          return mapped.filter(
            (p) => !seen.has(p.id) && seen.add(p.id) !== undefined,
          );
        });
      } catch {
        setPosts((prev) => prev.filter((p) => p.id !== optimisticId));
        toast.error("Failed to save comment");
      }
    },
    [replyingToPostId, posts, boardId, currentUserId, currentProfile, supabase],
  );

  const handleSaveDraft = useCallback(
    async (data: {
      type: PostType;
      title: string;
      content: string;
      imageFile?: File | null;
      mapLocation?: import("@/lib/supabase/types").MapLocation | null;
    }) => {
      if (!draft) return;
      setDraft(null);

      let imageUrl: string | null = null;
      if (data.imageFile) {
        const ext = data.imageFile.name.split(".").pop() ?? "jpg";
        const path = `${boardId}/${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("post-images")
          .upload(path, data.imageFile);
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from("post-images")
            .getPublicUrl(path);
          imageUrl = urlData.publicUrl;
        }
      }

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: PostWithRelations = {
        id: optimisticId,
        board_id: boardId,
        author_id: currentUserId,
        author: currentProfile as any,
        type: data.type,
        title: data.title || null,
        content: data.type === "tasks" ? null : data.content || null,
        image_url: imageUrl,
        map_location: data.mapLocation ?? null,
        pos_x: draft.x,
        pos_y: draft.y,
        rotation: draft.rotation,
        reply_to_post_id: draft.replyTo?.postId ?? null,
        label_color: null,
        task_items: [],
        reactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPosts((prev) => [...prev, optimistic]);

      try {
        const { data: post, error } = await supabase
          .from("posts")
          .insert({
            board_id: boardId,
            author_id: currentUserId,
            type: data.type,
            title: data.title || null,
            content: data.type === "tasks" ? null : data.content || null,
            image_url: imageUrl,
            map_location: data.mapLocation ?? null,
            pos_x: draft.x,
            pos_y: draft.y,
            rotation: draft.rotation,
            reply_to_post_id: draft.replyTo?.postId ?? null,
          })
          .select("*, author:profiles(*)")
          .single();

        if (error) throw error;

        if (data.type === "tasks" && data.content.trim()) {
          const lines = data.content
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean);
          const { data: items } = await supabase
            .from("task_items")
            .insert(
              lines.map((label, position) => ({
                post_id: post.id,
                label,
                position,
              })),
            )
            .select();
          setPosts((prev) => {
            const mapped = prev.map((p) =>
              p.id === optimisticId
                ? ({
                    ...post,
                    task_items: items ?? [],
                    reactions: [],
                  } as PostWithRelations)
                : p,
            );
            // Deduplicate: realtime may have already added the real post before this runs
            const seen = new Set<string>();
            return mapped.filter(
              (p) => !seen.has(p.id) && seen.add(p.id) !== undefined,
            );
          });
        } else {
          setPosts((prev) => {
            const mapped = prev.map((p) =>
              p.id === optimisticId
                ? ({
                    ...post,
                    task_items: [],
                    reactions: [],
                  } as PostWithRelations)
                : p,
            );
            const seen = new Set<string>();
            return mapped.filter(
              (p) => !seen.has(p.id) && seen.add(p.id) !== undefined,
            );
          });
        }
      } catch {
        setPosts((prev) => prev.filter((p) => p.id !== optimisticId));
        toast.error("Failed to save post");
      }
    },
    [draft, boardId, currentUserId, currentProfile, supabase],
  );

  const handleDragEnd = useCallback(
    async (postId: string, x: number, y: number) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, pos_x: x, pos_y: y } : p)),
      );
      channelRef.current?.send({
        type: "broadcast",
        event: "post-move",
        payload: { id: postId, x, y },
      });
      await supabase
        .from("posts")
        .update({ pos_x: x, pos_y: y })
        .eq("id", postId);
    },
    [supabase],
  );

  const handleAddTaskItem = useCallback(
    async (postId: string, label: string) => {
      const post = posts.find((p) => p.id === postId);
      if (!post) return;
      const position = (post.task_items ?? []).length;
      const optimisticId = `opt-task-${Date.now()}`;
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                task_items: [
                  ...(p.task_items ?? []),
                  {
                    id: optimisticId,
                    post_id: postId,
                    label,
                    checked: false,
                    position,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  } as TaskItem,
                ],
              },
        ),
      );
      const { data, error } = await supabase
        .from("task_items")
        .insert({ post_id: postId, label, position })
        .select()
        .single();
      if (error) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id !== postId
              ? p
              : {
                  ...p,
                  task_items: (p.task_items ?? []).filter(
                    (t) => t.id !== optimisticId,
                  ),
                },
          ),
        );
        toast.error("Failed to add task");
      } else if (data) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id !== postId
              ? p
              : {
                  ...p,
                  task_items: (p.task_items ?? []).map((t) =>
                    t.id === optimisticId ? (data as TaskItem) : t,
                  ),
                },
          ),
        );
      }
    },
    [posts, supabase],
  );

  const handleTaskToggle = useCallback(
    async (taskId: string, checked: boolean) => {
      setPosts((prev) =>
        prev.map((p) => ({
          ...p,
          task_items: p.task_items?.map((t) =>
            t.id === taskId ? { ...t, checked } : t,
          ),
        })),
      );
      await supabase.from("task_items").update({ checked }).eq("id", taskId);
    },
    [supabase],
  );

  const handleDeletePost = useCallback(
    async (postId: string) => {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (!error) {
        setPosts((prev) =>
          prev.filter((p) => p.id !== postId && p.reply_to_post_id !== postId),
        );
      }
    },
    [supabase],
  );

  const handleSetColor = useCallback(
    async (postId: string, color: string | null) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, label_color: color as 'red' | 'blue' | 'green' | 'pink' | 'grey' | null } : p)),
      );
      await supabase.from("posts").update({ label_color: color }).eq("id", postId);
    },
    [supabase],
  );

  const doExport = useCallback(async () => {
    const allPosts = postsRef.current.filter((p) => !p.reply_to_post_id);
    if (allPosts.length === 0) {
      toast.error("Nothing to export");
      return;
    }

    const padding = 80;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;
    for (const post of allPosts) {
      const el = document.getElementById(`post-${post.id}`);
      const w = el?.offsetWidth ?? 288;
      const h = el?.offsetHeight ?? 200;
      minX = Math.min(minX, post.pos_x);
      minY = Math.min(minY, post.pos_y);
      maxX = Math.max(maxX, post.pos_x + w);
      maxY = Math.max(maxY, post.pos_y + h);
    }

    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 120));

    toast.loading("Exporting board…", { id: "export" });
    try {
      const { toPng } = await import("html-to-image");
      const fullPng = await toPng(innerRef.current!, {
        backgroundColor: "#f4f3f0",
        pixelRatio: 2,
      });

      const img = new Image();
      await new Promise<void>((res) => {
        img.onload = () => res();
        img.src = fullPng;
      });

      const scale = 2;
      const cropW = maxX - minX + padding * 2;
      const cropH = maxY - minY + padding * 2;
      const canvas = document.createElement("canvas");
      canvas.width = cropW * scale;
      canvas.height = cropH * scale;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(
        img,
        (minX - padding) * scale,
        (minY - padding) * scale,
        cropW * scale,
        cropH * scale,
        0,
        0,
        cropW * scale,
        cropH * scale,
      );

      const a = document.createElement("a");
      a.download = `${boardNameRef.current ?? "board"}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("Board exported!", { id: "export" });
    } catch (err) {
      console.error(err);
      toast.error("Export failed", { id: "export" });
    } finally {
      setIsExporting(false);
    }
  }, []);

  useEffect(() => {
    onExportReady?.(doExport);
  }, [onExportReady, doExport]);

  const handleFitAll = useCallback(() => {
    const container = canvasRef.current;
    if (!container || rootPosts.length === 0) return;

    const padding = 80;
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity;

    for (const post of rootPosts) {
      const cardEl = document.getElementById(`post-${post.id}`);
      const cardW = cardEl?.offsetWidth ?? 288;
      const cardH = cardEl?.offsetHeight ?? 160;
      minX = Math.min(minX, post.pos_x);
      minY = Math.min(minY, post.pos_y);
      maxX = Math.max(maxX, post.pos_x + cardW);
      maxY = Math.max(maxY, post.pos_y + cardH);
    }

    const contentW = maxX - minX + padding * 2;
    const contentH = maxY - minY + padding * 2;
    const scaleToFitW = container.clientWidth / contentW;
    const scaleToFitH = container.clientHeight / contentH;
    const targetScale = Math.min(scaleToFitW, scaleToFitH, 1.0);
    const targetZoom = Math.round(Math.max(20, targetScale * 100));
    const effectiveScale = targetZoom / 100;

    setZoom(targetZoom);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const scrollLeft = centerX * effectiveScale - container.clientWidth / 2;
    const scrollTop = centerY * effectiveScale - container.clientHeight / 2;
    container.scrollTo({
      left: Math.max(0, scrollLeft),
      top: Math.max(0, scrollTop),
      behavior: "smooth",
    });
  }, [rootPosts]);

  const { setActions } = useBoardActions();
  useEffect(() => {
    setActions({
      onNewPost: spawnDraft,
      onAddSticker: () => setStickerPickerOpen(true),
      onFitAll: handleFitAll,
      onZoomIn: () => setZoom((z) => Math.min(200, z + 10)),
      onZoomOut: () => setZoom((z) => Math.max(20, z - 10)),
      zoom,
    });
    return () => setActions(null);
  }, [zoom, spawnDraft, handleFitAll, setActions]);

  const handleFocusPost = useCallback(
    (post: PostWithRelations, cardEl: HTMLElement) => {
      const panelEl = overlayPanelRef.current;
      const bgEl = overlayBgRef.current;
      const pillsEl = overlayPillsRef.current;
      if (!panelEl) return;

      activeCardRef.current = cardEl;
      gsap.killTweensOf([cardEl, panelEl]);
      if (bgEl) gsap.killTweensOf(bgEl);
      if (pillsEl) gsap.killTweensOf(pillsEl.querySelectorAll("[data-pill]"));

      // Measure card before any DOM changes
      const rect = cardEl.getBoundingClientRect();
      const dx = rect.left + rect.width / 2 - window.innerWidth / 2;
      const dy = rect.top + rect.height / 2 - window.innerHeight / 2;
      const sx = rect.width / window.innerWidth;
      const sy = rect.height / window.innerHeight;
      // Border-radius compensation: at scale sx, (18/sx)*sx = 18px visual (matches rounded-[18px] card)
      const startRadius = 18 / sx;

      if (bgEl) gsap.set(bgEl, { opacity: 0 });
      gsap.set(cardEl, { opacity: 0, pointerEvents: "none" });
      flushSync(() => setFocusedPost(post));

      // pillsRef lives inside {post && ...} so it's only available after flushSync
      const pillsElAfter = overlayPillsRef.current;
      if (pillsElAfter)
        gsap.set(pillsElAfter.querySelectorAll("[data-pill]"), {
          opacity: 0,
          y: 8,
        });

      if (bgEl) {
        gsap.to(bgEl, {
          opacity: 1,
          duration: 0.5,
          ease: "expo.out",
          onComplete: () => {
            if (overlayPillsRef.current) {
              gsap.to(overlayPillsRef.current.querySelectorAll("[data-pill]"), {
                opacity: 1,
                y: 0,
                stagger: 0.1,
                duration: 0.22,
                ease: "power4.out",
                clearProps: "y",
              });
            }
          },
        });
      }

      gsap.fromTo(
        panelEl,
        {
          x: dx,
          y: dy,
          scaleX: sx,
          scaleY: sy,
          borderRadius: startRadius,
          transformOrigin: "center center",
        },
        {
          x: 0,
          y: 0,
          scaleX: 1,
          scaleY: 1,
          borderRadius: 0,
          duration: 0.5,
          ease: "expo.out",
        },
      );
    },
    [],
  );

  const handleClose = useCallback(() => {
    const panelEl = overlayPanelRef.current;
    const bgEl = overlayBgRef.current;
    const pillsEl = overlayPillsRef.current;
    const cardEl = activeCardRef.current;
    if (!panelEl) return;

    if (cardEl) gsap.killTweensOf(cardEl);
    gsap.killTweensOf(panelEl);
    if (bgEl) gsap.killTweensOf(bgEl);
    if (pillsEl) gsap.killTweensOf(pillsEl.querySelectorAll("[data-pill]"));

    const doMorphBack = () => {
      const rect = cardEl?.getBoundingClientRect();
      const dx = rect ? rect.left + rect.width / 2 - window.innerWidth / 2 : 0;
      const dy = rect ? rect.top + rect.height / 2 - window.innerHeight / 2 : 0;
      const sx = rect ? rect.width / window.innerWidth : 0.2;
      const sy = rect ? rect.height / window.innerHeight : 0.2;
      const endRadius = 18 / sx;

      gsap.to(panelEl, {
        x: dx,
        y: dy,
        scaleX: sx,
        scaleY: sy,
        borderRadius: endRadius,
        duration: 0.2,
        ease: "expo.in",
        onComplete: () => {
          gsap.set(panelEl, { display: "none" });
          gsap.set(panelEl, {
            clearProps: "x,y,scaleX,scaleY,borderRadius,transformOrigin",
          });
          if (cardEl) gsap.set(cardEl, { clearProps: "opacity,pointerEvents" });
          setFocusedPost(null);
          activeCardRef.current = null;
        },
      });
    };

    const pillNodes = pillsEl
      ? Array.from(pillsEl.querySelectorAll("[data-pill]"))
      : [];
    const fadeTargets = [bgEl, ...pillNodes].filter(Boolean) as Element[];

    if (fadeTargets.length > 0) {
      gsap.to(fadeTargets, {
        opacity: 0,
        duration: 0.18,
        ease: "power2.in",
        onComplete: doMorphBack,
      });
    } else {
      doMorphBack();
    }
  }, []);

  const handleJumpToPost = useCallback((postId: string) => {
    setTimeout(() => {
      const inner = innerRef.current;
      const container = canvasRef.current;
      if (!inner || !container) return;
      const el = inner.querySelector<HTMLElement>(`#post-${postId}`);
      if (!el) return;
      const scale = zoomRef.current / 100;
      container.scrollTo({
        left:
          (el.offsetLeft + el.offsetWidth / 2) * scale -
          container.clientWidth / 2,
        top:
          (el.offsetTop + el.offsetHeight / 2) * scale -
          container.clientHeight / 2,
        behavior: "smooth",
      });
    }, 280);
  }, []);

  const handleAddSticker = useCallback(
    async (imageSrc: string) => {
      const el = canvasRef.current;
      const scrollX = el?.scrollLeft ?? 0;
      const scrollY = el?.scrollTop ?? 0;
      const w = el?.clientWidth ?? 800;
      const h = el?.clientHeight ?? 600;
      const scale = zoomRef.current / 100;
      const pos_x =
        (scrollX + w / 2) / scale - 60 + (Math.random() - 0.5) * 120;
      const pos_y =
        (scrollY + h / 2) / scale - 60 + (Math.random() - 0.5) * 120;

      const rotation = Math.random() * 20 - 10; // -10° to +10°

      const { data, error } = await supabase
        .from("stickers")
        .insert({
          board_id: boardId,
          created_by: currentUserId,
          image_src: imageSrc,
          pos_x,
          pos_y,
          rotation,
        })
        .select()
        .single();

      if (!error && data) {
        setStickers((prev) => [...prev, data as Sticker]);
      }
    },
    [boardId, currentUserId, supabase],
  );

  const handleStickerDragEnd = useCallback(
    async (stickerId: string, x: number, y: number) => {
      setStickers((prev) =>
        prev.map((s) =>
          s.id === stickerId ? { ...s, pos_x: x, pos_y: y } : s,
        ),
      );
      channelRef.current?.send({
        type: "broadcast",
        event: "sticker-move",
        payload: { id: stickerId, x, y },
      });
      await supabase
        .from("stickers")
        .update({ pos_x: x, pos_y: y })
        .eq("id", stickerId);
    },
    [supabase],
  );

  const handleStickerDelete = useCallback(
    async (stickerId: string) => {
      setStickers((prev) => prev.filter((s) => s.id !== stickerId));
      await supabase.from("stickers").delete().eq("id", stickerId);
    },
    [supabase],
  );

  const handlePasteImage = useCallback(
    async (file: File) => {
      const el = canvasRef.current;
      const scrollX = el?.scrollLeft ?? 0;
      const scrollY = el?.scrollTop ?? 0;
      const w = el?.clientWidth ?? 800;
      const h = el?.clientHeight ?? 600;
      const scale = zoomRef.current / 100;
      // Place at viewport center with a small random offset to avoid stacking
      const pos_x = (scrollX + w / 2) / scale - 144 + (Math.random() - 0.5) * 80;
      const pos_y = (scrollY + h / 2) / scale - 100 + (Math.random() - 0.5) * 80;

      const toastId = `paste-${Date.now()}`;
      toast.loading("Adding image…", { id: toastId });

      const ext = file.name !== "image.png"
        ? (file.name.split(".").pop() ?? "jpg")
        : file.type.split("/")[1] ?? "jpg";
      const path = `${boardId}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("post-images")
        .upload(path, file);

      if (uploadError) {
        toast.error("Failed to upload image", { id: toastId });
        return;
      }

      const { data: urlData } = supabase.storage
        .from("post-images")
        .getPublicUrl(path);
      const imageUrl = urlData.publicUrl;

      const optimisticId = `opt-${Date.now()}`;
      const optimistic: PostWithRelations = {
        id: optimisticId,
        board_id: boardId,
        author_id: currentUserId,
        author: currentProfile as any,
        type: "note",
        title: null,
        content: null,
        image_url: imageUrl,
        map_location: null,
        pos_x,
        pos_y,
        rotation: 0,
        reply_to_post_id: null,
        label_color: null,
        task_items: [],
        reactions: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setPosts((prev) => [...prev, optimistic]);

      try {
        const { data: post, error } = await supabase
          .from("posts")
          .insert({
            board_id: boardId,
            author_id: currentUserId,
            type: "note",
            title: null,
            content: null,
            image_url: imageUrl,
            map_location: null,
            pos_x,
            pos_y,
            rotation: 0,
            reply_to_post_id: null,
          })
          .select("*, author:profiles(*)")
          .single();

        if (error) throw error;

        setPosts((prev) => {
          const mapped = prev.map((p) =>
            p.id === optimisticId
              ? ({ ...post, task_items: [], reactions: [] } as PostWithRelations)
              : p,
          );
          const seen = new Set<string>();
          return mapped.filter(
            (p) => !seen.has(p.id) && seen.add(p.id) !== undefined,
          );
        });

        toast.success("Image added", { id: toastId });
      } catch {
        setPosts((prev) => prev.filter((p) => p.id !== optimisticId));
        toast.error("Failed to save post", { id: toastId });
      }
    },
    [boardId, currentUserId, currentProfile, supabase],
  );

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement;
      // Let paste events in text fields pass through untouched
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) return;

      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItem = items.find((item) => item.type.startsWith("image/"));
      if (!imageItem) return;

      e.preventDefault();
      const file = imageItem.getAsFile();
      if (file) handlePasteImage(file);
    }

    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
  }, [handlePasteImage]);


  // Active drag info shared across all PostCards for bidirectional magnetic attraction
  const activeDragRef = useRef<{
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const getDraggedInfo = useCallback(() => activeDragRef.current, []);
  const setActiveDrag = useCallback((info: typeof activeDragRef.current) => {
    activeDragRef.current = info;
  }, []);
  const getZoom = useCallback(() => zoomRef.current, []);

  const getNearbyPostRects = useCallback((excludeId: string) => {
    return postsRef.current
      .filter((p) => !p.reply_to_post_id && p.id !== excludeId)
      .map((p) => {
        const el = document.getElementById(`post-${p.id}`);
        return {
          id: p.id,
          x: p.pos_x,
          y: p.pos_y,
          w: el?.offsetWidth ?? 288,
          h: el?.offsetHeight ?? 200,
        };
      });
  }, []);

  // ─── Multi-select & group drag ─────────────────────────────────────────────
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set())
  const selectedPostIdsRef = useRef(selectedPostIds)
  useEffect(() => { selectedPostIdsRef.current = selectedPostIds }, [selectedPostIds])
  const [isGroupDragging, setIsGroupDragging] = useState(false)
  const groupDeltaX = useMotionValue(0)
  const groupDeltaY = useMotionValue(0)
  const GROUP_BIAS_SPRING = { stiffness: 280, damping: 22, mass: 0.5 }
  const groupBiasX = useSpring(0, GROUP_BIAS_SPRING)
  const groupBiasY = useSpring(0, GROUP_BIAS_SPRING)

  // Marquee selection
  const [marqueeRect, setMarqueeRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const marqueeStartRef = useRef<{ clientX: number; clientY: number } | null>(null)
  const isMarqueeRef = useRef(false)

  // Group drag tracking
  const groupDragStartRef = useRef<{
    startClientX: number
    startClientY: number
  } | null>(null)

  const handleGroupDragStart = useCallback((postId: string, clientX: number, clientY: number) => {
    groupDragStartRef.current = { startClientX: clientX, startClientY: clientY }
    groupDeltaX.jump(0)
    groupDeltaY.jump(0)
    setIsGroupDragging(true)
  }, [groupDeltaX, groupDeltaY])

  const handleGroupDragMove = useCallback((clientX: number, clientY: number) => {
    if (!groupDragStartRef.current) return
    const scale = zoomRef.current / 100
    const dx = (clientX - groupDragStartRef.current.startClientX) / scale
    const dy = (clientY - groupDragStartRef.current.startClientY) / scale
    groupDeltaX.set(dx)
    groupDeltaY.set(dy)

    // Magnetic bias: find the strongest attraction among all selected posts vs non-selected
    const selected = selectedPostIdsRef.current
    const nonSelected = postsRef.current
      .filter(p => !p.reply_to_post_id && !selected.has(p.id))
      .map(p => {
        const el = document.getElementById(`post-${p.id}`)
        return { id: p.id, x: p.pos_x, y: p.pos_y, w: el?.offsetWidth ?? 288, h: el?.offsetHeight ?? 200 }
      })

    let bx = 0, by = 0, maxMag = 0
    postsRef.current.forEach(p => {
      if (!selected.has(p.id) || p.reply_to_post_id) return
      const el = document.getElementById(`post-${p.id}`)
      const pw = el?.offsetWidth ?? 288
      const ph = el?.offsetHeight ?? 200
      const bias = computeMagneticBias({ x: p.pos_x + dx, y: p.pos_y + dy }, pw, ph, nonSelected)
      const mag = Math.abs(bias.x) + Math.abs(bias.y)
      if (mag > maxMag) { maxMag = mag; bx = bias.x; by = bias.y }
    })
    groupBiasX.set(bx)
    groupBiasY.set(by)
  }, [groupDeltaX, groupDeltaY, groupBiasX, groupBiasY])

  const handleGroupDragEnd = useCallback(async (clientX: number, clientY: number, _cardEl: HTMLElement | null) => {
    if (!groupDragStartRef.current) return
    const scale = zoomRef.current / 100
    const dx = (clientX - groupDragStartRef.current.startClientX) / scale
    const dy = (clientY - groupDragStartRef.current.startClientY) / scale
    const selected = selectedPostIdsRef.current

    // Check for snap across all selected posts
    const nonSelected = postsRef.current
      .filter(p => !p.reply_to_post_id && !selected.has(p.id))
      .map(p => {
        const el = document.getElementById(`post-${p.id}`)
        return { id: p.id, x: p.pos_x, y: p.pos_y, w: el?.offsetWidth ?? 288, h: el?.offsetHeight ?? 200 }
      })

    let snapDx = 0, snapDy = 0, bestSnapDist = Infinity
    postsRef.current.forEach(p => {
      if (!selected.has(p.id) || p.reply_to_post_id) return
      const el = document.getElementById(`post-${p.id}`)
      const pw = el?.offsetWidth ?? 288
      const ph = el?.offsetHeight ?? 200
      const curPos = { x: p.pos_x + dx, y: p.pos_y + dy }
      const snap = computeSnapCommit(curPos, pw, ph, nonSelected)
      if (snap) {
        const cx = snap.x - curPos.x
        const cy = snap.y - curPos.y
        const dist = Math.abs(cx) + Math.abs(cy)
        if (dist < bestSnapDist) { bestSnapDist = dist; snapDx = cx; snapDy = cy }
      }
    })

    const finalDx = dx + snapDx
    const finalDy = dy + snapDy

    // Snap animation: jump bias to compensate for snap correction, then spring to 0
    if (snapDx !== 0 || snapDy !== 0) {
      const curBiasX = groupBiasX.get()
      const curBiasY = groupBiasY.get()
      groupDeltaX.set(finalDx)
      groupDeltaY.set(finalDy)
      groupBiasX.jump(curBiasX - snapDx)
      groupBiasY.jump(curBiasY - snapDy)
      groupBiasX.set(0)
      groupBiasY.set(0)
    }

    // Commit final positions optimistically
    const updates: { id: string; x: number; y: number }[] = []
    postsRef.current.forEach(p => {
      if (selected.has(p.id)) updates.push({ id: p.id, x: p.pos_x + finalDx, y: p.pos_y + finalDy })
    })
    setPosts(prev => prev.map(p => {
      const u = updates.find(u => u.id === p.id)
      return u ? { ...p, pos_x: u.x, pos_y: u.y } : p
    }))
    groupDragStartRef.current = null
    setIsGroupDragging(false)
    // Reset delta; motion batches this with rawX.set(finalPos) in the same frame
    groupDeltaX.jump(0)
    groupDeltaY.jump(0)
    groupBiasX.jump(0)
    groupBiasY.jump(0)

    // Persist to DB + broadcast
    for (const { id, x, y } of updates) {
      channelRef.current?.send({ type: "broadcast", event: "post-move", payload: { id, x, y } })
      supabase.from("posts").update({ pos_x: x, pos_y: y }).eq("id", id).then(() => {})
    }
  }, [groupDeltaX, groupDeltaY, groupBiasX, groupBiasY, supabase])

  const handleDeselect = useCallback(() => {
    setSelectedPostIds(new Set())
  }, [])

  // Escape key clears selection
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && selectedPostIdsRef.current.size > 0) {
        setSelectedPostIds(new Set())
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    // Only start marquee on empty canvas (not on posts/stickers)
    if (target.closest('[id^="post-"]') || target.closest('[data-sticker-peel]')) return
    marqueeStartRef.current = { clientX: e.clientX, clientY: e.clientY }
    isMarqueeRef.current = false
  }, [])

  const handleCanvasPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!marqueeStartRef.current) return
    const start = marqueeStartRef.current
    marqueeStartRef.current = null

    if (isMarqueeRef.current && marqueeRect) {
      // Hit-test posts against marquee in board coordinates
      const canvas = canvasRef.current
      if (!canvas) { setMarqueeRect(null); return }
      const rect = canvas.getBoundingClientRect()
      const scale = zoomRef.current / 100
      const toBoard = (cx: number, cy: number) => ({
        x: (cx - rect.left + canvas.scrollLeft) / scale,
        y: (cy - rect.top + canvas.scrollTop) / scale,
      })
      const rawX = marqueeRect.w < 0 ? marqueeRect.x + marqueeRect.w : marqueeRect.x
      const rawY = marqueeRect.h < 0 ? marqueeRect.y + marqueeRect.h : marqueeRect.y
      const rawW = Math.abs(marqueeRect.w)
      const rawH = Math.abs(marqueeRect.h)
      const tl = toBoard(rawX, rawY)
      const br = toBoard(rawX + rawW, rawY + rawH)
      const newSelected = new Set<string>()
      postsRef.current.forEach(p => {
        if (p.reply_to_post_id) return
        const el = document.getElementById(`post-${p.id}`)
        const pw = el?.offsetWidth ?? 288
        const ph = el?.offsetHeight ?? 200
        const px2 = p.pos_x + pw
        const py2 = p.pos_y + ph
        // Intersects marquee rect
        if (p.pos_x < br.x && px2 > tl.x && p.pos_y < br.y && py2 > tl.y) {
          newSelected.add(p.id)
        }
      })
      setSelectedPostIds(newSelected)
      setMarqueeRect(null)
    } else {
      // Plain click on canvas background — deselect
      const dx = Math.abs(e.clientX - start.clientX)
      const dy = Math.abs(e.clientY - start.clientY)
      if (dx < 4 && dy < 4) {
        setSelectedPostIds(new Set())
      }
      setMarqueeRect(null)
    }
    isMarqueeRef.current = false
  }, [marqueeRect])

  const handleCanvasPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Cursor broadcast (throttled)
      const now = Date.now();
      if (now - lastCursorRef.current >= 50) {
        lastCursorRef.current = now;
        const canvas = canvasRef.current;
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          const scale = zoomRef.current / 100;
          const x = (e.clientX - rect.left + canvas.scrollLeft) / scale;
          const y = (e.clientY - rect.top + canvas.scrollTop) / scale;
          channelRef.current?.send({
            type: "broadcast",
            event: "cursor",
            payload: { userId: currentUserId, x, y },
          });
        }
      }

      // Marquee update
      if (!marqueeStartRef.current) return
      const dx = e.clientX - marqueeStartRef.current.clientX
      const dy = e.clientY - marqueeStartRef.current.clientY
      if (!isMarqueeRef.current && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
        isMarqueeRef.current = true
      }
      if (isMarqueeRef.current) {
        setMarqueeRect({
          x: marqueeStartRef.current.clientX,
          y: marqueeStartRef.current.clientY,
          w: dx,
          h: dy,
        })
      }
    },
    [currentUserId],
  );

  const onlineUsersList = useMemo(
    () => Object.values(onlineUsers),
    [onlineUsers],
  );

  return (
    <div className="relative flex-1 flex flex-col overflow-hidden">
      <OnlineAvatars users={onlineUsersList} />

      {/* Marquee selection rectangle */}
      {marqueeRect && (
        <div
          className="pointer-events-none"
          style={{
            position: 'fixed',
            left: Math.min(marqueeRect.x, marqueeRect.x + marqueeRect.w),
            top: Math.min(marqueeRect.y, marqueeRect.y + marqueeRect.h),
            width: Math.abs(marqueeRect.w),
            height: Math.abs(marqueeRect.h),
            border: '1.5px solid rgba(28, 27, 25, 0.5)',
            backgroundColor: 'rgba(28, 27, 25, 0.06)',
            borderRadius: 6,
            zIndex: 100,
          }}
        />
      )}
      <div
        ref={canvasRef}
        className="relative flex-1 overflow-auto bg-[#D9D9D9]"
        style={{ touchAction: "pan-x pan-y", overscrollBehavior: "none" }}
        onPointerDown={handleCanvasPointerDown}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handleCanvasPointerUp}
      >
        {/* Size wrapper: sets scroll area to board dimensions × zoom so the
            full board is always navigable regardless of where posts are */}
        <div
          ref={sizeRef}
          style={{
            position: "relative",
            width: BOARD_W * (zoom / 100),
            height: BOARD_H * (zoom / 100),
          }}
        >
        <div
          ref={innerRef}
          className="relative"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: BOARD_W,
            height: BOARD_H,
            transform: isExporting ? "scale(1)" : `scale(${zoom / 100})`,
            transformOrigin: "top left",
            transition: isExporting
              ? "none"
              : "transform 550ms cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
{posts.length === 0 && !draft && (
            <EmptyState onCompose={spawnDraft} />
          )}

          {rootPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUserId}
              isBoardOwner={isOwner}
              allPosts={posts}
              onJumpToPost={handleJumpToPost}
              replies={repliesByParentId.get(post.id) ?? []}
              isReplying={post.id === replyingToPostId}
              onReplyDraftSave={handleSaveReply}
              onReplyDraftDiscard={() => setReplyingToPostId(null)}
              onDragEnd={handleDragEnd}
              boardBounds={BOARD_BOUNDS}
              getNearbyPostRects={getNearbyPostRects}
              getDraggedInfo={getDraggedInfo}
              setActiveDrag={setActiveDrag}
              getZoom={getZoom}
              onTaskToggle={handleTaskToggle}
              onAddTaskItem={handleAddTaskItem}
              onDelete={handleDeletePost}
              onSetColor={handleSetColor}
              isFiltered={activeFilters.length > 0 && post.label_color !== null
                ? !activeFilters.includes(post.label_color)
                : activeFilters.length > 0}
              isSelected={selectedPostIds.has(post.id)}
              selectedCount={selectedPostIds.size}
              isGroupDragging={isGroupDragging}
              groupDeltaX={groupDeltaX}
              groupDeltaY={groupDeltaY}
              groupBiasX={groupBiasX}
              groupBiasY={groupBiasY}
              onGroupDragStart={handleGroupDragStart}
              onGroupDragMove={handleGroupDragMove}
              onGroupDragEnd={handleGroupDragEnd}
              onDeselect={handleDeselect}
              onReply={handleReply}
              onFocusPost={handleFocusPost}
            />
          ))}

          {stickers.map((s) => (
            <StickerPeel
              key={s.id}
              imageSrc={s.image_src}
              posX={s.pos_x}
              posY={s.pos_y}
              rotate={s.rotation}
              peelDirection={s.rotation}
              createdBy={s.created_by}
              currentUserId={currentUserId}
              isBoardOwner={isOwner}
              onDragEnd={(x, y) => handleStickerDragEnd(s.id, x, y)}
              onDelete={() => handleStickerDelete(s.id)}
              getZoom={getZoom}
            />
          ))}

          {draft && (
            <InlineCardEditor
              x={draft.x}
              y={draft.y}
              rotation={draft.rotation}
              currentProfile={currentProfile}
              currentUserId={currentUserId}
              replyTo={draft.replyTo}
              posts={posts}
              onSave={handleSaveDraft}
              onDiscard={() => setDraft(null)}
            />
          )}

          <PresenceCursors users={onlineUsersList} />
        </div>
        </div>{/* end size wrapper */}

        <Dialog open={stickerPickerOpen} onOpenChange={setStickerPickerOpen}>
          <DialogContent
            showCloseButton={false}
            className="border-0 bg-transparent p-0 shadow-none ring-0 sm:max-w-xs top-1/3 translate-y-0"
          >
            <DialogHeader className="sr-only">
              <DialogTitle>Add Sticker</DialogTitle>
            </DialogHeader>
            <LiquidGlass className="rounded-[1.25rem] p-4">
              <p className="text-xs font-semibold text-foreground/50 uppercase tracking-wider mb-3">
                Stickers
              </p>
              {stickerLoading ? (
                <div className="flex flex-wrap gap-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-14 h-14 rounded-xl bg-foreground/10 animate-pulse"
                    />
                  ))}
                </div>
              ) : stickerError ? (
                <div className="py-2 flex flex-col gap-2">
                  <p className="text-sm text-foreground/40">
                    Failed to load stickers.
                  </p>
                  <button
                    type="button"
                    onClick={() => setStickerError(false)}
                    className="text-xs text-foreground/60 hover:text-foreground underline self-start"
                  >
                    Try again
                  </button>
                </div>
              ) : stickerSrcs.length === 0 ? (
                <p className="text-sm text-foreground/40 py-2">
                  No stickers yet.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {stickerSrcs.map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => {
                        handleAddSticker(src);
                        setStickerPickerOpen(false);
                      }}
                      className="w-14 h-14 rounded-xl bg-foreground/6 hover:bg-foreground/12 flex items-center justify-center transition-colors"
                    >
                      <img
                        src={src}
                        alt=""
                        className="w-10 h-10 object-contain"
                        draggable={false}
                      />
                    </button>
                  ))}
                </div>
              )}
            </LiquidGlass>
          </DialogContent>
        </Dialog>

        <PostFocusOverlay
          ref={overlayPanelRef}
          bgRef={overlayBgRef}
          pillsRef={overlayPillsRef}
          post={
            focusedPost
              ? (posts.find((p) => p.id === focusedPost.id) ?? focusedPost)
              : null
          }
          replies={
            focusedPost ? (repliesByParentId.get(focusedPost.id) ?? []) : []
          }
          currentUserId={currentUserId}
          allPosts={posts}
          onClose={handleClose}
          onTaskToggle={handleTaskToggle}
          onAddTaskItem={handleAddTaskItem}
          onReply={handleReply}
          onJumpToPost={(postId) => {
            handleClose();
            handleJumpToPost(postId);
          }}
        />
      </div>
    </div>
  );
}
