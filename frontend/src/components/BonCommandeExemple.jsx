import React from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Avatar } from "@mui/material";

// Remplacer par le chemin réel de ton logo importé dans le projet
import logoSysteme from "../../assets/logo-systeme.png";

const lignes = [
  { numero: 1, designation: "Lot de pièces de rechange", unite: "Lot", quantite: 1, prix: 24000, total: 24000 },
  { numero: 2, designation: "Prestation de mise en service", unite: "Service", quantite: 1, prix: 40000, total: 40000 },
];

export default function BonCommandeExemple() {
  return (
    <Box sx={{ maxWidth: 900, mx: "auto", my: 4, bgcolor: "#fff", borderRadius: 3, boxShadow: 3, p: { xs: 2, md: 5 } }}>
      {/* En-tête */}
      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "2px solid #3b82f6", pb: 2, mb: 2 }}>
        <Avatar src={logoSysteme} alt="Logo Système" sx={{ width: 90, height: 90, bgcolor: "#f3f4f6", border: "1px solid #e5e7eb" }} />
        <Typography sx={{ flex: 1, textAlign: "center", fontSize: "2.1rem", fontWeight: 700, color: "#3b82f6", letterSpacing: 2, mt: 2 }}>BON DE COMMANDE</Typography>
        <Box sx={{ minWidth: 160, fontSize: "0.98rem", color: "#374151", mt: 1 }}>
          <div><b>Date :</b> 22/03/2026</div>
          <div><b>N° :</b> BC-2026-001</div>
          <div><b>Page :</b> 1</div>
        </Box>
      </Box>
      {/* Infos client */}
      <Box sx={{ fontSize: "0.98rem", color: "#374151", mb: 2 }}>
        <b>Client :</b> Société Exemple SARL<br />
        <b>Adresse :</b> 123, Rue de l’Industrie, Tunis<br />
        <b>Contact :</b> contact@exemple.com | +216 12 345 678
      </Box>
      {/* Tableau */}
      <TableContainer component={Paper} sx={{ boxShadow: 0, mb: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>N°</TableCell>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>Désignation</TableCell>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>Unité</TableCell>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>Qté</TableCell>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>Prix Unitaire</TableCell>
              <TableCell sx={{ bgcolor: "#f1f5f9", color: "#2563eb", fontWeight: 600 }}>Total HT</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {lignes.map((ligne) => (
              <TableRow key={ligne.numero}>
                <TableCell>{ligne.numero}</TableCell>
                <TableCell>{ligne.designation}</TableCell>
                <TableCell>{ligne.unite}</TableCell>
                <TableCell>{ligne.quantite}</TableCell>
                <TableCell>{ligne.prix.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</TableCell>
                <TableCell>{ligne.total.toLocaleString("fr-FR", { minimumFractionDigits: 2 })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* Totaux */}
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Box component="table" sx={{ minWidth: 320 }}>
          <tbody>
            <tr>
              <td style={{ padding: 7, fontWeight: 500 }}>Total HT</td>
              <td style={{ padding: 7 }}>64 000,00</td>
            </tr>
            <tr>
              <td style={{ padding: 7, fontWeight: 500 }}>Remise</td>
              <td style={{ padding: 7 }}>600,00</td>
            </tr>
            <tr>
              <td style={{ padding: 7, fontWeight: 500 }}>Total net HT</td>
              <td style={{ padding: 7 }}>63 400,00</td>
            </tr>
            <tr>
              <td style={{ padding: 7, fontWeight: 700, color: "#3b82f6" }}>Total TTC</td>
              <td style={{ padding: 7, fontWeight: 700, color: "#3b82f6" }}>63 400,00</td>
            </tr>
          </tbody>
        </Box>
      </Box>
      {/* Signature */}
      <Box sx={{ mt: 6, display: "flex", justifyContent: "flex-end" }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography sx={{ color: "#64748b", fontSize: "0.95rem", mb: 2 }}>Signature et Cachet</Typography>
          <Box sx={{ width: 110, height: 60, bgcolor: "#f3f4f6", borderRadius: 2, opacity: 0.7 }} />
        </Box>
      </Box>
    </Box>
  );
}
