import React, { useEffect, useState } from 'react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  messages: ToastMessage[];
  onRemove: (id: string) => void;
}

export function Toast({ messages, onRemove }: ToastProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {messages.map(msg => (
        <ToastItem key={msg.id} msg={msg} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ msg, onRemove }: { msg: ToastMessage; onRemove: (id: string) => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    requestAnimationFrame(() => setVisible(true));
    // Auto-remove after 4 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(msg.id), 300);
    }, 4000);
    return () => clearTimeout(timer);
  }, [msg.id, onRemove]);

  const bgColor = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-blue-600',
  }[msg.type];

  const icon = {
    success: '✓',
    error: '✗',
    info: 'ℹ',
  }[msg.type];

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white text-sm font-medium transition-all duration-300 ${bgColor} ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <span className="text-base font-bold">{icon}</span>
      <span className="flex-1">{msg.message}</span>
      <button
        onClick={() => onRemove(msg.id)}
        className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Schliessen"
      >
        ×
      </button>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: ToastMessage['type'] = 'info') => {
    const id = crypto.randomUUID();
    setMessages(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  const showSuccess = (message: string) => addToast(message, 'success');
  const showError = (message: string) => addToast(message, 'error');
  const showInfo = (message: string) => addToast(message, 'info');

  return { messages, removeToast, showSuccess, showError, showInfo };
}
