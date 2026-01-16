# Claude Code Setup Summary

This repository has been optimized for working with Claude Code. Here's what was added and how to use it.

## ✅ What Was Added

### 1. Core Documentation
- **`CLAUDE.md`** - Comprehensive guide for Claude covering architecture, commands, patterns, and rules
- **`docs/INDEX_FOR_CLAUDE.md`** - Quick reference index for fast navigation
- **`docs/claude-optimization-recommendations.md`** - Full recommendations document with implementation plan

### 2. VSCode Configuration
- **`.vscode/extensions.json`** - Recommended extensions for the team
- **`.vscode/settings.json`** - Enhanced with TypeScript, Tailwind, formatting, and search settings

### 3. Claude-Specific Config
- **`.claude/config.json`** - Context files and ignore patterns for Claude Code CLI

## 🚀 How to Use

### For Developers Using Claude Code (CLI)

1. **Claude will automatically read:**
   - `CLAUDE.md` - Main guide
   - `AGENTS.md` - Global runbook
   - Architecture and development docs
   - The quick index

2. **Key commands to know:**
   ```bash
   # Development
   pnpm --filter @apps/cms dev
   pnpm typecheck:watch

   # Testing (always scoped!)
   pnpm --filter @acme/ui test
   pnpm test:affected

   # Building
   pnpm build
   pnpm build:cms-deps
   ```

3. **Claude will follow these rules:**
   - Always read files before editing
   - Respect layer hierarchy (atoms → molecules → organisms → templates → pages)
   - Run scoped tests, not workspace-wide
   - Only commit when explicitly asked
   - Make minimal, targeted changes

### For Developers Using VSCode

1. **Install recommended extensions:**
   - When you open the project, VSCode will prompt you to install recommended extensions
   - Click "Install All" or review them individually

2. **Settings are pre-configured:**
   - Format on save enabled
   - ESLint auto-fix on save
   - TypeScript workspace version
   - Tailwind IntelliSense
   - Optimized search and file exclusions

3. **Use the documentation:**
   - Start with `docs/INDEX_FOR_CLAUDE.md` for quick reference
   - Check `CLAUDE.md` for detailed guidance
   - Review architecture docs before making changes

## 📚 Key Documents

### Must Read (Priority 1)
1. [`CLAUDE.md`](CLAUDE.md) - Main assistant guide
2. [`docs/INDEX_FOR_CLAUDE.md`](docs/INDEX_FOR_CLAUDE.md) - Quick navigation
3. [`docs/architecture.md`](docs/architecture.md) - Layer hierarchy and rules

### Important Context (Priority 2)
4. [`AGENTS.md`](AGENTS.md) - Global repo runbook
5. [`README.md`](README.md) - Project overview
6. [`docs/development.md`](docs/development.md) - Workflows and CI

### Domain-Specific (As Needed)
- CMS: `docs/cms-plan/`, `docs/cms.md`
- UI: `docs/architecture.md`, `packages/ui/`
- Platform: `docs/persistence.md`, `packages/platform-core/`

## 🎯 Quick Start for Claude

When working on a task:

1. **Understand Context:**
   ```
   - Read CLAUDE.md for rules
   - Check docs/INDEX_FOR_CLAUDE.md for relevant docs
   - Read architecture.md for layer rules
   ```

2. **Before Coding:**
   ```
   - Read existing code first
   - Check similar patterns
   - Verify layer hierarchy
   ```

3. **During Work:**
   ```
   - Use Edit for existing files
   - Use TodoWrite for multi-step tasks
   - Run scoped tests frequently
   - Check types: pnpm typecheck
   ```

4. **After Changes:**
   ```
   - Run tests: pnpm --filter <package> test
   - Type check: pnpm typecheck
   - Only commit if explicitly asked
   ```

## 🔍 Common Scenarios

### "I need to create a new component"
→ See `CLAUDE.md` → "Common Tasks" → "Create a Component"
→ Check layer (atom/molecule/organism/template)
→ Look at similar components
→ Create with tests and stories

### "I need to fix a bug"
→ See `CLAUDE.md` → "Common Tasks" → "Fix a Bug"
→ Reproduce issue
→ Read relevant code
→ Make minimal fix
→ Add regression test

### "I need to add a feature"
→ Check `docs/architecture.md` for correct location
→ Read `docs/INDEX_FOR_CLAUDE.md` for domain docs
→ Follow existing patterns
→ Add tests
→ Update docs if needed

### "Where does this code belong?"
→ Use decision tree in `docs/INDEX_FOR_CLAUDE.md`
→ Check package layering in `docs/architecture.md`
→ When in doubt, ask!

## ⚡ Pro Tips

### For Claude
1. **Context is cached** - Essential docs are in `.claude/config.json`
2. **Use the index** - `docs/INDEX_FOR_CLAUDE.md` is your quick reference
3. **Read before edit** - Always use Read tool first
4. **Scoped tests only** - Never run `pnpm test` unless asked
5. **Follow patterns** - Look at existing code first

### For Developers
1. **Reference CLAUDE.md** - Great onboarding doc for team too
2. **Update docs** - Keep INDEX_FOR_CLAUDE.md current
3. **Add patterns** - Document new patterns in CLAUDE.md
4. **Review changes** - Claude follows the documented rules

## 📈 What's Next?

### Phase 1: ✅ Completed
- [x] Create CLAUDE.md
- [x] Create .claude/config.json
- [x] Enhance .vscode/settings.json
- [x] Create .vscode/extensions.json
- [x] Create docs/INDEX_FOR_CLAUDE.md
- [x] Create comprehensive recommendations

### Phase 2: Optional Future Enhancements
See `docs/claude-optimization-recommendations.md` for:
- [ ] Claude prompt templates (`.claude/prompts/`)
- [ ] Helper scripts (`scripts/claude-helpers/`)
- [ ] Additional troubleshooting docs
- [ ] VSCode tasks configuration

## 🛠️ Maintenance

### Monthly Review
- Update CLAUDE.md with new patterns
- Refresh INDEX_FOR_CLAUDE.md with new docs
- Review .claude/config.json context files

### After Major Changes
- Update architecture docs if layers change
- Update troubleshooting guide with new issues
- Add new patterns to CLAUDE.md

## 📞 Support

### Questions About Setup?
- Check `docs/claude-optimization-recommendations.md` for detailed explanations
- Review individual files for inline documentation
- Ask team members or raise an issue

### Want to Extend?
- See Phase 2 and Phase 3 in `docs/claude-optimization-recommendations.md`
- Add new patterns to CLAUDE.md
- Create additional prompt templates in `.claude/prompts/`

## 🎉 Benefits

### For Claude
- ✅ Clear architectural guidance
- ✅ Fast navigation via index
- ✅ Explicit rules and patterns
- ✅ Pre-configured context
- ✅ Troubleshooting help

### For Developers
- ✅ Better AI assistance
- ✅ Consistent patterns
- ✅ Improved onboarding docs
- ✅ Clear conventions
- ✅ Optimized VSCode setup

### For the Team
- ✅ Reduced back-and-forth
- ✅ Fewer architectural violations
- ✅ Better code consistency
- ✅ Faster iterations
- ✅ Living documentation

---

**Last Updated:** 2026-01-12

**Next Steps:** Start using Claude with this setup and provide feedback for improvements!
