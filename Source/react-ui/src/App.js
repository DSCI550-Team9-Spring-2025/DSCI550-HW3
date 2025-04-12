import React from 'react';
import WordCloud from './components/WordCloud';

function App() {
  return (
    <div className="App">
      <div className="title-wrapper">
        <h1>Haunted Places in the US</h1>
        <h2>Visualized with D3</h2>
      </div>
      <WordCloud />
    </div>
  );
}

export default App;
