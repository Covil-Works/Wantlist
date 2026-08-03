"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowLeft, ArrowUpRight, CircleMinus, Copy, Eye, EyeOff, Globe2, GripVertical, Home, MailPlus, Medal, MoreHorizontal, Pencil, Plus, Search, Settings, Share2, SlidersHorizontal, Trash2, UserPlus, X } from "lucide-react";
import { api, ApiError } from "@/lib/client-api";
import { useAuth } from "@/components/auth-provider";
import { ItemForm } from "@/components/item-form";
import type { Item } from "@/lib/types";
import { getStoreOptions, resolveStore } from "@/lib/store-catalog";
import { searchItems } from "@/lib/item-search";

type ItemView = "grouped" | "all" | "available" | "reserved";
type ItemOrder = "newest" | "oldest" | "name-asc" | "name-desc";
const visibilityOptions = [
  { value: "public", label: "Pública", description: "Qualquer pessoa com o link pode ver.", icon: Globe2 },
  { value: "invited", label: "Somente convidados", description: "Apenas pessoas convidadas acessam.", icon: UserPlus },
  { value: "private", label: "Somente eu", description: "A lista fica privada para você.", icon: EyeOff },
];
const wishlistCache = new Map<string, any>();

function visibilityLabel(value: string) {
  return visibilityOptions.find((option) => option.value === value)?.label || value;
}

function SortablePodiumItem({ item, position, onRemove }: { item: Item; position: 1 | 2 | 3; onRemove: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });

  return (
    <article
      className={`item-row podium-edit-item${isDragging ? " dragging" : ""}`}
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      {item.image_url
        ? <Image className="item-row-image" src={item.image_url} alt="" width={88} height={88} unoptimized />
        : <div className="item-row-image" />}
      <div className="item-row-copy">
        <div className="item-row-title-line">
          <strong className="item-row-title" title={item.name}>{item.name}</strong>
          <span className={`podium-badge podium-badge-${position}`} aria-label={`${position}º lugar no pódio`}>
            <Medal size={15} aria-hidden />{position}º
          </span>
        </div>
        {item.domain && <span className="muted">{item.domain}</span>}
      </div>
      <div className="podium-edit-item-actions">
        <button
          className="icon-button danger"
          type="button"
          title="Remover do pódio"
          aria-label={`Remover ${item.name} do pódio`}
          onClick={() => onRemove(item.id)}
        >
          <CircleMinus size={19} aria-hidden />
        </button>
        <button
          className="icon-button podium-drag-handle"
          type="button"
          title={`Arrastar ${item.name}`}
          aria-label={`Arrastar ${item.name} para outra posição`}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={20} aria-hidden />
        </button>
      </div>
    </article>
  );
}

function ContentNotFound() {
  return (
    <main className="page not-found-page">
      <section className="not-found-panel">
        <strong>404</strong>
        <h1>Conteúdo não encontrado</h1>
        <p>Este conteúdo não existe ou não está disponível.</p>
        <Link className="button primary" href="/"><Home size={18} aria-hidden />Voltar para a página inicial</Link>
      </section>
    </main>
  );
}

function ContentLoadError({ status, onRetry }: { status?: number; onRetry: () => void }) {
  const hasHttpStatus = status !== undefined;
  const message = status !== undefined && status >= 500
    ? "O servidor encontrou um problema temporário. Tente novamente em alguns instantes."
    : status === 429
      ? "Foram feitas muitas tentativas. Aguarde um instante e tente novamente."
      : hasHttpStatus
        ? "A solicitação não pôde ser concluída. Tente carregar a lista novamente."
        : "Verifique sua conexão e tente carregar a lista novamente.";

  return (
    <main className="page not-found-page">
      <section className="not-found-panel" role="alert">
        <strong>{hasHttpStatus ? `Erro ${status}` : "Falha de conexão"}</strong>
        <h1>Não foi possível carregar a lista</h1>
        <p>{message}</p>
        <div className="row">
          <button className="button primary" type="button" onClick={onRetry}>Tentar novamente</button>
          <Link className="button" href="/"><Home size={18} aria-hidden />Ir para o início</Link>
        </div>
      </section>
    </main>
  );
}

