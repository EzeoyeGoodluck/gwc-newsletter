"use client";

import { useState } from "react";
import { ChevronRight, X } from "lucide-react";

interface EditMemberFormData {
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  membershipType: string;
  status: string;
  joinDate: string;
  renewalDate: string;
  categories: string[];
  notes: string;
}

interface EditMemberPageProps {
  initialData: EditMemberFormData;
  availableCategories: string[];
  readOnly?: boolean;
  onCancel: () => void;
  onSave: (data: EditMemberFormData) => void;
}

function FieldInput({
  label,
  required,
  value,
  onChange,
  type = "text",
  disabled,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
      <label className="text-[13px] font-semibold text-gwc-text-body tracking-wide">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 disabled:bg-white disabled:text-gwc-text-body disabled:cursor-default"
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
      <label className="text-[13px] font-semibold text-gwc-text-body tracking-wide">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="border border-gwc-border/50 rounded-lg px-4 py-3 text-[15px] text-gwc-navy bg-gwc-muted-bg focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 disabled:bg-white disabled:text-gwc-text-body disabled:cursor-default"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-gwc-navy">{title}</h2>
      <div className="h-px bg-gwc-border/30" />
    </div>
  );
}

export function EditMemberPage({
  initialData,
  availableCategories,
  readOnly = false,
  onCancel,
  onSave,
}: EditMemberPageProps) {
  const [data, setData] = useState<EditMemberFormData>(initialData);
  const [categoryInput, setCategoryInput] = useState("");

  const update = <K extends keyof EditMemberFormData>(
    key: K,
    value: EditMemberFormData[K]
  ) => {
    if (readOnly) return;
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const addCategory = (value: string) => {
    if (readOnly) return;
    const trimmed = value.trim();
    if (trimmed && !data.categories.includes(trimmed)) {
      update("categories", [...data.categories, trimmed]);
    }
    setCategoryInput("");
  };

  const removeCategory = (value: string) => {
    if (readOnly) return;
    update(
      "categories",
      data.categories.filter((c) => c !== value)
    );
  };

  return (
    <div className="flex flex-col gap-8 max-w-[936px]">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5 text-[13px] text-gwc-text-muted">
          <span>Members</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span>{initialData.fullName}</span>
          <ChevronRight className="h-2.5 w-2.5" />
          <span className="text-gwc-navy font-medium">
            {readOnly ? "View Profile" : "Edit Record"}
          </span>
        </div>
        <h1 className="text-[32px] font-semibold text-gwc-navy tracking-tight">
          {readOnly ? "Member Profile" : "Edit Member Profile"}
        </h1>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col gap-10">
        <div className="flex flex-col gap-6">
          <SectionHeader title="Personal Information" />
          <div className="flex gap-6 flex-wrap">
            <FieldInput
              label="Full Name"
              required
              value={data.fullName}
              onChange={(v) => update("fullName", v)}
              disabled={readOnly}
            />
            <FieldInput
              label="Email Address"
              required
              type="email"
              value={data.email}
              onChange={(v) => update("email", v)}
              disabled={readOnly}
            />
          </div>
          <div className="flex gap-6 flex-wrap">
            <FieldInput
              label="Phone Number"
              value={data.phone}
              onChange={(v) => update("phone", v)}
              disabled={readOnly}
            />
            <FieldInput
              label="Date of Birth"
              type="date"
              value={data.dateOfBirth}
              onChange={(v) => update("dateOfBirth", v)}
              disabled={readOnly}
            />
            <FieldSelect
              label="Gender"
              value={data.gender}
              onChange={(v) => update("gender", v)}
              options={["Female", "Male", "Prefer not to say"]}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <SectionHeader title="Residential Address" />
          <div className="flex gap-6 flex-wrap">
            <FieldInput
              label="Street Address"
              value={data.streetAddress}
              onChange={(v) => update("streetAddress", v)}
              disabled={readOnly}
            />
            <FieldInput
              label="City"
              value={data.city}
              onChange={(v) => update("city", v)}
              disabled={readOnly}
            />
          </div>
          <div className="flex gap-6 flex-wrap">
            <FieldInput
              label="State / Region"
              value={data.state}
              onChange={(v) => update("state", v)}
              disabled={readOnly}
            />
            <FieldInput
              label="Postal Code"
              value={data.postalCode}
              onChange={(v) => update("postalCode", v)}
              disabled={readOnly}
            />
            <FieldSelect
              label="Country"
              value={data.country}
              onChange={(v) => update("country", v)}
              options={["United States", "Canada", "United Kingdom", "Other"]}
              disabled={readOnly}
            />
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <SectionHeader title="Membership Details" />
          <div className="flex gap-6 flex-wrap">
            <FieldSelect
              label="Membership Type"
              value={data.membershipType}
              onChange={(v) => update("membershipType", v)}
              options={["Regular Member", "Associate Member", "Visitor"]}
              disabled={readOnly}
            />
            <FieldSelect
              label="Status"
              value={data.status}
              onChange={(v) => update("status", v)}
              options={["Active", "Inactive", "Visitor"]}
              disabled={readOnly}
            />
          </div>
          <div className="flex gap-6 flex-wrap">
            <FieldInput
              label="Join Date"
              type="date"
              value={data.joinDate}
              onChange={(v) => update("joinDate", v)}
              disabled={readOnly}
            />
            <FieldInput
              label="Renewal Date"
              type="date"
              value={data.renewalDate}
              onChange={(v) => update("renewalDate", v)}
              disabled={readOnly}
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Assigned Categories & Ministry Groups
            </label>
            <div className="flex flex-wrap gap-2 items-center">
              {data.categories.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1 bg-gwc-muted-bg border border-gwc-border/50 text-gwc-text-body text-[13px] font-semibold px-3 py-1.5 rounded-md"
                >
                  {c}
                  {!readOnly && (
                    <button onClick={() => removeCategory(c)}>
                      <X className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}
              {!readOnly && (
                <>
                  <input
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCategory(categoryInput);
                      }
                    }}
                    list="edit-member-categories"
                    placeholder="Add Category +"
                    className="border border-dashed border-gwc-border/50 text-gwc-text-body text-[13px] font-semibold px-3 py-1.5 rounded-md bg-gwc-muted-bg/50 focus:outline-none w-40"
                  />
                  <datalist id="edit-member-categories">
                    {availableCategories.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <SectionHeader title="Internal Ministry Notes" />
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-gwc-text-body">
              Comments / Pastoral Notes
            </label>
            <textarea
              value={data.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              disabled={readOnly}
              className="border border-gwc-border/50 rounded-lg px-4 py-4 text-[15px] text-gwc-navy bg-gwc-muted-bg resize-none focus:outline-none focus:ring-2 focus:ring-gwc-navy/20 disabled:bg-white disabled:text-gwc-text-body disabled:cursor-default"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 border-t border-gwc-border/30 pt-6">
          <button
            onClick={onCancel}
            className="px-6 py-3 rounded-lg text-sm font-semibold text-gwc-text-body border border-gwc-border/50 hover:bg-gwc-muted-bg"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>
          {!readOnly && (
            <button
              onClick={() => onSave(data)}
              className="px-6 py-3 rounded-lg text-sm font-semibold bg-gwc-navy text-white hover:brightness-110"
            >
              Save Changes
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
