#!/bin/bash
# Smoke test for agent-conformance CLI

set -e

echo "=================================="
echo "Running agent-conformance smoke tests"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test CLI is available
echo "Testing CLI availability..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"

# Build the project
echo ""
echo "Building project..."
npm run build
echo -e "${GREEN}✓ Build successful${NC}"

# Run tests
echo ""
echo "Running tests..."
npm test -- --silent
echo -e "${GREEN}✓ All tests passed${NC}"

# Test CLI help
echo ""
echo "Testing CLI help..."
node dist/cli.js --help > /dev/null
echo -e "${GREEN}✓ CLI help works${NC}"

# Test scan command
echo ""
echo "Testing scan command..."
node dist/cli.js scan --repo fixtures/example-repo --output /tmp/smoke-scan.json > /dev/null 2>&1
if [ -f /tmp/smoke-scan.json ]; then
    echo -e "${GREEN}✓ Scan command works${NC}"
else
    echo -e "${RED}✗ Scan command failed${NC}"
    exit 1
fi

# Test run command
echo ""
echo "Testing run command..."
node dist/cli.js run --repo fixtures/example-repo --task pr-review --runtime claude --output /tmp/smoke-out > /dev/null 2>&1
if [ -f /tmp/smoke-out/traces.json ]; then
    echo -e "${GREEN}✓ Run command works${NC}"
else
    echo -e "${RED}✗ Run command failed${NC}"
    exit 1
fi

# Test report command - JSON
echo ""
echo "Testing report command (JSON)..."
node dist/cli.js report --input /tmp/smoke-out/traces.json --repo fixtures/example-repo --format json --output /tmp/smoke-reports > /dev/null 2>&1
if ls /tmp/smoke-reports/*.json 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓ JSON report generation works${NC}"
else
    echo -e "${RED}✗ JSON report generation failed${NC}"
    exit 1
fi

# Test report command - Markdown
echo ""
echo "Testing report command (Markdown)..."
node dist/cli.js report --input /tmp/smoke-out/traces.json --repo fixtures/example-repo --format md --output /tmp/smoke-reports > /dev/null 2>&1
if ls /tmp/smoke-reports/*.md 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓ Markdown report generation works${NC}"
else
    echo -e "${RED}✗ Markdown report generation failed${NC}"
    exit 1
fi

# Test report command - HTML
echo ""
echo "Testing report command (HTML)..."
node dist/cli.js report --input /tmp/smoke-out/traces.json --repo fixtures/example-repo --format html --output /tmp/smoke-reports > /dev/null 2>&1
if ls /tmp/smoke-reports/*.html 1> /dev/null 2>&1; then
    echo -e "${GREEN}✓ HTML report generation works${NC}"
else
    echo -e "${RED}✗ HTML report generation failed${NC}"
    exit 1
fi

# Cleanup
rm -rf /tmp/smoke-*

echo ""
echo "=================================="
echo -e "${GREEN}All smoke tests passed!${NC}"
echo "=================================="
