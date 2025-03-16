import React, { useState } from 'react';
import { FlowVisualizer } from '../lib';
import { generateSampleFlow } from './sampleData';

const App: React.FC = () => {
  const [flowData, setFlowData] = useState(generateSampleFlow());
  
  return (
    <div className="app">
      <header className="header">
        <h1>Phasmatic Visualizer</h1>
        <p>Interactive state machine visualization for game development</p>
      </header>
      
      <main className="content">
        <div className="visualizer-container" style={{ height: '70vh' }}>
          <FlowVisualizer 
            flowData={flowData}
            config={{ showConditions: true }}
          />
        </div>
      </main>
      
      <footer className="footer">
        <p>Powered by Phasmatic - The state machine library for game development</p>
      </footer>
    </div>
  );
};

export default App;