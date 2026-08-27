export interface MultipartFile {
  buffer: Buffer;
  mimetype: string;
}

export interface StoredAsset {
  path: string;
  mime: string;
}

export type AssetKind = "upload" | "generated";
