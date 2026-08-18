import React, { useState } from "react";

// ─── Palette & tokens ───────────────────────────────────────────────────────
const C = {
  bg:        "#08080f",
  bgRight:   "#0b0b18",
  card:      "#0f0f1e",
  border:    "rgba(255,255,255,0.06)",
  borderAlt: "rgba(255,255,255,0.04)",
  purple:    "#6c63ff",
  purpleHov: "#5b53e8",
  purpleLow: "rgba(108,99,255,0.15)",
  purpleBdr: "rgba(108,99,255,0.25)",
  white:     "#fff",
  muted1:    "#8888aa",
  muted2:    "#555570",
  muted3:    "#424260",
  muted4:    "#3d3d5c",
  muted5:    "#2e2e48",
  green:     "#22c55e",
  greenLow:  "rgba(34,197,94,0.1)",
  greenBdr:  "rgba(34,197,94,0.15)",
};

// ─── Shared atoms ────────────────────────────────────────────────────────────
const Divider = () => (
  <div style={{ height: 1, background: "rgba(255,255,255,0.05)" }} />
);

const EtaBar = ({ pct = 60, label = "Progression estimée" }) => (
  <div style={{ marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
      <span style={{ fontSize: "0.75rem", color: C.muted3 }}>{label}</span>
      <span style={{ fontSize: "0.75rem", color: C.purple, fontWeight: 600 }}>{pct} %</span>
    </div>
    <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 100, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: C.purple, borderRadius: 100 }} />
    </div>
  </div>
);

