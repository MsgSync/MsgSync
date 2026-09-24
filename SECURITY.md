# Security Policy

## Supported Versions

We actively support the following versions of MsgSync with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take the security of MsgSync seriously. If you have discovered a security vulnerability, please report it to us privately.

### How to Report

**Please do NOT report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@msgsync.io** (or your-email@example.com)

Include the following information:

- Type of issue (e.g., buffer overflow, SQL injection, cross-site scripting, etc.)
- Full paths of source file(s) related to the manifestation of the issue
- The location of the affected source code (tag/branch/commit or direct URL)
- Any special configuration required to reproduce the issue
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the issue, including how an attacker might exploit it

### Response Timeline

- **Initial Response**: Within 48 hours, we'll acknowledge your report
- **Assessment**: Within 5 business days, we'll provide an assessment of the vulnerability
- **Fix Timeline**: We'll work to release a fix as quickly as possible, typically within 30 days
- **Disclosure**: Once a fix is available, we'll coordinate disclosure with you

## Security Best Practices

When using MsgSync, please follow these security best practices:

### API Keys and Secrets

- Never commit API keys or secrets to version control
- Use environment variables for sensitive configuration
- Rotate API keys regularly
- Use different keys for development, staging, and production

### Network Security

- Always use HTTPS in production
- Implement rate limiting on your endpoints
- Use webhook signature verification
- Keep your dependencies up to date

### Data Protection

- Encrypt sensitive data at rest and in transit
- Follow GDPR and other relevant data protection regulations
- Implement proper access controls
- Regularly audit access logs

### Code Security

- Keep MsgSync and all dependencies updated
- Run security audits regularly (`pnpm audit`)
- Use Content Security Policy headers
- Validate and sanitize all user inputs

## Security Updates

Security updates will be released as patch versions (e.g., 1.0.1, 1.0.2) and announced via:

- GitHub Security Advisories
- Release notes
- Email notifications (for registered users)
- Our security mailing list

## Bug Bounty Program

We currently do not have a formal bug bounty program, but we greatly appreciate responsible disclosure and will publicly acknowledge security researchers who help us improve MsgSync's security.

## Acknowledgments

We would like to thank the following security researchers for responsibly disclosing vulnerabilities:

- (List will be updated as reports are received and fixed)

## Contact

For any security-related questions or concerns, contact:

- Email: security@msgsync.io
- GPG Key: (Add if applicable)

---

Thank you for helping keep MsgSync and our users safe!
