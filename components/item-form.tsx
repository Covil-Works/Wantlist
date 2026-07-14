"use client";

import { useState } from "react";
import { api } from "@/lib/client-api";
import { resolveProductName } from "@/lib/product-url";

export function ItemForm({ onSaved }: { onSaved: () => void }) {
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
      setMessage(data.duplicate ? "Item salvo. Aviso: essa URL ja existia na wishlist." : "Item salvo.");
      setOriginalUrl(""); setName(""); setDescription(""); setImageUrl("");
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao salvar."); }
  }
  return (
    <form className="panel stack" onSubmit={save}>
      <label className="field"><span>URL do produto</span><input className="input" required value={originalUrl} onChange={(e) => changeUrl(e.target.value)} /></label>
      <label className="field"><span>Nome</span><input className="input" required maxLength={140} value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>Descricao</span><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <label className="field"><span>URL da imagem</span><input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></label>
      {message && <p className="muted">{message}</p>}{error && <p className="error">{error}</p>}
      <button className="button primary">Salvar item</button>
    </form>
  );
}
