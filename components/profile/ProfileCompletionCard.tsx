export type ProfileFieldTarget =
  | "fullName"
  | "username"
  | "headline"
  | "industryId"
  | "professionId"
  | "specialtyId"
  | "country"
  | "stateRegion"
  | "city"
  | "ancestryCity"
  | "tagline"
  | "streetAddress"
  | "addressLine2"
  | "zipCode"
  | "mapVisibility"
  | "dateOfBirth"
  | "gender"
  | "bio"
  | "skills"
  | "experience"
  | "personalDetails"
  | "birthdayVisibility";

type ProfileCompletionCardProps = {
  fullName: string;
  username: string;
  headline: string;
  industryId: string;
  professionId: string;
  specialtyId: string;
  country: string;
  stateRegion: string;
  city: string;
  ancestryCity: string;
  bio: string;
  tagline?: string;
  streetAddress?: string;
  zipCode?: string;
  dateOfBirth?: string;
  gender?: string;
  selectedSkillIds: string[];
  hasExperience: boolean;
  onJumpToField?: (field: ProfileFieldTarget) => void;
};

type CompletionItem = {
  label: string;
  completed: boolean;
  required?: boolean;
  target: ProfileFieldTarget;
};

function clampScore(value: number) {
  if (value < 0) return 0;
  if (value > 100) return 100;
  return value;
}

export default function ProfileCompletionCard({
  fullName,
  username,
  headline,
  industryId,
  professionId,
  specialtyId,
  country,
  stateRegion,
  city,
  ancestryCity,
  bio,
  tagline = "",
  streetAddress = "",
  zipCode = "",
  dateOfBirth = "",
  gender = "",
  selectedSkillIds,
  hasExperience,
  onJumpToField,
}: ProfileCompletionCardProps) {
  const items: CompletionItem[] = [
    {
      label: "Full name",
      completed: fullName.trim().length > 0,
      required: true,
      target: "fullName",
    },
    {
      label: "Username",
      completed: username.trim().length > 0,
      required: true,
      target: "username",
    },
    {
      label: "Headline",
      completed: headline.trim().length > 0,
      required: true,
      target: "headline",
    },
    {
      label: "Industry",
      completed: industryId.trim().length > 0,
      required: true,
      target: "industryId",
    },
    {
      label: "Profession",
      completed: professionId.trim().length > 0,
      required: true,
      target: "professionId",
    },
    {
      label: "Specialty",
      completed: specialtyId.trim().length > 0,
      required: false,
      target: "specialtyId",
    },
    {
      label: "Country",
      completed: country.trim().length > 0,
      required: true,
      target: "country",
    },
    {
      label: "State",
      completed: stateRegion.trim().length > 0,
      required: true,
      target: "stateRegion",
    },
    {
      label: "City",
      completed: city.trim().length > 0,
      required: true,
      target: "city",
    },
    {
      label: "Ancestral origin",
      completed: ancestryCity.trim().length > 0,
      required: false,
      target: "ancestryCity",
    },
    {
      label: "Bio",
      completed: bio.trim().length > 0,
      required: true,
      target: "bio",
    },
    {
      label: "Tagline",
      completed: tagline.trim().length > 0,
      required: false,
      target: "tagline",
    },
    {
      label: "Street Address",
      completed: streetAddress.trim().length > 0,
      required: true,
      target: "streetAddress",
    },
    {
      label: "ZIP Code",
      completed: zipCode.trim().length > 0,
      required: true,
      target: "zipCode",
    },
    {
      label: "Date of Birth",
      completed: dateOfBirth.trim().length > 0,
      required: true,
      target: "dateOfBirth",
    },
    {
      label: "Gender",
      completed: gender.trim().length > 0,
      required: true,
      target: "gender",
    },
    {
      label: "Skills",
      completed: selectedSkillIds.length > 0,
      required: true,
      target: "skills",
    },
    {
      label: "Experience",
      completed: hasExperience,
      required: true,
      target: "experience",
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = clampScore(
    Math.round((completedCount / totalCount) * 100),
  );

  const missingItems = items.filter((item) => !item.completed);
  const requiredMissingItems = missingItems.filter((item) => item.required);
  const optionalMissingItems = missingItems.filter((item) => !item.required);

  let statusText = "Strong start. Keep building your profile.";
  if (completionPercentage >= 90) {
    statusText = "Excellent. Your profile is highly discoverable.";
  } else if (completionPercentage >= 70) {
    statusText =
      "Good progress. A few more details will strengthen your profile.";
  } else if (completionPercentage >= 40) {
    statusText =
      "Your profile is visible, but still missing important details.";
  } else {
    statusText = "Your profile needs more detail to be useful in the network.";
  }

  let progressNudge = "";
  if (requiredMissingItems.length > 0) {
    progressNudge =
      requiredMissingItems.length === 1
        ? "Complete 1 more core item to strengthen profile visibility."
        : `Complete ${requiredMissingItems.length} more core items to strengthen profile visibility.`;
  } else if (optionalMissingItems.length > 0) {
    progressNudge =
      optionalMissingItems.length === 1
        ? "Add 1 more detail to make your profile more complete."
        : `Add ${optionalMissingItems.length} more details to make your profile more complete.`;
  }

  function renderItemButton(item: CompletionItem) {
    const label = `Add your ${item.label.toLowerCase()}`;

    if (typeof onJumpToField === "function") {
      return (
        <button
          key={item.label}
          type="button"
          onClick={() => onJumpToField(item.target)}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            border: "1px solid #444",
            background: "rgba(255,255,255,0.03)",
            fontSize: 14,
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          {label}
        </button>
      );
    }

    return (
      <div
        key={item.label}
        style={{
          padding: "10px 12px",
          borderRadius: 10,
          border: "1px solid #444",
          background: "rgba(255,255,255,0.03)",
          fontSize: 14,
        }}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      style={{
        border: "1px solid #444",
        borderRadius: 14,
        padding: 18,
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ margin: 0, fontSize: 20 }}>Profile Completion</h3>
          <p style={{ marginTop: 8, opacity: 0.82, fontSize: 14 }}>
            {statusText}
          </p>
          {progressNudge ? (
            <p
              style={{
                marginTop: 8,
                fontSize: 13,
                fontWeight: 600,
                color: "#d4af37",
              }}
            >
              {progressNudge}
            </p>
          ) : null}
        </div>

        <div
          style={{
            minWidth: 78,
            height: 78,
            borderRadius: 999,
            border: "2px solid #666",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {completionPercentage}%
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          height: 10,
          borderRadius: 999,
          background: "rgba(255,255,255,0.08)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${completionPercentage}%`,
            height: "100%",
            background: "linear-gradient(90deg, #b8860b 0%, #d4af37 100%)",
            borderRadius: 999,
          }}
        />
      </div>

      <div style={{ marginTop: 18 }}>
        <strong>Next Steps</strong>

        {missingItems.length === 0 ? (
          <p style={{ marginTop: 10, opacity: 0.82 }}>
            Everything here is complete.
          </p>
        ) : (
          <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
            {requiredMissingItems.length > 0 ? (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: 0.65,
                    marginBottom: 6,
                    letterSpacing: 0.4,
                  }}
                >
                  CORE PROFILE
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {requiredMissingItems.map(renderItemButton)}
                </div>
              </div>
            ) : null}

            {optionalMissingItems.length > 0 ? (
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    opacity: 0.65,
                    marginBottom: 6,
                    letterSpacing: 0.4,
                  }}
                >
                  ADDITIONAL DETAILS
                </div>

                <div style={{ display: "grid", gap: 8 }}>
                  {optionalMissingItems.map(renderItemButton)}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
