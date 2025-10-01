import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'primary';
}

export default function ConfirmationModal({
  isOpen,
  onConfirm,
  onCancel,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger'
}: ConfirmationModalProps) {
  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter') {
      onConfirm();
    }
  };

  const confirmButtonClass = confirmVariant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : 'bg-primary-red hover:bg-primary-red-hover text-white';

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-2 sm:p-4"
      onClick={handleBackdropClick}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div className="bg-dark-surface border border-dark-border rounded-lg sm:rounded-xl max-w-sm sm:max-w-md w-full shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-dark-border">
          <div className="flex items-center space-x-3">
            <div className="p-1.5 sm:p-2 bg-red-500 bg-opacity-10 rounded-lg">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-400" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-dark-text">{title}</h3>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-dark-elevated rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-dark-text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <p className="text-dark-text-secondary leading-relaxed text-sm sm:text-base">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-2 sm:space-x-3 p-4 sm:p-6 border-t border-dark-border bg-dark-elevated bg-opacity-50">
          <button
            onClick={onCancel}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base text-dark-text hover:bg-dark-surface border border-dark-border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dark-border"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-dark-surface ${confirmButtonClass}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}