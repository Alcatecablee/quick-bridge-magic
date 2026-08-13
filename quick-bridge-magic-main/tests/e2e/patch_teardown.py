import os
import glob

tests_dir = r"c:\Users\Clive\Downloads\quick-bridge-magic-main\quick-bridge-magic-main\tests\e2e"

for file in glob.glob(os.path.join(tests_dir, "*.spec.ts")):
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()
    
    if "setupDualSession" in content and "teardownAllSessions" not in content:
        # 1. Update the import to include teardownAllSessions
        content = content.replace(
            "import { setupDualSession } from '../helpers/session';",
            "import { setupDualSession, teardownAllSessions } from '../helpers/session';"
        )
        
        # 2. Add the test.afterEach hook after the first test.describe
        if "test.describe(" in content:
            # find the end of the test.describe line
            idx = content.find("test.describe(")
            end_of_line = content.find("{", idx)
            end_of_line = content.find("\n", end_of_line)
            
            hook = "\n  test.afterEach(async () => { await teardownAllSessions(); });\n"
            content = content[:end_of_line] + hook + content[end_of_line:]
            
            with open(file, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {os.path.basename(file)}")
