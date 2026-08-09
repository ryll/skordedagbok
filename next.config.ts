import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  // The CLI shim emits no capturable --showConfig output in this container.
  // The compiler API performs the same strict build check reliably.
  experimental: { useTypeScriptCli: false },
};

export default nextConfig;
