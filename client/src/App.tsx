import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import type { Article, Calculation } from './types';
import { createDefaultArticle } from './types';
import { CalculationList } from './components/CalculationList';
import { ArticleForm } from './components/ArticleForm';
import { ExportButtons } from './components/ExportButtons';
import { ShareButton } from './components/ShareButton';
import { Toast, useToast } from './components/Toast';
import { ImportModal } from './components/ImportModal';
import { ArticleListView } from './components/ArticleListView';
import { createCalculation, updateCalculation, getCalculation, getSharedCalculation } from './utils/api';

// Session ID management
function getSessionId(): string {
  const stored = localStorage.getItem('contrel_session_id');
  if (stored) return stored;
  const id = uuidv4();
  localStorage.setItem('contrel_session_id', id);
  return id;
}

const SESSION_ID = getSessionId();

// ─── Navbar ───────────────────────────────────────────────────────────────────
function Navbar() {
  return (
    <nav className="bg-blue-900 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">C</div>
            <div>
              <span className="text-white font-bold text-lg leading-none">Contrel AG</span>
              <span className="text-blue-300 text-xs block leading-none">Kalkulation</span>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-blue-200 hover:text-white text-sm transition-colors">
              Übersicht
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

// ─── New Calculation Modal ─────────────────────────────────────────────────────
function NewCalculationModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      const calc = await createCalculation(name.trim(), SESSION_ID);
      onCreated(calc.id);
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Neue Kalkulation</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="z.B. Angebot Müller AG, April 2026"
              className="input-field"
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Abbrechen
            </button>
            <button type="submit" disabled={!name.trim() || saving} className="btn-primary flex-1">
              {saving ? 'Erstellen...' : 'Erstellen'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Home Page ────────────────────────────────────────────────────────────────
function HomePage({ toast }: { toast: ReturnType<typeof useToast> }) {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CalculationList
        sessionId={SESSION_ID}
        onNewCalculation={() => setShowModal(true)}
        onShowSuccess={toast.showSuccess}
        onShowError={toast.showError}
      />
      {showModal && (
        <NewCalculationModal
          onClose={() => setShowModal(false)}
          onCreated={id => {
            setShowModal(false);
            navigate(`/calculation/${id}`);
          }}
        />
      )}
    </div>
  );
}

// ─── Calculation Editor ───────────────────────────────────────────────────────
function CalculationEditor({ readOnly = false, toast }: { readOnly?: boolean; toast: ReturnType<typeof useToast> }) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [calculation, setCalculation] = useState<Calculation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [forbidden, setForbidden] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const articleRefs = useRef<(HTMLDivElement | null)[]>([]);

  const lastSavedRef = useRef<string>('');

  // Load calculation
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    const loader = readOnly ? getSharedCalculation(id) : getCalculation(id);
    loader
      .then(calc => {
        setCalculation(calc);
        lastSavedRef.current = JSON.stringify(calc);
        // Check if this session owns it
        if (!readOnly && calc.sessionId !== SESSION_ID) {
          setForbidden(false); // allowed to view, but save will fail
        }
      })
      .catch(err => {
        if (String(err).includes('404')) setNotFound(true);
        else toast.showError('Fehler beim Laden');
      })
      .finally(() => setLoading(false));
  }, [id, readOnly]);

  // Auto-save every 30 seconds
  useEffect(() => {
    if (readOnly) return;
    const interval = setInterval(async () => {
      if (!hasChanges || !calculation || !id) return;
      await doSave(calculation);
    }, 30000);
    return () => clearInterval(interval);
  }, [hasChanges, calculation, id, readOnly]);

  const doSave = async (calc: Calculation) => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await updateCalculation(id, SESSION_ID, {
        name: calc.name,
        articles: calc.articles,
      });
      setCalculation(prev => prev ? { ...prev, updatedAt: updated.updatedAt } : prev);
      lastSavedRef.current = JSON.stringify(calc);
      setHasChanges(false);
      toast.showSuccess('Gespeichert');
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.includes('403')) {
        toast.showError('Keine Berechtigung – nur der Ersteller kann speichern');
      } else {
        toast.showError('Fehler beim Speichern');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (calculation) doSave(calculation);
  };

  const updateCalc = (updates: Partial<Calculation>) => {
    setCalculation(prev => {
      if (!prev) return prev;
      const next = { ...prev, ...updates };
      setHasChanges(JSON.stringify(next) !== lastSavedRef.current);
      return next;
    });
  };

  const addArticle = () => {
    if (!calculation) return;
    updateCalc({ articles: [...calculation.articles, createDefaultArticle()] });
  };

  const updateArticle = (idx: number, updated: Article) => {
    if (!calculation) return;
    const articles = [...calculation.articles];
    articles[idx] = updated;
    updateCalc({ articles });
  };

  const removeArticle = (idx: number) => {
    if (!calculation) return;
    const articles = calculation.articles.filter((_, i) => i !== idx);
    updateCalc({ articles });
  };

  const handleImport = (imported: Article[]) => {
    if (!calculation) return;
    updateCalc({ articles: [...calculation.articles, ...imported] });
    toast.showSuccess(`${imported.length} Artikel importiert`);
  };

  const scrollToArticle = (idx: number) => {
    setViewMode('cards');
    setTimeout(() => {
      articleRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const handleNameSave = () => {
    if (nameDraft.trim()) {
      updateCalc({ name: nameDraft.trim() });
    }
    setEditingName(false);
  };

  const isOwner = calculation?.sessionId === SESSION_ID;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-700 mb-2">Kalkulation nicht gefunden</h1>
        <p className="text-gray-500 mb-6">Der Link ist ungültig oder die Kalkulation wurde gelöscht.</p>
        <Link to="/" className="btn-primary">Zur Übersicht</Link>
      </div>
    );
  }

  if (!calculation) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Read-only banner */}
      {readOnly && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-sm text-amber-800 font-medium">Leseansicht – Diese Kalkulation wurde mit Ihnen geteilt.</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            {editingName && !readOnly ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onBlur={handleNameSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleNameSave(); if (e.key === 'Escape') setEditingName(false); }}
                  className="input-field text-lg font-bold py-1"
                />
              </div>
            ) : (
              <h1
                className={`text-xl font-bold text-gray-900 ${!readOnly ? 'cursor-pointer hover:text-blue-700' : ''}`}
                onClick={() => {
                  if (!readOnly) {
                    setNameDraft(calculation.name);
                    setEditingName(true);
                  }
                }}
                title={readOnly ? undefined : 'Klicken zum Umbenennen'}
              >
                {calculation.name}
              </h1>
            )}
            <p className="text-xs text-gray-500">
              {calculation.articles.length} Artikel
              {!readOnly && ` · ${isOwner ? 'Ihre Kalkulation' : 'Fremde Kalkulation (nur lesen)'}`}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportButtons
            articles={calculation.articles}
            onSuccess={toast.showSuccess}
            onError={toast.showError}
          />
          {!readOnly && (
            <>
              <ShareButton
                calculationId={calculation.id}
                onSuccess={() => toast.showSuccess('Link kopiert')}
                onError={() => toast.showError('Fehler beim Kopieren')}
              />
              {isOwner && (
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || saving}
                  className={`btn-primary flex items-center gap-2 ${hasChanges ? 'animate-pulse-once' : ''}`}
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Speichern...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {hasChanges ? 'Speichern *' : 'Gespeichert'}
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* View toggle */}
      {calculation.articles.length > 0 && (
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-gray-400">Ansicht:</span>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${viewMode === 'cards' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Karten
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${viewMode === 'list' ? 'bg-blue-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M3 6h18M3 18h18" />
              </svg>
              Übersichtstabelle
            </button>
          </div>
        </div>
      )}

      {/* Articles */}
      {viewMode === 'list' ? (
        <ArticleListView
          articles={calculation.articles}
          onEditArticle={scrollToArticle}
          onUpdateArticle={(idx, updates) => updateArticle(idx, { ...calculation.articles[idx], ...updates })}
          readOnly={readOnly || !isOwner}
        />
      ) : (
        <div className="space-y-4">
          {calculation.articles.map((article, idx) => (
            <div key={article.id} ref={el => { articleRefs.current[idx] = el; }}>
              <ArticleForm
                article={article}
                index={idx}
                onChange={updated => updateArticle(idx, updated)}
                onRemove={() => removeArticle(idx)}
                readOnly={readOnly || !isOwner}
              />
            </div>
          ))}
        </div>
      )}

      {/* Add Article / Import Buttons */}
      {!readOnly && isOwner && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          <button
            onClick={addArticle}
            className="border-2 border-dashed border-gray-300 rounded-xl py-4 text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Artikel hinzufügen
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="border-2 border-dashed border-orange-300 rounded-xl py-4 text-orange-500 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Aus Excel/CSV importieren
          </button>
        </div>
      )}
      {showImport && (
        <ImportModal
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}

      {calculation.articles.length === 0 && !readOnly && (
        <div className="text-center text-gray-400 text-sm mt-2">
          Noch keine Artikel. Klicken Sie oben, um den ersten Artikel hinzuzufügen.
        </div>
      )}
    </div>
  );
}

// ─── App Root ─────────────────────────────────────────────────────────────────
export default function App() {
  const toast = useToast();

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage toast={toast} />} />
            <Route path="/calculation/new" element={<HomePage toast={toast} />} />
            <Route path="/calculation/:id" element={<CalculationEditor toast={toast} />} />
            <Route path="/share/:id" element={<CalculationEditor readOnly toast={toast} />} />
            <Route path="*" element={
              <div className="max-w-7xl mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-gray-700 mb-2">Seite nicht gefunden</h1>
                <Link to="/" className="btn-primary inline-block mt-4">Zur Startseite</Link>
              </div>
            } />
          </Routes>
        </main>
        <footer className="bg-white border-t border-gray-200 py-3 text-center text-xs text-gray-400">
          Contrel AG · Kalkulations-Tool · INOBAT Tarif 2026
        </footer>
      </div>
      <Toast messages={toast.messages} onRemove={toast.removeToast} />
    </BrowserRouter>
  );
}
