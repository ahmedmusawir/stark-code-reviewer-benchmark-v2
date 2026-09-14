"use client";

import React, { useEffect, useState } from "react";
import { PoleMaterials } from "@/types/product";

interface Props {
  selectedMaterial: string | null;
  onSelectionChange: (material: string) => void; // Pass the selected label back
}

/**
 * Pole Material (Metal / Wood) — frontend-owned option, Ticket 3.
 * Labels come from the ACF "Product Global" options page via the
 * `poleMaterials` key of the embedded product-category-custom JSON.
 * Empty labels are omitted; nothing is selected on load.
 * Styled exactly like the Pole Size buttons in BloxxPricing.
 */
const BloxxPricingPoleMaterials = ({
  selectedMaterial,
  onSelectionChange,
}: Props) => {
  const [poleMaterials, setPoleMaterials] = useState<PoleMaterials | null>(
    null
  );

  // Read pole materials from the embedded category JSON
  useEffect(() => {
    const categoryScript = document.getElementById("product-category-custom");
    if (categoryScript) {
      const data = JSON.parse(categoryScript.textContent || "{}");
      if (data.poleMaterials) {
        setPoleMaterials(data.poleMaterials);
      }
    }
  }, []);

  // CONTRACT: empty/absent ACF value → option omitted; both empty → render nothing
  const materialLabels = poleMaterials
    ? [poleMaterials.metal, poleMaterials.wood].filter((label) => !!label)
    : [];

  if (materialLabels.length === 0) return null;

  return (
    <div className="mb-4">
      <h3 className="text-lg text-gray-600">Pole Material</h3>
      <div className="flex flex-wrap gap-3 mt-2 justify-start">
        {materialLabels.map((label) => (
          <button
            key={label}
            onClick={() => onSelectionChange(label)}
            className={`px-8 py-4 min-w-[50px] rounded-none text-sm font-medium shadow-sm ${
              selectedMaterial === label
                ? "bg-blue-600 text-white border-2 border-blue-500"
                : "bg-white text-gray-900 border-2 border-blue-500 hover:bg-gray-100"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BloxxPricingPoleMaterials;
