# AGENTS.md - Project Documentation

## Project Overview

**Project Name:** api_password_kimi  
**Location:** `C:\Users\admin\Desktop\api_password_kimi`  
**Status:** Empty / Not Initialized  
**Last Updated:** 2026-03-24

This project directory is currently empty and has not been initialized with any source code, configuration files, or project structure.

## Current State

- **Source Files:** None
- **Configuration Files:** None (no pyproject.toml, package.json, Cargo.toml, etc.)
- **Documentation:** None (except this AGENTS.md file)
- **Dependencies:** None
- **Build System:** None

## Technology Stack

To be determined. Common options based on the project name "api_password_kimi":

| Category | Possible Technologies |
|----------|----------------------|
| Backend API | Python (FastAPI/Flask), Node.js (Express), Rust (Actix), Go |
| Authentication/Password | OAuth2, JWT, bcrypt, Argon2 |
| Database | PostgreSQL, MongoDB, Redis |
| AI Integration | Moonshot AI (Kimi) API |

## Project Initialization Guidelines

When initializing this project, consider:

1. **Choose a primary language and framework** based on requirements
2. **Create standard project structure** following language conventions
3. **Add dependency management** (pip + requirements.txt/pyproject.toml for Python, npm/yarn + package.json for Node.js, Cargo.toml for Rust, etc.)
4. **Set up version control** with `.gitignore`
5. **Add configuration management** for different environments (dev/staging/prod)
6. **Implement testing framework** from the start
7. **Add CI/CD pipeline** configuration

## Recommended Directory Structure (Example for Python API)

```
api_password_kimi/
├── src/
│   └── api_password_kimi/
│       ├── __init__.py
│       ├── main.py
│       ├── config.py
│       ├── auth/
│       │   ├── __init__.py
│       │   └── password.py
│       └── api/
│           ├── __init__.py
│           └── routes.py
├── tests/
│   ├── __init__.py
│   └── test_auth.py
├── docs/
├── scripts/
├── .github/
│   └── workflows/
├── .env.example
├── .gitignore
├── pyproject.toml
├── README.md
└── AGENTS.md (this file)
```

## Development Conventions (To Be Defined)

Once the project is initialized, document here:
- Code style guidelines (PEP 8, StandardJS, etc.)
- Commit message conventions
- Branch naming conventions
- Code review process

## Build and Test Commands (To Be Defined)

To be added based on chosen technology stack.

## Security Considerations

Given the project name suggests password/API functionality:

- **Never commit secrets** (API keys, passwords, tokens) to version control
- Use environment variables or secure secret management
- Implement proper password hashing (bcrypt, Argon2, PBKDF2)
- Use HTTPS for all API communications
- Implement rate limiting to prevent brute force attacks
- Follow OWASP API Security Top 10 guidelines
- Regularly audit dependencies for vulnerabilities

## AI Integration Notes

The project name suggests potential integration with Kimi AI (Moonshot AI). If so:
- Store API keys securely
- Implement proper error handling for API failures
- Consider rate limits and usage quotas
- Cache responses where appropriate
- Handle sensitive data appropriately when sending to AI services

## Next Steps

1. Define project requirements and scope
2. Choose technology stack
3. Initialize project with appropriate tooling
4. Set up development environment
5. Update this AGENTS.md with actual project details

---

*This file was created by an AI coding agent during initial project exploration. Update this file as the project evolves.*
