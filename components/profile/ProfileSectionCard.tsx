type ProfileSectionCardProps = {
  title: string;
  description?: string;
  children?: React.ReactNode;
  viewContent?: React.ReactNode;
  editContent?: React.ReactNode;
  isEditing?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  isSaving?: boolean;
  hideActions?: boolean;
  saveLabel?: string;
};

export default function ProfileSectionCard({
  title,
  description,
  children,
  viewContent,
  editContent,
  isEditing = false,
  onEdit,
  onSave,
  onCancel,
  isSaving = false,
  hideActions = false,
  saveLabel = "Save",
}: ProfileSectionCardProps) {
  const hasStructuredMode =
    typeof viewContent !== "undefined" || typeof editContent !== "undefined";

  const content = hasStructuredMode
    ? isEditing
      ? editContent
      : viewContent
    : children;

  return (
    <div className="wac-card p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          {description && (
            <p className="mt-1 text-sm text-white/60">{description}</p>
          )}
        </div>

        {!hideActions && (
          <div className="flex items-center gap-2 flex-wrap justify-end shrink-0">
            {hasStructuredMode ? (
              isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs rounded-full border border-white/15 bg-transparent text-white/60 hover:text-white hover:border-white/30 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    className="px-3 py-1.5 text-xs rounded-full border border-[#D4AF37]/40 bg-[#D4AF37]/10 text-[#D4AF37] hover:bg-[#D4AF37]/20 transition disabled:opacity-50"
                  >
                    {isSaving ? "Saving…" : saveLabel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onEdit}
                  className="px-3 py-1.5 text-xs rounded-full border border-white/15 bg-transparent text-white/50 hover:text-white hover:border-white/30 transition"
                >
                  Edit
                </button>
              )
            ) : onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                className="px-3 py-1.5 text-xs rounded-full border border-white/15 bg-transparent text-white/50 hover:text-white hover:border-white/30 transition"
              >
                Edit
              </button>
            ) : null}
          </div>
        )}
      </div>

      <div>{content}</div>
    </div>
  );
}
