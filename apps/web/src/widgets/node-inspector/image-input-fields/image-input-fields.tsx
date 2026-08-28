import { useUploadImage } from "@/features/upload-image";
import { api } from "@/shared/api";
import { IMAGE_ACCEPT } from "@/shared/config";
import { Field } from "@/shared/ui";
import type { ImageInputFieldsProps } from "./image-input-fields.types";

export function ImageInputFields({ node }: ImageInputFieldsProps) {
  const { upload, uploading, error } = useUploadImage(node.id);
  const { assetId } = node.data;

  return (
    <>
      <Field label="Source image">
        <input
          type="file"
          accept={IMAGE_ACCEPT}
          disabled={uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </Field>
      {uploading && <p className="muted">uploading…</p>}
      {error && <p className="error">{error}</p>}
      {assetId !== null && (
        <img className="preview" src={api.assetUrl(assetId)} alt="uploaded source" />
      )}
    </>
  );
}
