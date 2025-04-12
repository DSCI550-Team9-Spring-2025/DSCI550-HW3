import React from 'react';
import WordCloud from './components/WordCloud';

function App() {
  return (
    <div className="App">
      <div className="title-wrapper">
        <h1>Haunted Places in the US</h1>
        <h2>Visualized with D3</h2>
      </div>

      <div className="viz-grid">
        <div className="viz-item">
          <WordCloud />
        </div>

        <div className="viz-item">
          <h2>Visualization 2</h2>
          <div className="viz-placeholder">[TBD]</div>
        </div>

        <div className="viz-item">
          <h2>Visualization 3</h2>
          <div className="viz-placeholder">[TBD]</div>
        </div>

        <div className="viz-item">
          <h2>Visualization 4</h2>
          <div className="viz-placeholder">[TBD]</div>
        </div>

        <div className="viz-item">
          <h2>Visualization 5</h2>
          <div className="viz-placeholder">[TBD]</div>
        </div>
      </div>

    </div>
  );
}

export default App;
