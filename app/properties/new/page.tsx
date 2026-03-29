"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useActor } from "@/components/providers/ActorProvider";
import { PROPERTIES_ENABLED } from "@/lib/constants/featureFlags";
import { DIASPORA_COUNTRIES } from "@/lib/constants/locations";
import {
  ChevronLeft, Camera, X, Loader2, Home, AlertCircle, Car,
  BedDouble, Bath, Maximize, Building2, TreePine, Hotel,
  Warehouse, Castle, LandPlot, MessageSquare, ExternalLink,
  Phone, Mail, Eye, EyeOff, Megaphone,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

type SectionId = "basics" | "details" | "location" | "publish";

const SECTIONS: { id: SectionId; label: string; sublabel: string }[] = [
  { id: "basics",   label: "Basic Info",      sublabel: "Title, price, cover, and description" },
  { id: "details",  label: "Property Specs",  sublabel: "Type, beds, baths, parking, area" },
  { id: "location", label: "Location",        sublabel: "Where is it situated?"   },
  { id: "publish",  label: "Publish",         sublabel: "Visibility and promotion"  },
];

const LISTING_TYPES = [
  { value: "sale",       label: "For Sale" },
  { value: "long_term",  label: "Long-Term Rental" },
  { value: "short_term", label: "Short-Term / Vacation" },
  { value: "commercial", label: "Commercial Lease" },
];

const PROPERTY_TYPES = [
  { value: "house",           label: "House",           icon: Home },
  { value: "apartment",       label: "Apartment",       icon: Building2 },
  { value: "villa",           label: "Villa",           icon: Castle },
  { value: "land",            label: "Land",            icon: TreePine },
  { value: "commercial_unit", label: "Commercial",      icon: Warehouse },
  { value: "hotel",           label: "Hotel",           icon: Hotel },
  { value: "guesthouse",      label: "Guesthouse",      icon: Hotel },
  { value: "multi_family",    label: "Multi-Family",    icon: Building2 },
  { value: "other",           label: "Other",           icon: LandPlot },
];

const CURRENCIES = [
  { value: "EUR", symbol: "€", label: "EUR (€)" },
  { value: "USD", symbol: "$", label: "USD ($)" },
  { value: "GBP", symbol: "£", label: "GBP (£)" },
  { value: "CHF", symbol: "Fr", label: "CHF (Fr)" },
  { value: "ALL", symbol: "L", label: "ALL (L)" },
];

const CONTACT_MODES = [
  { value: "profile_message", label: "WAC Message",   icon: MessageSquare, desc: "Buyers contact you through WAC messaging" },
  { value: "email",           label: "Email",          icon: Mail,          desc: "Show your email for direct contact" },
  { value: "phone",           label: "Phone",          icon: Phone,         desc: "Display your phone number" },
  { value: "external_link",   label: "External Link",  icon: ExternalLink,  desc: "Link to an external listing page" },
];

type ValidationErrors = Record<string, string>;

// ── Field Components ──────────────────────────────────────────────────────────

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[10px] font-semibold uppercase tracking-wider text-white/28 mb-2">
      {children}{required && <span className="text-red-400/70 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p className="flex items-center gap-1 mt-1.5 text-[11px] text-red-400/80 font-medium">
      <AlertCircle size={11} className="shrink-0" />
      {error}
    </p>
  );
}

