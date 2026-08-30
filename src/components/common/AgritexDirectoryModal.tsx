import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Phone,
  MessageCircle,
  MapPin,
  Building,
  Sprout,
  ShieldAlert,
  User,
  Plus,
  Edit2,
  Trash2,
  PhoneCall,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import { db, seedOfficerContactsIfNeeded } from '../../db';
import { OfficerContact, OfficerRole } from '../../types';
import { AddEditOfficerModal } from './AddEditOfficerModal';

interface AgritexDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoleFilter?: 'all' | 'crop' | 'animal' | 'vet' | 'agritex';
  highlightProvince?: string;
}

export const AgritexDirectoryModal: React.FC<AgritexDirectoryModalProps> = ({
  isOpen,
  onClose,
  initialRoleFilter = 'all',
  highlightProvince,
}) => {
  const [contacts, setContacts] = useState<OfficerContact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>(
    initialRoleFilter === 'animal' || initialRoleFilter === 'vet'
      ? 'vet_officer'
      : initialRoleFilter === 'crop' || initialRoleFilter === 'agritex'
      ? 'mudhumeni'
      : 'all'
  );
  const [selectedProvince, setSelectedProvince] = useState<string>(highlightProvince || 'all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<OfficerContact | null>(null);

  const loadContacts = async () => {
    await seedOfficerContactsIfNeeded();
    const all = await db.officerContacts.toArray();
    setContacts(all);
  };

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDeleteContact = async (id: string, name: string) => {
    if (window.confirm(`Remove ${name} from contacts directory?`)) {
      await db.officerContacts.delete(id);
      loadContacts();
    }
  };

  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      c.name.toLowerCase().includes(q) ||
      (c.roleTitle && c.roleTitle.toLowerCase().includes(q)) ||
      (c.district && c.district.toLowerCase().includes(q)) ||
      (c.province && c.province.toLowerCase().includes(q)) ||
      (c.wardOrArea && c.wardOrArea.toLowerCase().includes(q)) ||
      (c.address && c.address.toLowerCase().includes(q)) ||
      (c.specialization && c.specialization.toLowerCase().includes(q)) ||
      (c.notes && c.notes.toLowerCase().includes(q));

    const matchesRole =
      selectedRole === 'all' ||
      c.role === selectedRole ||
      (selectedRole === 'mudhumeni' && (c.role === 'mudhumeni' || c.role === 'agronomist')) ||
      (selectedRole === 'vet_officer' && (c.role === 'vet_officer' || c.role === 'livestock_specialist'));

    const matchesProvince = selectedProvince === 'all' || c.province === selectedProvince;

    return matchesQuery && matchesRole && matchesProvince;
  });

  const getRoleBadge = (c: OfficerContact) => {
    if (c.role === 'mudhumeni') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
          <Sprout className="w-3.5 h-3.5" /> Mudhumeni (AGRITEX)
        </span>
      );
    }
    if (c.role === 'agronomist') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-teal-100 text-teal-800">
          <Sprout className="w-3.5 h-3.5" /> Agronomist (Zvirimwa)
        </span>
      );
    }
    if (c.role === 'vet_officer') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
          <ShieldAlert className="w-3.5 h-3.5" /> Chiremba weMhuka (Vet)
        </span>
      );
    }
    if (c.role === 'livestock_specialist') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
          <ShieldAlert className="w-3.5 h-3.5" /> Livestock / Diptank Officer
        </span>
      );
    }
    if (c.role === 'agro_dealer') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
          <Building className="w-3.5 h-3.5" /> Certified Agro-Dealer
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800">
        <User className="w-3.5 h-3.5" /> Agricultural Officer
      </span>
    );
  };

  const provinces = [
    'all',
    'Harare',
    'Mashonaland East',
    'Mashonaland West',
    'Mashonaland Central',
    'Manicaland',
    'Midlands',
    'Masvingo',
    'Matabeleland North',
    'Matabeleland South',
    'Bulawayo',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-farm-navy text-farm-cyan flex items-center justify-center shadow-xs">
              <PhoneCall className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-farm-navy">
                AGRITEX & Veterinary Directory
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mudhumeni, Agronomists & Veterinary officers contacts and locations
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="add-new-officer-btn"
              onClick={() => {
                setEditingContact(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer min-h-[40px]"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline">Add Contact</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-500 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="py-3 space-y-2.5 border-b border-slate-100 shrink-0">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              id="officer-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, district, ward, crop/livestock specialty..."
              className="w-full min-h-[44px] pl-10.5 pr-4 py-2 text-sm font-medium rounded-xl border-2 border-slate-200 focus:border-farm-cyan outline-none bg-slate-50 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setSelectedRole('all')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                selectedRole === 'all'
                  ? 'bg-farm-navy text-farm-cyan shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Contacts ({contacts.length})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('mudhumeni')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedRole === 'mudhumeni'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
              }`}
            >
              <Sprout className="w-3.5 h-3.5" /> Mudhumeni / Agronomist
            </button>
            <button
              type="button"
              onClick={() => setSelectedRole('vet_officer')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                selectedRole === 'vet_officer'
                  ? 'bg-amber-700 text-white shadow-2xs'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" /> Vet Officer / Diptank
            </button>

            {/* Province selector */}
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              className="ml-auto text-xs font-bold px-2.5 py-1.5 bg-slate-100 text-slate-700 rounded-lg border border-slate-200 outline-none"
            >
              {provinces.map((p) => (
                <option key={p} value={p}>
                  {p === 'all' ? 'All Provinces' : p}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Directory List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {filteredContacts.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
              <PhoneCall className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-base font-bold text-farm-navy mb-1">No contacts found</p>
              <p className="text-xs text-slate-500 mb-4 max-w-sm mx-auto">
                No matching AGRITEX or Veterinary officers found for this search. Add your local extension officer's contact!
              </p>
              <button
                type="button"
                onClick={() => {
                  setEditingContact(null);
                  setIsAddModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-farm-navy text-farm-cyan font-bold text-xs rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Local Mudhumeni / Vet
              </button>
            </div>
          ) : (
            filteredContacts.map((contact) => (
              <div
                key={contact.id}
                id={`officer-card-${contact.id}`}
                className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs hover:shadow-xs transition-all hover:border-slate-300"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-bold text-farm-navy flex items-center gap-1.5">
                        {contact.name}
                      </h3>
                      {getRoleBadge(contact)}
                      {contact.isCustom && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          My Added Contact
                        </span>
                      )}
                    </div>

                    {contact.roleTitle && (
                      <p className="text-xs font-semibold text-slate-600">{contact.roleTitle}</p>
                    )}

                    {/* Location & Address */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 font-medium">
                      {(contact.wardOrArea || contact.district || contact.province) && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {[contact.wardOrArea, contact.district, contact.province]
                            .filter(Boolean)
                            .join(', ')}
                        </span>
                      )}
                      {contact.address && (
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {contact.address}
                        </span>
                      )}
                    </div>

                    {/* Specialization */}
                    {contact.specialization && (
                      <div className="text-xs bg-emerald-50/70 border border-emerald-100 rounded-lg px-2.5 py-1 text-emerald-900 font-medium mt-1 inline-block">
                        <span className="font-bold">Focus:</span> {contact.specialization}
                      </div>
                    )}

                    {/* Notes */}
                    {contact.notes && (
                      <p className="text-xs text-slate-500 italic mt-0.5">Note: {contact.notes}</p>
                    )}
                  </div>

                  {/* Right Actions: Call & WhatsApp & Edit/Delete */}
                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <div className="flex items-center gap-2">
                      {/* Direct Call Button */}
                      <a
                        href={`tel:${contact.phone.replace(/\s+/g, '')}`}
                        className="inline-flex items-center gap-1 px-3 py-2 bg-farm-navy hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 min-h-[38px] cursor-pointer"
                        title={`Call ${contact.name}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-farm-cyan" />
                        <span>Call</span>
                      </a>

                      {/* WhatsApp Button */}
                      {contact.whatsapp && (
                        <a
                          href={`https://wa.me/${contact.whatsapp.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-2xs transition-all active:scale-95 min-h-[38px] cursor-pointer"
                          title={`WhatsApp ${contact.name}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>
                      )}
                    </div>

                    {/* Edit / Delete for custom contacts */}
                    {contact.isCustom && (
                      <div className="flex items-center gap-1 mt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingContact(contact);
                            setIsAddModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
                          title="Edit Contact"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteContact(contact.id, contact.name)}
                          className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                          title="Delete Contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Note */}
        <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-slate-400" />
            Showing {filteredContacts.length} agricultural officers
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>

      {/* Add / Edit Officer Modal */}
      {isAddModalOpen && (
        <AddEditOfficerModal
          isOpen={isAddModalOpen}
          officerToEdit={editingContact}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingContact(null);
          }}
          onSaved={() => {
            setIsAddModalOpen(false);
            setEditingContact(null);
            loadContacts();
          }}
        />
      )}
    </div>
  );
};
