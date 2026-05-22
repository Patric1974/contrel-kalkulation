import React from 'react';
import type { Article } from '../types';
import { exportWebshopCsv, exportErpCsv, exportInobatCsv } from '../utils/export';

interface ExportButtonsProps {
  articles: Article[];
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export function ExportButtons({ articles, onSuccess, onError }: ExportButtonsProps) {
  const handleExport = (fn: () => void, label: string) => {
    try {
      fn();
      onSuccess(`${label} exportiert`);
    } catch (err) {
      onError(`Fehler beim Export: ${err}`);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleExport(() => exportWebshopCsv(articles), 'Webshop CSV')}
        disabled={articles.length === 0}
        className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Exportiert Preise für den Webshop"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Webshop CSV
      </button>
      <button
        onClick={() => handleExport(() => exportErpCsv(articles), 'ERP CSV')}
        disabled={articles.length === 0}
        className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Exportiert Artikeldaten für das ERP-System"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        ERP CSV
      </button>
      <button
        onClick={() => handleExport(() => exportInobatCsv(articles), 'INOBAT CSV')}
        disabled={articles.length === 0}
        className="btn-secondary text-sm flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        title="Exportiert INOBAT Monatsmeldung"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        INOBAT CSV
      </button>
    </div>
  );
}
