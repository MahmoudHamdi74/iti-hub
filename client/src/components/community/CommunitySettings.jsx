import { useState } from 'react';
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/react';
import { useIntlayer } from 'react-intlayer';
import ErrorDisplay from '@components/common/ErrorDisplay';
export default function CommunitySettings({ community, onSave, onClose }) {
  const text = useIntlayer('community');
  const [name, setName] = useState(community.name);
  const [description, setDescription] = useState(community.description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const submit = async event => {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError(null);
    try { await onSave({ name: name.trim(), description: description.trim() }); onClose(); }
    catch (err) { setError(err); } finally { setSaving(false); }
  };
  return <Dialog open onClose={onClose} className="relative z-50"><div className="fixed inset-0 bg-black/40" aria-hidden="true" /><div className="fixed inset-0 flex items-center justify-center p-4"><DialogPanel className="w-full max-w-lg max-h-[90dvh] overflow-y-auto rounded-2xl bg-neutral-100 p-5 text-neutral-900"><div className="flex items-center justify-between"><DialogTitle className="font-bold">{text.settings}</DialogTitle><button onClick={onClose} aria-label={text.cancel?.value}>×</button></div><form onSubmit={submit} className="mt-4 space-y-4"><label className="block">{text.communityName}<input className="mt-1 w-full rounded-lg border border-outline bg-neutral-50 p-3" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} required /></label><label className="block">{text.aboutCommunity}<textarea className="mt-1 w-full rounded-lg border border-outline bg-neutral-50 p-3" value={description} onChange={e => setDescription(e.target.value)} maxLength={1000} required rows={4} /></label><ErrorDisplay error={error} /><button disabled={saving} className="rounded-lg bg-primary-600 px-5 py-3 text-white disabled:opacity-50">{text.savee}</button></form></DialogPanel></div></Dialog>;
}
