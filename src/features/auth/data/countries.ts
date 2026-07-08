export interface CountryOption {
  readonly code: string;
  readonly name: string;
  readonly dialCode: string;
}

export const COUNTRIES: readonly CountryOption[] = [
  { code: "KE", name: "Kenya", dialCode: "+254" },
  { code: "NG", name: "Nigeria", dialCode: "+234" },
  { code: "ZA", name: "South Africa", dialCode: "+27" },
  { code: "GH", name: "Ghana", dialCode: "+233" },
  { code: "UG", name: "Uganda", dialCode: "+256" },
  { code: "TZ", name: "Tanzania", dialCode: "+255" },
  { code: "RW", name: "Rwanda", dialCode: "+250" },
  { code: "EG", name: "Egypt", dialCode: "+20" },
  { code: "MA", name: "Morocco", dialCode: "+212" },
  { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
  { code: "GB", name: "United Kingdom", dialCode: "+44" },
  { code: "US", name: "United States", dialCode: "+1" },
];