export default function PublicWishlistPage() {
  const { code } = useParams<{ code: string }>();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pendingAction = searchParams.get("action");
  const highlightedNewItemId = searchParams.get("novo");
  const cacheKey = `${code}:${user?.uid ?? "guest"}`;
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<{ status?: number } | null>(null);
  const [showItemForm, setShowItemForm] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [shareCopied, setShareCopied] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showListControls, setShowListControls] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isEditingPodium, setIsEditingPodium] = useState(false);
  const [isSavingPodium, setIsSavingPodium] = useState(false);
  const [podiumDraft, setPodiumDraft] = useState<Item[]>([]);
  const [itemView, setItemView] = useState<ItemView>("grouped");
  const [itemOrder, setItemOrder] = useState<ItemOrder>("newest");
  const [storeFilter, setStoreFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [newItemIds, setNewItemIds] = useState<Set<string>>(new Set());
  const [viewedNewItemIds, setViewedNewItemIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [pendingViewRevision, setPendingViewRevision] = useState<number | null>(null);
  const shareMenuRef = useRef<HTMLDivElement>(null);
  const listControlsRef = useRef<HTMLDivElement>(null);
  const itemListRef = useRef<HTMLElement>(null);
  const pendingActionHandledRef = useRef(false);
  const dataRef = useRef<any>(null);
  const requestRef = useRef(0);
  const requestControllerRef = useRef<AbortController | null>(null);
  const highlightedItemRef = useRef(highlightedNewItemId);
  const requestedHighlightRef = useRef<string | null>(null);
  const scrolledHighlightRef = useRef<string | null>(null);
  const acknowledgedRevisionRef = useRef(0);
  highlightedItemRef.current = highlightedNewItemId;
  const podiumSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const load = useCallback(async () => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    const hadData = Boolean(dataRef.current);
    setError(null);
    setRefreshError("");
    setIsRefreshing(hadData);
    try {
      const nextData = await api(`/api/wishlist/${code}`, { signal: controller.signal });
      if (requestRef.current !== requestId || controller.signal.aborted) return;
      dataRef.current = nextData;
      wishlistCache.set(cacheKey, nextData);
      setData(nextData);
      setNewItemIds((current) => {
        const next = new Set(current);
        for (const item of nextData.items as Item[]) {
          if (item.is_new || item.id === highlightedItemRef.current) next.add(item.id);
        }
        return next;
      });
      setPendingViewRevision(nextData.tracksUpdates ? Number(nextData.viewRevision) : null);
    }
    catch (loadError) {
      if (controller.signal.aborted || requestRef.current !== requestId) return;
      if (dataRef.current) {
        setRefreshError("Não foi possível atualizar a wishlist agora. Os dados exibidos foram mantidos.");
      } else {
        setError(loadError instanceof ApiError ? { status: loadError.status } : {});
      }
    } finally {
      if (requestRef.current === requestId) setIsRefreshing(false);
    }
  }, [cacheKey, code]);

  useEffect(() => {
    if (authLoading) return;
    requestControllerRef.current?.abort();
    requestRef.current += 1;
    const cachedData = wishlistCache.get(cacheKey) ?? null;
    dataRef.current = cachedData;
    setData(cachedData);
    setError(null);
    setRefreshError("");
    setNewItemIds(new Set());
    setViewedNewItemIds(new Set());
    setPendingViewRevision(null);
    acknowledgedRevisionRef.current = 0;
    requestedHighlightRef.current = null;
    scrolledHighlightRef.current = null;
    load();
    return () => requestControllerRef.current?.abort();
  }, [authLoading, cacheKey, code, load, user?.uid]);

  useEffect(() => {
    const revision = pendingViewRevision ?? -1;
    if (revision < 0 || acknowledgedRevisionRef.current >= revision) return;
    let cancelled = false;
    let frame = 0;
    let observer: IntersectionObserver | null = null;

    function acknowledgeVisibleRevision() {
      if (cancelled || document.visibilityState !== "visible" || !itemListRef.current) return;
      acknowledgedRevisionRef.current = revision;
      frame = window.requestAnimationFrame(() => {
        api(`/api/follow/${code}`, {
          method: "PATCH",
          body: JSON.stringify({ viewRevision: revision }),
        }).then(() => {
          window.dispatchEvent(new Event("notifications:refresh"));
        }).catch(() => {
          if (!cancelled) acknowledgedRevisionRef.current = Math.max(revision - 1, 0);
        });
      });
    }

    function observeItemList() {
      if (cancelled || document.visibilityState !== "visible" || !itemListRef.current) return;
      observer?.disconnect();
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer?.disconnect();
          acknowledgeVisibleRevision();
        }
      }, { threshold: 0.01 });
      observer.observe(itemListRef.current);
    }

    observeItemList();
    document.addEventListener("visibilitychange", observeItemList);
    return () => {
      cancelled = true;
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      document.removeEventListener("visibilitychange", observeItemList);
    };
  }, [code, pendingViewRevision]);

  useEffect(() => {
    if (!highlightedNewItemId || !data) return;
    const targetKey = `${code}:${highlightedNewItemId}`;
    const targetExists = data.items.some((item: Item) => item.id === highlightedNewItemId);
    if (!targetExists) {
      if (requestedHighlightRef.current !== targetKey) {
        requestedHighlightRef.current = targetKey;
        load();
      }
      return;
    }

    setNewItemIds((current) => new Set(current).add(highlightedNewItemId));
    if (scrolledHighlightRef.current === targetKey) return;
    scrolledHighlightRef.current = targetKey;
    window.requestAnimationFrame(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.getElementById(`wishlist-item-${highlightedNewItemId}`)
        ?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "center" });
    });
  }, [code, data, highlightedNewItemId, load]);

  const updateData = useCallback((updater: (current: any) => any) => {
    setData((current: any) => {
      const next = updater(current);
      dataRef.current = next;
      if (next) wishlistCache.set(cacheKey, next);
      return next;
    });
  }, [cacheKey]);

  useEffect(() => {
    if (
      pendingAction !== "follow"
      || !user
      || !data
      || data.isOwner
      || data.wishlist.visibility !== "public"
      || pendingActionHandledRef.current
    ) return;

    pendingActionHandledRef.current = true;

    async function followAfterAuthentication() {
      try {
        if (!data.following) {
          await api(`/api/follow/${code}`, { method: "POST" });
          updateData((current) => current ? { ...current, following: true, tracksUpdates: true } : current);
        }
        router.replace(`/w/${code}`);
      } catch {
        pendingActionHandledRef.current = false;
      }
    }

    followAfterAuthentication();
  }, [code, data, pendingAction, router, updateData, user]);

  useEffect(() => {
    if (!showShareMenu && !showVisibilityMenu) return;

    function closeMenusOnOutsideClick(event: PointerEvent) {
      if (!(event.target instanceof Node)) return;

      const clickedShareMenu = shareMenuRef.current?.contains(event.target);

      if (!clickedShareMenu) {
        setShowShareMenu(false);
        setShowVisibilityMenu(false);
      }
    }

    document.addEventListener("pointerdown", closeMenusOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeMenusOnOutsideClick);
  }, [showShareMenu, showVisibilityMenu]);

  useEffect(() => {
    if (!showListControls) return;

    function closeListControlsOnOutsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !listControlsRef.current?.contains(event.target)) {
        setShowListControls(false);
      }
    }

    document.addEventListener("pointerdown", closeListControlsOnOutsideClick);
    return () => document.removeEventListener("pointerdown", closeListControlsOnOutsideClick);
  }, [showListControls]);

  async function authAction(fn: () => Promise<void>, action?: "follow") {
    if (!user) {
      const nextPath = `/w/${code}${action ? `?action=${action}` : ""}`;
      router.push(`/login?next=${encodeURIComponent(nextPath)}`);
      return;
    }
    await fn();
  }

  async function toggleFollowing() {
    const wasFollowing = Boolean(data.following);
    updateData((current) => current ? { ...current, following: !wasFollowing } : current);
    try {
      await api(`/api/follow/${code}`, { method: wasFollowing ? "DELETE" : "POST" });
      if (wasFollowing) {
        setNewItemIds(new Set());
        setViewedNewItemIds(new Set());
      }
      updateData((current) => current ? {
        ...current,
        tracksUpdates: !wasFollowing,
      } : current);
    } catch (followError) {
      updateData((current) => current ? { ...current, following: wasFollowing } : current);
      throw followError;
    }
  }

  function handleItemSaved(item: Item) {
    setShowItemForm(false);
    updateData((current) => current ? {
      ...current,
      wishlist: {
        ...current.wishlist,
        items_revision: Math.max(Number(current.wishlist.items_revision) || 0, Number(item.created_revision)),
      },
      items: [{ ...item, reserved: false, reserved_by_me: false, is_new: false }, ...current.items],
      viewRevision: Math.max(Number(current.viewRevision) || 0, Number(item.created_revision)),
    } : current);
  }

  function toggleItem(id: string) {
    if (expandedItemId !== id) {
      setViewedNewItemIds((current) => new Set(current).add(id));
    }
    setExpandedItemId((current) => current === id ? null : id);
  }

  function toggleShareMenu() {
    setShowShareMenu((value) => !value);
    setShowVisibilityMenu(false);
  }

  async function changeVisibility(visibility: string) {
    setShowVisibilityMenu(false);
    const response = await api("/api/wishlist", { method: "PATCH", body: JSON.stringify({ title: data.wishlist.title, visibility }) });
    updateData((current) => current ? { ...current, wishlist: response.wishlist } : current);
  }

  async function invite() {
    setShowShareMenu(false);
    setInviteCopied(false);
    const res = await api("/api/invites", { method: "POST" });
    setInviteUrl(`${location.origin}${res.url}`);
    setShowInviteModal(true);
  }

  async function copyInvite() {
    await navigator.clipboard.writeText(inviteUrl);
    setInviteCopied(true);
    window.setTimeout(() => setInviteCopied(false), 1800);
  }

  async function copyShareLink() {
    await navigator.clipboard.writeText(`${location.origin}/w/${data.wishlist.public_code}`);
    setShareCopied(true);
    window.setTimeout(() => setShareCopied(false), 1800);
  }

  async function reserve(id: string) {
    await api(`/api/items/${id}/reserve`, { method: "POST" });
    updateData((current) => current ? {
      ...current,
      items: current.items.map((item: Item) => item.id === id ? { ...item, reserved: true, reserved_by_me: true } : item),
    } : current);
  }
  async function unreserve(id: string) {
    await api(`/api/items/${id}/reserve`, { method: "DELETE" });
    updateData((current) => current ? {
      ...current,
      items: current.items.map((item: Item) => item.id === id ? { ...item, reserved: false, reserved_by_me: false } : item),
    } : current);
  }
  async function setPodiumPosition(id: string, position: 1 | 2 | 3 | null) {
    await api(`/api/items/${id}/podium`, { method: "PATCH", body: JSON.stringify({ position }) });
    updateData((current) => {
      if (!current) return current;
      const previousPosition = current.items.find((item: Item) => item.id === id)?.podium_position ?? null;
      return {
        ...current,
        items: current.items.map((item: Item) => {
          if (item.id === id) return { ...item, podium_position: position };
          if (position === null && previousPosition && item.podium_position && item.podium_position > previousPosition) {
            return { ...item, podium_position: (item.podium_position - 1) as 1 | 2 | 3 };
          }
          return item;
        }),
      };
    });
  }

  function startPodiumEditing() {
    const items = data.items
      .filter((item: Item) => item.podium_position && !item.reserved)
      .sort((first: Item, second: Item) => (first.podium_position || 0) - (second.podium_position || 0));

    setItemView("grouped");
    setStoreFilter("all");
    setSearchQuery("");
    setShowSearch(false);
    setPodiumDraft(items);
    setIsEditingPodium(true);
  }

  function cancelPodiumEditing() {
    setPodiumDraft([]);
    setIsEditingPodium(false);
  }

  function handlePodiumDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setPodiumDraft((items) => {
      const previousIndex = items.findIndex((item) => item.id === active.id);
      const nextIndex = items.findIndex((item) => item.id === over.id);
      return arrayMove(items, previousIndex, nextIndex);
    });
  }

  async function savePodiumOrder() {
    setIsSavingPodium(true);
    try {
      await api(`/api/wishlist/${code}/podium`, {
        method: "PATCH",
        body: JSON.stringify({ itemIds: podiumDraft.map((item) => item.id) }),
      });
      const positions = new Map(podiumDraft.map((item, index) => [item.id, (index + 1) as 1 | 2 | 3]));
      updateData((current) => current ? {
        ...current,
        items: current.items.map((item: Item) => ({
          ...item,
          podium_position: positions.get(item.id) ?? null,
        })),
      } : current);
      setIsEditingPodium(false);
      setPodiumDraft([]);
    } finally {
      setIsSavingPodium(false);
    }
  }
  async function remove(id: string) {
    if (confirm("Excluir este item definitivamente?")) {
      await api(`/api/items/${id}`, { method: "DELETE" });
      updateData((current) => current ? {
        ...current,
        items: current.items.filter((item: Item) => item.id !== id),
      } : current);
      setNewItemIds((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      if (expandedItemId === id) setExpandedItemId(null);
    }
  }

  if (!data && !error) return <main className="page"><div className="empty">Carregando wishlist.</div></main>;
  if (error?.status === 404) return <ContentNotFound />;
  if (error) return <ContentLoadError status={error.status} onRetry={load} />;

  const shareUrl = typeof location === "undefined" ? `/w/${data.wishlist.public_code}` : `${location.origin}/w/${data.wishlist.public_code}`;
  const storeOptions = getStoreOptions(data.items);
  const filteredItems = data.items.filter((item: Item) => {
    const matchesStore = storeFilter === "all" || (item.domain !== null && resolveStore(item.domain).id === storeFilter);
    const matchesStatus = itemView === "grouped" || itemView === "all"
      || (itemView === "available" && !item.reserved)
      || (itemView === "reserved" && item.reserved);
    return matchesStore && matchesStatus;
  });
  const orderedItems = [...filteredItems].sort((first: Item, second: Item) => {
    const firstPodiumPosition = first.podium_position;
    const secondPodiumPosition = second.podium_position;

    if (firstPodiumPosition || secondPodiumPosition) {
      if (!firstPodiumPosition) return 1;
      if (!secondPodiumPosition) return -1;
      return firstPodiumPosition - secondPodiumPosition;
    }

    if (itemOrder === "name-asc" || itemOrder === "name-desc") {
      const comparison = first.name.localeCompare(second.name, "pt-BR", { sensitivity: "base", numeric: true });
      return itemOrder === "name-asc" ? comparison : -comparison;
    }

    const comparison = new Date(second.created_at).getTime() - new Date(first.created_at).getTime();
    return itemOrder === "newest" ? comparison : -comparison;
  });
  const sortedItems = searchItems(orderedItems, searchQuery).sort((first: Item, second: Item) => {
    if (!first.podium_position && !second.podium_position) return 0;
    if (!first.podium_position) return 1;
    if (!second.podium_position) return -1;
    return first.podium_position - second.podium_position;
  });
  const availableItems = sortedItems.filter((item: Item) => !item.reserved);
  const reservedItems = sortedItems.filter((item: Item) => item.reserved);
  const occupiedPodiumPositions = new Set(data.items.map((item: Item) => item.podium_position).filter(Boolean));
  const nextPodiumPosition = ([1, 2, 3] as const).find((position) => !occupiedPodiumPositions.has(position)) ?? null;

  const activeControlCount = Number(itemView !== "grouped") + Number(itemOrder !== "newest") + Number(storeFilter !== "all");
  const emptyItemsMessage = searchQuery.trim() ? "Nenhum item corresponde à busca." : "Nenhum item corresponde aos filtros.";
  const itemSections = itemView === "grouped"
    ? [
        { id: "available-items", title: "Disponíveis", items: availableItems },
        { id: "reserved-items", title: "Reservados", items: reservedItems },
      ]
    : [{
        id: `${itemView}-items`,
        title: itemView === "all" ? "Todos os itens" : itemView === "available" ? "Disponíveis" : "Reservados",
        items: sortedItems,
      }];

  function openItemForm() {
    setShowItemForm(true);
    window.setTimeout(() => {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.querySelector<HTMLElement>(".item-form")?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }, 0);
  }
  function renderItem(item: Item) {
    const expanded = expandedItemId === item.id;
    const hasDescription = Boolean(item.description);
    const hasExpandedDetails = hasDescription || expanded;
    const detailsId = `item-details-${item.id}`;
    const isNew = !viewedNewItemIds.has(item.id) && newItemIds.has(item.id);

    return (
      <article
        className={`item-row${expanded ? " expanded" : ""}${isNew ? " new" : ""}`}
        id={`wishlist-item-${item.id}`}
        key={item.id}
      >
        {isNew && <span className="badge item-new-badge">NOVO</span>}
        {item.image_url ? <Image className="item-row-image" src={item.image_url} alt="" width={88} height={88} unoptimized /> : <div className="item-row-image" />}
        <div className="item-row-copy">
          <div className="item-row-title-line">
            <strong className="item-row-title" title={item.name}>{item.name}</strong>
            {item.podium_position && (
              <span className={`podium-badge podium-badge-${item.podium_position}`} aria-label={`${item.podium_position}º lugar no pódio`}>
                <Medal size={15} aria-hidden />{item.podium_position}º
              </span>
            )}
          </div>
          {item.domain && <span className="muted">{item.domain}</span>}
          {expanded && <span className={`badge item-status ${item.reserved ? "reserved" : "available"} item-row-copy-status`}>{item.reserved_by_me ? "Seu" : item.reserved ? "Reservado" : "Disponível"}</span>}
        </div>
        <div className="item-row-actions">
          <button className="icon-button" title={expanded ? "Recolher detalhes" : "Ver detalhes"} aria-label={expanded ? "Recolher detalhes" : `Ver detalhes de ${item.name}`} aria-expanded={expanded} aria-controls={hasExpandedDetails ? detailsId : undefined} onClick={() => toggleItem(item.id)}><MoreHorizontal size={18} aria-hidden /></button>
          {item.original_url && <a className="icon-button" href={item.original_url} target="_blank" rel="noreferrer" title="Ver item" aria-label={`Ver ${item.name}`}><ArrowUpRight size={18} aria-hidden /></a>}
          {!data.isOwner && !item.reserved && <button className="button primary compact" onClick={() => authAction(() => reserve(item.id))}>Reservar</button>}
          {!data.isOwner && item.reserved_by_me && <button className="button compact" onClick={() => authAction(() => unreserve(item.id))}>Desfazer</button>}
          {data.isOwner && item.reserved && <button className="icon-button danger" title="Remover reserva" aria-label="Remover reserva" onClick={() => confirm("Remover a reserva deste item?") && authAction(() => unreserve(item.id))}><EyeOff size={18} aria-hidden /></button>}
          {data.isOwner && <button className="icon-button danger" title="Excluir item" aria-label={`Excluir ${item.name}`} onClick={() => remove(item.id)}><Trash2 size={18} aria-hidden /></button>}
        </div>
        {expanded && hasExpandedDetails && (
          <div className="item-row-details" id={detailsId}>
            {hasDescription && <p>{item.description}</p>}
            {data.isOwner && (
              <div className="podium-action">
                {item.podium_position ? (
                  <button className="button compact" type="button" onClick={() => setPodiumPosition(item.id, null)}>
                    <Medal size={16} aria-hidden />Remover do pódio
                  </button>
                ) : (
                  <button
                    className="button compact"
                    type="button"
                    disabled={item.reserved || nextPodiumPosition === null}
                    title={item.reserved ? "Apenas itens disponíveis podem entrar no pódio" : nextPodiumPosition === null ? "O pódio já está completo" : undefined}
                    onClick={() => nextPodiumPosition && setPodiumPosition(item.id, nextPodiumPosition)}
                  >
                    <Medal size={16} aria-hidden />{nextPodiumPosition === null ? "Pódio completo" : "Adicionar ao pódio"}
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </article>
    );
  }

  function clearListControls() {
    setItemView("grouped");
    setItemOrder("newest");
    setStoreFilter("all");
  }

  function closeSearch() {
    setShowSearch(false);
    setSearchQuery("");
  }

  return (
    <main className="page stack wishlist-page" aria-busy={isRefreshing}>
      {isRefreshing && <span className="sr-only" role="status">Atualizando wishlist.</span>}
      <div className="wishlist-topbar">
        <Link className="icon-button page-nav-button" href={user ? "/painel" : "/"} title={user ? "Voltar ao painel" : "Voltar para a página inicial"} aria-label={user ? "Voltar ao painel" : "Voltar para a página inicial"}>
          <ArrowLeft size={18} aria-hidden />
        </Link>
        <div className="wishlist-actions" aria-label="Ações da wishlist">
          {data.isOwner && (
            <div className="wishlist-owner-actions" ref={shareMenuRef}>
              <div className="menu-wrap">
                <button className="icon-button" title="Compartilhar" aria-label="Compartilhar" aria-expanded={showShareMenu} aria-controls="share-menu" onClick={toggleShareMenu}><Share2 size={18} aria-hidden /></button>
                {showShareMenu && (
                  <div className="dropdown-menu share-menu wishlist-topbar-menu dropdown-menu-viewport-centered" id="share-menu" role="menu">
                    <strong>Compartilhar wishlist</strong>
                    <div className="share-link-plain">{shareUrl}</div>
                    <button className="menu-option" onClick={copyShareLink} role="menuitem">
                      <Copy size={18} aria-hidden />
                      <span><strong>Copiar link</strong><small>Copie o link público da lista.</small></span>
                    </button>
                    {shareCopied && <p className="share-copy-feedback" role="status">Link copiado.</p>}
                    <button className="menu-option" onClick={invite} role="menuitem">
                      <MailPlus size={18} aria-hidden />
                      <span><strong>Convidar amigo</strong><small>Gere um convite para acesso à lista.</small></span>
                    </button>
                  </div>
                )}
              </div>
              <div className="menu-wrap">
                <button className="icon-button" title="Alterar visibilidade" aria-label="Alterar visibilidade" aria-expanded={showVisibilityMenu} onClick={() => { setShowVisibilityMenu((value) => !value); setShowShareMenu(false); }}><Eye size={18} aria-hidden /></button>
                {showVisibilityMenu && (
                  <div className="dropdown-menu visibility-menu wishlist-topbar-menu dropdown-menu-viewport-centered" role="menu">
                    <strong>Escolha a visibilidade da lista</strong>
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      const active = data.wishlist.visibility === option.value;
                      return (
                        <button className="menu-option" disabled={active} key={option.value} onClick={() => changeVisibility(option.value)} role="menuitem">
                          <Icon size={18} aria-hidden />
                          <span><strong>{option.label}</strong><small>{option.description}</small></span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <Link className="icon-button wishlist-config-button" href="/wishlist/configuracoes" title="Configurar wishlist" aria-label="Configurar wishlist"><Settings size={18} aria-hidden /></Link>
            </div>
          )}
          {!data.isOwner && data.wishlist.visibility === "public" && (
            <button className="button" onClick={() => authAction(toggleFollowing, data.following ? undefined : "follow")}>{data.following ? "Deixar de seguir" : "Seguir"}</button>
          )}
        </div>
      </div>

      <header className="wishlist-header">
        <h1>{data.wishlist.title}</h1>
        <p className="muted wishlist-meta">
          <span>Wishlist de <strong>{data.wishlist.owner_name}</strong></span>
        </p>
      </header>

      {refreshError && <p className="error" role="status">{refreshError}</p>}

      {data.isOwner && showInviteModal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setShowInviteModal(false)}>
          <section className="modal-panel stack" role="dialog" aria-modal="true" aria-labelledby="invite-title" onClick={(event) => event.stopPropagation()}>
            <div className="form-heading">
              <div>
                <h2 id="invite-title">Convite da wishlist</h2>
                <p className="muted">Envie este link para quem pode acessar a lista.</p>
              </div>
              <button className="icon-button" title="Fechar convite" aria-label="Fechar convite" onClick={() => setShowInviteModal(false)}><X size={18} aria-hidden /></button>
            </div>
            <input className="input" readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} />
            <div className="row">
              <button className="button primary" onClick={copyInvite}>Copiar convite</button>
              <button className="button" onClick={() => setShowInviteModal(false)}>Fechar</button>
            </div>
            {inviteCopied && <p className="success" role="status">Convite copiado.</p>}
          </section>
        </div>
      )}

      <section className="item-list" aria-label="Itens da wishlist" ref={itemListRef}>
        {data.isOwner && !showItemForm && (
          <button className="button primary add-item-inline" onClick={openItemForm}><Plus size={18} aria-hidden />Adicionar item</button>
        )}
        {data.isOwner && showItemForm && <ItemForm onCancel={() => setShowItemForm(false)} onSaved={handleItemSaved} />}
        {data.items.length === 0 ? (
          <div className="empty">Esta wishlist ainda não possui itens.</div>
        ) : (
          <>
            <div className="wishlist-list-toolbar">
              <div className="wishlist-list-toolbar-row">
                <span className="muted" aria-live="polite">{sortedItems.length} de {data.items.length} itens</span>
                <div className="wishlist-list-toolbar-actions">
                  <button
                    className={`icon-button wishlist-search-button${searchQuery ? " active" : ""}`}
                    title={showSearch ? "Fechar pesquisa" : "Pesquisar itens"}
                    aria-label={showSearch ? "Fechar pesquisa" : "Pesquisar itens"}
                    aria-expanded={showSearch}
                    aria-controls="wishlist-search-field"
                    onClick={() => showSearch ? closeSearch() : setShowSearch(true)}
                  >
                    <Search size={18} aria-hidden />
                  </button>
                  <div className="menu-wrap" ref={listControlsRef}>
                    <button
                      className={`icon-button wishlist-filter-button${activeControlCount > 0 ? " active" : ""}`}
                      title="Filtrar e ordenar"
                      aria-label="Filtrar e ordenar"
                      aria-expanded={showListControls}
                      aria-controls="wishlist-list-controls"
                      onClick={() => setShowListControls((value) => !value)}
                    >
                      <SlidersHorizontal size={18} aria-hidden />
                    </button>
                    {showListControls && (
                      <div className="dropdown-menu wishlist-list-controls dropdown-menu-viewport-centered" id="wishlist-list-controls" role="dialog" aria-label="Filtrar e ordenar itens">
                        <label className="field">
                          <span>Ordenar por</span>
                          <select className="select" value={itemOrder} onChange={(event) => setItemOrder(event.target.value as ItemOrder)}>
                            <option value="newest">Inclusão mais recente</option>
                            <option value="oldest">Inclusão mais antiga</option>
                            <option value="name-asc">Nome de A a Z</option>
                            <option value="name-desc">Nome de Z a A</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Filtrar por</span>
                          <select className="select" value={itemView} onChange={(event) => setItemView(event.target.value as ItemView)}>
                            <option value="grouped">Separados por status</option>
                            <option value="all">Todos juntos</option>
                            <option value="available">Somente disponíveis</option>
                            <option value="reserved">Somente reservados</option>
                          </select>
                        </label>
                        <label className="field">
                          <span>Loja</span>
                          <select className="select" value={storeFilter} onChange={(event) => setStoreFilter(event.target.value)}>
                            <option value="all">Todas as lojas</option>
                            {storeOptions.map((store) => <option value={store.id} key={store.id}>{store.label}</option>)}
                          </select>
                        </label>
                        {activeControlCount > 0 && <button className="button wishlist-clear-filters" onClick={clearListControls}>Restaurar padrão</button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {showSearch && (
                <div className="wishlist-search-field" id="wishlist-search-field">
                  <label className="sr-only" htmlFor="wishlist-search-input">Pesquisar por nome ou descrição</label>
                  <Search size={18} aria-hidden />
                  <input
                    className="input"
                    id="wishlist-search-input"
                    type="search"
                    placeholder="Pesquisar por nome ou descrição"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    onKeyDown={(event) => { if (event.key === "Escape") closeSearch(); }}
                    autoFocus
                  />
                  <button className="wishlist-search-close" type="button" title="Fechar pesquisa" aria-label="Fechar pesquisa" onClick={closeSearch}>
                    <X size={18} aria-hidden />
                  </button>
                </div>
              )}
            </div>
            {itemSections.map((section) => {
              const sectionPodiumItems = section.items.filter((item: Item) => item.podium_position && !item.reserved);
              const sectionRegularItems = section.items.filter((item: Item) => !item.podium_position || item.reserved);
              const editingThisPodium = isEditingPodium && section.id === "available-items";
              const displayedPodiumItems = editingThisPodium ? podiumDraft : sectionPodiumItems;

              return (
                <section className="wishlist-item-group" aria-label={section.id === "available-items" ? "Itens disponíveis" : undefined} aria-labelledby={section.id !== "available-items" ? `${section.id}-title` : undefined} key={section.id}>
                  {section.id !== "available-items" && (
                    <div className="wishlist-item-group-heading">
                      <h2 id={`${section.id}-title`}>{section.title}</h2>
                      <span>{section.items.length}</span>
                    </div>
                  )}
                  <div className="wishlist-item-group-list">
                    {(displayedPodiumItems.length > 0 || editingThisPodium) && (
                      <section className={`podium-group${editingThisPodium ? " editing" : ""}`} aria-labelledby={`${section.id}-podium-title`}>
                        <div className="podium-group-heading">
                          <h2 id={`${section.id}-podium-title`}>Mais desejados</h2>
                          {data.isOwner && !editingThisPodium && (
                            <button className="icon-button podium-edit-button" type="button" title="Editar pódio" aria-label="Editar pódio" onClick={startPodiumEditing}>
                              <Pencil size={17} aria-hidden />
                            </button>
                          )}
                        </div>
                        {editingThisPodium ? (
                          <>
                            <DndContext sensors={podiumSensors} collisionDetection={closestCenter} onDragEnd={handlePodiumDragEnd}>
                              <SortableContext items={podiumDraft.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                                <div className="podium-group-items">
                                  {podiumDraft.map((item, index) => (
                                    <SortablePodiumItem
                                      item={item}
                                      position={(index + 1) as 1 | 2 | 3}
                                      onRemove={(id) => setPodiumDraft((items) => items.filter((draftItem) => draftItem.id !== id))}
                                      key={item.id}
                                    />
                                  ))}
                                </div>
                              </SortableContext>
                            </DndContext>
                            <div className="podium-edit-footer">
                              <button className="button primary compact" type="button" disabled={isSavingPodium} onClick={savePodiumOrder}>
                                {isSavingPodium ? "Salvando..." : "Salvar"}
                              </button>
                              <button className="button compact" type="button" disabled={isSavingPodium} onClick={cancelPodiumEditing}>Cancelar</button>
                            </div>
                          </>
                        ) : (
                          <div className="podium-group-items">
                            {displayedPodiumItems.map(renderItem)}
                          </div>
                        )}
                      </section>
                    )}
                    {sectionRegularItems.length > 0
                      ? sectionRegularItems.map(renderItem)
                      : displayedPodiumItems.length === 0 && !editingThisPodium && <p className="wishlist-item-group-empty">{emptyItemsMessage}</p>}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </section>

      {data.isOwner && !showItemForm && <button className="fab-add" aria-label="Adicionar item" onClick={openItemForm}><Plus size={24} aria-hidden /></button>}
    </main>
  );
}
