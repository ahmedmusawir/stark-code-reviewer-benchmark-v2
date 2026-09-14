import React, { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useCheckoutStore } from "@/store/useCheckoutStore";

const NOTE_MAX_LENGTH = 1000;

const CustomerComments = () => {
  const customerNote = useCheckoutStore(
    (state) => state.checkoutData.customerNote
  );
  const setCustomerNote = useCheckoutStore((state) => state.setCustomerNote);

  const [saved, setSaved] = useState(false);
  const noteLength = (customerNote ?? "").length;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="mt-6 p-4 border shadow-xl bg-white">
      <label
        htmlFor="customer-comment"
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        Add a note to your order (optional)
      </label>

      <Textarea
        id="customer-comment"
        placeholder="E.g. Please call before delivery, or leave at front desk."
        value={customerNote}
        onChange={(e) => setCustomerNote(e.target.value)}
        className="mb-1"
        maxLength={NOTE_MAX_LENGTH}
        rows={3}
      />

      <p
        aria-live="polite"
        data-testid="customer-note-counter"
        className={`mb-3 text-xs ${
          noteLength >= NOTE_MAX_LENGTH ? "text-red-600" : "text-gray-500"
        }`}
      >
        {noteLength} / {NOTE_MAX_LENGTH}
      </p>

      <Button
        onClick={handleSave}
        disabled={!(customerNote ?? "").trim()}
        size="sm"
        className="bg-blue-600 text-white py-4 px-4 hover:bg-blue-500 rounded-none"
      >
        Save Note
      </Button>
      {saved && (
        <span className="ml-3 text-green-600 text-xs font-semibold">
          Saved!
        </span>
      )}
    </div>
  );
};

export default CustomerComments;
