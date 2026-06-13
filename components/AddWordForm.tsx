import React, { useState } from 'react';
import { createWordWithOptionalAudio } from '../lib/wordService';

export function AddWordForm() {
  const [word, setWord] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await createWordWithOptionalAudio({ word, audioFile: file });
      console.log('created word', res.wordId);
      setWord('');
      setFile(null);
      alert('単語を追加しました');
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
      <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      <button type="submit" disabled={loading}>追加</button>
    </form>
  );
}
