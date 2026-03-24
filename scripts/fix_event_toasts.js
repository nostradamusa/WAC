const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/events/new/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add import
if (!content.includes('import { toast } from "react-hot-toast";')) {
  content = content.replace('import { supabase } from "@/lib/supabase";', 'import { supabase } from "@/lib/supabase";\nimport { toast } from "react-hot-toast";');
}

// 2. Remove states
content = content.replace(/const \[notice, \s*setNotice\]\s*=\s*useState<string \| null>\(null\);/, '');
content = content.replace(/const \[error, \s*setError\]\s*=\s*useState<string \| null>\(null\);/, '');

// 3. Draft replace
content = content.replace('setError(null);\n    setNotice("Draft saved on this device.");', 'toast.success("Draft saved on this device.");');

// 4. setError -> toast.error inside handlePublish (simple regex)
content = content.replace(/setError\("An event title is required."\);/g, 'toast.error("An event title is required.");');
content = content.replace(/setError\("Choose the organization, business, or group that is hosting this event."\);/g, 'toast.error("Choose the organization, business, or group that is hosting this event.");');
content = content.replace(/setError\("Choose the WAC person who represents the hosting entity."\);/g, 'toast.error("Choose the WAC person who represents the hosting entity.");');
content = content.replace(/setError\("You can only host as an organization or business when you have a role above Member on WAC."\);/g, 'toast.error("You can only host as an organization or business when you have a role above Member on WAC.");');
content = content.replace(/setError\("Please choose a valid start date and time."\);/g, 'toast.error("Please choose a valid start date and time.");');

// 5. Remove nulling before submit
content = content.replace('    setIsSubmitting(true);\n    setNotice(null);\n    setError(null);', '    setIsSubmitting(true);');

// 6. Final success toast
content = content.replace('      window.localStorage.removeItem(EVENT_DRAFT_KEY);\n      router.push("/events");\n      router.refresh();', '      window.localStorage.removeItem(EVENT_DRAFT_KEY);\n      toast.success("Event published successfully!");\n      router.push("/events");\n      router.refresh();');

// 7. Error catch
content = content.replace(/setError\(err instanceof Error \? err.message : "Failed to publish event."\);/, 'toast.error(err instanceof Error ? err.message : "Failed to publish event.");');

// 8. Remove UI at bottom
const uiRegex = /\{\(notice \|\| error\) && \([\s\S]*?\}\)/;
content = content.replace(uiRegex, '');

fs.writeFileSync(filePath, content, 'utf8');
console.log("Successfully replaced file.");
