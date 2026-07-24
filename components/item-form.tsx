"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { api } from "@/lib/client-api";
import { resolveProductName } from "@/lib/product-url";

export function ItemForm({ onSaved, onCancel }: { onSaved: () => void; onCancel?: () => void }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function changeUrl(value: string) {
    setOriginalUrl(value);
    const resolvedName = resolveProductName(value);
    if (resolvedName) {
      setName(resolvedName);
      setMessage("Nome preenchido a partir da URL. Revise antes de salvar.");
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      const data = await api("/api/items", { method: "POST", body: JSON.stringify({ name, description, imageUrl, originalUrl }) });
      setMessage(data.duplicate ? "Item salvo. Aviso: essa URL já existia na wishlist." : "Item salvo.");
      setOriginalUrl(""); setName(""); setDescription(""); setImageUrl("");
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao salvar."); }
  }
  return (
    <form className="panel stack item-form" onSubmit={save}>
      <div className="form-heading">
        <div>
          <h2>Adicionar um item</h2>
          <p className="muted">Cole o link do produto e complete os detalhes da wishlist.</p>
        </div>
        {onCancel && <button type="button" className="icon-button" title="Fechar formulário" aria-label="Fechar formulário" onClick={onCancel}><X size={18} aria-hidden /></button>}
      </div>
      <label className="field"><span>URL do produto</span><input className="input" required value={originalUrl} onChange={(e) => changeUrl(e.target.value)} /></label>
      <label className="field"><span>Nome</span><input className="input" required maxLength={140} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>Descrição</span><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <label className="field"><span>URL da imagem</span><input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></label>
      {message && <p className="muted">{message}</p>}{error && <p className="error">{error}</p>}
      <div className="row">
        <button className="button primary">Salvar item</button>
        {onCancel && <button type="button" className="button" onClick={onCancel}>Cancelar</button>}
      </div>
    </form>
  );
}
