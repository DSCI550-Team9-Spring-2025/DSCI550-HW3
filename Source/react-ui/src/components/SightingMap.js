import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";

const SpikeMap = () => {
  const ref = useRef();
  const [sightings, setSightings] = useState([]);

	// Load sighting map
  useEffect(() => {
      fetch(process.env.PUBLIC_URL + "/SightingMap/us.json")
        .then(res => res.json())
        .then(data => setSightings(data))
        .catch(err => console.error("Failed to load sightings:", err));
    }, []);

	// Load TopoJSON US map
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/usMap.json")
      .then(res => res.json())
      .then(us => {
        const svg = d3.create("svg")
          .attr("viewBox", [0, 0, 975, 610])
          .attr("width", 975)
          .attr("height", 610)
          .style("max-width", "100%")
          .style("height", "auto");

        const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
        const path = d3.geoPath(projection);

        // Fill background with merged state shapes
        svg.append("path")
          .datum(topojson.feature(us, us.objects.states))
          .attr("fill", "#444")
          .attr("d", path);

        // Draw state borders
        svg.append("path")
          .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
          .attr("fill", "none")
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("d", path);

        // Group sightings by city+state+coords
        const grouped = d3.rollups(
          sightings,
          v => v.length,
          d => `${d.city.toLowerCase()},${d.state.toLowerCase()},${d.city_longitude},${d.city_latitude}`
        );

        const data = grouped.map(([key, count]) => {
          const [city, state, lon, lat] = key.split(",");
          return { city, state, lon: +lon, lat: +lat, count };
        });

        const length = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.count)])
          .range([0, 100]);

        const spike = len => {
          const r = 3;
          return `M${-r},0L0,${-len}L${r},0Z`;
        };

        svg.append("g")
          .attr("fill", "red")
          .attr("fill-opacity", 0.6)
          .attr("stroke", "darkred")
          .attr("stroke-width", 0.5)
          .selectAll("path")
          .data(data)
          .join("path")
          .attr("transform", d => {
            const coords = projection([d.lon, d.lat]);
            return coords ? `translate(${coords})` : null;
          })
          .attr("d", d => spike(length(d.count)))
          .append("title")
          .text(d => `${d.city}, ${d.state}\nSightings: ${d.count}`);

        // Append to the DOM
        const container = ref.current;
        container.innerHTML = "";
        container.appendChild(svg.node());
      })
      .catch(err => console.error("Failed to load map data:", err));
  }, [sightings]);

  return (
    <div className="spike-map-wrapper">
      <h2>Spike Map of Sightings</h2>
      <div ref={ref}></div>
    </div>
  );
};

export default SpikeMap;
