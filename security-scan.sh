#!/bin/bash

echo "=== Language Learner Extension Security Scan ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ISSUES_FOUND=0

echo "1. Checking for innerHTML usage..."
if grep -rn "innerHTML" content/ utils/ options/ popup/ 2>/dev/null | grep -v "//.*innerHTML"; then
    echo -e "${YELLOW}   ⚠ innerHTML usage detected - verify escaping${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No innerHTML found${NC}"
fi

echo ""
echo "2. Checking for eval() usage..."
if grep -rn "eval(" content/ utils/ options/ popup/ background/ 2>/dev/null; then
    echo -e "${RED}   ✗ CRITICAL: eval() found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No eval() found${NC}"
fi

echo ""
echo "3. Checking for inline event handlers..."
if grep -rn "onclick=" options/ popup/ 2>/dev/null || grep -rn "onload=" options/ popup/ 2>/dev/null; then
    echo -e "${RED}   ✗ Inline event handlers found (CSP violation)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No inline handlers found${NC}"
fi

echo ""
echo "4. Checking for unsafe regex..."
REGEX_COUNT=$(grep -rn "new RegExp(" content/ utils/ 2>/dev/null | wc -l)
if [ $REGEX_COUNT -gt 0 ]; then
    echo -e "${YELLOW}   ⚠ Found $REGEX_COUNT dynamic RegExp instances - review for user input${NC}"
    grep -rn "new RegExp(" content/ utils/ 2>/dev/null | head -5
else
    echo -e "${GREEN}   ✓ No dynamic RegExp found${NC}"
fi

echo ""
echo "5. Checking for document.write..."
if grep -rn "document.write" content/ utils/ options/ popup/ 2>/dev/null; then
    echo -e "${RED}   ✗ document.write found${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No document.write found${NC}"
fi

echo ""
echo "6. Checking for localStorage usage..."
if grep -rn "localStorage" content/ utils/ options/ popup/ background/ 2>/dev/null; then
    echo -e "${YELLOW}   ⚠ localStorage found - should use chrome.storage${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No localStorage found${NC}"
fi

echo ""
echo "7. Checking for Function() constructor..."
if grep -rn "Function(" content/ utils/ options/ popup/ background/ 2>/dev/null; then
    echo -e "${RED}   ✗ Function() constructor found (like eval)${NC}"
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
else
    echo -e "${GREEN}   ✓ No Function() constructor found${NC}"
fi

echo ""
echo "8. Checking for inline styles..."
INLINE_STYLES=$(grep -rn 'style=' options/ popup/ content/ 2>/dev/null | grep -v "//.*style=" | wc -l)
if [ $INLINE_STYLES -gt 0 ]; then
    echo -e "${YELLOW}   ⚠ Found $INLINE_STYLES inline style attributes (CSP concern)${NC}"
else
    echo -e "${GREEN}   ✓ No inline styles found${NC}"
fi

echo ""
echo "9. Checking chrome.runtime.onMessage handlers..."
MESSAGE_HANDLERS=$(grep -rn "chrome.runtime.onMessage" content/ background/ 2>/dev/null | wc -l)
if [ $MESSAGE_HANDLERS -gt 0 ]; then
    echo -e "${YELLOW}   ⚠ Found $MESSAGE_HANDLERS message handlers - verify sender validation${NC}"
    grep -rn "chrome.runtime.onMessage" content/ background/ 2>/dev/null
else
    echo -e "${GREEN}   ✓ No message handlers found${NC}"
fi

echo ""
echo "10. Checking for user input concatenation in URLs..."
if grep -rn "chrome.tabs.create.*url.*+" popup/ options/ 2>/dev/null || grep -rn "window.open.*+" content/ popup/ options/ 2>/dev/null; then
    echo -e "${YELLOW}   ⚠ URL string concatenation detected - verify validation${NC}"
else
    echo -e "${GREEN}   ✓ No suspicious URL construction found${NC}"
fi

echo ""
echo "=== Scan Complete ==="
echo ""

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✓ No critical security issues detected${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Found $ISSUES_FOUND potential security concerns - review above${NC}"
    exit 1
fi
