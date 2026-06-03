import { Component } from 'react';

const STALE_CHUNK_FLAG = 'tome:reloaded-after-stale-chunk';

function isStaleChunkError(error) {
  const msg = String(error?.message || error || '');
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('ChunkLoadError')
  );
}

// Top-level fogás: ha bármelyik child render közben dob, mutatjuk a hibát
// fehér képernyő helyett. A barátnő ne ragadjon "nincs semmi" állapotban —
// legyen legalább egy stack trace amit el tud küldeni.
//
// Speciális eset: ha a hiba egy "Failed to fetch dynamically imported module"
// (Vite chunk-hash rotálódott egy új deploy alatt, a régi service worker
// még a régi index.html-t adja), akkor automatikusan unregister-eljük a
// SW-t, töröljük a cache-eket és reloadolunk — egyszer per session.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null, recovering: false };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    this.setState({ info });
    console.error('[ErrorBoundary]', error, info?.componentStack);

    // Auto-recovery elavult chunk-ra (egyszer per session, hogy ne legyen loop)
    if (isStaleChunkError(error) && !sessionStorage.getItem(STALE_CHUNK_FLAG)) {
      sessionStorage.setItem(STALE_CHUNK_FLAG, '1');
      this.setState({ recovering: true });
      this.recoverFromStaleDeploy();
    }
  }

  async recoverFromStaleDeploy() {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
    } catch (e) {
      console.warn('[ErrorBoundary] cache/SW cleanup failed:', e);
    }
    // Hard reload: SW és cache törölve, a böngésző friss bundle-t kap
    location.reload();
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  handleClearStorage = () => {
    try {
      localStorage.removeItem('tome:state:v1');
      localStorage.removeItem('tome:sync:v1');
    } catch {}
    location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    // Stale-chunk auto-recovery: csak egy "frissítés folyamatban" jelzés
    if (this.state.recovering) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: '#fef3e3', color: '#7a5e22', fontFamily: 'system-ui, sans-serif',
          fontSize: 14, textAlign: 'center', padding: 16,
        }}>
          <div>
            <div style={{ fontSize: 18, marginBottom: 8 }}>Új verzió érkezett — frissítés…</div>
            <div style={{ fontSize: 12 }}>Egy pillanat, töltődik a friss kód.</div>
          </div>
        </div>
      );
    }

    const { error, info } = this.state;
    const stack = (error?.stack || String(error)).split('\n').slice(0, 12).join('\n');
    const compStack = info?.componentStack?.split('\n').slice(0, 10).join('\n') || '';

    return (
      <div style={{
        minHeight: '100vh',
        padding: '24px 16px',
        background: '#fef3e3',
        color: '#3a2a1a',
        fontFamily: 'system-ui, sans-serif',
        fontSize: 14,
        lineHeight: 1.5,
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h1 style={{ fontSize: 22, marginBottom: 8 }}>⚠️ Hoppá — az alkalmazás lefagyott</h1>
          <p style={{ marginBottom: 16, color: '#7a5e22' }}>
            Másold ki ezt a hibát és küldd át — abból pontosan látszik, mi a baj.
          </p>

          <div style={{
            background: '#fff',
            border: '1px solid #c9a961',
            borderRadius: 4,
            padding: 12,
            marginBottom: 12,
            fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
            fontSize: 12,
            whiteSpace: 'pre-wrap',
            overflowX: 'auto',
          }}>
            <strong>{error?.name || 'Error'}: {error?.message || String(error)}</strong>
            {stack && <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{stack}</pre>}
          </div>

          {compStack && (
            <div style={{
              background: '#fff',
              border: '1px solid #c9a961',
              borderRadius: 4,
              padding: 12,
              marginBottom: 16,
              fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
              fontSize: 12,
              whiteSpace: 'pre-wrap',
              overflowX: 'auto',
            }}>
              <strong>Komponens-stack:</strong>
              <pre style={{ margin: '8px 0 0', whiteSpace: 'pre-wrap' }}>{compStack}</pre>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => location.reload()}
              style={{ padding: '10px 16px', background: '#9b7e3a', color: '#fef3e3', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600 }}
            >
              Újratöltés
            </button>
            <button
              onClick={this.handleReset}
              style={{ padding: '10px 16px', background: '#fff', color: '#3a2a1a', border: '1px solid #c9a961', borderRadius: 4, cursor: 'pointer' }}
            >
              Próbáljuk újra
            </button>
            <button
              onClick={this.handleClearStorage}
              style={{ padding: '10px 16px', background: '#fff', color: '#7a4f44', border: '1px solid #c47866', borderRadius: 4, cursor: 'pointer' }}
            >
              localStorage törlés + reload
            </button>
          </div>

          <p style={{ marginTop: 16, fontSize: 12, color: '#7a5e22' }}>
            Ha a hiba minden alkalommal előjön, a "localStorage törlés + reload" gomb tisztítja a böngésző-mentést — gyakran ez old fel egy elromlott state-et.
          </p>
        </div>
      </div>
    );
  }
}
