import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import HomePage from './pages/HomePage';
import WordCloud from './components/WordCloud';
import SpikeMap from './components/SightingMap';
import ChoroplethMap from './components/stateChoroplethMap';
import EntityBarChart from './components/EntityBarChart';
import ApparitionChart from './components/apparitionTypes';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="nav-bar">
          <ul className="nav-list">
            <li><Link to="/">Home</Link></li>
            <li><a href="https://github.com/DSCI550-Team9-Spring-2025/DSCI550-HW3" target="_blank">GitHub</a></li>
            <li><a href="https://d3js.org/" target="_blank">D3</a></li>
            <li><a href="https://www.kaggle.com/datasets/mexwell/haunted-places-in-the-us" target="_blank">Dataset</a></li>
          </ul>
        </nav>

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/wordcloud" element={<WordCloud />} />
          <Route path="/spike-map" element={<SpikeMap />} />
          <Route path="/choropleth" element={<ChoroplethMap />} />
          <Route path="/entities" element={<EntityBarChart />} />
          <Route path="/apparition" element={<ApparitionChart />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;