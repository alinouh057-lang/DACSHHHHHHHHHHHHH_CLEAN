'use client';

import { useState } from 'react';
import { 
  Trash2, Database, Wrench, Bell, Archive, CalendarDays, 
  Clock, Info, AlertTriangle, AlertCircle, X, Loader,
  Smartphone
} from 'lucide-react';
import { C } from '@/lib/colors';
import { useAdminData } from '../hooks/useAdminData';

interface DataManagementProps {
  onMessage: (text: string, type: 'success' | 'error') => void;
  onRefresh: () => void;
}

export default function DataManagement({ onMessage, onRefresh }: DataManagementProps) {
  const {
    showDeleteModal,
    setShowDeleteModal,
    deleteType,
    setDeleteType,
    deleteCollection,
    setDeleteCollection,
    retentionDays,
    setRetentionDays,
    deleteLoading,
    deleteConfirmText,
    setDeleteConfirmText,
    handleDeleteAllData,
    handleDeleteOldData,
  } = useAdminData();

  const deleteOptions = [
    { id: 'surveillance', label: 'Mesures (historique)', color: C.blue, icon: Database },
    { id: 'interventions', label: 'Interventions', color: C.amber, icon: Wrench },
    { id: 'alerts', label: 'Alertes', color: C.red, icon: Bell },
  ];

  return (
    <>
      <div style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        padding: 20,
        marginTop: 20,
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.text, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Trash2 size={18} color={C.red} />
          Gestion des données
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* 1. Choix de la collection */}
          <div>
            <label style={{ 
              fontSize: 13, fontWeight: 600, color: C.text, 
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 
            }}>
              <Database size={16} color={C.blue} />
              Quelle donnée voulez-vous supprimer ?
            </label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {deleteOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = deleteCollection === option.id;
                return (
                  <label
                    key={option.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '8px 16px',
                      borderRadius: 8,
                      background: isSelected ? `${option.color}20` : C.surface2,
                      border: `1px solid ${isSelected ? option.color : C.border}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <input
                      type="radio"
                      name="deleteCollection"
                      value={option.id}
                      checked={isSelected}
                      onChange={(e) => setDeleteCollection(e.target.value)}
                      style={{ accentColor: option.color }}
                    />
                    <Icon size={16} color={isSelected ? option.color : C.text3} />
                    <span style={{ fontSize: 13, color: isSelected ? option.color : C.text2 }}>
                      {option.label}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 2. Type de suppression */}
          <div>
            <label style={{ 
              fontSize: 13, fontWeight: 600, color: C.text, 
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 
            }}>
              <Trash2 size={18} color={C.red} />
              Comment voulez-vous supprimer ?
            </label>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: deleteType === 'all' ? C.redL : C.surface2,
                  border: `1px solid ${deleteType === 'all' ? C.red : C.border}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="deleteType"
                  value="all"
                  checked={deleteType === 'all'}
                  onChange={() => setDeleteType('all')}
                  style={{ accentColor: C.red }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Trash2 size={20} color={deleteType === 'all' ? C.red : C.text3} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deleteType === 'all' ? C.red : C.text }}>
                      Supprimer TOUT
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>
                      Supprime définitivement toutes les données de cette collection
                    </div>
                  </div>
                </div>
              </label>
              
              <label
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: deleteType === 'old' ? C.amberL : C.surface2,
                  border: `1px solid ${deleteType === 'old' ? C.amber : C.border}`,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="deleteType"
                  value="old"
                  checked={deleteType === 'old'}
                  onChange={() => setDeleteType('old')}
                  style={{ accentColor: C.amber }}
                />
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Archive size={20} color={deleteType === 'old' ? C.amber : C.text3} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: deleteType === 'old' ? C.amber : C.text }}>
                      Supprimer les données plus anciennes
                    </div>
                    <div style={{ fontSize: 11, color: C.text3 }}>
                      Ne conserve que les X derniers jours
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* 3. Nombre de jours */}
          {deleteType === 'old' && (
            <div style={{
              background: C.surface2,
              borderRadius: 10,
              padding: 16,
              border: `1px solid ${C.border}`,
            }}>
              <label style={{ 
                fontSize: 12, color: C.text3, 
                display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 
              }}>
                <CalendarDays size={14} color={C.amber} />
                Conserver les données des derniers :
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  type="range"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  min={1}
                  max={365}
                  style={{ flex: 1, height: 4, borderRadius: 2, accentColor: C.amber }}
                />
                <div style={{
                  background: C.surface,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: `1px solid ${C.border}`,
                  minWidth: 80,
                  textAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}>
                  <Clock size={12} color={C.amber} />
                  <span style={{ fontSize: 14, fontWeight: 600, color: C.amber }}>{retentionDays}</span>
                  <span style={{ fontSize: 11, color: C.text3 }}>jours</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: C.text3, marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                <Info size={12} />
                Les données plus anciennes que {retentionDays} jours seront supprimées
              </div>
            </div>
          )}

          {/* 4. Bouton de suppression */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={() => setShowDeleteModal(true)}
              style={{
                padding: '12px 24px',
                borderRadius: 8,
                border: 'none',
                background: C.red,
                color: 'white',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Trash2 size={18} />
              Supprimer
            </button>
          </div>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showDeleteModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: C.surface,
            borderRadius: 14,
            padding: 24,
            width: 500,
            maxWidth: '90%',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <AlertTriangle size={28} color={C.red} />
              <h3 style={{ fontSize: 18, fontWeight: 700, color: C.red }}>Confirmation de suppression</h3>
            </div>

            <div style={{
              background: C.surface2,
              borderRadius: 10,
              padding: 16,
              marginBottom: 20,
            }}>
              <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: C.redL, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={20} color={C.red} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {deleteCollection === 'surveillance' && <Database size={14} color={C.blue} />}
                    {deleteCollection === 'interventions' && <Wrench size={14} color={C.amber} />}
                    {deleteCollection === 'alerts' && <Bell size={14} color={C.red} />}
                    {deleteCollection === 'surveillance' && 'Mesures (historique)'}
                    {deleteCollection === 'interventions' && 'Interventions'}
                    {deleteCollection === 'alerts' && 'Alertes'}
                  </div>
                  <div style={{ fontSize: 12, color: C.text3, marginTop: 2 }}>
                    {deleteType === 'all' 
                      ? '⚠️ Toutes les données seront supprimées définitivement'
                      : `⚠️ Les données plus anciennes que ${retentionDays} jours seront supprimées`
                    }
                  </div>
                </div>
              </div>

              {deleteType === 'all' && (
                <div style={{
                  padding: 10,
                  background: C.redL,
                  borderRadius: 8,
                  fontSize: 12,
                  color: C.red,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}>
                  <AlertCircle size={14} />
                  <strong>Attention :</strong> Cette action est irréversible !
                </div>
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: C.text3, display: 'block', marginBottom: 8 }}>
                Tapez <strong style={{ color: C.red }}>"SUPPRIMER"</strong> pour confirmer :
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="SUPPRIMER"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: C.surface2,
                  fontSize: 14,
                  textAlign: 'center',
                  letterSpacing: 2,
                  fontWeight: 600,
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                style={{
                  padding: '10px 20px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  background: 'transparent',
                  color: C.text2,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <X size={14} />
                Annuler
              </button>
              <button
                onClick={deleteType === 'all' ? handleDeleteAllData : handleDeleteOldData}
                disabled={deleteConfirmText !== 'SUPPRIMER' || deleteLoading}
                style={{
                  padding: '10px 24px',
                  borderRadius: 8,
                  border: 'none',
                  background: deleteConfirmText === 'SUPPRIMER' && !deleteLoading ? C.red : C.surface2,
                  color: deleteConfirmText === 'SUPPRIMER' && !deleteLoading ? 'white' : C.text3,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: deleteConfirmText === 'SUPPRIMER' && !deleteLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {deleteLoading ? <Loader size={16} className="spin" /> : <Trash2 size={16} />}
                {deleteLoading ? 'Suppression...' : 'Confirmer la suppression'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}