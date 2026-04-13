'use client';

import { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Edit, Trash2, Check, X, 
  Shield, Wrench, Eye, Calendar, CheckCircle, XCircle,
  User as UserIcon
} from 'lucide-react';
import { C } from '@/lib/colors';
import { fetchUsers, addUser, updateUser, deleteUser, type User } from '@/lib/api';

interface UsersConfigProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function UsersConfig({ onMessage, onRefresh }: UsersConfigProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [newUser, setNewUser] = useState<Partial<User>>({
    username: '',
    email: '',
    role: 'viewer',
    active: true,
  });

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const data = await fetchUsers();
    setUsers(data);
    setLoading(false);
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.email) {
      onMessage('Veuillez remplir tous les champs', 'error');
      return;
    }

    setLoading(true);
    const user = await addUser(newUser);
    setLoading(false);

    if (user) {
      setUsers([...users, user]);
      setShowAddUser(false);
      setNewUser({
        username: '',
        email: '',
        role: 'viewer',
        active: true,
      });
      onMessage('Utilisateur ajouté avec succès', 'success');
      onRefresh();
    } else {
      onMessage('Erreur lors de l\'ajout', 'error');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editingUser.id) return;

    setLoading(true);
    const updated = await updateUser(editingUser.id, newUser);
    setLoading(false);

    if (updated) {
      setUsers(users.map(u => u.id === editingUser.id ? updated : u));
      setShowAddUser(false);
      setEditingUser(null);
      setNewUser({
        username: '',
        email: '',
        role: 'viewer',
        active: true,
      });
      onMessage('Utilisateur mis à jour', 'success');
      onRefresh();
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      setLoading(true);
      const success = await deleteUser(userId);
      setLoading(false);
      
      if (success) {
        setUsers(users.filter(u => u.id !== userId));
        onMessage('Utilisateur supprimé', 'success');
        onRefresh();
      }
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={12} />;
      case 'user': return <Wrench size={12} />;
      default: return <Eye size={12} />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrateur';
      case 'user': return 'Technicien';
      default: return 'Observateur';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return C.blue;
      case 'user': return C.green;
      default: return C.amber;
    }
  };

  const getRoleBg = (role: string) => {
    switch (role) {
      case 'admin': return C.blueL;
      case 'user': return C.greenL;
      default: return C.amberL;
    }
  };

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
      padding: 20,
    }}>
      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Users size={18} color={C.green} />
          Gestion des utilisateurs
        </h2>
        <button
          onClick={() => {
            setEditingUser(null);
            setNewUser({
              username: '',
              email: '',
              role: 'viewer',
              active: true,
            });
            setShowAddUser(true);
          }}
          style={{
            padding: '8px 16px',
            borderRadius: 8,
            border: 'none',
            background: C.green,
            color: 'white',
            fontSize: 13,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <UserPlus size={16} />
          Ajouter un utilisateur
        </button>
      </div>

      {/* Formulaire d'ajout/édition */}
      {showAddUser && (
        <div style={{
          marginBottom: 20,
          padding: 20,
          background: C.surface2,
          borderRadius: 8,
        }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserPlus size={16} color={C.green} />
            {editingUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 12, color: C.text3 }}>Nom d'utilisateur *</label>
              <input
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  marginTop: 4,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.text3 }}>Email *</label>
              <input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  marginTop: 4,
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.text3 }}>Rôle</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as any })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  marginTop: 4,
                }}
              >
                <option value="admin">Administrateur</option>
                <option value="user">Technicien</option>
                <option value="viewer">Observateur</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: C.text3 }}>Statut</label>
              <select
                value={newUser.active ? 'active' : 'inactive'}
                onChange={(e) => setNewUser({ ...newUser, active: e.target.value === 'active' })}
                style={{
                  width: '100%',
                  padding: '8px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  color: C.text,
                  marginTop: 4,
                }}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button
              onClick={editingUser ? handleUpdateUser : handleAddUser}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: 'none',
                background: C.green,
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Check size={14} />
              {editingUser ? 'Mettre à jour' : 'Ajouter'}
            </button>
            <button
              onClick={() => {
                setShowAddUser(false);
                setEditingUser(null);
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 6,
                border: `1px solid ${C.border}`,
                background: 'transparent',
                color: C.text2,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <X size={14} />
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Liste des utilisateurs */}
      {loading && users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: C.text3 }}>Chargement...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${C.border}` }}>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Utilisateur</th>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Email</th>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Rôle</th>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Dernière connexion</th>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Statut</th>
              <th style={{ textAlign: 'left', padding: '12px 8px' }}>Actions</th>
             </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                <td style={{ padding: '12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <UserIcon size={14} />
                  {user.username}
                </td>
                <td style={{ padding: '12px 8px' }}>{user.email}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    background: getRoleBg(user.role),
                    color: getRoleColor(user.role),
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {getRoleIcon(user.role)}
                    {getRoleLabel(user.role)}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  {user.last_login ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={12} />
                      {new Date(user.last_login).toLocaleDateString('fr-FR')}
                    </span>
                  ) : '-'}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ 
                    color: user.active ? C.green : C.red,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    {user.active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                    {user.active ? 'Actif' : 'Inactif'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <button 
                    onClick={() => {
                      setEditingUser(user);
                      setNewUser(user);
                      setShowAddUser(true);
                    }}
                    style={{ color: C.blue, background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user.id)}
                    style={{ color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}