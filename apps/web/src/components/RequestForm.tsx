"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createServiceRequestSchema, CreateServiceRequestInput } from "@maybe/shared";
import { useQuery } from "@tanstack/react-query";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { EmergencyDisclaimer } from "@/components/EmergencyDisclaimer";
import { trackEvent } from "@/lib/analytics";

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
  emergencyEligible: boolean;
}

export function RequestForm() {
  const searchParams = useSearchParams();
  const [submitted, setSubmitted] = useState<{ statusLookupUrl: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoMediaIds, setPhotoMediaIds] = useState<string[]>([]);

  const { data: categories } = useQuery<ServiceCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ServiceCategory[]>("/service-categories"),
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateServiceRequestInput>({
    resolver: zodResolver(createServiceRequestSchema),
    defaultValues: {
      urgency: (searchParams.get("urgency") as "scheduled" | "instant" | "emergency") ?? "scheduled",
      categorySlug: searchParams.get("category") ?? "",
      address: { province: "ON" },
      photoMediaIds: [],
      marketingConsent: false,
    },
  });

  useEffect(() => {
    trackEvent("booking_started");
  }, []);

  const selectedCategorySlug = watch("categorySlug");
  const selectedCategory = categories?.find((c) => c.slug === selectedCategorySlug);

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { mediaId, uploadUrl } = await apiClient.post<{ mediaId: string; uploadUrl: string }>("/files/upload-url", {
        purpose: "SERVICE_REQUEST_PHOTO",
        mimeType: file.type,
        sizeBytes: file.size,
        fileName: file.name,
      });
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      const next = [...photoMediaIds, mediaId];
      setPhotoMediaIds(next);
      setValue("photoMediaIds", next);
    } catch {
      setSubmitError("We couldn't upload that photo. You can still submit your request without it.");
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(data: CreateServiceRequestInput) {
    setSubmitError(null);
    trackEvent("service_selected", { categorySlug: data.categorySlug, urgency: data.urgency });
    try {
      const result = await apiClient.post<{ id: string; statusLookupUrl: string }>("/service-requests", data);
      trackEvent("request_submitted", { categorySlug: data.categorySlug, urgency: data.urgency, source: "request_form" });
      setSubmitted(result);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.apiError.message : "We couldn't submit your request. Please try again.");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-700">Request received</h1>
        <p className="mt-3 text-slate-700">
          We&apos;ll review your request and get you matched with a plumber. Bookmark this link to check status any
          time:
        </p>
        <p className="mt-3 break-all rounded-md bg-slate-50 p-3 text-sm">{submitted.statusLookupUrl}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Request a plumber</h1>
      <p className="mt-1 text-sm text-slate-600">Tell us what&apos;s going on — no account required.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">Your contact info</legend>
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-slate-900">Full name</label>
            <input id="contactName" {...register("contactName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.contactName && <p className="mt-1 text-xs text-emergency-600">{errors.contactName.message}</p>}
          </div>
          <div>
            <label htmlFor="contactEmail" className="block text-sm font-medium text-slate-900">Email</label>
            <input id="contactEmail" type="email" {...register("contactEmail")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.contactEmail && <p className="mt-1 text-xs text-emergency-600">{errors.contactEmail.message}</p>}
          </div>
          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-slate-900">Phone number</label>
            <input id="contactPhone" type="tel" {...register("contactPhone")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.contactPhone && <p className="mt-1 text-xs text-emergency-600">{errors.contactPhone.message}</p>}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">Service address</legend>
          <div>
            <label htmlFor="line1" className="block text-sm font-medium text-slate-900">Street address</label>
            <input id="line1" {...register("address.line1")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.address?.line1 && <p className="mt-1 text-xs text-emergency-600">{errors.address.line1.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-slate-900">City</label>
              <input id="city" defaultValue="Toronto" {...register("address.city")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            </div>
            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-slate-900">Postal code</label>
              <input id="postalCode" {...register("address.postalCode")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
              {errors.address?.postalCode && <p className="mt-1 text-xs text-emergency-600">{errors.address.postalCode.message}</p>}
            </div>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">The problem</legend>
          <div>
            <label htmlFor="categorySlug" className="block text-sm font-medium text-slate-900">Category</label>
            <select id="categorySlug" {...register("categorySlug")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring">
              <option value="">Select a category</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.slug}>{c.name}</option>
              ))}
            </select>
            {errors.categorySlug && <p className="mt-1 text-xs text-emergency-600">{errors.categorySlug.message}</p>}
          </div>
          <div>
            <label htmlFor="problemDescription" className="block text-sm font-medium text-slate-900">Describe the problem</label>
            <textarea id="problemDescription" rows={4} {...register("problemDescription")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.problemDescription && <p className="mt-1 text-xs text-emergency-600">{errors.problemDescription.message}</p>}
          </div>
          <div>
            <label htmlFor="photo" className="block text-sm font-medium text-slate-900">Add a photo (optional)</label>
            <input id="photo" type="file" accept="image/*" onChange={handlePhotoUpload} className="mt-1 text-sm" />
            {uploading && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
            {photoMediaIds.length > 0 && <p className="mt-1 text-xs text-brand-700">{photoMediaIds.length} photo(s) attached</p>}
          </div>
          <fieldset>
            <legend className="block text-sm font-medium text-slate-900">Urgency</legend>
            <div className="mt-2 flex gap-4 text-sm">
              {(["scheduled", "instant", "emergency"] as const).map((u) => (
                <label key={u} className="flex items-center gap-2">
                  <input type="radio" value={u} {...register("urgency")} disabled={u === "emergency" && selectedCategory && !selectedCategory.emergencyEligible} />
                  {u === "scheduled" ? "Schedule for later" : u === "instant" ? "As soon as possible" : "Emergency"}
                </label>
              ))}
            </div>
          </fieldset>
          {watch("urgency") === "emergency" && <EmergencyDisclaimer compact />}
        </fieldset>

        {submitError && (
          <p role="alert" className="rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit request"}
        </button>
      </form>
    </div>
  );
}
