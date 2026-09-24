import React, { useState, useCallback } from 'react';
import { apiClient } from '../lib/api/client';
import { useQuery, useMutation } from '../hooks/useApi';
import { Contact, ContactList } from '../lib/api/types';

interface ContactsScreenProps {
  onShowToast: (msg: string, type?: 'success' | 'warning' | 'error' | 'info') => void;
}

export const ContactsScreen: React.FC<ContactsScreenProps> = ({ onShowToast }) => {
  const [search, setSearch] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [selectedList, setSelectedList] = useState<string>('');

  const { data: lists, loading: listsLoading } = useQuery<ContactList[]>(
    () => apiClient.getContactLists().then((r) => r.data || []),
    []
  );

  const { data: contacts, loading, error, refetch } = useQuery<Contact[]>(
    () => apiClient.get<{ data: Contact[] }>('/api/bulk/lists').then((r) => r.data || []),
    [selectedList]
  );

  const addMutation = useMutation();

  const handleAddContact = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const phone = formData.get('phone') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const email = formData.get('email') as string;

    try {
      await addMutation.execute(() => apiClient.post('/api/bulk/lists/contacts', {
        listId: selectedList,
        contacts: [{ phone, firstName, lastName, email }],
      }));
      onShowToast('Contact added successfully', 'success');
      refetch();
    } catch (err: any) {
      onShowToast(err.message || 'Failed to add contact', 'error');
    }
  }, [selectedList, addMutation, onShowToast, refetch]);

  const filtered = (contacts || []).filter((c) =>
    c.phone.includes(search) || c.firstName?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col w-full space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#3d494c]">
        <div className="flex items-center gap-1.5 text-[#bcc9cd] text-[12px]">
          <span className="text-[#869397]">SYSTEM</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#869397]">MESSAGING</span>
          <span className="text-[#3d494c]">/</span>
          <span className="text-[#4cd7f6] font-semibold">CONTACTS &amp; SEGMENTS</span>
        </div>
        <button onClick={() => setShowImport(true)} className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#06b6d4] text-[#00424f] font-semibold text-[12px]">
          <span className="material-symbols-outlined text-[16px]">upload</span>
          Import Contacts
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts by phone, name, or email..."
          className="flex-1 min-w-[250px] px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] placeholder:text-[#869397] focus:outline-none focus:border-[#4cd7f6]"
        />
        {selectedList && (
          <select value={selectedList} onChange={(e) => setSelectedList(e.target.value)} className="px-3 py-1.5 rounded bg-[#0a0e16] border border-[#3d494c] text-[#dfe2ee] text-[12px] focus:outline-none focus:border-[#4cd7f6]">
            <option value="">All Lists</option>
            {lists?.map((l: ContactList) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        )}
      </div>

      <div className="rounded bg-[#1c2028] border border-[#3d494c] overflow-hidden">
        {loading ? (
          <div className="text-center py-8 text-[#869397]">Loading contacts...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-code-metric text-[12px]">
              <thead className="bg-[#181c24] border-b border-[#3d494c] text-[10px] uppercase text-[#869397]">
                <tr>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Name</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#3d494c]">
                {filtered.map((c: Contact) => (
                  <tr key={c.id} className="hover:bg-[#262a33]/60 transition-colors">
                    <td className="py-3 text-[#4cd7f6]">{c.phone}</td>
                    <td className="py-3 text-[#dfe2ee]">{c.firstName} {c.lastName}</td>
                    <td className="py-3 text-[#bcc9cd]">{c.email || '—'}</td>
                    <td className="py-3"><span className="px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] text-[10px] border border-[#4edea3]/30">OPTED IN</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {filtered.length === 0 && !loading && (
          <div className="text-center py-8 text-[#869397]">No contacts found.</div>
        )}
      </div>
    </div>
  );
};
