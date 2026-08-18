import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLocation, useNavigate } from "react-router-dom";
import { Alert, Box, Button, Card, CardContent, Stack, TextField, Typography } from "@mui/material";

const LoginOtpVerification = () => {
  const { verifyEmailOtp, resendEmailOtp } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpMessage, setOtpMessage] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpResending, setOtpResending] = useState(false);
  const [otpContext, setOtpContext] = useState(null);

  useEffect(() => {
    const stateData = location.state;
    if (stateData?.challengeId) {
      setOtpContext(stateData);
      localStorage.setItem("pending_otp", JSON.stringify(stateData));
      return;
    }

    const persisted = localStorage.getItem("pending_otp");
    if (!persisted) return;

    try {
      const parsed = JSON.parse(persisted);
      if (parsed?.challengeId && parsed?.purpose === "login") {
        setOtpContext(parsed);
      }
    } catch (_) {
      localStorage.removeItem("pending_otp");
    }
  }, [location.state]);

  const handleOtpVerify = async () => {
    setOtpError("");
    setOtpMessage("");

    const normalizedOtp = otpCode.replace(/\s+/g, "").trim();
    if (!otpContext?.challengeId) {
      setOtpError("Challenge OTP introuvable. Reconnectez-vous.");
      return;
    }
    if (!/^\d{6}$/.test(normalizedOtp)) {
      setOtpError("Entrez un code OTP a 6 chiffres.");
      return;
    }

    setOtpLoading(true);
    const result = await verifyEmailOtp(otpContext.challengeId, normalizedOtp);
    setOtpLoading(false);

    if (!result.success) {
      setOtpError(result.error || "Code OTP invalide.");
      return;
    }

    localStorage.removeItem("pending_otp");
    const user = result.user;
    const isAdmin = user?.is_superuser || user?.is_staff;
    navigate(isAdmin ? "/admin_dashboard" : "/dashboard", { replace: true });
  };

  const handleOtpResend = async () => {
    setOtpError("");
    setOtpMessage("");

    if (!otpContext?.challengeId) {
      setOtpError("Challenge OTP introuvable. Reconnectez-vous.");
      return;
    }

    setOtpResending(true);
    const result = await resendEmailOtp(otpContext.challengeId);
    setOtpResending(false);

    if (!result.success) {
      setOtpError(result.error || "Impossible de renvoyer le code.");
      return;
    }

    const updatedContext = {
      ...otpContext,
      challengeId: result.challengeId,
      email: result.email || otpContext.email,
      purpose: result.purpose || otpContext.purpose,
      message: result.message || "Nouveau code OTP envoye.",
    };

    setOtpContext(updatedContext);
    localStorage.setItem("pending_otp", JSON.stringify(updatedContext));
    setOtpMessage(updatedContext.message || "Nouveau code OTP envoye.");
  };

  if (!otpContext?.challengeId) {
    return (
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "black",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 520, width: "100%", borderRadius: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 1 }}>
              Verification OTP
            </Typography>
            <Typography sx={{ color: "text.secondary", mb: 2 }}>
              Aucune verification OTP en cours. Retournez a la connexion.
            </Typography>
            <Button variant="contained" onClick={() => navigate("/login")}>Retour a la connexion</Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "black",
        p: 2,
      }}
    >
      <Card
        sx={{
          p: 2,
          bgcolor: "rgba(30, 41, 59, 0.9)",
          border: "1px solid rgba(59, 130, 246, 0.25)",
          borderRadius: 3,
          maxWidth: 520,
          width: "100%",
        }}
      >
        <CardContent>
          <Typography variant="h5" sx={{ color: "white", fontWeight: 700, mb: 1 }}>
            Verification OTP (Connexion)
          </Typography>
          <Typography variant="body2" sx={{ color: "#94a3b8", mb: 2 }}>
            Un code a 6 chiffres a ete envoye a {otpContext.email || "votre email"}.
          </Typography>

          {otpMessage ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {otpMessage}
            </Alert>
          ) : null}

          {otpError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              {otpError}
            </Alert>
          ) : null}

          <TextField
            fullWidth
            label="Code OTP"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            placeholder="123456"
            inputProps={{ maxLength: 6, inputMode: "numeric", pattern: "[0-9]*" }}
            sx={{
              mb: 2,
              "& .MuiInputBase-input": { color: "white" },
              "& .MuiInputLabel-root": { color: "#94a3b8" },
              "& .MuiOutlinedInput-notchedOutline": { borderColor: "#475569" },
            }}
          />

          <Stack spacing={1.5}>
            <Button
              variant="contained"
              onClick={handleOtpVerify}
              disabled={otpLoading}
              sx={{ bgcolor: "#3b82f6", "&:hover": { bgcolor: "#2563eb" } }}
            >
              {otpLoading ? "Verification..." : "Verifier le code"}
            </Button>

            <Button
              variant="outlined"
              onClick={handleOtpResend}
              disabled={otpResending}
              sx={{ borderColor: "#475569", color: "#94a3b8" }}
            >
              {otpResending ? "Renvoi..." : "Renvoyer le code"}
            </Button>

            <Button variant="text" onClick={() => navigate("/login")} sx={{ color: "#94a3b8" }}>
              Retour a la connexion
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default LoginOtpVerification;
