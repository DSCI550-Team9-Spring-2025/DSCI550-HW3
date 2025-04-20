import React from 'react';
import WordCloud from './components/WordCloud';
import SpikeMap from './components/SightingMap';
import ChoroplethMap from './components/stateChoroplethMap';
import EntityBarChart from './components/EntityBarChart';

function App() {


  return (
    <div className="App">
      <div className="title-wrapper">
        <h1>Haunted Places in the US</h1>
        <h2>Data Insights with D3.js</h2>
        <h4><a href="https://github.com/DSCI550-Team9-Spring-2025/DSCI550-HW3" target="_blank">GitHub</a></h4>
      </div>

      <div className="viz-grid">
        <div className="viz-item">
          <WordCloud />
        </div>

        <div className="viz-item">
          <ChoroplethMap />
        </div>

        <div className="viz-item">
          <SpikeMap />
        </div>

        <div className="viz-item">
          <h2>Visualization 4</h2>
          <div className="viz-placeholder">[TBD]</div>
        </div>

        <div className="viz-item">
          <EntityBarChart />
        </div>
      </div>

    </div>
  );
}

export default App;
