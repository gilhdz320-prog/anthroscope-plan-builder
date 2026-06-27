import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    // Pin the Turbopack root to this project directory.
    // Without this, Turbopack walks up and finds ~/package-lock.json
    // (an unrelated personal project), infers the wrong workspace root,
    // and produces corrupted Client Manifests + global-error.js failures.
    root: __dirname,
  },
};

export default nextConfig;
