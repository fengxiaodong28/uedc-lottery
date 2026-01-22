<!--
Sync Impact Report:
===================
Version change: 0.0.0 → 1.0.0
Modified principles: N/A (initial version)
Added sections:
  - Core Principles (5 principles)
  - Quality Standards
  - Development Workflow
  - Governance
Removed sections: N/A
Templates requiring updates:
  ✅ plan-template.md - Constitution Check section reviewed (no updates needed)
  ✅ spec-template.md - Requirements alignment reviewed (no updates needed)
  ✅ tasks-template.md - Task categorization reviewed (no updates needed)
Follow-up TODOs: None
-->

# Lucky Lottery Constitution

## Core Principles

### I. Code Quality

All code MUST meet these non-negotiable standards:

- **Readability First**: Code is written for humans first, machines second. Self-documenting code preferred over comments where possible.
- **Type Safety**: Strong typing MUST be used where available. No `any` types without documented justification.
- **Linting Enforced**: All code MUST pass linting rules before commit. Zero tolerance for lint warnings in production code.
- **Code Review Required**: All changes MUST undergo peer review. No self-merge to main branch.
- **SOLID Principles**: Code MUST follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles.
- **DRY Enforcement**: No duplication of three or more lines. Extract shared logic immediately.

**Rationale**: High code quality reduces bugs, enables faster feature development, and reduces onboarding time for new developers.

### II. Testing Standards

Testing is a REQUIREMENT, not an option:

- **Test Coverage Minimum**: 80% code coverage REQUIRED for all new code. Critical paths MUST have 100% coverage.
- **Test Pyramid Balance**: 70% unit tests, 20% integration tests, 10% end-to-end tests.
- **Tests First**: For complex features, tests MUST be written before implementation (TDD). For simple changes, tests MUST accompany the PR.
- **Independent Tests**: Each test MUST run in isolation. No shared state between tests.
- **Meaningful Assertions**: Tests MUST verify behavior, not implementation details.
- **Flaky Tests Zero Tolerance**: Flaky tests MUST be fixed or removed within 24 hours of detection.

**Rationale**: Comprehensive testing prevents regressions, enables confident refactoring, and serves as living documentation.

### III. User Experience Consistency

User experience MUST be consistent across all touchpoints:

- **Design System Adherence**: All UI components MUST use the established design system. Custom styles MUST be exceptions, not the rule.
- **Responsive by Default**: All features MUST work seamlessly on mobile, tablet, and desktop viewports.
- **Accessibility Compliance**: All features MUST meet WCAG 2.1 AA standards. Keyboard navigation, screen reader support, and color contrast requirements are MANDATORY.
- **Loading States**: Users MUST receive clear feedback during all operations longer than 200ms.
- **Error Handling**: Errors MUST be presented in user-friendly language with actionable next steps. No stack traces to end users.
- **Performance Perceived**: Interface MUST feel responsive. Perceived performance is as important as actual performance.

**Rationale**: Consistent UX builds user trust, reduces support burden, and ensures accessibility for all users.

### IV. Performance Requirements

Performance is a feature, not an afterthought:

- **Response Time Targets**: API responses MUST complete within 200ms (p95). UI updates MUST render within 16ms (60fps).
- **Bundle Size Limits**: JavaScript bundles MUST NOT exceed 200KB gzipped for initial load. Code splitting REQUIRED for larger applications.
- **Database Query Limits**: No N+1 queries permitted. Query complexity MUST be indexed and optimized.
- **Memory Constraints**: Applications MUST not exceed 500MB memory footprint under normal load.
- **Monitoring Required**: Performance metrics MUST be monitored and alerted. Degradation triggers immediate investigation.
- **Progressive Enhancement**: Core functionality MUST work without JavaScript. Enhanced features layered on top.

**Rationale**: Performance directly impacts user engagement, conversion rates, and infrastructure costs.

### V. Security & Privacy

Security is foundational to all development:

- **Input Validation**: ALL user input MUST be validated, sanitized, and parameterized. No trust in client-side validation.
- **Principle of Least Privilege**: Services and users MUST have minimum required permissions only.
- **Secrets Management**: No secrets in code or environment files. Use secure secret management systems.
- **Dependency Hygiene**: Dependencies MUST be scanned for vulnerabilities. High/Critical CVEs block deployment.
- **Audit Trail**: All state changes MUST be logged with user context and timestamp.
- **Privacy by Design**: User data MUST be minimized, encrypted at rest and in transit, and deletable upon request.

**Rationale**: Security breaches can destroy user trust and have legal consequences. Prevention is far cheaper than remediation.

## Quality Standards

### Code Review Checklist

Every pull request MUST verify:

- [ ] Tests pass (including new tests for the change)
- [ ] Linting passes with zero warnings
- [ ] No commented-out code
- [ ] No console.log or debug statements
- [ ] Documentation updated (if applicable)
- [ ] Accessibility verified (if UI change)
- [ ] Performance impact assessed
- [ ] Security implications considered

### Definition of Done

A feature is complete ONLY when:

- All acceptance criteria met
- Tests written and passing
- Code reviewed and approved
- Documentation updated
- Accessibility verified
- Performance validated
- Security reviewed (if applicable)
- Deployed to staging for validation

## Development Workflow

### Branch Strategy

- `main`: Production-ready code only. Protected branch requiring PR and approval.
- `develop`: Integration branch for features. Must always be deployable.
- `feature/*`: Short-lived feature branches. Deleted after merge.
- `bugfix/*`: Short-lived bug fix branches. Deleted after merge.
- `hotfix/*`: Emergency production fixes. Bypass normal process but require review.

### Commit Standards

- Commit messages MUST follow conventional commits format: `type(scope): description`
- Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`
- Commits MUST be atomic—one logical change per commit
- No WIP commits in shared branches

### Release Process

1. Create release branch from `develop`
2. Update version number
3. Update CHANGELOG.md
4. Tag release
5. Merge to `main` and back to `develop`
6. Deploy to production

## Governance

### Amendment Process

Constitution amendments require:

1. Proposal document with rationale and impact analysis
2. Team review and discussion period (minimum 1 week)
3. Majority approval from core maintainers
4. Migration plan for existing code
5. Updated documentation and templates

### Version Policy

- MAJOR: Principle removal or redefinition breaking backward compatibility
- MINOR: New principle added or material expansion of existing guidance
- PATCH: Clarifications, wording improvements, non-semantic changes

### Compliance Review

- All pull requests MUST verify compliance with applicable principles
- Violations MUST be explicitly documented with justification
- Chronic non-compliance triggers architecture review
- Complexity beyond constitutional norms requires explicit approval and documentation

### Living Document

This constitution evolves with the project. Suggestions for improvements are encouraged. When in doubt, favor simplicity and clarity over comprehensive coverage.

**Version**: 1.0.0 | **Ratified**: 2026-01-20 | **Last Amended**: 2026-01-20
