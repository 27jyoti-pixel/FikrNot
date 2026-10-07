import { ImagePlus, X } from "lucide-react";

export default function ReportImagePicker({
  inputRef,
  existingImages,
  newImages,
  onFilesSelected,
  onRemoveExisting,
  onRemoveNew,
}) {
  return (
    <div className="report-image-picker wide">
      <div className="report-image-heading">
        <strong>Add item photos</strong>
        <span>Optional · up to 5 images · JPG, PNG or WEBP · 5 MB max each</span>
      </div>

      <label className="image-upload-prompt">
        <ImagePlus size={22} />
        <span><b>Add an item photo</b><small>Choose a JPG, PNG or WEBP image</small></span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={onFilesSelected}
          aria-label="Add report photos"
        />
      </label>

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
      {existingImages.length === 0 && newImages.length === 0 && <small className="image-empty-note">No photos selected.</small>}
    </div>
  );
}
