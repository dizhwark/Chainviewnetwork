import { Injectable, Logger } from "@nestjs/common";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

@Injectable()
export class S3Service {
  private readonly logger = new Logger("S3Service");
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = process.env.S3_BUCKET ?? "maybe-uploads";
    this.client = new S3Client({
      endpoint: process.env.S3_ENDPOINT,
      region: process.env.S3_REGION ?? "us-east-1",
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "maybe-dev",
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "maybe-dev-secret",
      },
    });
  }

  /**
   * Returns a short-lived signed PUT URL the client uploads directly to,
   * so file bytes never transit the API process. `purpose` namespaces the
   * key so private documents (licenses/insurance) and public-ish photos can
   * have different bucket policies in production.
   */
  async createSignedUploadUrl(purpose: string, mimeType: string): Promise<{ storageKey: string; uploadUrl: string }> {
    const extension = mimeType.split("/")[1] ?? "bin";
    const storageKey = `${purpose.toLowerCase()}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: storageKey,
      ContentType: mimeType,
    });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 });
    return { storageKey, uploadUrl };
  }
}
