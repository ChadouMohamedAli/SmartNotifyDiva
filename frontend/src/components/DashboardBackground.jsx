import React from "react";
import { Box } from "@mui/material";
import Aurora from "./Aurora/Aurora";

const DashboardBackground = () => {
  return (
    <>
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 0,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        <Aurora
          colorStops={["#4f8cff", "#9f8cff", "#1f5fff"]}
          blend={0.75}
          amplitude={1.2}
          speed={1}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 15% 10%, rgba(56,189,248,0.28), transparent 34%), radial-gradient(circle at 85% 12%, rgba(168,85,247,0.26), transparent 38%), radial-gradient(circle at 50% 88%, rgba(59,130,246,0.24), transparent 42%)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "36px 36px, 36px 36px",
            maskImage: "radial-gradient(circle at center, black 30%, transparent 92%)",
            opacity: 0.4,
          }}
        />
      </Box>

      <Box
        sx={{
          position: "fixed",
          inset: 0,
          zIndex: 2,
          pointerEvents: "none",
          mixBlendMode: "screen",
          opacity: 0.25,
          background:
            "radial-gradient(1000px 500px at -10% 20%, rgba(56,189,248,0.55), transparent 60%), radial-gradient(900px 480px at 110% 0%, rgba(99,102,241,0.5), transparent 62%), radial-gradient(700px 420px at 50% 110%, rgba(14,165,233,0.45), transparent 65%)",
          animation: "dashboardGlowShift 14s ease-in-out infinite alternate",
          "@keyframes dashboardGlowShift": {
            "0%": { transform: "translate3d(0, 0, 0) scale(1)" },
            "100%": { transform: "translate3d(0, -10px, 0) scale(1.04)" },
          },
        }}
      />
    </>
  );
};

export default DashboardBackground;
