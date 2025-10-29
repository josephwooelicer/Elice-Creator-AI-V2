import React, { useState } from 'react';
import { Button, Popover } from '../../../components/ui';

interface SaveContentPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (notes: string) => void;
  triggerRef: React.RefObject<HTMLElement>;
}

export const SaveContentPopover: React.FC<SaveContentPopoverProps> = ({ isOpen, onClose, onSave, triggerRef }) => {
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    onSave(notes);
    setNotes('');
  };

  return (
    <Popover
        isOpen={isOpen}
        onClose={onClose}
        triggerRef={triggerRef}
        title="Notes"
        className="w-80"
    >
        <div>
            <textarea
                id="notes"
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="optional"
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-0 focus:ring-primary-focus focus:border-primary-focus placeholder-slate-400"
            />
        </div>
        <div className="flex justify-end mt-4">
            <Button onClick={handleSave} className="w-full !py-2">Save</Button>
        </div>
    </Popover>
  );
};