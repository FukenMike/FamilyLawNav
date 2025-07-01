import { LegalCategory } from "@/types";

export const legalCategories: LegalCategory[] = [
  {
    id: "custody",
    name: "Child Custody",
    description: "Laws and regulations regarding child custody arrangements and disputes."
  },
  {
    id: "cps-dhr",
    name: "CPS/DHR",
    description: "Child Protective Services and Department of Human Resources policies and procedures."
  },
  {
    id: "foster-care",
    name: "Foster Care",
    description: "Foster care system regulations, requirements, and rights."
  },
  {
    id: "child-support",
    name: "Child Support",
    description: "Child support calculation, enforcement, and modification."
  },
  {
    id: "icpc",
    name: "ICPC",
    description: "Interstate Compact on the Placement of Children regulations and procedures."
  },
  {
    id: "visitation",
    name: "Visitation Rights",
    description: "Parental visitation rights, schedules, and enforcement."
  },
  {
    id: "adoption",
    name: "Adoption",
    description: "Adoption procedures, requirements, and legal processes."
  },
  {
    id: "paternity",
    name: "Paternity",
    description: "Establishing and challenging paternity, father's rights."
  },
  {
    id: "guardianship",
    name: "Guardianship",
    description: "Legal guardianship establishment and responsibilities."
  },
  {
    id: "divorce",
    name: "Divorce",
    description: "Divorce procedures and related family law issues."
  }
];

export const getCategoryById = (id: string): LegalCategory | undefined => {
  return legalCategories.find(category => category.id === id);
};

export const getCategoryByName = (name: string): LegalCategory | undefined => {
  return legalCategories.find(category => category.name.toLowerCase() === name.toLowerCase());
};
