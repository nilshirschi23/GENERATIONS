import educationData from '../data/education.js';
let educationOptions = [];

export async function loadEducationOptions() {
  if (educationOptions.length > 0) return;
  educationOptions = educationData;
}

export function getEducationOptions() {
  return educationOptions;
}
