import React, { useState } from 'react';
import { createWord } from "../lib/wordService";

export function AddWordForm() {
  const [word, setWord] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createWord({ word });
      console.log("created word", res.wordId);
      setWord("");
      alert("単語を追加しました");
    } catch (err) {
      console.error(err);
      alert('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input value={word} onChange={(e) => setWord(e.target.value)} placeholder="word" />
      <button type="submit" disabled={loading}>追加</button>
    </form>
  );
}
