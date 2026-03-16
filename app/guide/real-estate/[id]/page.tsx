"use client";

import { useState, use } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, MapPin, Bed, Bath, Square, Share2, Heart, CheckCircle2, ChevronLeft, ChevronRight, Phone, Mail } from "lucide-react";

export default function PropertyDetails({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [activeImage, setActiveImage] = useState(0);

  // Mock property data
  const property = {
    id: resolvedParams.id,
    title: "Luxury Coastal Villa with Panoramic Sea Views",
    price: "€320,000",
    location: "Vlorë, Albania",
    specs: { beds: 3, baths: 2, sqft: 185 },
    status: "For Sale",
    verified: true,
    description: "Experience unparalleled luxury in this stunning coastal villa located in the heart of the Albanian Riviera. Featuring floor-to-ceiling windows, modern finishes, a private infinity pool, and sweeping views of the Ionian Sea. Perfect as a summer retreat or a highly profitable rental investment for the diaspora.",
    features: [
      "Sea View", "Private Pool", "Smart Home System", "Underfloor Heating", "2 Car Garage", "24/7 Security",
      "Rooftop Terrace", "Built-in Wardrobes"
    ],
    images: [
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600607687931-cebf0746e50e?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600607687644-aac4c15cecb1?auto=format&fit=crop&q=80&w=1200",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&q=80&w=1200"
    ],
    agent: {
      name: "Ilir Kastrati",
      agency: "Illyrian Real Estate Group",
      phone: "+355 69 123 4567",
      email: "ilir@illyrianRE.al",
      image: "https://i.pravatar.cc/150?u=ilir",
      verified: true
    }
  };

  const nextImage = () => setActiveImage((prev) => (prev + 1) % property.images.length);
  const prevImage = () => setActiveImage((prev) => (prev - 1 + property.images.length) % property.images.length);

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-24">
      {/* Top Nav */}
      <div className="sticky top-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 py-4 px-6 relative">
        <div className="mx-auto max-w-[90rem] flex items-center justify-between">
          <Link href="/guide/real-estate" className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Listings
          </Link>
          <div className="flex items-center gap-3">
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors" title="Share">
              <Share2 className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/5 hover:bg-[var(--accent)] hover:text-black rounded-full transition-colors" title="Save">
              <Heart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[90rem] px-6 mt-8 grid lg:grid-cols-3 gap-12 relative">
        
        {/* Left Column: Image Gallery & Details */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Main Gallery */}
          <div className="relative h-[60vh] min-h-[400px] w-full bg-white/5 rounded-2xl overflow-hidden group">
            <Image
              src={property.images[activeImage]}
              alt={`Property view ${activeImage + 1}`}
              fill
              className="object-cover transition-all duration-500"
            />
            {/* Status Badges */}
            <div className="absolute top-4 left-4 flex gap-2">
              <span className="bg-black/70 backdrop-blur-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-2 border border-white/10">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> {property.status}
              </span>
              {property.verified && (
                <span className="bg-[var(--accent)] text-black px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded flex items-center gap-1 shadow-lg">
                  <CheckCircle2 className="w-3 h-3" /> Verified Listing
                </span>
              )}
            </div>
            
            {/* Gallery Controls */}
            <button onClick={prevImage} className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button onClick={nextImage} className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/80 text-white p-3 rounded-full opacity-0 group-hover:opacity-100 transition-all backdrop-blur-sm">
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Thumbnails */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-md p-2 rounded-xl">
              {property.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                    activeImage === idx ? "border-[var(--accent)]" : "border-transparent opacity-50 hover:opacity-100"
                  }`}
                >
                  <Image src={img} alt="" fill className="object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Property Intel */}
          <div>
             <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                   <h1 className="text-3xl md:text-5xl font-serif tracking-tight mb-3">{property.title}</h1>
                   <p className="text-white/60 flex items-center gap-2 text-lg">
                      <MapPin className="w-5 h-5 text-[var(--accent)]" /> {property.location}
                   </p>
                </div>
                <div className="text-[var(--accent)] font-serif text-4xl md:text-5xl">{property.price}</div>
             </div>

             {/* Specs Bar */}
             <div className="flex flex-wrap items-center gap-8 py-6 border-y border-white/10 mb-8">
                <div className="flex items-center gap-3">
                   <div className="bg-white/5 p-3 rounded-full"><Bed className="text-[var(--accent)] w-6 h-6" /></div>
                   <div><div className="text-xl font-bold">{property.specs.beds}</div><div className="text-xs uppercase tracking-widest text-white/50">Bedrooms</div></div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="bg-white/5 p-3 rounded-full"><Bath className="text-[var(--accent)] w-6 h-6" /></div>
                   <div><div className="text-xl font-bold">{property.specs.baths}</div><div className="text-xs uppercase tracking-widest text-white/50">Bathrooms</div></div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="bg-white/5 p-3 rounded-full"><Square className="text-[var(--accent)] w-6 h-6" /></div>
                   <div><div className="text-xl font-bold">{property.specs.sqft}</div><div className="text-xs uppercase tracking-widest text-white/50">Square Meters</div></div>
                </div>
             </div>

             <h3 className="text-2xl font-serif mb-4">About this Property</h3>
             <p className="text-lg opacity-80 leading-relaxed mb-10">
               {property.description}
             </p>

             <h3 className="text-2xl font-serif mb-6">Key Features</h3>
             <div className="grid grid-cols-2 md:grid-cols-3 gap-y-4 gap-x-8 mb-10">
                {property.features.map((feature, i) => (
                   <div key={i} className="flex items-center gap-3 text-white/80">
                      <CheckCircle2 className="w-5 h-5 text-[var(--accent)]" />
                      {feature}
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* Right Column: Contact Agent Sticky Box */}
        <div className="relative">
           <div className="sticky top-28 bg-[#1b1714] border border-[var(--accent)]/30 p-8 rounded-3xl shadow-[0_0_40px_rgba(212,175,55,0.05)]">
              <h3 className="text-xl font-serif mb-6 border-b border-white/10 pb-4">Contact Agent</h3>
              
              <div className="flex items-center gap-4 mb-6">
                 <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[var(--accent)]">
                    <Image src={property.agent.image} alt={property.agent.name} fill className="object-cover" />
                 </div>
                 <div>
                    <h4 className="font-bold text-lg flex items-center gap-2">
                       {property.agent.name}
                       {property.agent.verified && <span title="Verified Agent"><CheckCircle2 className="w-4 h-4 text-[var(--accent)]" /></span>}
                    </h4>
                    <Link href={`/people/${property.agent.name.toLowerCase().replace(' ', '-')}`} className="text-sm text-[var(--accent)] hover:underline flex items-center gap-1 mt-1">
                       View WAC Profile
                    </Link>
                 </div>
              </div>

              <div className="space-y-4 mb-8">
                 <a href={`tel:${property.agent.phone}`} className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors">
                    <Phone className="w-5 h-5 text-white/50" />
                    <span>{property.agent.phone}</span>
                 </a>
                 <a href={`mailto:${property.agent.email}`} className="flex items-center gap-3 w-full bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors">
                    <Mail className="w-5 h-5 text-white/50" />
                    <span className="truncate">{property.agent.email}</span>
                 </a>
              </div>

              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                 
                 {/* WAC Profile Trust Layer */}
                 <div className="bg-black/40 border border-[var(--accent)]/20 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden relative border border-white/20">
                          <Image src="https://i.pravatar.cc/150?img=11" alt="My Profile" fill className="object-cover" />
                       </div>
                       <div>
                          <p className="text-sm font-bold flex items-center gap-1">
                             Sending as Sokol B. <CheckCircle2 className="w-3 h-3 text-[var(--accent)]" />
                          </p>
                          <p className="text-xs text-[var(--accent)]">Verified Platform Member</p>
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <input type="text" defaultValue="Sokol B." className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] opacity-50 cursor-not-allowed" readOnly title="Name pulled from platform profile" />
                    <input type="email" defaultValue="sokol@example.al" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] opacity-50 cursor-not-allowed" readOnly title="Email pulled from platform profile" />
                 </div>

                 <div>
                    <textarea placeholder="Hi, I am interested in this property..." rows={4} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-[var(--accent)] resize-none"></textarea>
                 </div>

                 <label className="flex items-start gap-3 text-sm text-white/70 cursor-pointer group">
                    <input type="checkbox" defaultChecked className="mt-1 w-4 h-4 rounded border-white/20 accent-[var(--accent)] bg-white/5" />
                    <span className="group-hover:text-white transition-colors leading-relaxed">
                       Attach a link to my <span className="text-[var(--accent)] font-bold">WAC Public Profile</span> so the agent can quickly verify my identity and professional background.
                    </span>
                 </label>

                 <button className="w-full bg-[var(--accent)] hover:bg-[#b08d24] text-black font-bold text-lg py-4 rounded-xl transition-colors shadow-lg shadow-[var(--accent)]/20 mt-4">
                    Send Securely via WAC
                 </button>
              </form>
           </div>
        </div>

      </div>
    </main>
  );
}
