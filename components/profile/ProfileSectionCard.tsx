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
    <div
      style={{
        border: "1px solid #444",
        borderRadius: 14,
        padding: 20,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 14,
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 20 }}>{title}</h3>

          {description ? (
            <p
              style={{
                marginTop: 6,
                fontSize: 14,
                opacity: 0.75,
              }}
            >
              {description}
            </p>
          ) : null}
        </div>

        {!hideActions ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              justifyContent: "flex-end",
            }}
          >
            {hasStructuredMode ? (
              isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={onCancel}
                    disabled={isSaving}
                    style={{
                      fontSize: 14,
                      border: "1px solid #555",
                      background: "transparent",
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: isSaving ? "default" : "pointer",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isSaving}
                    style={{
                      fontSize: 14,
                      border: "1px solid #555",
                      background: "rgba(255,255,255,0.08)",
                      padding: "6px 12px",
                      borderRadius: 8,
                      cursor: isSaving ? "default" : "pointer",
                      opacity: isSaving ? 0.7 : 1,
                    }}
                  >
                    {isSaving ? "Saving..." : saveLabel}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={onEdit}
                  style={{
                    fontSize: 14,
                    border: "1px solid #555",
                    background: "transparent",
                    padding: "6px 12px",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Edit
                </button>
              )
            ) : onEdit ? (
              <button
                type="button"
                onClick={onEdit}
                style={{
                  fontSize: 14,
                  border: "1px solid #555",
                  background: "transparent",
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Edit
              </button>
            ) : null}
          </div>
        ) : null}
      </div>

      <div>{content}</div>
    </div>
  );
}
