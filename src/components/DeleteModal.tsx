import React from 'react';
import { Trash2, AlertTriangle, X } from 'lucide-react';

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  itemTitle?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  title,
  itemTitle,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
      <div 
        className="w-full max-w-sm bg-[#221A1A] border border-[#3D3030] rounded-2xl shadow-2xl overflow-hidden p-5 space-y-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[#D0888F] flex items-center justify-center">
            <Trash2 className="w-5 h-5" />
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-[#8F827E] hover:text-[#F5EFEB] hover:bg-[#2A2121] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <h3 className="text-base font-bold text-[#F5EFEB] mb-1.5">
            {title}
          </h3>
          <p className="text-xs text-[#C7BCB8] leading-relaxed">
            {itemTitle ? (
              <>
                Are you sure you want to delete <span className="font-semibold text-[#F5EFEB]">"{itemTitle}"</span>? This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to permanently delete this reflection? This action cannot be undone.'
            )}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#3D3030]">
          <button
            type="button"
            id="btn-cancel-delete"
            onClick={onCancel}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#C7BCB8] hover:text-[#F5EFEB] hover:bg-[#2A2121] border border-[#3D3030] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-confirm-delete"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-900/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Reflection
          </button>
        </div>
      </div>
    </div>
  );
};
