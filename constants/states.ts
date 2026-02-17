import { State } from "@/types";

export const states: State[] = [
  { id: "AL", name: "Alabama", abbreviation: "AL" },
  { id: "AK", name: "Alaska", abbreviation: "AK" },
  { id: "AZ", name: "Arizona", abbreviation: "AZ" },
  { id: "AR", name: "Arkansas", abbreviation: "AR" },
  { id: "CA", name: "California", abbreviation: "CA" },
  { id: "CO", name: "Colorado", abbreviation: "CO" },
  { id: "CT", name: "Connecticut", abbreviation: "CT" },
  { id: "DE", name: "Delaware", abbreviation: "DE" },
  { id: "FL", name: "Florida", abbreviation: "FL" },
  { id: "GA", name: "Georgia", abbreviation: "GA" },
  { id: "HI", name: "Hawaii", abbreviation: "HI" },
  { id: "ID", name: "Idaho", abbreviation: "ID" },
  { id: "IL", name: "Illinois", abbreviation: "IL" },
  { id: "IN", name: "Indiana", abbreviation: "IN" },
  { id: "IA", name: "Iowa", abbreviation: "IA" },
  { id: "KS", name: "Kansas", abbreviation: "KS" },
  { id: "KY", name: "Kentucky", abbreviation: "KY" },
  { id: "LA", name: "Louisiana", abbreviation: "LA" },
  { id: "ME", name: "Maine", abbreviation: "ME" },
  { id: "MD", name: "Maryland", abbreviation: "MD" },
  { id: "MA", name: "Massachusetts", abbreviation: "MA" },
  { id: "MI", name: "Michigan", abbreviation: "MI" },
  { id: "MN", name: "Minnesota", abbreviation: "MN" },
  { id: "MS", name: "Mississippi", abbreviation: "MS" },
  { id: "MO", name: "Missouri", abbreviation: "MO" },
  { id: "MT", name: "Montana", abbreviation: "MT" },
  { id: "NE", name: "Nebraska", abbreviation: "NE" },
  { id: "NV", name: "Nevada", abbreviation: "NV" },
  { id: "NH", name: "New Hampshire", abbreviation: "NH" },
  { id: "NJ", name: "New Jersey", abbreviation: "NJ" },
  { id: "NM", name: "New Mexico", abbreviation: "NM" },
  { id: "NY", name: "New York", abbreviation: "NY" },
  { id: "NC", name: "North Carolina", abbreviation: "NC" },
  { id: "ND", name: "North Dakota", abbreviation: "ND" },
  { id: "OH", name: "Ohio", abbreviation: "OH" },
  { id: "OK", name: "Oklahoma", abbreviation: "OK" },
  { id: "OR", name: "Oregon", abbreviation: "OR" },
  { id: "PA", name: "Pennsylvania", abbreviation: "PA" },
  { id: "RI", name: "Rhode Island", abbreviation: "RI" },
  { id: "SC", name: "South Carolina", abbreviation: "SC" },
  { id: "SD", name: "South Dakota", abbreviation: "SD" },
  { id: "TN", name: "Tennessee", abbreviation: "TN" },
  { id: "TX", name: "Texas", abbreviation: "TX" },
  { id: "UT", name: "Utah", abbreviation: "UT" },
  { id: "VT", name: "Vermont", abbreviation: "VT" },
  { id: "VA", name: "Virginia", abbreviation: "VA" },
  { id: "WA", name: "Washington", abbreviation: "WA" },
  { id: "WV", name: "West Virginia", abbreviation: "WV" },
  { id: "WI", name: "Wisconsin", abbreviation: "WI" },
  { id: "WY", name: "Wyoming", abbreviation: "WY" },
  { id: "DC", name: "District of Columbia", abbreviation: "DC" },
];

export const getStateByAbbreviation = (abbreviation: string): State | undefined => {
  return states.find(state => state.abbreviation === abbreviation);
};

export const getStateByName = (name: string): State | undefined => {
  return states.find(state => state.name.toLowerCase() === name.toLowerCase());
};
// TODO(PHASE-?): Implement this module fully
