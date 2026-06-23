const fs = require('fs');
const path = './src/app/page.tsx';

let content = fs.readFileSync(path, 'utf8');

const ctxString = `
  const ctx = {
    appConfig, openSettings, activeTab, setActiveTab, selectedSemester, 
    setSelectedSemester, setCurrentPath, semesters, handleAddSemester, 
    lectures, currentPath, data, asyncPrompt, updateConf, getConfidenceColor,
    widgetNames, activeWidget, setActiveWidget, pomoTime, pomoActive, 
    setPomoActive, setPomoTime, pomoMode, setPomoMode, convValue, setConvValue, 
    convType, setConvType, jd, utc, encInput, setEncInput, encMode, setEncMode, pingData
  };

  return (
    <div className={\`app-container \${!appConfig.enableFlicker ? 'no-flicker' : ''}\`}>
      <Sidebar ctx={ctx} />
`;

const startIndex = content.indexOf('  return (\n    <div className={`app-container ${!appConfig.enableFlicker ? \'no-flicker\' : \'\'}`}>');
if (startIndex === -1) {
    console.error("Start not found");
    process.exit(1);
}

const endIndex = content.indexOf('<div className="main-content">', startIndex);
if (endIndex === -1) {
    console.error("End not found");
    process.exit(1);
}

// Replace everything between start and end (exclusive of end) with ctxString
const newContent = content.substring(0, startIndex) + ctxString + '      ' + content.substring(endIndex);

fs.writeFileSync(path, newContent, 'utf8');
console.log("Refactored successfully.");
