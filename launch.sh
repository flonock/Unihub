#!/bin/bash

cd /home/apollon/uni-workspace || exit

# Check if something is listening on port 3000
if ! command -v nc &> /dev/null || ! nc -z localhost 3000; then
    # Start the Next.js app in the background
    npm run dev > /dev/null 2>&1 &
    SERVER_PID=$!
    
    # Wait for the server to spin up faster by checking more frequently
    for i in {1..40}; do
        if nc -z localhost 3000 2>/dev/null; then
            break
        fi
        sleep 0.25
    done
fi

# Launch the native Electron wrapper explicitly to skip 'npx' overhead
./node_modules/.bin/electron electron-main.js

# Only kill the server if we were the ones who started it
if [ ! -z "$SERVER_PID" ]; then
    kill $SERVER_PID
fi
