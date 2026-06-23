const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf-8');

// 1. Convert specific functions to async
code = code.replace('const handleAddContainer = () => {', 'const handleAddContainer = async () => {');
code = code.replace('const handleChangeMaxCredits = (containerName: string) => {', 'const handleChangeMaxCredits = async (containerName: string) => {');

// 2. Convert specific onClick handlers to async
code = code.replace(/onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*const val = prompt/g, 'onClick={async (e) => { e.stopPropagation(); const val = await asyncPrompt');
code = code.replace(/onClick=\{\(\) => \{\s*const title = prompt/g, 'onClick={async () => { const title = await asyncPrompt');

// 3. Replace the word prompt with await asyncPrompt
code = code.replace(/\bprompt\(/g, 'await asyncPrompt(');

// 4. Inject the PromptModal state into the Workspace component
const stateInjection = `  const [promptData, setPromptData] = useState<{ message: string, defaultVal: string, resolve: (val: string | null) => void } | null>(null);
  const asyncPrompt = (message: string, defaultVal: string = '') => {
      return new Promise<string | null>((resolve) => {
          setPromptData({ message, defaultVal, resolve });
      });
  };
`;
code = code.replace('  const [data, setData] = useState<WorkspaceData>', stateInjection + '\n  const [data, setData] = useState<WorkspaceData>');

// 5. Inject the PromptModal JSX right before the final closing div
const modalJSX = `
      {promptData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--foam)', borderRadius: '8px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '15px', color: 'var(--text)', fontWeight: 'bold' }}>{promptData.message}</div>
              <input 
                 autoFocus 
                 defaultValue={promptData.defaultVal} 
                 onKeyDown={e => {
                    if (e.key === 'Enter') { promptData.resolve(e.currentTarget.value); setPromptData(null); }
                    if (e.key === 'Escape') { promptData.resolve(null); setPromptData(null); }
                 }}
                 style={{ width: '100%', padding: '10px', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--muted)', outline: 'none', borderRadius: '4px' }}
                 id="prompt-input"
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                 <button className="button" onClick={() => { promptData.resolve(null); setPromptData(null); }} style={{ color: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" onClick={() => { promptData.resolve((document.getElementById('prompt-input') as HTMLInputElement).value); setPromptData(null); }} style={{ color: 'var(--pine)', borderColor: 'var(--pine)', padding: '5px 15px' }}>OK</button>
              </div>
           </div>
        </div>
      )}
`;
code = code.replace(/    <\/div>\n  \);\n\}\n*$/g, modalJSX + '    </div>\n  );\n}\n');

fs.writeFileSync('src/app/page.tsx', code);
