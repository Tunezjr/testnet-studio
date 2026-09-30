import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/testnet-studio/",
  plugins: [react()],
  define: {
    "process.env": {},
  },
});
