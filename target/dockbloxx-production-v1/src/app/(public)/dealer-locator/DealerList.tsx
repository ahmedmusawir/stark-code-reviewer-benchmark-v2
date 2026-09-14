"use client";

import { useState } from "react";
import { Dealer } from "@/types/dealer";
import {
  MdOutlinePhone,
  MdOutlineLocationOn,
  MdOutlineLanguage,
} from "react-icons/md";

interface DealerListProps {
  dealers: Dealer[];
}

const DealerList = ({ dealers }: DealerListProps) => {
  const [query, setQuery] = useState("");

  const filtered = dealers.filter((d) =>
    d.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <div className="max-w-md mx-auto mb-8">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search dealers by name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-600">No dealers match your search.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
          {filtered.map((dealer) => (
            <div
              key={dealer.name}
              className="bg-gray-100 p-6 rounded-lg shadow-sm text-left flex flex-col gap-4"
            >
              <h3 className="text-xl font-semibold text-gray-900">
                {dealer.name}
              </h3>

              <div className="flex items-start gap-3 text-gray-700">
                <MdOutlineLocationOn className="w-10 h-10 text-gray-400" />
                <p className="mt-2">{dealer.address}</p>
              </div>

              <div className="flex items-start gap-3 text-gray-700">
                <MdOutlinePhone className="w-10 h-10 text-gray-400" />
                <p className="mt-2">{dealer.phone}</p>
              </div>

              <div className="flex items-start gap-3 text-gray-700">
                <MdOutlineLanguage className="w-10 h-10 text-gray-400" />
                <a
                  href={dealer.website}
                  target="_blank"
                  className="mt-2 border-b-2 border-blue-500"
                >
                  Click to go to site
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default DealerList;
