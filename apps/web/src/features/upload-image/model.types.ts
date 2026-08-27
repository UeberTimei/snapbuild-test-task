export interface UseUploadImageResult {
  upload: (file: File) => Promise<void>;
  uploading: boolean;
  error: string | null;
}
