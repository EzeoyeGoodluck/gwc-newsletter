"use client";

import { useId, useRef, useState, type FormEvent } from "react";

import { ChevronRight, X } from "lucide-react";

type EmailSubscriptionStatus = "SUBSCRIBED" | "UNSUBSCRIBED" | "BOUNCED";

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
  initialData: EditMemberFormData & {
    subscriptionStatus?: EmailSubscriptionStatus;
  };
  subscriptionStatus?: EmailSubscriptionStatus;
  availableCategories: string[];
  readOnly?: boolean;
  onCancel: () => void;
  onSave: (data: Partial<EditMemberFormData>) => void | Promise<void>;
}

interface FieldInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  disabled?: boolean;
}

interface FieldSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  disabled?: boolean;
  description?: string;
}

const fieldClass =
  "w-full rounded-lg border border-gwc-border/50 bg-gwc-muted-bg px-4 py-3 text-[15px] text-gwc-navy outline-none focus:ring-2 focus:ring-gwc-navy/20 disabled:cursor-default disabled:bg-white disabled:text-gwc-text-body";

const FORM_FIELDS: (keyof EditMemberFormData)[] = [
  "fullName",
  "email",
  "phone",
  "dateOfBirth",
  "gender",
  "streetAddress",
  "city",
  "state",
  "postalCode",
  "country",
  "membershipType",
  "status",
  "joinDate",
  "renewalDate",
  "categories",
  "notes",
];

function normalizeStatus(value: string) {
  const status = value.trim().toLowerCase();

  if (status === "inactive") return "Inactive";
  if (status === "visitor") return "Visitor";

  return "Active";
}

function buildInitialForm(initialData: EditMemberFormData): EditMemberFormData {
  return {
    fullName: initialData.fullName ?? "",
    email: initialData.email ?? "",
    phone: initialData.phone ?? "",
    dateOfBirth: initialData.dateOfBirth ?? "",
    gender: initialData.gender ?? "",
    streetAddress: initialData.streetAddress ?? "",
    city: initialData.city ?? "",
    state: initialData.state ?? "",
    postalCode: initialData.postalCode ?? "",
    country: initialData.country ?? "",
    membershipType: initialData.membershipType ?? "",
    status: normalizeStatus(initialData.status ?? "Active"),
    joinDate: initialData.joinDate ?? "",
    renewalDate: initialData.renewalDate ?? "",
    categories: [...(initialData.categories ?? [])],
    notes: initialData.notes ?? "",
  };
}

function FieldInput({
  label,
  required = false,
  value,
  onChange,
  type = "text",
  disabled = false,
}: FieldInputProps) {
  const id = useId();

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[240px]">
      <label
        htmlFor={id}
        className="text-[13px] font-semibold tracking-wide text-gwc-text-body"
      >
        {label}
        {required && <span className="ml-1 text-red-600">*</span>}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </div>
  );
}

