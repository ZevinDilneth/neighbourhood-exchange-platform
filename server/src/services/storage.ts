import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_KEY,
  region:          process.env.AWS_REGION,
});

const BUCKET  = () => process.env.AWS_S3_BUCKET as string;
const EXPIRY  = 60 * 60 * 24; // 24 hours — refreshed on every profile load

// ── Upload ───────────────────────────────────────────────────────────────────
export const uploadToS3 = (
  key:         string,
  buffer:      Buffer,
  contentType: string,
): Promise<AWS.S3.ManagedUpload.SendData> =>
  s3.upload({ Bucket: BUCKET(), Key: key, Body: buffer, ContentType: contentType }).promise();

// ── Signed URL ────────────────────────────────────────────────────────────────
// Returns a temporary URL (24 h) — works with any S3 bucket regardless of
// whether public-read ACLs or bucket policies are configured.
export const getSignedUrl = (key: string): string =>
  s3.getSignedUrl('getObject', { Bucket: BUCKET(), Key: key, Expires: EXPIRY });

// ── Resolve avatar ────────────────────────────────────────────────────────────
// Accepts either:
//  • an S3 key  (e.g.  "avatars/abc-123.jpg")  → generates a signed URL
//  • a full URL (e.g.  "https://...")           → returned as-is (legacy / external)
//  • undefined / null                           → returns undefined
export const resolveAvatarUrl = (avatar?: string | null): string | undefined => {
  if (!avatar) return undefined;
  if (avatar.startsWith('http')) return avatar; // legacy full URL or external provider
  return getSignedUrl(avatar);                  // S3 key — sign it
};
