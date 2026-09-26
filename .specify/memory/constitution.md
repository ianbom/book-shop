<!--
Sync Impact Report
Version change: Unset scaffold -> 1.0.0 (initial constitution)
Modified principles: None; initial principles established from observed conventions
Added sections: Repository Constraints; Development Workflow
Removed sections: None
Follow-up TODOs: Confirm original ratification date
-->
# Book Shop Constitution

## Core Principles

### I. Preserve Existing Architecture and Behavior
Implement features within the existing Laravel, Inertia, and React application structure. Preserve
existing routes, interfaces, and behavior unless explicitly changed. Reuse established controllers,
services, models, resources, components, hooks, and utilities. Avoid unrelated refactors to retain
compatibility with the existing application.

### II. Follow Established Backend and Frontend Patterns
Keep routes in `routes/`, HTTP controllers and Form Requests under `app/Http/`, business operations
in `app/Services/`, entities in `app/Models/`, and serialized props in `app/Http/Resources/`.
Render pages through Inertia. Keep React TypeScript pages, components, layouts, hooks, shared
utilities, generated route helpers, and types in their existing `resources/js/` directories.
Follow neighboring naming and coding style; reuse existing UI components and dependencies.
PHP classes use StudlyCase and concern-based namespaces; class suffixes reflect roles such as
`Controller`, `Request`, `Service`, and `Resource`. Frontend filenames use the existing lowercase
directory/file pattern, React components use PascalCase, and route names use dotted segments.

### III. Validate Inputs and Preserve Data Integrity
Validate untrusted request data with Laravel Form Requests and use validated data for writes.
Use existing Eloquent relationships, enums, and database constraints. Make schema changes through
Laravel migrations. Keep related writes atomic with transactions where consistency is needed;
retain established inventory/order locking and integrity safeguards. These rules prevent invalid
input and partial or conflicting state changes.

### IV. Preserve Authentication and Error Contracts
Retain Fortify authentication and existing route middleware, including `auth` and `verified` where
applied. Do not assume an unobserved role or policy system; preserve existing access behavior
unless authorization changes are requested. Use Laravel validation and HTTP exceptions, Inertia
validation errors, and established flash/toast patterns rather than parallel error mechanisms.

### V. Verify Changes and Keep Dependencies Minimal
Add or update focused tests in the existing `tests/Feature/` or `tests/Unit/` structure for changed
behavior; reuse factories and `RefreshDatabase` where appropriate. Existing tests must continue
to pass. Run relevant configured lint, static-analysis, TypeScript, and test checks. Prefer
installed framework, package, and project utilities; add no dependency when an existing solution
suffices.

## Repository Constraints

- Backend: Laravel routes, controllers, Form Requests, services, Eloquent models, API resources,
  migrations, factories, seeders, and PHP enums. Preserve these observed boundaries.
- Frontend: React TypeScript via Inertia, Vite, Tailwind CSS, shared UI components, typed props,
  route helpers, and existing form/error patterns.
- Authentication: Fortify account flows; admin routes grouped behind `auth` and `verified`.
  No separate role or policy convention was observed.
- Database: Schema changes MUST use Laravel migrations; preserve data and existing constraints.
- Dependencies: Reuse packages and scripts in `composer.json` and `package.json`; avoid new
  packages when installed solutions suffice.

## Development Workflow

- Locate the closest existing implementation and follow its naming, formatting, and layering.
- Add focused feature or unit tests using the existing Pest/PHPUnit, factory, and database patterns.
- Run relevant focused tests and configured quality checks; never refactor unrelated code.
- Review affected route access, validation failures, database effects, Inertia props, and frontend
  errors before changing their contracts.

## Governance

This constitution governs feature work alongside established repository conventions. Amendments
require an explicit rationale and review of affected conventions. Record the last-amended date in
ISO format. Increment MAJOR for incompatible governance changes, MINOR for new or materially
expanded requirements, and PATCH for clarifications. Review changes for compatibility, migration
use, validation, authorization, and test coverage. Confirm the original adoption date before
replacing the ratification TODO.

**Version**: 1.0.0 | **Ratified**: TODO(RATIFICATION_DATE): confirm original adoption date | **Last Amended**: 2026-09-23
