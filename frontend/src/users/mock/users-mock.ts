import type { ManagedUser } from "@/api/types";

/**
 * PROTOTYPE FIXTURES — controlled sample accounts used to demonstrate the
 * User Management interface. These are NOT real organizational users: no
 * identity service, database, or directory sync exists in this codebase.
 * Every record is flagged `prototype: true` and is served exclusively through
 * the service boundary in `@/api/workspace-service`.
 */
export const prototypeManagedUsers: ManagedUser[] = [];

/** Access-scope vocabulary offered by the create/edit forms. */
export const prototypeAccessScopeVocabulary = [
  "General Knowledge",
  "Engineering Knowledge",
  "Product Knowledge",
  "Marketing Knowledge",
  "Sales Knowledge",
  "Finance Knowledge",
  "Security Knowledge",
  "Operations Knowledge",
  "All Knowledge",
];

/** Department vocabulary offered by the create/edit forms. */
export const prototypeDepartmentVocabulary = [
  "Engineering",
  "Product",
  "Marketing",
  "Sales",
  "Finance",
  "Operations",
  "IT/Security",
  "People",
];
