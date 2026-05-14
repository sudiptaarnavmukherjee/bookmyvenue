"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, Send } from "lucide-react";

type InquiryFormProps = {
  entityType: "VENUE" | "CATERER";
  entityId: string;
  entityName: string;
};

const EVENT_TYPES = ["WEDDING", "BIRTHDAY", "CORPORATE", "RECEPTION", "ANNIVERSARY", "OTHER"];

export default function InquiryForm({ entityType, entityId, entityName }: InquiryFormProps) {
  const { data: session } = useSession();
  const [eventType, setEventType] = useState("WEDDING");
  const [guestCount, setGuestCount] = useState("");
  const [budget, setBudget] = useState("");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      alert("Please add your requirement message.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        venueId: entityType === "VENUE" ? entityId : undefined,
        catererId: entityType === "CATERER" ? entityId : undefined,
        eventType,
        guestCount: guestCount ? parseInt(guestCount, 10) : undefined,
        budget: budget ? parseFloat(budget) : undefined,
        email: email || undefined,
        phoneNumber: phoneNumber || undefined,
        message,
      };

      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "Failed to submit inquiry");
      }

      alert(`Inquiry sent for ${entityName}. The owner will contact you soon.`);
      setMessage("");
      setGuestCount("");
      setBudget("");
      setPhoneNumber("");
    } catch (error: any) {
      alert(error?.message || "Failed to send inquiry");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <h4 className="text-sm font-bold text-slate-900">Send Detailed Inquiry</h4>
      <p className="mt-1 text-xs text-slate-500">Get pricing clarity and availability confirmation from the owner.</p>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b5fab]"
        >
          {EVENT_TYPES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <input
          type="number"
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          placeholder="Expected guests"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b5fab]"
        />

        <input
          type="number"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          placeholder="Budget (optional)"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b5fab]"
        />

        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          placeholder="Phone number"
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b5fab]"
        />

        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-[#0b5fab]"
        />

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Tell the owner about your event date options, requirements, and preferences"
          className="sm:col-span-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none resize-none focus:border-[#0b5fab]"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !message.trim()}
        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#0b5fab] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#084a86] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        Submit Inquiry
      </button>
    </div>
  );
}
