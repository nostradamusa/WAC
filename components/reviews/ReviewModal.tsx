"use client";

import React, { useState } from 'react';
import { Star, X } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityName: string;
  entityId: string;
  entityType: 'business' | 'organization';
}

export default function ReviewModal({ isOpen, onClose, entityName, entityId, entityType }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    
    // Simulating an API call for now.
    // We would insert this into the `wac_reviews` table normally.
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      // Reset and close
      onClose();
      // You could trigger a revalidate or show a toast here.
    } catch (error) {
       console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white rounded-full hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>

        <div className="p-6 overflow-y-auto no-scrollbar">
          <h2 className="text-2xl font-bold mb-1">Leave a Review</h2>
          <p className="text-white/60 text-sm mb-6">
            Share your experience with <span className="text-[var(--accent)] font-semibold">{entityName}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center">
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                  >
                    <Star
                      size={32}
                      className={`transition-colors duration-200 ${
                        star <= (hoverRating || rating)
                          ? "fill-[var(--accent)] text-[var(--accent)] drop-shadow-[0_0_8px_rgba(200,160,80,0.5)]"
                          : "fill-transparent text-white/20"
                      }`}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-white/50 mt-2 h-4 font-medium uppercase tracking-widest">
                {rating === 1 && "Poor"}
                {rating === 2 && "Fair"}
                {rating === 3 && "Good"}
                {rating === 4 && "Very Good"}
                {rating === 5 && "Excellent"}
                {rating === 0 && "Select a rating"}
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="content" className="block text-sm font-medium text-white/80">
                Your Review
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What was your experience like?"
                className="w-full h-32 px-4 py-3 bg-black/20 border border-white/10 focus:border-[var(--accent)] rounded-xl resize-none text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={rating === 0 || isSubmitting}
              className="w-full font-bold py-3.5 px-4 rounded-xl text-black transition-all disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[var(--accent)] to-yellow-400 hover:shadow-[0_0_20px_rgba(200,160,80,0.4)]"
            >
              {isSubmitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
