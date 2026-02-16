import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatIndianMobile(input) {
  if (!input) return ''
  let digits = input.replace(/\D/g, '')

  // Remove leading zeros
  digits = digits.replace(/^0+/, '')

  // Check if it already starts with 91
  if (digits.startsWith('91') && digits.length > 10) {
    return `+${digits}`
  }

  return `+91${digits}`
}
