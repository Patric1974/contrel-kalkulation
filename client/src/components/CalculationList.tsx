import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CalculationSummary } from '../types';
import { listCalculations, deleteCalculation } from '../utils/api';

interface CalculationListProps {
  sessionId: string;
  onNewCalculation: () => void;
  onShowSuccess: (msg: string) => void;
  onShowError: (msg: string) => void;
}

export function CalculationList({ sessionId, onNewCalculation, onShowSuccess, onShowError }: CalculationListProps) {
  const [calculations, setCalculations] = useState<CalculationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    try {
      const data = await listCalculations();
      setCalculations(data);
    } catch (err) {
      onShowError('Fehler beim Laden der Kalkulationen');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleOpen = (id: string) => {
    navigate(`/calculation/${id}`);
  };

  const handleShare = async (id: string) => {
    const url = `${window.location.origin}/share/${id}`;
    try {
      await navigator.clipboard.writeText(url);
      onShowSuccess('Link in die Zwischenablage kopiert');
    } catch {
      onShowError('Link konnte nicht kopiert werden');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Kalkulation "${name}" wirklich löschen?`)) return;
    try {
      await deleteCalculation(id, sessionId);
      onShowSuccess(`"${name}" gelöscht`);
      load();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('403') || msg.includes('Forbidden')) {
        onShowError('Keine Berechtigung – nur der Ersteller kann löschen');
      } else {
        onShowError('Fehler beim Löschen');
      }
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('de-CH', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kalkulationen</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {calculations.length === 0
              ? 'Noch keine Kalkulationen vorhanden'
              : `${calculations.length} Kalkulation${calculations.length !== 1 ? 'en' : ''}`}
          </p>
        </div>
        <button onClick={onNewCalculation} className="btn-primary flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Neue Kalkulation
        </button>
      </div>

      {calculations.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-gray-700 mb-2">Keine Kalkulationen vorhanden</h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            Erstellen Sie Ihre erste Kalkulation, um Preise für Batterien und Akkus zu berechnen.
          </p>
          <button onClick={onNewCalculation} className="btn-primary inline-flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Erste Kalkulation erstellen
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {calculations.map(calc => (
            <div key={calc.id} className="card p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-2">
                  <h3 className="font-semibold text-gray-900 truncate">{calc.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {calc.articleCount} Artikel
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(calc.id, calc.name)}
                  className="text-gray-300 hover:text-red-400 transition-colors flex-shrink-0"
                  title="Löschen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <p className="text-xs text-gray-400 mb-4">
                Zuletzt geändert: {formatDate(calc.updatedAt)}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpen(calc.id)}
                  className="btn-primary flex-1 text-sm py-1.5"
                >
                  Öffnen
                </button>
                <button
                  onClick={() => handleShare(calc.id)}
                  className="btn-secondary text-sm py-1.5 px-3"
                  title="Link teilen"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
