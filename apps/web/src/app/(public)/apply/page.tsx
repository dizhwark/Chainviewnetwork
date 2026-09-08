"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { createPlumberApplicationSchema, CreatePlumberApplicationInput } from "@maybe/shared";
import { apiClient, ApiClientError } from "@/lib/api-client";
import { BRAND } from "@maybe/config";

interface ServiceCategory {
  id: string;
  slug: string;
  name: string;
}

async function uploadDocument(
  file: File,
  purpose: "LICENSE_DOCUMENT" | "INSURANCE_DOCUMENT",
): Promise<string> {
  const { mediaId, uploadUrl } = await apiClient.post<{ mediaId: string; uploadUrl: string }>("/files/upload-url", {
    purpose,
    mimeType: file.type,
    sizeBytes: file.size,
    fileName: file.name,
  });
  await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
  return mediaId;
}

export default function ApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [uploadingInsurance, setUploadingInsurance] = useState(false);

  const { data: categories } = useQuery<ServiceCategory[]>({
    queryKey: ["categories"],
    queryFn: () => apiClient.get<ServiceCategory[]>("/service-categories"),
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreatePlumberApplicationInput>({
    resolver: zodResolver(createPlumberApplicationSchema),
    defaultValues: {
      businessType: "sole_proprietor",
      businessAddress: { province: "ON" },
      serviceAreaPostalPrefixes: [],
      categorySlugs: [],
      yearsExperience: 0,
      agreedToTermsVersion: "v1-template",
    },
  });

  const selectedCategories = watch("categorySlugs") ?? [];

  function toggleCategory(slug: string) {
    const next = selectedCategories.includes(slug) ? selectedCategories.filter((s) => s !== slug) : [...selectedCategories, slug];
    setValue("categorySlugs", next);
  }

  async function onSubmit(data: CreatePlumberApplicationInput) {
    setSubmitError(null);
    try {
      await apiClient.post("/plumber-applications", data);
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof ApiClientError ? err.apiError.message : "We couldn't submit your application.");
    }
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-brand-700">Application received</h1>
        <p className="mt-3 text-slate-700">
          Thanks for applying! We&apos;ll review your licence and insurance documents and follow up by email.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Apply to join as a plumber</h1>
      <p className="mt-1 text-sm text-slate-600">It&apos;s free to join. We just need to verify your licence and insurance.</p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">About you and your business</legend>
          <div>
            <label className="block text-sm font-medium text-slate-900">Legal name</label>
            <input {...register("legalName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.legalName && <p className="mt-1 text-xs text-emergency-600">{errors.legalName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Business name</label>
            <input {...register("businessName")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.businessName && <p className="mt-1 text-xs text-emergency-600">{errors.businessName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Business type</label>
            <select {...register("businessType")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring">
              <option value="sole_proprietor">Sole proprietor</option>
              <option value="partnership">Partnership</option>
              <option value="corporation">Corporation</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-900">Email</label>
              <input type="email" {...register("email")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
              {errors.email && <p className="mt-1 text-xs text-emergency-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-900">Phone</label>
              <input type="tel" {...register("phone")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
              {errors.phone && <p className="mt-1 text-xs text-emergency-600">{errors.phone.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Password</label>
            <input type="password" {...register("password")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            {errors.password && <p className="mt-1 text-xs text-emergency-600">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Business address</label>
            <input placeholder="Street address" {...register("businessAddress.line1")} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            <div className="mt-2 grid grid-cols-2 gap-4">
              <input placeholder="City" defaultValue="Toronto" {...register("businessAddress.city")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
              <input placeholder="Postal code" {...register("businessAddress.postalCode")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Years of experience</label>
            <input type="number" min={0} {...register("yearsExperience", { valueAsNumber: true })} className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">Services and coverage</legend>
          <div>
            <p className="text-sm font-medium text-slate-900">Categories you offer</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {categories?.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => toggleCategory(c.slug)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium focus-ring ${
                    selectedCategories.includes(c.slug) ? "border-brand-600 bg-brand-600 text-white" : "border-slate-300 text-slate-700"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
            {errors.categorySlugs && <p className="mt-1 text-xs text-emergency-600">Select at least one category</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Service area postal prefixes (e.g. M5, M4)</label>
            <input
              placeholder="M5, M4, M6"
              onChange={(e) => setValue("serviceAreaPostalPrefixes", e.target.value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 focus-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Service radius (km)</label>
            <input type="number" min={1} {...register("serviceRadiusKm", { valueAsNumber: true })} className="mt-1 w-32 rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">Licence</legend>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Licence number" {...register("licenseNumber")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            <input placeholder="Licence type" {...register("licenseType")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
          <input placeholder="Issuing authority" {...register("licenseIssuingAuthority")} className="w-full rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          <div>
            <label className="block text-sm font-medium text-slate-900">Expiry date</label>
            <input type="date" {...register("licenseExpiresOn")} className="mt-1 rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Upload proof of licence</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingLicense(true);
                try {
                  setValue("licenseDocumentMediaId", await uploadDocument(file, "LICENSE_DOCUMENT"));
                } finally {
                  setUploadingLicense(false);
                }
              }}
              className="mt-1 text-sm"
            />
            {uploadingLicense && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
            {errors.licenseDocumentMediaId && <p className="mt-1 text-xs text-emergency-600">Please upload your licence document</p>}
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-semibold text-slate-900">Insurance</legend>
          <div className="grid grid-cols-2 gap-4">
            <input placeholder="Insurance provider" {...register("insuranceProvider")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
            <input placeholder="Policy number" {...register("insurancePolicyNumber")} className="rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Coverage amount (CAD)</label>
            <input
              type="number"
              min={0}
              onChange={(e) => setValue("insuranceCoverageAmountCents", Math.round(Number(e.target.value) * 100))}
              className="mt-1 w-40 rounded-md border border-slate-300 px-3 py-2 focus-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Expiry date</label>
            <input type="date" {...register("insuranceExpiresOn")} className="mt-1 rounded-md border border-slate-300 px-3 py-2 focus-ring" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-900">Upload proof of insurance</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploadingInsurance(true);
                try {
                  setValue("insuranceDocumentMediaId", await uploadDocument(file, "INSURANCE_DOCUMENT"));
                } finally {
                  setUploadingInsurance(false);
                }
              }}
              className="mt-1 text-sm"
            />
            {uploadingInsurance && <p className="mt-1 text-xs text-slate-500">Uploading...</p>}
            {errors.insuranceDocumentMediaId && <p className="mt-1 text-xs text-emergency-600">Please upload your insurance document</p>}
          </div>
        </fieldset>

        <label className="flex items-start gap-2 text-sm text-slate-700">
          <input type="checkbox" {...register("consentToVerification")} className="mt-1" />
          I agree to {BRAND.name}&apos;s verification process and the Contractor/Provider Agreement, and consent to
          having my licence and insurance details verified.
        </label>
        {errors.consentToVerification && <p className="text-xs text-emergency-600">You must consent to verification to apply.</p>}

        {submitError && (
          <p role="alert" className="rounded-md bg-emergency-50 p-3 text-sm text-emergency-700">{submitError}</p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-md bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Submitting..." : "Submit application"}
        </button>
      </form>
    </div>
  );
}