const RIcon = ({ color = "purple", children }) => {
  const bg  = color === "purple" ? C.purpleLow : C.greenLow;
  const bdr = color === "purple" ? "rgba(108,99,255,0.2)" : C.greenBdr;
  return (
    <div style={{
      width: 38, height: 38, borderRadius: 10, flexShrink: 0,
      background: bg, border: `1px solid ${bdr}`,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {children}
    </div>
  );
};

const RCard = ({ children }) => (
  <div style={{
    background: C.card, border: `1px solid ${C.border}`,
    borderRadius: 16, padding: 24,
  }}>
    {children}
  </div>
);

// ─── Step chip ───────────────────────────────────────────────────────────────
const CHIP_STYLES = {
  done:    { bg: "rgba(34,197,94,0.1)",    color: "#4ade80", border: "rgba(34,197,94,0.2)"    },
  active:  { bg: C.purpleLow,              color: "#9490e0", border: C.purpleBdr              },
  pending: { bg: "rgba(255,255,255,0.04)", color: C.muted4,  border: "rgba(255,255,255,0.06)" },
};
const Chip = ({ variant, label }) => {
  const s = CHIP_STYLES[variant];
  return (
    <span style={{
      fontSize: "0.68rem", fontWeight: 700, padding: "3px 10px",
      borderRadius: 100, letterSpacing: "0.04em",
      background: s.bg, color: s.color, border: `1px solid ${s.border}`,
    }}>
      {label}
    </span>
  );
};

// ─── Step icon ────────────────────────────────────────────────────────────────
const StepIcon = ({ variant }) => {
  const base = {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  if (variant === "done") return (
    <div style={{ ...base, background: C.purpleLow, border: "1px solid rgba(108,99,255,0.3)" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M3 8l3.5 3.5L13 5" stroke={C.purple} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
  if (variant === "active") return (
    <div style={{ ...base, background: "rgba(108,99,255,0.2)", border: `1px solid ${C.purple}` }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="3" fill={C.purple} />
        <circle cx="8" cy="8" r="6.5" stroke={C.purple} strokeWidth="1" />
      </svg>
    </div>
  );
  return (
    <div style={{ ...base, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="5.5" stroke={C.muted4} strokeWidth="1.2" />
      </svg>
    </div>
  );
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const STEPS = [
  { variant: "done",    chip: "Complété",   title: "Collecte du profil",       desc: "Compte créé et adresse e-mail validée le 3 fév. 2026." },
  { variant: "done",    chip: "Complété",   title: "Soumission des documents", desc: "Pièce d'identité et justificatif de domicile reçus." },
  { variant: "active",  chip: "En cours",   title: "Analyse de conformité",    desc: "Nos agents vérifient vos documents. Délai estimé : 12 à 36h.", showEta: true },
  { variant: "pending", chip: "En attente", title: "Activation du compte",     desc: "Notification par e-mail dès la validation finale." },
];

const FAQS = [
  { q: "Combien de temps dure la vérification ?",  a: "En général, les comptes sont vérifiés en moins de 36 heures. Dans certains cas le processus peut prendre jusqu'à 5 jours ouvrés si des informations supplémentaires sont requises." },
  { q: "Quels documents sont nécessaires ?",       a: "Une pièce d'identité officielle (passeport, CNI ou permis) ainsi qu'un justificatif de domicile de moins de 3 mois sont obligatoires." },
  { q: "Puis-je accéder avant validation ?",       a: "L'accès complet est restreint pendant la vérification. Vous pouvez consulter le statut de votre dossier, mais les fonctionnalités seront disponibles après validation." },
];

// ─── FAQ item ─────────────────────────────────────────────────────────────────
const FaqItem = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderTop: `1px solid ${C.borderAlt}` }}>
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 0", cursor: "pointer", gap: 12 }}
      >
        <span style={{ fontSize: "0.84rem", color: C.muted1, fontWeight: 500 }}>{q}</span>
        <div style={{
          width: 22, height: 22, borderRadius: 6, flexShrink: 0,
          background: open ? C.purpleLow : "rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.2s",
        }}>
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path d={open ? "M2 6.5l3-3 3 3" : "M2 3.5l3 3 3-3"} stroke={C.muted2} strokeWidth="1.5" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      </div>
      {open && <p style={{ fontSize: "0.8rem", color: C.muted3, lineHeight: 1.7, paddingBottom: 14, margin: 0 }}>{a}</p>}
    </div>
  );
};

// ─── Arrow icon ───────────────────────────────────────────────────────────────
const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
    <path d="M2.5 6h7M6.5 3l3 3-3 3" stroke={C.purple} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Main component ───────────────────────────────────────────────────────────
const VerificationPage = () => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1600);
  };

  return (
    <div style={{
      background: C.bg, minHeight: "100vh",
      display: "grid", gridTemplateColumns: "1fr 420px",
      fontFamily: "'Inter', system-ui, sans-serif",
    }}>

      {/* ── Left column ── */}
      <div style={{ padding: "56px 48px", borderRight: `1px solid ${C.border}`, display: "flex", flexDirection: "column", gap: 40 }}>

        {/* Hero */}
        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(108,99,255,0.1)", border: `1px solid ${C.purpleBdr}`,
            borderRadius: 100, padding: "5px 14px", marginBottom: 24,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: C.purple, display: "inline-block" }} />
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#9490e0", letterSpacing: "0.06em", textTransform: "uppercase" }}>
              Vérification en cours
            </span>
          </div>

          <h1 style={{ fontSize: "2.6rem", fontWeight: 700, lineHeight: 1.15, color: C.white, marginBottom: 16, letterSpacing: "-0.02em" }}>
            Votre accès sécurisé est  <span style={{ color: C.purple }}>en préparation.</span>
          </h1>
<p
  style={{
    fontSize: "0.92rem",
    color: C.muted3,
    lineHeight: 1.75,
    maxWidth: 420,
    margin: 0,
    whiteSpace: "nowrap"
  }}
>

  Votre demande de création de compte a bien été reçue. Notre équipe de conformité procédera à l’analyse de vos informations. Vous recevrez un e-mail de confirmation dès que votre <br />
  compte sera validé.
</p>
      </div>

        <Divider />

        {/* Steps */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted4, letterSpacing: "0.12em", textTransform: "uppercase" }}>Progression</span>
            <span style={{ fontSize: "0.72rem", color: C.purple, fontWeight: 600 }}>2 / 4 complétées</span>
          </div>

          {STEPS.map((s, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "40px 1fr", gap: 16,
              alignItems: "start", padding: "16px 0",
              borderBottom: i < STEPS.length - 1 ? `1px solid ${C.borderAlt}` : "none",
            }}>
              <StepIcon variant={s.variant} />
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
                  <span style={{ fontSize: "0.88rem", fontWeight: 600, color: s.variant === "pending" ? C.muted4 : C.white }}>
                    {s.title}
                  </span>
                  <Chip variant={s.variant} label={s.chip} />
                </div>
                <p style={{ fontSize: "0.8rem", color: s.variant === "pending" ? C.muted5 : C.muted3, lineHeight: 1.65, margin: 0 }}>
                  {s.desc}
                </p>
                {s.showEta && <EtaBar pct={60} label="Analyse en cours" />}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12 }}>
          <button
            onClick={handleRefresh}
            style={{
              flex: 1, background: C.purple, color: C.white, border: "none",
              borderRadius: 10, padding: "13px 20px", fontSize: "0.85rem",
              fontWeight: 600, cursor: "pointer",
            }}
          >
            {refreshing ? "Actualisation…" : "↻  Actualiser le statut"}
          </button>
          <button style={{
            background: "transparent", color: C.muted2,
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10,
            padding: "13px 20px", fontSize: "0.85rem", fontWeight: 500,
            cursor: "pointer", whiteSpace: "nowrap",
          }}>
            Contacter le support
          </button>
        </div>

        <Divider />

        {/* FAQ */}
        <div>
          <div style={{ fontSize: "0.72rem", fontWeight: 700, color: C.muted4, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 16 }}>
            Questions fréquentes
          </div>
          {FAQS.map((f, i) => <FaqItem key={i} q={f.q} a={f.a} />)}
        </div>
      </div>

      {/* ── Right column ── */}
      <div style={{ padding: "56px 40px", background: C.bgRight, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Security */}
        <RCard>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <RIcon color="purple">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 2L3 4.5V9c0 3.5 2.5 6.75 6 7.75C15 15.75 15 12.5 15 9V4.5L9 2Z" stroke={C.purple} strokeWidth="1.4" />
                <path d="M6.5 9l2 2L11.5 7" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </RIcon>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: C.white }}>Sécurité de niveau bancaire</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: C.muted3, lineHeight: 1.65, marginTop: 4, marginBottom: 16 }}>
            Chiffrement AES-256 et protocole TLS 1.3 appliqués à chaque étape du traitement de vos données.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Conformité", "RGPD"], ["Chiffrement", "SSL 256-bit"]].map(([label, val]) => (
              <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted4, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: "0.82rem", color: C.muted1, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.green, flexShrink: 0 }} />
                  {val}
                </div>
              </div>
            ))}
          </div>
        </RCard>

        {/* ETA */}
        <RCard>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <RIcon color="green">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="9" r="6.5" stroke={C.green} strokeWidth="1.4" />
                <path d="M9 5.5v4l2.5 2" stroke={C.green} strokeWidth="1.4" strokeLinecap="round" />
              </svg>
            </RIcon>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: C.white }}>Délai estimé</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: C.muted3, lineHeight: 1.65, marginTop: 4 }}>
            Votre dossier est en cours d'examen. La validation intervient généralement sous 12 à 36 heures ouvrées.
          </p>
          <EtaBar pct={60} label="Analyse en cours" />
        </RCard>

        {/* Support */}
        <RCard>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <RIcon color="purple">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 13.5C3 11.015 5.015 9 7.5 9h3c2.485 0 4.5 2.015 4.5 4.5" stroke={C.purple} strokeWidth="1.4" strokeLinecap="round" />
                <circle cx="9" cy="5.5" r="2.5" stroke={C.purple} strokeWidth="1.4" />
              </svg>
            </RIcon>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: C.white }}>Support dédié 24 / 7</span>
          </div>
          <p style={{ fontSize: "0.78rem", color: C.muted3, lineHeight: 1.65, marginTop: 4, marginBottom: 12 }}>
            Un agent de conformité est disponible en permanence pour répondre à vos questions.
          </p>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="#" style={{ fontSize: "0.78rem", color: C.purple, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
              Contacter un agent <Arrow />
            </a>
            <span style={{ fontSize: "0.72rem", color: C.muted5 }}>Réponse sous 2h</span>
          </div>
        </RCard>

        {/* Policy */}
        <RCard>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5.5" stroke={C.muted2} strokeWidth="1.2" />
              <path d="M7 4.5v3l1.5 1.5" stroke={C.muted2} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: "0.7rem", fontWeight: 700, color: C.muted4, textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Politique de vérification
            </span>
          </div>
          <p style={{ fontSize: "0.78rem", color: C.muted5, lineHeight: 1.65, marginBottom: 10 }}>
            Consultez nos conditions générales pour comprendre comment nous traitons et protégeons vos données.
          </p>
          <a href="#" style={{ fontSize: "0.78rem", color: C.purple, fontWeight: 500, textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            Lire la politique complète <Arrow />
          </a>
        </RCard>
      </div>
    </div>
  );
};

export default VerificationPage;