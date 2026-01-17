# Contributing to Farsi Root Word Learner

Thank you for your interest in contributing! This document provides guidelines and instructions for contributing to the project.

## Ways to Contribute

### 1. Expand the Dictionary

The dictionary currently has 5 example roots. Help us reach 500!

**What you need:**
- Knowledge of Persian/Farsi language
- Understanding of Arabic root system
- Ability to identify common derivatives

**How to contribute:**
1. Open `data/farsi-roots.json`
2. Add new root entries following the existing format
3. Include 3-5 common derivatives per root
4. Provide accurate meanings and parts of speech
5. Categorize roots appropriately

**Example entry:**
```json
{
  "id": 6,
  "root": "ر-س-م",
  "rootLatin": "r-s-m",
  "meaning": "to draw, to write",
  "category": "art",
  "derivatives": [
    {
      "word": "رسم",
      "latin": "rasm",
      "meaning": "custom, drawing",
      "pos": "noun"
    },
    {
      "word": "رسام",
      "latin": "rassâm",
      "meaning": "painter, artist",
      "pos": "noun"
    }
  ]
}
```

### 2. Improve Code Quality

**Areas for improvement:**
- Performance optimization
- Better error handling
- Improved pattern matching
- Enhanced language detection
- Code documentation

**Guidelines:**
- Follow existing code style
- Add comments for complex logic
- Test your changes thoroughly
- Keep functions focused and small

### 3. Fix Bugs

**Before reporting a bug:**
1. Check if it's already reported in Issues
2. Test in multiple browsers if possible
3. Provide steps to reproduce
4. Include browser version and OS

**Bug report template:**
```
**Bug Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Step one
2. Step two
3. ...

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120 / Firefox 121
- OS: Windows 11 / macOS 14
- Extension version: 1.0.0
```

### 4. Add New Languages

The extension is designed for multi-language support. You can add support for:
- Arabic
- Urdu
- Turkish
- Other languages with root systems

**Steps:**
1. Create a new dictionary file: `data/[language]-roots.json`
2. Implement language-specific detection in `utils/language-detector.js`
3. Add or adapt matching logic in `utils/[language]-matcher.js`
4. Update UI for language selection
5. Add language-specific tests

See `docs/ADDING_LANGUAGES.md` for detailed instructions.

### 5. Improve UI/UX

**Design contributions welcome:**
- Better tooltip layouts
- More color themes
- Accessibility improvements
- Mobile-friendly adaptations
- Icon designs

**Design guidelines:**
- Keep it simple and unobtrusive
- Ensure readability
- Support dark mode
- Follow accessibility standards (WCAG 2.1)

### 6. Write Documentation

**Documentation needs:**
- Tutorial videos
- Usage examples
- Translation guides
- API documentation
- FAQ section

## Development Setup

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/lang-ext.git
   cd lang-ext
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Edit files as needed
   - Test in browser
   - Check console for errors

4. **Test your changes**
   - Load extension in Chrome/Firefox
   - Test with `test.html`
   - Test on real Persian websites
   - Check all features work

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "Add: brief description of changes"
   ```

6. **Push and create Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```
   Then create a PR on GitHub

## Commit Message Guidelines

Use clear, descriptive commit messages:

- `Add: new feature or file`
- `Update: changes to existing feature`
- `Fix: bug fix`
- `Refactor: code restructuring`
- `Docs: documentation changes`
- `Style: formatting, no code change`
- `Test: adding or updating tests`

Examples:
```
Add: support for Turkish language
Fix: tooltip positioning on small screens
Update: improve word matching accuracy
Docs: add usage examples to README
```

## Code Style

### JavaScript
- Use semicolons
- Use const/let (not var)
- Use template literals for strings
- Add JSDoc comments for functions
- Keep functions under 50 lines when possible

### CSS
- Use kebab-case for class names
- Group related properties
- Support dark mode with media queries
- Comment sections

### JSON
- Indent with 2 spaces
- Keep consistent formatting
- Validate JSON before committing

## Testing Checklist

Before submitting a PR:

- [ ] Extension loads without errors
- [ ] All existing features still work
- [ ] New features work as expected
- [ ] No console errors
- [ ] Works in Chrome
- [ ] Works in Firefox
- [ ] UI looks good in light mode
- [ ] UI looks good in dark mode
- [ ] Test page displays correctly
- [ ] Settings save and load properly

## Dictionary Quality Standards

When adding dictionary entries:

### Accuracy
- Verify root meanings with reliable sources
- Ensure derivatives are actually from that root
- Check spelling in both Persian and Latin scripts
- Confirm parts of speech are correct

### Coverage
- Include most common derivatives first
- Add 3-5 derivatives per root minimum
- Include different parts of speech when possible
- Consider common compound words

### Categories
Use these standardized categories:
- `education` - learning, teaching, studying
- `writing` - writing, books, documentation
- `communication` - speaking, conversation, language
- `action` - doing, working, acting
- `knowledge` - knowing, science, awareness
- `religion` - faith, worship, spirituality
- `time` - temporal concepts
- `place` - spatial concepts
- `social` - society, relationships, family
- `nature` - natural world
- `abstract` - abstract concepts
- `art` - artistic expression
- `body` - physical/corporeal
- `emotion` - feelings, emotions

## Review Process

1. **Submission**: Create a pull request
2. **Initial Review**: Maintainers check basics
3. **Feedback**: You may be asked for changes
4. **Revision**: Make requested updates
5. **Approval**: Maintainers approve
6. **Merge**: Changes are merged into main

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Read the README and docs first

## Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Accept constructive criticism
- Focus on what's best for the project
- Show empathy towards others

Thank you for contributing to Farsi Root Word Learner! 🙏
