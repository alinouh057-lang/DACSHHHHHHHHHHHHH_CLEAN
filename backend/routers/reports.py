# ============================================================================
# FICHIER: reports.py
# ============================================================================
# 📌 RÔLE DU FICHIER:
#   Ce fichier permet de générer et télécharger des rapports personnalisés
#   sur les performances des panneaux solaires. Les rapports peuvent être
#   exportés dans différents formats (PDF, Excel, CSV, JSON).
#
# 📥 ENDPOINTS:
#   POST /api/v1/export/report           - Générer un rapport
#   GET  /api/v1/export/report/{report_id} - Télécharger un rapport
#
# 📊 STRUCTURE D'UNE DEMANDE DE RAPPORT (ReportRequest):
#   {
#     "start_date": "2026-04-01T00:00:00Z",  # Date de début (requis)
#     "end_date": "2026-04-30T23:59:59Z",    # Date de fin (requis)
#     "device_ids": ["esp2", "esp3"],        # Devices à inclure (optionnel)
#     "include_soiling": true,               # Inclure l'ensablement
#     "include_performance": true,           # Inclure les performances
#     "include_alerts": true,                # Inclure les alertes
#     "format": "pdf"                        # pdf/excel/csv/json
#   }
#
# 📤 RÉPONSE (ReportResponse):
#   {
#     "report_id": "550e8400-e29b-41d4-a716-446655440000",
#     "generated_at": "2026-04-11T15:30:00Z",
#     "download_url": "/api/v1/export/report/550e8400...",
#     "size_bytes": 125000,
#     "expires_at": "2026-04-18T15:30:00Z"   # Expire après 7 jours
#   }
#
# 🔐 AUTHENTIFICATION:
#   - Requise (verify_token) pour les deux endpoints
#
# 📁 STOCKAGE:
#   - Les rapports sont stockés dans le dossier "reports/"
#   - Expiration automatique après 7 jours (à implémenter)
#   - Format du nom: report_{uuid}.{extension}
#
# ⚠️ ÉTAT ACTUEL:
#   - Génération basique (seulement en-tête)
#   - À compléter avec les données réelles (soiling, performance, alerts)
#   - Formats PDF/Excel à implémenter avec des bibliothèques dédiées
#
# 🔮 AMÉLIORATIONS POSSIBLES:
#   - PDF: utiliser reportlab ou weasyprint
#   - Excel: utiliser openpyxl ou xlsxwriter
#   - Templates HTML pour les rapports
#   - Envoi par email automatique
#   - Planification de rapports récurrents
#
# ============================================================================

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pathlib import Path
from datetime import datetime, timedelta, timezone
import uuid
from auth import verify_token
from schemas import ReportRequest, ReportResponse

# Création du routeur pour les endpoints de rapports
# Toutes les routes commenceront par /api/v1/export
router = APIRouter(prefix="/api/v1/export", tags=["reports"])

# Dossier de stockage des rapports générés
REPORTS_DIR = "reports"


# ============================================================================
# 📄 GÉNÉRATION D'UN RAPPORT
# ============================================================================

