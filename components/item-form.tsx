"use client";

import { useState } from "react";
import { api } from "@/lib/client-api";

export function ItemForm({ onSaved }: { onSaved: () => void }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  async function preview() {
    setError(""); setMessage("Buscando dados do produto...");
    const data = await api("/api/og", { method: "POST", body: JSON.stringify({ url: originalUrl }) });
    if (data.ok) {
      setName(data.title || "");
      setDescription(data.description || "");
      setImageUrl(data.imageUrl || "");
      setOriginalUrl(data.originalUrl || originalUrl);
      setMessage("Revise os dados antes de salvar.");
    } else setMessage("Nao conseguimos obter automaticamente os dados deste produto. Preencha manualmente.");
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
      <div className="row">
        <label className="field" style={{ flex: 1 }}><span>URL do produto</span><input className="input" required value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} /></label>
        <button className="button" type="button" onClick={preview}>Preencher por Open Graph</button>
      </div>
      <label className="field"><span>Nome</span><input className="input" required value={name} onChange={(e) => setName(e.target.value)} /></label>
      <label className="field"><span>Descricao</span><textarea className="textarea" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
      <label className="field"><span>URL da imagem</span><input className="input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} /></label>
      {message && <p className="muted">{message}</p>}{error && <p className="error">{error}</p>}
      <button className="button primary">Salvar item</button>
    </form>
  );
}
