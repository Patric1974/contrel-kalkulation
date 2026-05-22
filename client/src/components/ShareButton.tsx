import React from 'react';

interface ShareButtonProps {
  calculationId: string;
  onSuccess: () => void;
  onError: () => void;
  className?: string;
}

export function ShareButton({ calculationId, onSuccess, onError, className = '' }: ShareButtonProps) {
  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/share/${calculationId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      onSuccess();
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        onSuccess();
      } catch {
        onError();
      } finally {
        document.body.removeChild(textArea);
      }
    }
  };

  return (
    <button onClick={handleShare} className={`btn-secondary flex items-center gap-2 ${className}`}>
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
      Teilen
    </button>
  );
}
