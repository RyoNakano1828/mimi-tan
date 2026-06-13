import React, { useEffect, useState } from 'react';
import { getProfile, createProfile, updateProfile, Profile } from '../lib/profileService';

export function ProfileForm() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState<string | null>(null);
  const [metadataText, setMetadataText] = useState('');

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await getProfile();
        if (p) {
          setProfile(p);
          setDisplayName(p.display_name ?? '');
          setEmail(p.email ?? null);
          setMetadataText(p.metadata ? JSON.stringify(p.metadata, null, 2) : '');
        }
      } catch (err) {
        console.error('Failed to load profile', err);
        alert('プロフィールの読み込みに失敗しました');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      let metadata: any = null;
      if (metadataText.trim()) {
        try {
          metadata = JSON.parse(metadataText);
        } catch (err) {
          alert('Metadata は有効な JSON である必要があります');
          setLoading(false);
          return;
        }
      }

      if (profile?.id) {
        const updated = await updateProfile(profile.id, { display_name: displayName || null, metadata });
        setProfile(updated);
        alert('プロフィールを更新しました');
      } else {
        const created = await createProfile(displayName || undefined, metadata ?? undefined);
        setProfile(created);
        setEmail(created.email);
        alert('プロフィールを作成しました');
      }
    } catch (err) {
      console.error(err);
      alert('プロフィールの保存に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>メール (readonly)</label>
        <div>{email ?? '（未ログインまたは未設定）'}</div>
      </div>

      <div>
        <label>表示名</label>
        <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="表示名" />
      </div>

      <div>
        <label>Metadata (JSON)</label>
        <textarea value={metadataText} onChange={(e) => setMetadataText(e.target.value)} placeholder='{"locale":"ja"}' rows={6} />
      </div>

      <div>
        <button type="submit" disabled={loading}>{profile ? '更新' : '作成'}</button>
      </div>
    </form>
  );
}
