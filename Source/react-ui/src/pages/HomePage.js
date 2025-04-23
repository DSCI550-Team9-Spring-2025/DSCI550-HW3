import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import ImageCarousel from '../components/ImageCarousel';

const HomePage = () => {
  const visualizations = [
    { title: 'Word Cloud', path: '/wordcloud', description: 'Visualize frequently used words in haunted sighting descriptions.' },
    { title: 'Spike Map', path: '/spike-map', description: 'Geographic distribution of sightings by city across the US.' },
    { title: 'Choropleth Map', path: '/choropleth', description: 'Explore death rates per state and possible correlation with hauntings.' },
    { title: 'Entity Bar Chart', path: '/entities', description: 'See which named entities (like dates, people, and places) appear most in haunted reports.' },
		{ title: 'Apparatition Characteristics', path: '/', description: '...'}
	];

  return (
    <div className="home-wrapper">
      <h1>Haunted Places in the US</h1>
      <h3>Data Insights with D3.js</h3>
      <div className="card-grid">
        {visualizations.map((viz, index) => (
          <Link to={viz.path} key={index} className="viz-card">
            <h2>{viz.title}</h2>
            <p>{viz.description}</p>
          </Link>
        ))}
      </div>

			<hr style={{backgroundColor: "#757575", height: "1px", border: "none"}}></hr>
			<h3>Visualizations by Stable Diffusion</h3>
			<ImageCarousel />
    </div>
  );
};

export default HomePage;
