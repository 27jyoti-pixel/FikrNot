import { ImagePlus, X } from "lucide-react";

export default function ReportImagePicker({
  inputRef,
  existingImages,
  newImages,
  validationError,
  onFilesSelected,
  onRemoveExisting,
  onRemoveNew,
}) {
  return (
    <div className="report-image-picker wide">
      <div className="report-image-heading">
        <strong>Item photos</strong>
        <span>Optional · Up to 5 photos</span>
      </div>
      <small className="report-image-requirements">JPG, PNG or WEBP · Max 5 MB per photo</small>

      <label className="image-upload-prompt">
        <span className="report-upload-icon"><ImagePlus size={23} aria-hidden="true" /></span>
        <span className="report-upload-copy"><b>Choose photos to upload</b><small>Click to browse your files</small></span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={onFilesSelected}
          aria-label="Add report photos"
          aria-invalid={Boolean(validationError)}
          aria-describedby={validationError ? "report-image-error" : undefined}
        />
      </label>

      {validationError && <p className="report-image-error" id="report-image-error" role="alert">{validationError}</p>}

      <small className="image-selection-status" role="status" aria-live="polite">
        {existingImages.length + newImages.length === 0
          ? "No photos added yet"
          : `${existingImages.length + newImages.length} photo${existingImages.length + newImages.length === 1 ? "" : "s"} selected`}
      </small>

      {existingImages.length > 0 && (
        <div className="report-image-list" aria-label="Existing report images">
          {existingImages.map((image, index) => (
            <figure className="report-image-preview" key={image.publicId || image.url || index}>
              <img src={image.url} alt={`Existing report photo ${index + 1}`} />
              <button type="button" className="image-remove-button" aria-label="Remove existing image" title="Remove existing image" onClick={() => onRemoveExisting(image)}>
                <X size={16} /><span>Remove</span>
              </button>
            </figure>
          ))}
        </div>
      )}

      {newImages.length > 0 && existingImages.length > 0 && (
        <small className="image-replacement-note">New photos will replace the existing photos when you save.</small>
      )}
      {newImages.length > 0 && (
        <div className="report-image-list" aria-label="Selected new report images">
          {newImages.map((image, index) => (
            <figure className="report-image-preview" key={image.key}>
              <img src={image.previewUrl} alt={`Selected report photo ${index + 1}`} />
              <button type="button" className="image-remove-button" aria-label="Remove selected image" title="Remove selected image" onClick={() => onRemoveNew(image.key)}>
                <X size={16} /><span>Remove</span>
              </button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}
