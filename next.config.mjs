/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Paid files live outside /public; make sure they ship with the download route.
  outputFileTracingIncludes: {
    "/api/download/[token]": ["./private/downloads/**/*"],
  },
};

export default nextConfig;
