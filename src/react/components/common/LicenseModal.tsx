import React from 'react';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle className="text-2xl font-bold">
            {t('license.title')}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
            aria-label={t('license.close')}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-md border">
            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">
              {t('license.content')}
            </pre>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={onClose} variant="default">
            {t('license.close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LicenseModal;