import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { HiXMark, HiOutlineCamera } from 'react-icons/hi2';
import { useIntlayer } from 'react-intlayer';

export default function ProfilePhotoViewer({ open, onClose, src, name, onEdit, uploading }) {
  const content = useIntlayer('profile');
  return <Dialog open={open} onClose={onClose} className="relative z-[100]">
    <div className="fixed inset-0 bg-black/80" aria-hidden="true" />
    <div className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4">
      <DialogPanel data-no-lightbox className="w-full max-w-2xl overflow-hidden rounded-2xl bg-neutral-50 shadow-xl">
        <div className="flex items-center justify-between gap-3 p-3">
          <DialogTitle className="min-w-0 break-words font-semibold">{name}</DialogTitle>
          <button type="button" onClick={onClose} aria-label={content.closePhoto.value} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full hover:bg-neutral-200"><HiXMark className="h-6 w-6" /></button>
        </div>
        {src ? <img src={src} alt={name} className="max-h-[65dvh] w-full object-contain" /> : <div className="flex h-48 items-center justify-center bg-primary-100 text-6xl text-primary-600">{name?.[0] || '?'}</div>}
        {onEdit && <div className="p-4"><button type="button" onClick={onEdit} disabled={uploading} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-primary-600 px-4 py-3 font-semibold text-white disabled:opacity-50"><HiOutlineCamera className="h-5 w-5" />{uploading ? content.loading : content.updateProfilePicture}</button></div>}
      </DialogPanel>
    </div>
  </Dialog>;
}