@router.post("/report", response_model=ReportResponse)
async def generate_report(
    request: ReportRequest,
    token_payload: dict = Depends(verify_token)
):
    """
    Génère un rapport personnalisé basé sur les critères fournis.
    
    📥 ENTRÉE (ReportRequest):
        - start_date           : Date de début (ISO format)
        - end_date             : Date de fin (ISO format)
        - device_ids           : Liste des devices à inclure (optionnel)
        - include_soiling      : Inclure les données d'ensablement
        - include_performance  : Inclure les KPIs de performance
        - include_alerts       : Inclure l'historique des alertes
        - format               : pdf/excel/csv/json
    
    📤 SORTIE (ReportResponse):
        - report_id     : Identifiant unique du rapport
        - generated_at  : Date de génération
        - download_url  : URL pour télécharger le rapport
        - size_bytes    : Taille du fichier en octets
        - expires_at    : Date d'expiration (7 jours)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    📁 FONCTIONNEMENT:
        1. Génère un ID unique (UUID v4)
        2. Crée un fichier dans reports/ avec l'extension demandée
        3. Écrit les données demandées dans le fichier
        4. Retourne les métadonnées pour téléchargement
    
    ⚠️ ÉTAT ACTUEL:
        - Version simplifiée (seulement en-tête)
        - À compléter avec les vraies données depuis MongoDB
        - Les formats autres que CSV/JSON nécessitent des bibliothèques
    
    💡 EXEMPLE D'UTILISATION:
        POST /api/v1/export/report
        {
            "start_date": "2026-04-01T00:00:00Z",
            "end_date": "2026-04-30T23:59:59Z",
            "device_ids": ["esp2"],
            "include_soiling": true,
            "include_performance": true,
            "include_alerts": false,
            "format": "csv"
        }
    """
    # Générer un ID unique pour le rapport
    report_id = str(uuid.uuid4())
    filename = f"report_{report_id}.{request.format.value}"
    filepath = Path(REPORTS_DIR) / filename
    
    # Créer le dossier si nécessaire
    filepath.parent.mkdir(exist_ok=True)
    
    # ========================================================================
    # GÉNÉRATION DU CONTENU (VERSION SIMPLIFIÉE)
    # ========================================================================
    # TODO: Remplacer par la vraie génération de rapport avec données MongoDB
    # - Récupérer les mesures dans la période
    # - Calculer les statistiques d'ensablement
    # - Calculer les KPIs de performance
    # - Récupérer les alertes
    # - Formater selon le format demandé (PDF, Excel, CSV, JSON)
    
    with open(filepath, "w") as f:
        f.write(f"Rapport généré le {datetime.now()}\n")
        f.write(f"Période: {request.start_date} - {request.end_date}\n")
        f.write(f"Devices: {request.device_ids or 'Tous'}\n")
        f.write(f"Inclure ensablement: {request.include_soiling}\n")
        f.write(f"Inclure performances: {request.include_performance}\n")
        f.write(f"Inclure alertes: {request.include_alerts}\n")
        f.write("\n")
        f.write("=== DONNÉES À IMPLÉMENTER ===\n")
        f.write("Cette version est simplifiée. Les données réelles seront ajoutées prochainement.\n")
    
    # ========================================================================
    # RÉPONSE AVEC MÉTADONNÉES
    # ========================================================================
    return ReportResponse(
        report_id=report_id,
        generated_at=datetime.now(timezone.utc),
        download_url=f"/api/v1/export/report/{report_id}",
        size_bytes=filepath.stat().st_size,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )


# ============================================================================
# ⬇️ TÉLÉCHARGEMENT D'UN RAPPORT
# ============================================================================

@router.get("/report/{report_id}")
async def download_report(
    report_id: str,
    token_payload: dict = Depends(verify_token)
):
    """
    Télécharge un rapport précédemment généré.
    
    📥 ENTRÉE:
        - report_id : Identifiant unique du rapport (UUID)
    
    📤 SORTIE: Fichier du rapport (téléchargement automatique)
    
    🔒 AUTHENTIFICATION: Requise (verify_token)
    
    🔍 FONCTIONNEMENT:
        1. Recherche le fichier dans reports/ avec n'importe quelle extension
        2. Si trouvé, retourne le fichier en téléchargement
        3. Si non trouvé, retourne une erreur 404
    
    ⚠️ ERREURS:
        - 404: Rapport non trouvé (expiré, supprimé, ou ID invalide)
    
    💡 NOTE:
        - Les rapports expirent automatiquement après 7 jours
        - Le nom du fichier téléchargé est "pv_report.{ext}"
        - Le type MIME est "application/octet-stream"
    """
    # Parcourir les extensions possibles pour trouver le rapport
    for ext in ["pdf", "excel", "csv", "json"]:
        filepath = Path(REPORTS_DIR) / f"report_{report_id}.{ext}"
        if filepath.exists():
            return FileResponse(
                path=filepath,
                filename=f"pv_report.{ext}",
                media_type="application/octet-stream"
            )
    
    raise HTTPException(status_code=404, detail="Rapport non trouvé")