function FieldSelect({
  label,
  value,
  onChange,
  options,
  disabled = false,
  description,
}: FieldSelectProps) {
  const id = useId();
  const descriptionId = `${id}-description`;

  // Preserve existing saved values even when they are not
  // included in the standard options.
  const availableOptions = Array.from(
    new Set([...(value ? [value] : []), ...options])
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-[240px]">
      <label
        htmlFor={id}
        className="text-[13px] font-semibold tracking-wide text-gwc-text-body"
      >
        {label}
      </label>

      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-describedby={description ? descriptionId : undefined}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      >
        <option value="">Not specified</option>

        {availableOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>

      {description && (
        <p id={descriptionId} className="text-xs leading-5 text-gwc-text-muted">
          {description}
        </p>
      )}
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

function EditMemberForm({
  initialData,
  subscriptionStatus,
  availableCategories,
  readOnly = false,
  onCancel,
  onSave,
}: EditMemberPageProps) {
  const [baseline] = useState(() => buildInitialForm(initialData));

  const [data, setData] = useState<EditMemberFormData>(() =>
    buildInitialForm(initialData)
  );

  const [categoryInput, setCategoryInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const savingRef = useRef(false);

  const categoryListId = useId();
  const notesId = useId();

  const emailStatus = subscriptionStatus ?? initialData.subscriptionStatus;

  const isUnsubscribed = emailStatus === "UNSUBSCRIBED";

  const disabled = readOnly || saving;

  // Match the directory's display rule without replacing
  // the stored membership value in form state.
  const displayedStatus = isUnsubscribed ? "Inactive" : data.status;

  const update = <K extends keyof EditMemberFormData>(
    key: K,
    value: EditMemberFormData[K]
  ) => {
    if (readOnly || savingRef.current) return;

    setData((previous) => ({
      ...previous,
      [key]: value,
    }));

    setSaveError("");
  };

  const addCategory = (value: string) => {
    if (readOnly || savingRef.current) return;

    const trimmed = value.trim();

    if (trimmed && !data.categories.includes(trimmed)) {
      update("categories", [...data.categories, trimmed]);
    }

    setCategoryInput("");
  };

  const removeCategory = (value: string) => {
    if (readOnly || savingRef.current) return;

    update(
      "categories",
      data.categories.filter((category) => category !== value)
    );
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (readOnly || savingRef.current) return;

    let changes: Partial<EditMemberFormData> = {};

    for (const key of FORM_FIELDS) {
      // The inactive display override is not a membership edit.
      // Do not submit status while an unsubscribe overrides it.
      if (key === "status" && isUnsubscribed) {
        continue;
      }

      const changed =
        key === "categories"
          ? JSON.stringify(data.categories) !==
            JSON.stringify(baseline.categories)
          : data[key] !== baseline[key];

      if (changed) {
        changes = {
          ...changes,
          [key]: data[key],
        };
      }
    }

    savingRef.current = true;
    setSaving(true);
    setSaveError("");

    try {
      await onSave(changes);
    } catch {
      setSaveError(
        "The save result could not be confirmed. Check the member record before trying again."
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  function input(
    key: Exclude<keyof EditMemberFormData, "categories">,
    label: string,
    type = "text",
    required = false
  ) {
    return (
      <FieldInput
        label={label}
        type={type}
        required={required}
        value={data[key]}
        onChange={(value) => update(key, value)}
        disabled={disabled}
      />
    );
  }

  return (
    <div className="flex max-w-[936px] flex-col gap-8">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-gwc-text-muted">
          <span>Members</span>

          <ChevronRight aria-hidden="true" className="h-2.5 w-2.5" />

          <span>{initialData.fullName}</span>

          <ChevronRight aria-hidden="true" className="h-2.5 w-2.5" />

          <span className="font-medium text-gwc-navy">
            {readOnly ? "View Profile" : "Edit Record"}
          </span>
        </div>

        <h1 className="text-[32px] font-semibold tracking-tight text-gwc-navy">
          {readOnly ? "Member Profile" : "Edit Member Profile"}
        </h1>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-10 rounded-xl bg-white p-5 shadow-sm sm:p-8"
      >
        <section className="flex flex-col gap-6">
          <SectionHeader title="Personal Information" />

          <div className="flex flex-wrap gap-6">
            {input("fullName", "Full Name", "text", true)}

            {input("email", "Email Address", "email", true)}
          </div>

          <div className="flex flex-wrap gap-6">
            {input("phone", "Phone Number", "tel")}

            {input("dateOfBirth", "Date of Birth", "date")}

            <FieldSelect
              label="Gender"
              value={data.gender}
              onChange={(value) => update("gender", value)}
              options={["Female", "Male", "Prefer not to say"]}
              disabled={disabled}
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader title="Residential Address" />

          <div className="flex flex-wrap gap-6">
            {input("streetAddress", "Street Address")}
            {input("city", "City")}
          </div>

          <div className="flex flex-wrap gap-6">
            {input("state", "State / Region")}
            {input("postalCode", "Postal Code")}

            <FieldSelect
              label="Country"
              value={data.country}
              onChange={(value) => update("country", value)}
              options={["United States", "Canada", "United Kingdom", "Other"]}
              disabled={disabled}
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader title="Membership Details" />

          <div className="flex flex-wrap gap-6">
            <FieldSelect
              label="Membership Type"
              value={data.membershipType}
              onChange={(value) => update("membershipType", value)}
              options={["Regular Member", "Associate Member", "Visitor"]}
              disabled={disabled}
            />

            <FieldSelect
              label="Status"
              value={displayedStatus}
              onChange={(value) => {
                if (isUnsubscribed) return;

                update("status", value);
              }}
              options={["Active", "Inactive", "Visitor"]}
              disabled={disabled || isUnsubscribed}
              description={
                isUnsubscribed
                  ? `Shown as Inactive because this member unsubscribed from newsletters. Stored church membership: ${data.status}. Editing this profile will not resubscribe them.`
                  : undefined
              }
            />
          </div>

          <div className="flex flex-wrap gap-6">
            {input("joinDate", "Join Date", "date")}

            {input("renewalDate", "Renewal Date", "date")}
          </div>

          <div className="flex flex-col gap-3">
            <label
              htmlFor={categoryListId}
              className="text-[13px] font-semibold text-gwc-text-body"
            >
              Assigned Categories &amp; Ministry Groups
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {data.categories.map((category) => (
                <span
                  key={category}
                  className="flex items-center gap-1 rounded-md border border-gwc-border/50 bg-gwc-muted-bg px-3 py-1.5 text-[13px] font-semibold text-gwc-text-body"
                >
                  {category}

                  {!readOnly && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => removeCategory(category)}
                      aria-label={`Remove ${category} category`}
                      className="rounded p-1 disabled:opacity-50"
                    >
                      <X aria-hidden="true" className="h-2.5 w-2.5" />
                    </button>
                  )}
                </span>
              ))}

              {!readOnly && (
                <>
                  <input
                    id={categoryListId}
                    value={categoryInput}
                    disabled={saving}
                    onChange={(event) => setCategoryInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        addCategory(categoryInput);
                      }
                    }}
                    list={`${categoryListId}-options`}
                    placeholder="Add Category +"
                    className="w-40 rounded-md border border-dashed border-gwc-border/50 bg-gwc-muted-bg/50 px-3 py-1.5 text-[13px] font-semibold text-gwc-text-body outline-none disabled:opacity-50"
                  />

                  <datalist id={`${categoryListId}-options`}>
                    {Array.from(new Set(availableCategories)).map(
                      (category) => (
                        <option key={category} value={category} />
                      )
                    )}
                  </datalist>

                  <button
                    type="button"
                    disabled={saving || !categoryInput.trim()}
                    onClick={() => addCategory(categoryInput)}
                    className="rounded-md border border-gwc-border/50 px-3 py-1.5 text-xs font-semibold text-gwc-navy disabled:opacity-50"
                  >
                    Add
                  </button>
                </>
              )}

              {readOnly && data.categories.length === 0 && (
                <span className="text-sm text-gwc-text-muted">
                  No categories assigned.
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SectionHeader title="Internal Ministry Notes" />

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor={notesId}
              className="text-[13px] font-semibold text-gwc-text-body"
            >
              Comments / Pastoral Notes
            </label>

            <textarea
              id={notesId}
              value={data.notes}
              onChange={(event) => update("notes", event.target.value)}
              rows={4}
              disabled={disabled}
              className={`${fieldClass} resize-none py-4`}
            />
          </div>
        </section>

        {saveError && (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {saveError}
          </p>
        )}

        <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-gwc-border/30 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-gwc-border/50 px-6 py-3 text-sm font-semibold text-gwc-text-body hover:bg-gwc-muted-bg disabled:opacity-50"
          >
            {readOnly ? "Close" : "Cancel"}
          </button>

          {!readOnly && (
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-gwc-navy px-6 py-3 text-sm font-semibold text-white hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}

export function EditMemberPage(props: EditMemberPageProps) {
  // New initial profile data resets the form.
  // A subscription-only refresh leaves form edits intact.
  const formKey = JSON.stringify(buildInitialForm(props.initialData));

  return <EditMemberForm key={formKey} {...props} />;
}
