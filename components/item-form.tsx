"use client";

import { useEffect, useRef, useState } from "react";
import { ImageOff, Loader2, X } from "lucide-react";
import { api } from "@/lib/client-api";
import { normalizeProductUrl } from "@/lib/product-metadata/services/normalize-product-url";
import { resolveProductName } from "@/lib/product-url";

type ExtractionState = "idle" | "loading" | "success" | "partial" | "not_found" | "timeout" | "invalid_url" | "redirect_failed" | "error";

type ExtractResponse = {
  status: ExtractionState;
  data?: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
};

function statusMessage(state: ExtractionState) {
  if (state === "loading") return "Extraindo informações...";
  if (["not_found", "timeout", "redirect_failed", "error"].includes(state)) return "Não foi possível extrair as informações. Preencha os campos abaixo.";
  if (state === "partial") return "Algumas informações foram preenchidas. Revise antes de salvar.";
  if (state === "success") return "Informações preenchidas automaticamente. Revise antes de salvar.";
  return "";
}

export function ItemForm({ onSaved, onCancel }: { onSaved: () => void; onCancel?: () => void }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showDescription, setShowDescription] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [extractionState, setExtractionState] = useState<ExtractionState>("idle");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const requestRef = useRef(0);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const normalized = normalizeProductUrl(originalUrl);
    if (!normalized.ok) {
      abortRef.current?.abort();
      setExtractionState("idle");
      return;
    }

    const normalizedUrl = normalized.normalizedUrl;
    const parsedName = resolveProductName(normalizedUrl);
    if (parsedName) setName(parsedName);

    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    const controller = new AbortController();
    abortRef.current?.abort();
    abortRef.current = controller;
    setExtractionState("loading");
    setMessage("");
    setError("");

    const timeout = window.setTimeout(async () => {
      try {
        const response = await api("/api/product-metadata/extract", {
          method: "POST",
          body: JSON.stringify({ url: normalizedUrl }),
          signal: controller.signal
        }) as ExtractResponse;
        if (requestRef.current !== requestId || controller.signal.aborted) return;

        const data = response.data ?? {};
        if (data.title) setName(data.title);

        if (data.imageUrl) {
          setImageUrl(data.imageUrl);
          setImageFailed(false);
        } else {
          setImageUrl("");
        }
        setExtractionState(response.status);
      } catch (err) {
        if (requestRef.current !== requestId || controller.signal.aborted) return;
        setExtractionState("error");
      }
    }, 500);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [originalUrl]);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const normalized = normalizeProductUrl(originalUrl);
      if (!normalized.ok) {
        setError("Informe uma URL de produto válida.");
        return;
      }
      const data = await api("/api/items", {
        method: "POST",
        body: JSON.stringify({ name, description: showDescription ? description : "", imageUrl, originalUrl: normalized.normalizedUrl })
      });
      setMessage(data.duplicate ? "Item salvo. Aviso: essa URL já existia na wishlist." : "Item salvo.");
      setOriginalUrl(""); setName(""); setDescription(""); setImageUrl(""); setShowDescription(false); setExtractionState("idle");
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao salvar."); }
  }

  const extractionMessage = statusMessage(extractionState);
  const canSubmit = extractionState !== "loading";

  return (
    <form className="panel stack item-form" onSubmit={save}>
      <div className="form-heading">
        <div>
          <h2>Adicionar um item</h2>
          <p className="muted">Cole o link do produto e revise os detalhes antes de salvar.</p>
        </div>
        {onCancel && <button type="button" className="icon-button" title="Fechar formulário" aria-label="Fechar formulário" onClick={onCancel}><X size={18} aria-hidden /></button>}
      </div>

      {imageUrl && !imageFailed && <img className="metadata-preview-image" src={imageUrl} alt="Prévia do produto" onError={() => setImageFailed(true)} />}
      {imageUrl && imageFailed && <p className="metadata-note"><ImageOff size={16} aria-hidden /> A imagem encontrada não pôde ser carregada.</p>}

      <label className="field"><span>Link do produto</span><input className="input" required inputMode="url" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} /></label>
      {extractionMessage && <p className={`metadata-note ${extractionState === "loading" ? "loading" : ""}`}>{extractionState === "loading" && <Loader2 size={16} aria-hidden />}{extractionMessage}</p>}
      <label className="field"><span>Nome</span><input className="input" required maxLength={140} value={name} onChange={(e) => setName(e.target.value)} /></label>

      <label className="description-toggle"><input type="checkbox" checked={showDescription} onChange={(event) => { setShowDescription(event.target.checked); if (!event.target.checked) setDescription(""); }} /> <span>Adicionar descrição</span></label>
      {showDescription && <label className="field"><span>Descrição</span><textarea className="textarea" placeholder="Ex: Tamanho P, cor azul..." value={description} onChange={(e) => setDescription(e.target.value)} /></label>}

      {message && <p className="muted">{message}</p>}{error && <p className="error">{error}</p>}
      <div className="row">
        <button className="button primary" disabled={!canSubmit}>Salvar item</button>
        {onCancel && <button type="button" className="button" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}