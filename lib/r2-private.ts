import "server-only";
import { createHash, createHmac } from "node:crypto";
const hash = (v: string) => createHash("sha256").update(v).digest("hex");
const hmac = (k: Buffer | string, v: string) => createHmac("sha256", k).update(v).digest();
export async function fetchPrivatePdf(id: string): Promise<Response> {
  const account = process.env.R2_ACCOUNT_ID!;
  const keyId = process.env.R2_ACCESS_KEY_ID!;
  const secret = process.env.R2_SECRET_ACCESS_KEY!;
  const bucket = process.env.R2_BUCKET!;
  if (![account, keyId, secret, bucket].every(Boolean)) throw new Error("Storage missing");
  const host = account + ".r2.cloudflarestorage.com";
  const path = "/" + encodeURIComponent(bucket) + "/" + encodeURIComponent(id + ".pdf");
  const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const day = now.slice(0, 8), region = "auto";
  const scope = day + "/" + region + "/s3/aws4_request";
  const empty = hash("");
  const headers = `host:${host}\nx-amz-content-sha256:${empty}\nx-amz-date:${now}\n`;
  const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
  const canonical = ["GET", path, "", headers, signedHeaders, empty].join("\n");
  const toSign = ["AWS4-HMAC-SHA256", now, scope, hash(canonical)].join("\n");
  const signingKey = hmac(hmac(hmac(hmac("AWS4" + secret, day), region), "s3"), "aws4_request");
  const signature = createHmac("sha256", signingKey).update(toSign).digest("hex");
  return fetch("https://" + host + path, {
    cache: "no-store", headers: {
      "x-amz-content-sha256": empty, "x-amz-date": now,
      Authorization: `AWS4-HMAC-SHA256 Credential=${keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    },
  });
}
