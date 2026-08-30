import React, { useState } from 'react';
import { X, User, Phone, MessageSquare, MapPin, Building, Sprout, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { db } from '../../db';
import { OfficerContact, OfficerRole } from '../../types';

interface AddEditOfficerModalProps {
  isOpen: boolean;
  officerToEdit?: OfficerContact | null;
  onClose: () => void;
  onSaved: (officer: OfficerContact) => void;
}

export const AddEditOfficerModal: React.FC<AddEditOfficerModalProps> = ({
  isOpen,
  officerToEdit,
  onClose,
  onSaved,
}) => {
  const [name, setName] = useState(officerToEdit?.name || '');
  const [role, setRole] = useState<OfficerRole>(officerToEdit?.role || 'mudhumeni');
  const [roleTitle, setRoleTitle] = useState(officerToEdit?.roleTitle || '');
  const [phone, setPhone] = useState(officerToEdit?.phone || '');
  const [whatsapp, setWhatsapp] = useState(officerToEdit?.whatsapp || '');
  const [province, setProvince] = useState(officerToEdit?.province || 'Mashonaland East');
  const [district, setDistrict] = useState(officerToEdit?.district || '');
  const [wardOrArea, setWardOrArea] = useState(officerToEdit?.wardOrArea || '');
  const [address, setAddress] = useState(officerToEdit?.address || '');
  const [specialization, setSpecialization] = useState(officerToEdit?.specialization || '');
  const [notes, setNotes] = useState(officerToEdit?.notes || '');

  React.useEffect(() => {
    if (officerToEdit) {
      setName(officerToEdit.name);
      setRole(officerToEdit.role);
      setRoleTitle(officerToEdit.roleTitle || '');
      setPhone(officerToEdit.phone);
      setWhatsapp(officerToEdit.whatsapp || '');
      setProvince(officerToEdit.province || 'Mashonaland East');
      setDistrict(officerToEdit.district || '');
      setWardOrArea(officerToEdit.wardOrArea || '');
      setAddress(officerToEdit.address || '');
      setSpecialization(officerToEdit.specialization || '');
      setNotes(officerToEdit.notes || '');
    } else {
      setName('');
      setRole('mudhumeni');
      setRoleTitle('Ward AGRITEX Extension Officer');
      setPhone('');
      setWhatsapp('');
      setProvince('Mashonaland East');
      setDistrict('');
      setWardOrArea('');
      setAddress('');
      setSpecialization('');
      setNotes('');
    }
  }, [officerToEdit, isOpen]);

  if (!isOpen) return null;

  const provinces = [
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const contact: OfficerContact = {
      id: officerToEdit?.id || 'officer_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      name: name.trim(),
      role,
      roleTitle: roleTitle.trim() || undefined,
      phone: phone.trim(),
      whatsapp: whatsapp.trim() || phone.trim(),
      province,
      district: district.trim() || undefined,
      wardOrArea: wardOrArea.trim() || undefined,
      address: address.trim() || undefined,
      specialization: specialization.trim() || undefined,
      notes: notes.trim() || undefined,
      isCustom: officerToEdit ? officerToEdit.isCustom : true,
      createdAt: officerToEdit?.createdAt || Date.now(),
    };

    await db.officerContacts.put(contact);
    onSaved(contact);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              {role === 'vet_officer' || role === 'livestock_specialist' ? (
                <ShieldAlert className="w-6 h-6 stroke-[2.2]" />
              ) : (
                <Sprout className="w-6 h-6 stroke-[2.2]" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-farm-navy">
                {officerToEdit ? 'Edit Officer Contact' : 'Add AGRITEX / Vet Contact'}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Mudhumeni, Agronomist or Veterinary Officer in your area
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Officer Role */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Role / Specialty Category
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as OfficerRole)}
              className="w-full min-h-[44px] px-3.5 py-2 text-sm font-bold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none bg-slate-50 text-slate-900"
            >
              <option value="mudhumeni">🌾 Mudhumeni (AGRITEX Ward Extension Officer)</option>
              <option value="agronomist">🌱 Agronomist (Crops & Horticulture Specialist)</option>
              <option value="vet_officer">🩺 Veterinary Officer (Chiremba weMhuka / DVS)</option>
              <option value="livestock_specialist">🐂 Livestock & Diptank Supervisor</option>
              <option value="agro_dealer">🏪 Agro-Dealer / Certified Seed & Chemical Supplier</option>
              <option value="other">📋 Other Agricultural Officer</option>
            </select>
          </div>

          {/* Full Name & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mr. T. Moyo / Dr. Chidzero"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Position / Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Ward 6 Extension Officer"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Phone & WhatsApp */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Phone Number (Calls) *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +263 77 212 3456"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-bold font-mono rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                WhatsApp Number
              </label>
              <input
                type="tel"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. +263 77 212 3456"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-bold font-mono rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Location Details: Province & District */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Province
              </label>
              <select
                value={province}
                onChange={(e) => setProvince(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 bg-slate-50 outline-none"
              >
                {provinces.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                District / Area
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="e.g. Marondera / Chinhoyi / Gutu"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Ward & Address */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Ward / Growth Point
              </label>
              <input
                type="text"
                value={wardOrArea}
                onChange={(e) => setWardOrArea(e.target.value)}
                placeholder="e.g. Ward 4 / Murehwa Center"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Physical Office / Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. RDC Complex, Stand 12"
                className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
              />
            </div>
          </div>

          {/* Specialization / Crops & Livestock */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Key Specialization / Advisory Focus
            </label>
            <input
              type="text"
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              placeholder="e.g. Maize Pfumvudza inputs, Armyworm trap, Diptank vaccines"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm font-semibold rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Farmer Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Available Mon-Thu, diptank inspections every 2 weeks"
              className="w-full min-h-[44px] px-3.5 py-2 text-sm rounded-xl border-2 border-slate-300 focus:border-farm-cyan outline-none font-medium"
            />
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full min-h-[48px] py-3 px-4 bg-farm-navy hover:bg-slate-800 text-white font-bold text-base rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
            >
              <CheckCircle2 className="w-5 h-5 text-farm-cyan" />
              <span>{officerToEdit ? 'Save Changes' : 'Save Contact to Directory'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
