const fs = require("fs");
const path = require("path");

// Update import paths from '@/app/(auth)/auth' to '@/app/(auth)/auth'
// (This is just a placeholder - the actual paths need to be verified)

const filesToUpdate = [
  "lib/ai/entitlements.ts",
  "lib/security/rate-limit.ts",
  "components/sign-out-form.tsx",
  "app/(chat)/api/document/route.ts",
  "app/(auth)/api/auth/guest/route.ts",
  "app/(chat)/api/files/upload/route.ts",
  "app/(chat)/chat/[id]/page.tsx",
  "app/(chat)/api/history/route.ts",
  "app/(auth)/api/auth/[...nextauth]/route.ts",
  "app/(chat)/api/suggestions/route.ts",
  "app/(chat)/api/vote/route.ts",
  "app/api/reports/route.ts",
  "app/api/users/route.ts",
  "app/api/message/thread/route.ts",
  "app/api/message/reaction/route.ts",
  "app/api/organizations/invitations/route.ts",
  "app/api/organizations/analytics/route.ts",
  "app/api/organizations/integrations/route.ts",
  "app/api/organizations/route.ts",
  "app/api/organizations/teams/route.ts",
  "app/api/organizations/business/metrics/route.ts",
  "app/api/organizations/integrations/[id]/route.ts",
  "app/api/organizations/security/settings/route.ts",
  "app/api/organizations/security/api-keys/[id]/route.ts",
  "app/api/organizations/business/billing/route.ts",
  "app/api/organizations/security/api-keys/route.ts",
  "app/api/organizations/business/subscription/route.ts",
  "app/api/organizations/security/audit-logs/route.ts",
  "app/organization/page.tsx",
];

// Check if the file exists and update the import
filesToUpdate.forEach((filePath) => {
  const fullPath = path.join(process.cwd(), filePath);

  if (fs.existsSync(fullPath)) {
    try {
      let content = fs.readFileSync(fullPath, "utf8");
      // Update the import path
      const updatedContent = content.replace(
        /from\s+['"]@\/app\(auth\)\/auth['"]/g,
        'from "@/app/(auth)/auth"',
      );

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, "utf8");
        console.log(`Updated imports in ${filePath}`);
      }
    } catch (error) {
      console.error(`Error processing ${filePath}:`, error);
    }
  } else {
    console.warn(`File not found: ${filePath}`);
  }
});

console.log("Import path update complete!");
