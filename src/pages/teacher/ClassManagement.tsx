import React, { useState, useEffect } from 'react';
import { DatabaseService, subscribeToDataChanges } from '../../services/db';
import { ClassItem, UserProfile } from '../../types';
import {
  School,
  Plus,
  Edit2,
  Trash2,
  Users,
  CheckCircle,
  XCircle,
  X,
  Layers
} from 'lucide-react';

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);

  const [nama, setNama] = useState('');
  const [tingkat, setTingkat] = useState('XI');
  const [jurusan, setJurusan] = useState('MIPA');
  const [status, setStatus] = useState<'aktif' | 'nonaktif'>('aktif');
  const [notification, setNotification] = useState<string | null>(null);

  const loadData = async () => {
    const [c, u] = await Promise.all([
      DatabaseService.getClasses(),
      DatabaseService.getUsers()
    ]);
    setClasses(c);
    setStudents(u.filter((x) => x.role === 'murid'));
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToDataChanges(loadData);
    return () => unsub();
  }, []);

  const openAddModal = () => {
    setEditingClass(null);
    setNama('');
    setTingkat('XI');
    setJurusan('MIPA');
    setStatus('aktif');
    setIsModalOpen(true);
  };

  const openEditModal = (c: ClassItem) => {
    setEditingClass(c);
    setNama(c.nama);
    setTingkat(c.tingkat);
    setJurusan(c.jurusan || 'MIPA');
    setStatus(c.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;

    const oldName = editingClass?.nama;
    const newName = nama.trim();

    const classData: ClassItem = {
      id: editingClass ? editingClass.id : `class-${newName.toLowerCase().replace(/\s+/g, '-')}`,
      nama: newName,
      tingkat,
      jurusan,
      status,
      createdAt: editingClass?.createdAt || new Date().toISOString()
    };

    await DatabaseService.saveClass(classData);

    // Jika guru mengubah nama rombel/kelas, otomatis perbarui data murid di kelas tersebut
    if (editingClass && oldName && oldName !== newName) {
      const affectedStudents = students.filter((s) => s.kelas === oldName);
      for (const s of affectedStudents) {
        await DatabaseService.saveUser({ ...s, kelas: newName });
      }
    }

    await loadData();
    setIsModalOpen(false);
    showNotice(editingClass ? `Data kelas "${newName}" berhasil diperbarui` : `Kelas "${newName}" berhasil ditambahkan`);
  };

  const handleToggleStatus = async (c: ClassItem) => {
    const newStatus = c.status === 'aktif' ? 'nonaktif' : 'aktif';
    await DatabaseService.saveClass({ ...c, status: newStatus });
    await loadData();
    showNotice(`Status kelas ${c.nama} diubah menjadi ${newStatus}`);
  };

  const handleDelete = async (id: string, name: string) => {
    const studentCount = students.filter((s) => s.kelas === name).length;
    if (studentCount > 0) {
      alert(`Tidak dapat menghapus kelas ${name} karena masih memiliki ${studentCount} siswa terdaftar.`);
      return;
    }
    if (window.confirm(`Hapus kelas ${name}?`)) {
      await DatabaseService.deleteClass(id);
      await loadData();
      showNotice(`Kelas ${name} berhasil dihapus`);
    }
  };

  const showNotice = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-blue-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-heading">
            Data Rombongan Belajar (Kelas)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Kelola daftar kelas yang diajar dalam mata pelajaran PJOK
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kelas Baru</span>
        </button>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((c) => {
          const studentCount = students.filter((s) => s.kelas === c.nama).length;
          return (
            <div
              key={c.id}
              className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700">
                    Tingkat {c.tingkat}
                  </span>
                  <button
                    onClick={() => handleToggleStatus(c)}
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold transition-colors cursor-pointer ${
                      c.status === 'aktif'
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    }`}
                  >
                    {c.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg">
                    <School className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900 font-heading">
                      Kelas {c.nama}
                    </h3>
                    <p className="text-xs text-slate-400 font-medium">
                      Peminatan / Program: {c.jurusan || 'Reguler'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-600">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="font-bold text-slate-800">{studentCount} Siswa</span>
                  <span className="text-slate-400">terdaftar di kelas ini</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(c)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => handleDelete(c.id, c.nama)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Class Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-800 text-lg font-heading">
                {editingClass ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Kelas * (Contoh: XI 7, X 1, XII 3)
                </label>
                <input
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  placeholder="Contoh: XI 7"
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Tingkat
                  </label>
                  <select
                    value={tingkat}
                    onChange={(e) => setTingkat(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                  >
                    <option value="X">Kelas X (10)</option>
                    <option value="XI">Kelas XI (11)</option>
                    <option value="XII">Kelas XII (12)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'aktif' | 'nonaktif')}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Peminatan / Jurusan
                </label>
                <input
                  type="text"
                  value={jurusan}
                  onChange={(e) => setJurusan(e.target.value)}
                  placeholder="Contoh: MIPA, IPS, Teknik, atau Umum"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-600"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  {editingClass ? 'Simpan Perubahan' : 'Tambah Kelas'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
