'use client';

import { useState } from 'react';
import { HlsVideo } from './HlsVideo';

type Project = {
  _id: string;
  title?: string;
  media?: Array<{
    mediaType: string;
    imageUrl?: string;
    hlsUrl?: string;
  }>;
};

type CollectionData = {
  _id: string;
  title?: string;
  slug?: { current?: string };
  projects: Project[];
};

export function CollectionViewer({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CollectionData | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`/api/collection/${slug}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      } else {
        setError(json.error ?? 'Invalid password');
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    return (
      <main
        style={{
          width: '100%',
          margin: 0,
          padding: 0,
          overflowX: 'hidden',
        }}
      >
        {data.projects.map((project) => (
          <div key={project._id} style={{ width: '100%', margin: 0, padding: 0 }}>
            {project.media?.map((item, i) => (
              <div
                key={i}
                style={{
                  width: '100%',
                  margin: 0,
                  padding: 0,
                  lineHeight: 0,
                  overflow: 'hidden',
                }}
              >
                {item.mediaType === 'image' && item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                      verticalAlign: 'bottom',
                    }}
                  />
                )}
                {item.mediaType === 'video' && item.hlsUrl && (
                  <HlsVideo src={item.hlsUrl} />
                )}
              </div>
            ))}
          </div>
        ))}
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          minWidth: '280px',
        }}
      >
        <h1 style={{ margin: 0, fontSize: '1.5rem' }}>{title}</h1>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          disabled={loading}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
        {error && (
          <p style={{ margin: 0, color: '#c00', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '0.75rem 1rem',
            fontSize: '1rem',
            background: '#333',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Checking...' : 'Enter'}
        </button>
      </form>
    </main>
  );
}
