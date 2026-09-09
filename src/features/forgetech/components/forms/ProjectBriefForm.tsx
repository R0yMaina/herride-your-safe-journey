import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  BUDGET_BANDS,
  PROJECT_NEEDS,
  projectBriefService,
  type NewProjectBrief,
} from "@/services/project-briefs";
import { Button } from "../ui/Button";
import { Reveal } from "../ui/Reveal";
import { SuccessState } from "./SuccessState";

const schema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(120),
  email: z.string().trim().email("That email doesn't look right").max(254),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  need: z.enum(PROJECT_NEEDS, { required_error: "Pick the closest option" }),
  details: z
    .string()
    .trim()
    .min(20, "A sentence or two is enough — what are you trying to build or fix?")
    .max(4000),
  // Optional on purpose: a required budget field costs more enquiries than it
  // filters, and the range is more useful once there is a conversation.
  budget: z.enum(BUDGET_BANDS).optional(),
});

type FormValues = z.infer<typeof schema>;

export function ProjectBriefForm() {
  const [submitted, setSubmitted] = useState(false);
  const [failed, setFailed] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", company: "", details: "" },
  });

  const need = watch("need");
  const budget = watch("budget");

  const onSubmit = handleSubmit(async (values) => {
    setFailed(false);
    const brief: NewProjectBrief = {
      name: values.name,
      email: values.email,
      company: values.company ? values.company : undefined,
      need: values.need,
      details: values.details,
      budget: values.budget,
    };

    try {
      await projectBriefService.submit(brief);
      setSubmitted(true);
    } catch {
      setFailed(true);
    }
  });

  if (submitted) {
    return (
      <SuccessState
        onReset={() => {
          reset();
          setSubmitted(false);
        }}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-10">
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Name" error={errors.name?.message} htmlFor="ft-name">
          <input
            id="ft-name"
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
            className={inputClass(Boolean(errors.name))}
            {...register("name")}
          />
        </Field>

        <Field label="Email" error={errors.email?.message} htmlFor="ft-email">
          <input
            id="ft-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
            className={inputClass(Boolean(errors.email))}
            {...register("email")}
          />
        </Field>
      </div>

      <Field label="Company / Organization" optional htmlFor="ft-company">
        <input
          id="ft-company"
          autoComplete="organization"
          className={inputClass(false)}
          {...register("company")}
        />
      </Field>

      <fieldset>
        <legend className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
          What do you need?
        </legend>
        <div className="mt-4 flex flex-wrap gap-2">
          {PROJECT_NEEDS.map((option) => (
            <label
              key={option}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ft-gold-deep",
                need === option
                  ? "border-ft-navy bg-ft-navy text-ft-cream"
                  : "border-ft-line bg-ft-cream text-ft-navy hover:border-ft-navy/30",
              )}
            >
              <input type="radio" value={option} className="sr-only" {...register("need")} />
              {option}
            </label>
          ))}
        </div>
        {errors.need && (
          <p role="alert" className="mt-3 text-sm text-ft-gold-deep">
            {errors.need.message}
          </p>
        )}
      </fieldset>

      <Field
        label="Tell us about your project"
        error={errors.details?.message}
        htmlFor="ft-details"
        hint="What is the problem, who is it for, and what does success look like? Rough is fine."
      >
        <textarea
          id="ft-details"
          rows={7}
          aria-invalid={Boolean(errors.details)}
          className={cn(inputClass(Boolean(errors.details)), "resize-y leading-relaxed")}
          {...register("details")}
        />
      </Field>

      <fieldset>
        <legend className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft">
          Budget{" "}
          <span className="normal-case tracking-normal text-ft-navy-soft/70">(optional)</span>
        </legend>
        <p className="mt-2 text-sm text-ft-navy-soft">
          A range helps us propose something realistic. Skip it if you'd rather talk first.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {BUDGET_BANDS.map((band) => (
            <label
              key={band}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                "has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ft-gold-deep",
                budget === band
                  ? "border-ft-navy bg-ft-navy text-ft-cream"
                  : "border-ft-line bg-ft-cream text-ft-navy hover:border-ft-navy/30",
              )}
            >
              <input type="radio" value={band} className="sr-only" {...register("budget")} />
              {band}
            </label>
          ))}
        </div>
        {budget && (
          <button
            type="button"
            onClick={() => setValue("budget", undefined)}
            className="mt-3 text-sm text-ft-navy-soft underline underline-offset-4 hover:text-ft-navy"
          >
            Clear budget
          </button>
        )}
      </fieldset>

      {failed && (
        <Reveal>
          <p
            role="alert"
            className="rounded-xl border border-ft-gold bg-ft-gold/10 px-5 py-4 text-sm text-ft-navy"
          >
            That didn't send. Check your connection and try again — or reach us on Instagram or
            TikTok if it keeps failing.
          </p>
        </Reveal>
      )}

      <div className="flex flex-col gap-4 border-t border-ft-line pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-ft-navy-soft">
          We read every enquiry ourselves. No automated sequences.
        </p>
        <Button type="submit" disabled={isSubmitting} arrow={!isSubmitting}>
          {isSubmitting ? "Sending…" : "Submit Project"}
        </Button>
      </div>
    </form>
  );
}

const inputClass = (invalid: boolean) =>
  cn(
    "w-full rounded-xl border bg-ft-cream px-4 py-3 text-base text-ft-navy transition-colors",
    "placeholder:text-ft-navy-soft/60 focus:outline-none focus:border-ft-navy",
    invalid ? "border-ft-gold-deep" : "border-ft-line",
  );

function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="text-[0.6875rem] font-semibold uppercase tracking-[0.18em] text-ft-navy-soft"
      >
        {label}
        {optional && (
          <span className="normal-case tracking-normal text-ft-navy-soft/70"> (optional)</span>
        )}
      </label>
      {hint && <p className="mt-2 text-sm text-ft-navy-soft">{hint}</p>}
      <div className="mt-3">{children}</div>
      {error && (
        <p role="alert" className="mt-2 text-sm text-ft-gold-deep">
          {error}
        </p>
      )}
    </div>
  );
}
