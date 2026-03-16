"use client";

import React, { useState } from "react";
import WacRatingBadge from "@/components/ui/WacRatingBadge";
import ReviewModal from "@/components/reviews/ReviewModal";

interface WacReviewTriggerProps {
  entityId: string;
  entityName: string;
  entityType: "business" | "organization";
  rating: number;
  reviewsCount: number;
}

export default function WacReviewTrigger({
  entityId,
  entityName,
  entityType,
  rating,
  reviewsCount,
}: WacReviewTriggerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <WacRatingBadge
        rating={rating}
        reviewsCount={reviewsCount}
        onClick={() => setIsModalOpen(true)}
      />
      <ReviewModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        entityId={entityId}
        entityName={entityName}
        entityType={entityType}
      />
    </>
  );
}
