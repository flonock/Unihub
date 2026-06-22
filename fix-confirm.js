const fs = require('fs');
let code = fs.readFileSync('src/app/page.tsx', 'utf-8');

// 1. Convert specific functions to async
code = code.replace('const handleDeleteContainer = (containerName: string) => {', 'const handleDeleteContainer = async (containerName: string) => {');
code = code.replace('const handleDeleteFolder = async (pathToDelete: string) => {', 'const handleDeleteFolder = async (pathToDelete: string) => {'); // Already async but safe

// 2. Replace confirm with await asyncConfirm
code = code.replace(/confirm\(/g, 'await asyncConfirm(');

// 3. Inject the ConfirmModal state
const stateInjection = `  const [confirmData, setConfirmData] = useState<{ message: string, resolve: (val: boolean) => void } | null>(null);
  const asyncConfirm = (message: string) => {
      return new Promise<boolean>((resolve) => {
          setConfirmData({ message, resolve });
      });
  };
`;
code = code.replace('  const asyncPrompt = (message: string, defaultVal: string = \'\') => {', stateInjection + '  const asyncPrompt = (message: string, defaultVal: string = \'\') => {');

// 4. Inject the ConfirmModal JSX right before the PromptModal
const modalJSX = `
      {confirmData && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10001, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
           <div style={{ background: 'var(--base)', padding: '20px', border: '1px solid var(--love)', borderRadius: '8px', minWidth: '350px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ marginBottom: '25px', color: 'var(--text)', fontWeight: 'bold' }}>{confirmData.message}</div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                 <button className="button" onClick={() => { confirmData.resolve(false); setConfirmData(null); }} style={{ color: 'var(--text)', borderColor: 'var(--muted)', padding: '5px 15px' }}>Cancel</button>
                 <button className="button" autoFocus onClick={() => { confirmData.resolve(true); setConfirmData(null); }} style={{ color: 'var(--base)', background: 'var(--love)', borderColor: 'var(--love)', padding: '5px 15px', fontWeight: 'bold' }}>Confirm</button>
              </div>
           </div>
        </div>
      )}
`;
code = code.replace('{promptData && (', modalJSX + '      {promptData && (');

fs.writeFileSync('src/app/page.tsx', code);
