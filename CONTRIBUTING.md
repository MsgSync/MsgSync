# Contributing to MsgSync

First off, thank you for considering contributing to MsgSync! It's people like you that make MsgSync such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [your-email@example.com](mailto:your-email@example.com).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues to avoid duplicates. When you create a bug report, include as many details as possible using our [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. Create an issue using our [feature request template](.github/ISSUE_TEMPLATE/feature_request.md) and provide detailed information.

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Make your changes** following our coding standards
3. **Add tests** if you've added code that should be tested
4. **Update documentation** if you've changed APIs
5. **Ensure tests pass** by running `pnpm test`
6. **Run linting** with `pnpm run lint`
7. **Submit your pull request** using our PR template

## Development Setup

### Prerequisites

- Node.js 16.x or higher
- pnpm
- Git
- (Add other prerequisites)

### Local Setup

```bash
# Clone your fork
git clone https://github.com/MsgSync/MsgSync.git

# Navigate to the directory
cd MsgSync

# Add upstream remote
git remote add upstream https://github.com/MsgSync/MsgSync.git

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start development server
pnpm run dev
```

## Coding Standards

### Style Guide

- Use 2 spaces for indentation
- Use semicolons
- Use single quotes for strings
- Add trailing commas
- Follow the existing code style

### Naming Conventions

- **Files**: Use kebab-case (e.g., `message-handler.js`)
- **Classes**: Use PascalCase (e.g., `MessageHandler`)
- **Functions**: Use camelCase (e.g., `sendMessage`)
- **Constants**: Use UPPER_SNAKE_CASE (e.g., `MAX_RETRY_COUNT`)

### Comments

- Write clear, concise comments
- Use JSDoc for function documentation
- Explain "why" not "what" in comments

```javascript
/**
 * Sends an SMS message with retry logic
 * @param {string} to - Recipient phone number
 * @param {string} message - Message content
 * @param {Object} options - Additional options
 * @returns {Promise<MessageResult>}
 */
async function sendMessage(to, message, options = {}) {
  // Implementation
}
```

## Testing

- Write unit tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow the Arrange-Act-Assert pattern

```javascript
describe("MessageHandler", () => {
  it("should send a message successfully", async () => {
    // Arrange
    const handler = new MessageHandler();
    const message = { to: "+1234567890", body: "Test" };

    // Act
    const result = await handler.send(message);

    // Assert
    expect(result.status).toBe("sent");
  });
});
```

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters
- Reference issues and pull requests

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Example:**

```
feat(platform): add retry logic for failed messages

Implement exponential backoff for message delivery retries.
This helps handle temporary provider outages gracefully.

Closes #123
```

## Branch Naming

- `feature/description` - For new features
- `fix/description` - For bug fixes
- `docs/description` - For documentation
- `refactor/description` - For refactoring

## Review Process

1. A maintainer will review your PR within 48 hours
2. Address any requested changes
3. Once approved, a maintainer will merge your PR
4. Your contribution will be included in the next release!

## Getting Help

- 💬 [GitHub Discussions](https://github.com/MsgSync/MsgSync/discussions)
- 📧 Email: [your-email@example.com](mailto:your-email@example.com)
- 📚 [Documentation](./docs/)

## Recognition

Contributors are recognized in:

- The [Contributors](https://github.com/MsgSync/MsgSync/graphs/contributors) page
- Release notes for significant contributions
- Our community showcase

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to MsgSync! 🎉
