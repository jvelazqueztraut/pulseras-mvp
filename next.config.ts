import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  output: "export",
  images: { unoptimized: true },
  // Root-absolute `/_next/...` URLs. Capacitor serves the export from
  // https://localhost via WebViewAssetLoader, so those paths resolve. A
  // file:// WebView origin would not, which is why Bubblewrap/TWA-style
  // packaging is the wrong fit for an offline APK.
  trailingSlash: true,
};

export default nextConfig;

export default nextConfig;