function SectionHeader({ index, section, hasErrors }: {
  index: number;
  section: { label: string; sublabel: string };
  hasErrors?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 mb-6">
      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
        hasErrors
          ? "bg-red-500/[0.08] border-red-400/15"
          : "bg-teal-500/[0.08] border-teal-400/15"
      }`}>
        <span className={`text-[11px] font-bold ${hasErrors ? "text-red-400/65" : "text-teal-400/65"}`}>
          {index + 1}
        </span>
      </div>
      <div>
        <h2 className="text-base font-semibold text-white leading-tight">{section.label}</h2>
        <p className="text-xs text-white/32 mt-0.5">{section.sublabel}</p>
      </div>
    </div>
  );
}

// ── Cover Image ───────────────────────────────────────────────────────────────

function CoverImageArea({
  value, onChange, error,
}: {
  value: string | null; onChange: (v: string | null) => void; error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      return; // silently skip >10MB
    }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext  = file.name.split(".").pop() ?? "jpg";
      const path = `property-covers/${user?.id ?? "anon"}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("feed_media").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("feed_media").getPublicUrl(path);
      onChange(urlData.publicUrl);
    } catch (err) {
      console.error("Cover upload failed:", err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  if (value) {
    return (
      <div className="relative w-full rounded-2xl overflow-hidden" style={{ height: 260 }}>
        <img src={value} alt="Cover" className="w-full h-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/65 backdrop-blur flex items-center justify-center text-white/60 hover:text-white transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <div
        onClick={() => !uploading && inputRef.current?.click()}
        className={`w-full rounded-2xl border flex flex-col items-center justify-center gap-3 cursor-pointer hover:border-teal-400/15 hover:bg-white/[0.015] transition-colors group ${
          error ? "border-red-400/30 bg-red-400/[0.02]" : "border-white/[0.07]"
        }`}
        style={{ height: 200 }}
      >
        <div className="w-10 h-10 rounded-full bg-white/[0.04] border border-white/[0.08] flex items-center justify-center group-hover:bg-teal-500/[0.08] group-hover:border-teal-400/15 transition-colors">
          {uploading
            ? <Loader2 size={16} className="text-[var(--accent)] animate-spin" />
            : <Camera size={16} className="text-white/25 group-hover:text-teal-400/50 transition-colors" />
          }
        </div>
        <div className="text-center">
          <div className="text-xs font-medium text-white/30 group-hover:text-white/45 transition-colors">
            {uploading ? "Uploading…" : "Add main property photo"}
          </div>
          <div className="text-[10px] text-white/15 mt-1">JPG, PNG — max 10 MB</div>
        </div>
      </div>
      <FieldError error={error} />
    </>
  );
}

// ── Country Search Select ─────────────────────────────────────────────────────

function CountrySelect({
  value, onChange, error,
}: {
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!search.trim()) return DIASPORA_COUNTRIES;
    const q = search.trim().toLowerCase();
    return DIASPORA_COUNTRIES.filter(c =>
      c.canonicalName.toLowerCase().includes(q) ||
      c.aliases.some(a => a.includes(q))
    );
  }, [search]);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`w-full bg-white/[0.04] border rounded-xl px-4 py-3 text-sm text-left outline-none transition-colors ${
          error ? "border-red-400/30 text-white/80" : "border-white/[0.09] text-white/80"
        } ${open ? "border-teal-400/25" : ""}`}
      >
        {value || <span className="text-white/20">Select country</span>}
      </button>
      <FieldError error={error} />

      {open && (
        <div className="absolute top-full left-0 right-0 z-50 mt-2 p-2 rounded-xl bg-[#1b1714] border border-white/[0.10] shadow-2xl max-h-[280px] flex flex-col">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search countries…"
            autoFocus
            className="w-full bg-white/[0.04] border border-white/[0.07] rounded-lg px-3 py-2 text-xs text-white/80 outline-none focus:border-teal-400/25 mb-2 placeholder:text-white/20"
          />
          <div className="flex-1 overflow-y-auto overscroll-contain space-y-0.5 wac-scrollbar">
            {filtered.map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  onChange(c.canonicalName);
                  setOpen(false);
                  setSearch("");
                }}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  value === c.canonicalName
                    ? "bg-teal-500/[0.08] text-teal-400 border border-teal-400/20"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white/80 border border-transparent"
                }`}
              >
                <span>{c.canonicalName}</span>
                <span className="text-[10px] text-white/20 ml-2">{c.regionGroup}</span>
              </button>
            ))}
            {filtered.length === 0 && (
              <p className="px-3 py-4 text-[11px] text-white/25 text-center">No matching countries</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function CreatePropertyPage() {
  const router = useRouter();
  const { currentActor, isLoading: actorLoading } = useActor();

  const [activeSection, setActiveSection] = useState<SectionId>("basics");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [publishError, setPublishError] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [listingType, setListingType] = useState("sale");
  const [propertyType, setPropertyType] = useState("house");
  const [priceAmount, setPriceAmount] = useState("");
  const [currency, setCurrency] = useState("EUR");

  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [squareMeters, setSquareMeters] = useState("");
  const [parking, setParking] = useState("");

  const [country, setCountry] = useState("Albania");
  const [city, setCity] = useState("");
  const [stateRegion, setStateRegion] = useState("");
  const [address1, setAddress1] = useState("");

  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  // Contact
  const [contactMode, setContactMode] = useState("profile_message");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [externalUrl, setExternalUrl] = useState("");

  // Publish — visibility and Pulse promotion (separate controls)
  const [isHidden, setIsHidden] = useState(false);
  const [shareToPulse, setShareToPulse] = useState(true);
  const [pulseCaption, setPulseCaption] = useState("");

  const currencySymbol = CURRENCIES.find(c => c.value === currency)?.symbol ?? "€";

  const generateSlug = (base: string) => {
    return base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Math.floor(Math.random() * 10000);
  };

  // ── Validation ────────────────────────────────────────────────────────────

  function validateBasics(): ValidationErrors {
    const e: ValidationErrors = {};
    if (!title.trim() || title.trim().length < 5) e.title = "Title must be at least 5 characters";
    if (!priceAmount || parseFloat(priceAmount) <= 0) e.price = "Price must be greater than 0";
    if (!coverUrl) e.cover = "Cover photo is required";
    if (!description.trim() || description.trim().length < 20) e.description = "Description must be at least 20 characters";
    // Contact mode specific validation
    if (contactMode === "email" && !contactEmail.trim()) e.contactEmail = "Email is required for email contact mode";
    else if (contactMode === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) e.contactEmail = "Enter a valid email address";
    if (contactMode === "phone" && !contactPhone.trim()) e.contactPhone = "Phone number is required for phone contact mode";
    if (contactMode === "external_link" && !externalUrl.trim()) e.externalUrl = "URL is required for external link contact mode";
    return e;
  }

  function validateLocation(): ValidationErrors {
    const e: ValidationErrors = {};
    if (!country.trim()) e.country = "Country is required";
    if (!city.trim()) e.city = "City is required";
    return e;
  }

  function validateAll(): ValidationErrors {
    return { ...validateBasics(), ...validateLocation() };
  }

  function goToSection(target: SectionId) {
    if (activeSection === "basics" && target !== "basics") {
      const basicErrors = validateBasics();
      if (Object.keys(basicErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...basicErrors }));
        return;
      }
    }
    if (activeSection === "location" && target === "publish") {
      const locErrors = validateLocation();
      if (Object.keys(locErrors).length > 0) {
        setErrors(prev => ({ ...prev, ...locErrors }));
        return;
      }
    }
    setActiveSection(target);
  }

  function clearError(field: string) {
    setErrors(prev => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  async function handlePublish() {
    setPublishError(null);
    const allErrors = validateAll();
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      if (allErrors.title || allErrors.price || allErrors.cover || allErrors.description || allErrors.contactEmail || allErrors.contactPhone || allErrors.externalUrl) {
        setActiveSection("basics");
      } else if (allErrors.country || allErrors.city) {
        setActiveSection("location");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const slug = generateSlug(title);

      const payload: Record<string, unknown> = {
        slug,
        title: title.trim(),
        description: description.trim(),
        listing_type: listingType,
        property_type: propertyType,
        status: isHidden ? "draft" : "active",
        owner_user_id: user.id,
        price_amount: parseFloat(priceAmount),
        price_currency: currency,
        bedrooms: bedrooms ? parseInt(bedrooms, 10) : null,
        bathrooms: bathrooms ? parseFloat(bathrooms) : null,
        square_meters: squareMeters ? parseFloat(squareMeters) : null,
        parking_spaces: parking ? parseInt(parking, 10) : null,
        country: country.trim(),
        city: city.trim(),
        state_region: stateRegion.trim() || null,
        address_line_1: address1.trim() || null,
        contact_mode: contactMode,
        show_owner_profile: true,
      };

      // Contact mode specifics
      if (contactMode === "email") payload.contact_email = contactEmail.trim();
      if (contactMode === "phone") payload.contact_phone = contactPhone.trim();
      if (contactMode === "external_link") payload.external_url = externalUrl.trim();

      const { data: newProp, error: insertError } = await supabase
        .from("properties")
        .insert(payload)
        .select("id")
        .single();

      if (insertError) throw insertError;

      if (coverUrl && newProp) {
        await supabase.from("property_media").insert({
          property_id: newProp.id,
          media_type: "image",
          url: coverUrl,
          is_cover: true,
          display_order: 0,
        });
      }

      // ── Pulse distribution (optional, separate from listing visibility) ──
      if (shareToPulse && !isHidden && newProp) {
        const listingUrl = `/properties/${slug}`;
        const currSym = CURRENCIES.find(c => c.value === currency)?.symbol ?? "€";
        const priceDisplay = `${currSym}${parseFloat(priceAmount).toLocaleString()}`;

        // Build descriptive auto-caption if user left it blank
        const autoCaption = `${priceDisplay} · ${title.trim()} — ${city.trim()}, ${country.trim()}`;
        const postContent = pulseCaption.trim() || autoCaption;

        try {
          await supabase.from("feed_posts").insert({
            submitted_by: user.id,
            author_profile_id: user.id,
            content: postContent,
            post_type: "general",
            content_type: "post",
            post_intent: "property_listing",
            status: "published",
            image_url: coverUrl,
            media_items: coverUrl ? [{ url: coverUrl, media_type: "photo", order_index: 0 }] : [],
            distribute_to_pulse: true,
            distribute_to_following: true,
            cta_url: listingUrl,
            cta_label: "View Listing",
          });
        } catch (pulseErr) {
          // Non-blocking — property was created successfully, Pulse is optional
          console.warn("Pulse post creation failed (non-blocking):", pulseErr);
        }
      }

      router.push("/directory?scope=properties");

    } catch (err: unknown) {
      console.error("Publish failed:", err);
      const message = err instanceof Error ? err.message : "Failed to publish property";
      setPublishError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Guard states ──────────────────────────────────────────────────────────

  if (actorLoading) {
    return <div className="min-h-screen pt-32 text-center text-white/30">Loading...</div>;
  }

  if (!currentActor || currentActor.type !== "person") {
    return (
      <div className="min-h-screen pt-32 text-center text-white/40">
        You must be signed in as a person to post a property.
      </div>
    );
  }

  if (!PROPERTIES_ENABLED) {
    return (
      <div className="min-h-screen pt-32 text-center px-4">
        <div className="max-w-sm mx-auto">
          <div className="w-12 h-12 rounded-full bg-[#10b981]/[0.08] border border-[#10b981]/15 flex items-center justify-center mx-auto mb-4">
            <Home size={20} className="text-[#10b981]/40" />
          </div>
          <h2 className="text-lg font-semibold text-white/70">Property Listings</h2>
          <p className="text-sm text-white/30 mt-2 leading-relaxed">
            Property listings are coming soon. You&apos;ll be able to list real estate across the Albanian diaspora network.
          </p>
          <span className="inline-block mt-4 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-[#b08d57]/70 bg-[#b08d57]/10 border border-[#b08d57]/20">
            Coming Soon
          </span>
        </div>
      </div>
    );
  }

  // ── Section error indicators ──────────────────────────────────────────────

  const basicsHasErrors = !!(errors.title || errors.price || errors.cover || errors.description || errors.contactEmail || errors.contactPhone || errors.externalUrl);
  const locationHasErrors = !!(errors.country || errors.city);

  const inputCls = "w-full bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-teal-400/25 transition-colors placeholder:text-white/20";
  const inputErrCls = "w-full bg-white/[0.04] border border-red-400/30 rounded-xl px-4 py-3 text-sm text-white/80 outline-none focus:border-red-400/40 transition-colors placeholder:text-white/20";

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-4 sm:px-6 pt-24 pb-32">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-white/[0.03] border border-white/[0.08] text-white/40 hover:text-white hover:bg-white/[0.06] transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-full text-xs font-semibold text-white/40 hover:text-white"
          >
            Cancel
          </button>
          <button
            onClick={handlePublish}
            disabled={isSubmitting}
            className="px-6 py-2 rounded-full text-[13px] font-bold bg-teal-500 text-black hover:bg-teal-400 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : "Publish Listing"}
          </button>
        </div>
      </div>

      {/* Publish error banner */}
      {publishError && (
        <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/[0.08] border border-red-400/20 flex items-start gap-2">
          <AlertCircle size={14} className="text-red-400/70 shrink-0 mt-0.5" />
          <div>
            <p className="text-[12px] font-semibold text-red-400/80">Failed to publish</p>
            <p className="text-[11px] text-red-400/55 mt-0.5">{publishError}</p>
          </div>
          <button onClick={() => setPublishError(null)} className="ml-auto shrink-0 text-red-400/40 hover:text-red-400/70">
            <X size={12} />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Nav Sidebar */}
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-1 sticky top-24">
          <div className="px-3 pb-3">
            <h1 className="text-xl font-bold tracking-tight text-white">Post a Property</h1>
            <p className="text-xs text-white/40 mt-1">List your real estate on the network.</p>
          </div>
          {SECTIONS.map((section) => {
            const sectionHasErr =
              section.id === "basics" ? basicsHasErrors :
              section.id === "location" ? locationHasErrors : false;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all ${
                  activeSection === section.id
                    ? "bg-teal-500/[0.07] border border-teal-400/12 text-teal-400"
                    : sectionHasErr
                    ? "text-red-400/60 hover:text-red-400/80 hover:bg-red-400/[0.03] border border-red-400/10"
                    : "text-white/36 hover:text-white/58 hover:bg-white/[0.025] border border-transparent"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="font-semibold truncate">{section.label}</div>
                </div>
                {sectionHasErr && <AlertCircle size={13} className="shrink-0 text-red-400/50" />}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 w-full flex flex-col gap-6">

          {/* ── Basics Section ── */}
          <div className={`wac-card p-6 md:p-8 space-y-8 ${activeSection !== "basics" ? "hidden" : ""}`}>
            <SectionHeader index={0} section={SECTIONS[0]} hasErrors={basicsHasErrors} />

            <div className="space-y-6">
              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearError("title"); }}
                  placeholder="e.g. Modern Villa with Sea View"
                  className={errors.title ? inputErrCls : inputCls}
                  maxLength={120}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError error={errors.title} />
                  <span className="text-[10px] text-white/15 ml-auto">{title.length}/120</span>
                </div>
              </div>

              <div>
                <FieldLabel required>Description</FieldLabel>
                <textarea
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearError("description"); }}
                  placeholder="Tell potential buyers about your property — features, neighborhood, condition… (min 20 characters)"
                  className={errors.description ? inputErrCls : inputCls}
                  rows={5}
                  maxLength={3000}
                />
                <div className="flex items-center justify-between mt-1">
                  <FieldError error={errors.description} />
                  <span className="text-[10px] text-white/15 ml-auto">{description.length}/3000</span>
                </div>
              </div>

              {/* Listing Type */}
              <div>
                <FieldLabel required>Listing Type</FieldLabel>
                <div className="grid grid-cols-2 gap-2">
                  {LISTING_TYPES.map(lt => (
                    <button
                      key={lt.value}
                      type="button"
                      onClick={() => setListingType(lt.value)}
                      className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors text-left ${
                        listingType === lt.value
                          ? "bg-teal-500/[0.08] border-teal-400/30 text-teal-400"
                          : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                      }`}
                    >
                      {lt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price + Currency */}
              <div className="grid grid-cols-[1fr_auto] gap-3">
                <div>
                  <FieldLabel required>Price</FieldLabel>
                  <div className="relative">
                    <span className="absolute left-3.5 top-[13px] text-[13px] font-semibold text-white/30">{currencySymbol}</span>
                    <input
                      type="number"
                      value={priceAmount}
                      onChange={(e) => { setPriceAmount(e.target.value); clearError("price"); }}
                      placeholder={listingType === "sale" ? "e.g. 150000" : "e.g. 800"}
                      className={`${errors.price ? inputErrCls : inputCls} pl-8`}
                      min="0"
                    />
                  </div>
                  <FieldError error={errors.price} />
                </div>
                <div>
                  <FieldLabel>Currency</FieldLabel>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className={`${inputCls} w-[110px]`}
                  >
                    {CURRENCIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Cover Photo */}
              <div>
                <FieldLabel required>Main Cover Photo</FieldLabel>
                <CoverImageArea
                  value={coverUrl}
                  onChange={(v) => { setCoverUrl(v); clearError("cover"); }}
                  error={errors.cover}
                />
              </div>

              {/* Contact Mode */}
              <div>
                <FieldLabel required>How should buyers reach you?</FieldLabel>
                <div className="space-y-2">
                  {CONTACT_MODES.map(cm => {
                    const Icon = cm.icon;
                    const active = contactMode === cm.value;
                    return (
                      <button
                        key={cm.value}
                        type="button"
                        onClick={() => { setContactMode(cm.value); clearError("contactEmail"); clearError("contactPhone"); clearError("externalUrl"); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                          active
                            ? "bg-teal-500/[0.06] border-teal-400/25 text-teal-400"
                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04]"
                        }`}
                      >
                        <Icon size={15} className="shrink-0 opacity-70" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold">{cm.label}</p>
                          <p className="text-[10px] opacity-50 mt-0.5">{cm.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {/* Conditional contact detail input */}
                {contactMode === "email" && (
                  <div className="mt-3">
                    <input
                      value={contactEmail}
                      onChange={(e) => { setContactEmail(e.target.value); clearError("contactEmail"); }}
                      placeholder="your@email.com"
                      type="email"
                      className={errors.contactEmail ? inputErrCls : inputCls}
                    />
                    <FieldError error={errors.contactEmail} />
                  </div>
                )}
                {contactMode === "phone" && (
                  <div className="mt-3">
                    <input
                      value={contactPhone}
                      onChange={(e) => { setContactPhone(e.target.value); clearError("contactPhone"); }}
                      placeholder="+355 69 123 4567"
                      type="tel"
                      className={errors.contactPhone ? inputErrCls : inputCls}
                    />
                    <FieldError error={errors.contactPhone} />
                  </div>
                )}
                {contactMode === "external_link" && (
                  <div className="mt-3">
                    <input
                      value={externalUrl}
                      onChange={(e) => { setExternalUrl(e.target.value); clearError("externalUrl"); }}
                      placeholder="https://example.com/listing"
                      type="url"
                      className={errors.externalUrl ? inputErrCls : inputCls}
                    />
                    <FieldError error={errors.externalUrl} />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.05]">
                <button
                  onClick={() => goToSection("details")}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm font-medium text-white transition-colors"
                >
                  Continue to Details &gt;
                </button>
              </div>
            </div>
          </div>

          {/* ── Details Section ── */}
          <div className={`wac-card p-6 md:p-8 space-y-8 ${activeSection !== "details" ? "hidden" : ""}`}>
            <SectionHeader index={1} section={SECTIONS[1]} />

            <div className="space-y-6">
              <div>
                <FieldLabel>Property Type</FieldLabel>
                <div className="grid grid-cols-3 gap-2">
                  {PROPERTY_TYPES.map(type => {
                    const Icon = type.icon;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setPropertyType(type.value)}
                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-colors ${
                          propertyType === type.value
                            ? "bg-teal-500/[0.08] border-teal-400/40 text-teal-400"
                            : "bg-white/[0.02] border-white/[0.06] text-white/40 hover:bg-white/[0.04] hover:text-white/60"
                        }`}
                      >
                        <Icon size={18} className="mb-1.5 opacity-70" />
                        <span className="text-[11px] font-medium">{type.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <FieldLabel>Bedrooms</FieldLabel>
                  <div className="relative">
                    <BedDouble size={14} className="absolute left-3 top-[14px] text-white/20" />
                    <input
                      type="number"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(e.target.value)}
                      placeholder="e.g. 3"
                      className={`${inputCls} pl-9`}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Bathrooms</FieldLabel>
                  <div className="relative">
                    <Bath size={14} className="absolute left-3 top-[14px] text-white/20" />
                    <input
                      type="number"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(e.target.value)}
                      placeholder="e.g. 2"
                      className={`${inputCls} pl-9`}
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Parking Spaces</FieldLabel>
                  <div className="relative">
                    <Car size={14} className="absolute left-3 top-[14px] text-white/20" />
                    <input
                      type="number"
                      value={parking}
                      onChange={(e) => setParking(e.target.value)}
                      placeholder="e.g. 1"
                      className={`${inputCls} pl-9`}
                      min="0"
                      max="20"
                    />
                  </div>
                </div>
                <div>
                  <FieldLabel>Area (m²)</FieldLabel>
                  <div className="relative">
                    <Maximize size={14} className="absolute left-3 top-[14px] text-white/20" />
                    <input
                      type="number"
                      value={squareMeters}
                      onChange={(e) => setSquareMeters(e.target.value)}
                      placeholder="e.g. 120"
                      className={`${inputCls} pl-9`}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-white/[0.05]">
                <button
                  onClick={() => goToSection("location")}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-sm font-medium text-white transition-colors"
                >
                  Continue to Location &gt;
                </button>
              </div>
            </div>
          </div>

          {/* ── Location Section ── */}
          <div className={`wac-card p-6 md:p-8 space-y-8 ${activeSection !== "location" ? "hidden" : ""}`}>
            <SectionHeader index={2} section={SECTIONS[2]} hasErrors={locationHasErrors} />

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel required>Country</FieldLabel>
                  <CountrySelect
                    value={country}
                    onChange={(v) => { setCountry(v); clearError("country"); }}
                    error={errors.country}
                  />
                </div>
                <div>
                  <FieldLabel required>City</FieldLabel>
                  <input
                    value={city}
                    onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                    placeholder="e.g. Tirana"
                    className={errors.city ? inputErrCls : inputCls}
                  />
                  <FieldError error={errors.city} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <FieldLabel>State / Region</FieldLabel>
                  <input
                    value={stateRegion}
                    onChange={(e) => setStateRegion(e.target.value)}
                    placeholder="e.g. Tirana County"
                    className={inputCls}
                  />
                </div>
                <div>
                  <FieldLabel>Street Address</FieldLabel>
                  <input
                    value={address1}
                    onChange={(e) => setAddress1(e.target.value)}
                    placeholder="e.g. Rruga Sami Frasheri"
                    className={inputCls}
                  />
                </div>
              </div>

              {/* Continue to publish section */}
              <div className="pt-4 border-t border-white/[0.05]">
                <button
                  onClick={() => goToSection("publish")}
                  className="w-full px-6 py-3 rounded-xl text-[13px] font-bold bg-white/[0.06] border border-white/[0.09] text-white/70 hover:bg-white/[0.10] hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                  Continue to Publish
                </button>
              </div>
            </div>
          </div>

          {/* ── Publish Section ── */}
          <div className={`wac-card p-6 md:p-8 space-y-8 ${activeSection !== "publish" ? "hidden" : ""}`}>
            <SectionHeader index={3} section={SECTIONS[3]} />

            <div className="space-y-6">

              {/* ── Listing Visibility ── */}
              <div>
                <FieldLabel>Listing Visibility</FieldLabel>
                <p className="text-[11px] text-white/25 -mt-1 mb-3">Controls whether this listing appears in the directory.</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsHidden(false)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      !isHidden
                        ? "bg-teal-500/[0.06] border-teal-400/20 text-teal-400"
                        : "bg-white/[0.02] border-white/[0.07] text-white/50 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Eye size={16} strokeWidth={1.8} className={!isHidden ? "text-teal-400" : "text-white/25"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold">Public</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Visible in the directory and on your profile</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      !isHidden ? "border-teal-400" : "border-white/15"
                    }`}>
                      {!isHidden && <span className="w-2 h-2 rounded-full bg-teal-400" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { setIsHidden(true); setShareToPulse(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                      isHidden
                        ? "bg-white/[0.04] border-white/[0.12] text-white/70"
                        : "bg-white/[0.02] border-white/[0.07] text-white/50 hover:bg-white/[0.04]"
                    }`}
                  >
                    <EyeOff size={16} strokeWidth={1.8} className={isHidden ? "text-white/50" : "text-white/25"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold">Hidden for now</p>
                      <p className="text-[10px] text-white/30 mt-0.5">Saved as draft — only you can see it</p>
                    </div>
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      isHidden ? "border-white/40" : "border-white/15"
                    }`}>
                      {isHidden && <span className="w-2 h-2 rounded-full bg-white/50" />}
                    </span>
                  </button>
                </div>
              </div>

              {/* ── Pulse Promotion ── */}
              <div className={isHidden ? "opacity-40 pointer-events-none" : ""}>
                <FieldLabel>Pulse Promotion</FieldLabel>
                <p className="text-[11px] text-white/25 -mt-1 mb-3">
                  Optionally share this listing on the Pulse feed to reach more people.
                </p>

                <button
                  type="button"
                  onClick={() => setShareToPulse(v => !v)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
                    shareToPulse
                      ? "bg-[#b08d57]/[0.06] border-[#b08d57]/20"
                      : "bg-white/[0.02] border-white/[0.07] hover:bg-white/[0.04]"
                  }`}
                >
                  <Megaphone size={16} strokeWidth={1.8} className={shareToPulse ? "text-[#b08d57]" : "text-white/25"} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-[13px] font-semibold ${shareToPulse ? "text-[#b08d57]" : "text-white/50"}`}>
                      Also share on Pulse
                    </p>
                    <p className="text-[10px] text-white/30 mt-0.5">
                      Creates a post with your listing photo, price, and a link back
                    </p>
                  </div>
                  <span className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    shareToPulse
                      ? "bg-[#b08d57] border-[#b08d57]"
                      : "border-white/15 bg-transparent"
                  }`}>
                    {shareToPulse && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </span>
                </button>

                {/* Pulse caption — only shown when sharing to pulse */}
                {shareToPulse && (
                  <div className="mt-4">
                    <FieldLabel>Pulse Caption</FieldLabel>
                    <p className="text-[10px] text-white/20 -mt-1 mb-2">
                      Optional — leave blank for an auto-generated caption with price and location.
                    </p>
                    <textarea
                      value={pulseCaption}
                      onChange={(e) => setPulseCaption(e.target.value)}
                      placeholder="e.g. Just listed! Beautiful sea-view villa in Sarandë…"
                      className={inputCls}
                      rows={3}
                      maxLength={500}
                    />
                    <div className="flex justify-end mt-1">
                      <span className="text-[10px] text-white/15">{pulseCaption.length}/500</span>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Final Publish ── */}
              <div className="pt-4 border-t border-white/[0.05]">
                {/* Summary */}
                <div className="flex items-center gap-3 mb-4 px-1">
                  <div className="flex items-center gap-1.5 text-[11px] font-medium">
                    {isHidden ? (
                      <><EyeOff size={11} className="text-white/30" /><span className="text-white/40">Hidden draft</span></>
                    ) : (
                      <><Eye size={11} className="text-teal-400/60" /><span className="text-teal-400/70">Public listing</span></>
                    )}
                  </div>
                  {!isHidden && (
                    <>
                      <span className="text-white/10">·</span>
                      <div className="flex items-center gap-1.5 text-[11px] font-medium">
                        {shareToPulse ? (
                          <><Megaphone size={11} className="text-[#b08d57]/60" /><span className="text-[#b08d57]/70">Sharing to Pulse</span></>
                        ) : (
                          <span className="text-white/30">No Pulse post</span>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <button
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 rounded-xl text-[13px] font-bold bg-teal-500 text-black hover:bg-teal-400 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : isHidden ? (
                    "Save as Draft"
                  ) : (
                    "Publish Listing"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
