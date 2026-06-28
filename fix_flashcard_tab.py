with open("src/components/flashcards/FlashcardManager.tsx", "r") as f:
    content = f.read()

content = content.replace(
    ") : !activeDeckId ? (",
    ") : flashcardTab === 'BUFFL' && !activeDeckId ? (\n                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>\n                      <div style={{ padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>\n                          <span style={{ color: 'var(--subtle)', fontSize: '0.9rem' }}>If the web view fails to load (due to browser security policies), you can launch the standalone window.</span>\n                          <button className=\"button\" onClick={() => window.open('https://buffl.co/app', 'Buffl', 'width=1200,height=800,toolbar=0,menubar=0,location=0,status=0')} style={{ borderColor: 'var(--foam)', color: 'var(--foam)' }}>\n                              Launch Standalone Window\n                          </button>\n                      </div>\n                      <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>\n                          <iframe \n                              src=\"https://buffl.co/app\" \n                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} \n                              sandbox=\"allow-scripts allow-same-origin allow-popups allow-forms\"\n                          />\n                      </div>\n                  </div>\n              ) : flashcardTab === 'LIBRARY' && !activeDeckId ? ("
)

# And remove the broken BUFFL block from the bottom:
broken_block = """              ) : flashcardTab === 'BUFFL' && !activeDeckId ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <div style={{ padding: '10px 20px', background: 'var(--surface)', borderBottom: '1px solid var(--muted)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--subtle)', fontSize: '0.9rem' }}>If the web view fails to load (due to browser security policies), you can launch the standalone window.</span>
                          <button className="button" onClick={() => window.open('https://buffl.co/app', 'Buffl', 'width=1200,height=800,toolbar=0,menubar=0,location=0,status=0')} style={{ borderColor: 'var(--foam)', color: 'var(--foam)' }}>
                              Launch Standalone Window
                          </button>
                      </div>
                      <div style={{ flex: 1, position: 'relative', background: '#ffffff' }}>
                          <iframe 
                              src="https://buffl.co/app" 
                              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} 
                              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                          />
                      </div>
                  </div>
              ) : null}"""

content = content.replace(broken_block, "              )}")

with open("src/components/flashcards/FlashcardManager.tsx", "w") as f:
    f.write(content)
