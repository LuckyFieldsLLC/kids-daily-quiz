import * as Dialog from '@radix-ui/react-dialog';
import React from 'react';
import clsx from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string; // for aria-describedby
  children: React.ReactNode;
  widthClass?: string;
  footer?: React.ReactNode;
  hideCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({ open, onOpenChange, title, description, children, widthClass = 'max-w-2xl', footer, hideCloseButton }) => {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur data-[state=open]:animate-fadeIn data-[state=closed]:animate-fadeOut" />
        <Dialog.Content
          className={clsx(
            'fixed top-[6vh] left-1/2 -translate-x-1/2 w-full',
            widthClass,
            'glass-panel elev-modal rounded-lg shadow-lg focus:outline-none data-[state=open]:animate-modalIn data-[state=closed]:animate-modalOut'
          )}
        >
          <div className="p-5 border-b flex justify-between items-start gap-4">
            <div className="flex-1">
              {title && <Dialog.Title className="text-xl font-bold text-gray-800">{title}</Dialog.Title>}
              {description && (
                <Dialog.Description className="mt-1 text-sm text-gray-500">
                  {description}
                </Dialog.Description>
              )}
            </div>
            {!hideCloseButton && (
              <Dialog.Close asChild>
                <button aria-label="閉じる" className="p-2 rounded hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                  <XMarkIcon className="h-5 w-5 text-gray-500" aria-hidden="true" />
                </button>
              </Dialog.Close>
            )}
          </div>
          <div className="p-6 max-h-[75vh] overflow-y-auto">{children}</div>
          {footer && <div className="p-5 border-t bg-gray-50 rounded-b-lg">{footer}</div>}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;