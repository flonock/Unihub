#!/bin/bash

echo "Booting Aerospace Workspace Engine..."

# Navigate to workspace
cd /home/apollon/uni-workspace || exit

# Start the Next.js development server in the background
npm run dev &
SERVER_PID=$!

# Wait for the server to spin up faster by checking more frequently
for i in {1..40}; do
    if nc -z localhost 3000 2>/dev/null; then
        break
    fi
    sleep 0.25
done

echo "Launching native Electron window..."

# Launch the native Electron wrapper without npx overhead!
./node_modules/.bin/electron electron-main.js

# When the user closes the native app window, the script resumes and we kill the background server!
echo "Window closed. Shutting down the backend server..."
kill $SERVER_PID
