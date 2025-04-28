import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { legendColor } from "d3-svg-legend";

const SpikeMap = () => {
  const ref = useRef();
  const [sightings, setSightings] = useState([])
  const [apparitionData, setApparitionData] = useState([])
  const [apparitionCityData, setApparitionCityData] = useState([]);

	// Load sighting map
  useEffect(() => {
      fetch(process.env.PUBLIC_URL + "/SightingMap/us.json")
        .then(res => res.json())
        .then(data => setSightings(data))
        .catch(err => console.error("Failed to load sightings:", err));
    }, []);

  // Load apparition data by state for US state fill
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/apparitions_by_states.json")
      .then(res => res.json())
      .then(data => setApparitionData(data))
      .catch(err => console.error("Failed to load apparition data:", err));
  }, []);

  // Load apparition data by city for tool tip
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/apparitions_by_city.json")
      .then(res => res.json())
      .then(data => setApparitionCityData(data))
      .catch(err => console.error("Failed to load city apparition data:", err));
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
        // Build a map: state name (lowercased) -> haunted_place_count
        const dataMap = new Map(
          apparitionData.map(d => [d.state.trim().toLowerCase(), d.haunted_place_count])
        );

        // Fill color based on state aggregated haunted places count metric
        const metricValues = apparitionData.map(d => d.haunted_place_count).filter(v => !isNaN(v));

        // Purple color scale gradient
        const color = d3.scaleSequential()
        .domain([0, d3.max(metricValues) * 0.7]) 
        .interpolator(d3.interpolateRgb("#a281a6", "#661c9c")); // Purple color scale

        // Create the legend
        const legend = legendColor()
          .labelFormat(d3.format(".0f"))
          .scale(color)
          .title("Haunted Places Count")
          .cells(8)
          .labels("center")
          .shapeWidth(30)
          .shapePadding(30);

        // Add the legend to the SVG container
        svg.append("g")
          .attr("class", "legend")
          .attr("transform", "translate(650,30)")  // Position the legend on the right
          .call(legend.orient("horizontal"));

        svg.select(".legend")
          .select("text.legendTitle")
          .style("fill", "white")
          .style("font-size", "24px")
          .attr("dy", "-0.3em");

        // Style tick labels
        svg.select(".legend")
          .selectAll("g.cell text")
          .attr("dy", "0.9em")
          .attr("text-anchor", "middle")
          .attr("x", 15) 
          .style("fill", "white")
          .style("font-size", "11px");

        // Drawing the states and coloring them
        const states = topojson.feature(us, us.objects.states).features;

        svg.append("g")
          .selectAll("path")
          .data(states)
          .join("path")
          .attr("fill", d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const rate = dataMap.get(stateName);
            return rate != null ? color(rate) : "#ccc";
          })
          .attr("stroke", "#fff")
          .attr("stroke-width", 0.5)
          .attr("d", path)
          .append("title")
          .text(d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const featureValues = apparitionData.find(x => x.state.trim().toLowerCase() === stateName);

            if (!featureValues) return `${stateName}: No data available`;

            // Extract and format values
            const { state, state_abbrev, apparition_mentions, haunted_place_count, apparition_type_counts } = featureValues;
            const apparition_places = featureValues["apparition:places"]; 

            // Format apparition type counts into a readable string
            const apparitionTypeString = Object.entries(apparition_type_counts)
              .map(([type, count]) => `${type}: ${count}`)
              .join(", ");

            // Construct tooltip text with state info
            const tooltipText = "Sightings in US State: " + state + " (" + state_abbrev + ")\n" +
            "Apparition mentions: " + apparition_mentions + "\n" +
            "Haunted place count: " + haunted_place_count + "\n" +
            "Apparition to places ratio: " + apparition_places + "\n" +
            "---\n" +
            "Apparition Types: " + apparitionTypeString;
            return tooltipText;
          });

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
          .text(d => {
            const key = `${d.city.trim().toLowerCase()},${d.state.trim().toLowerCase()}`;
            const featureAppartionCity = apparitionCityData.find(x => 
              x.city.trim().toLowerCase() === d.city.trim().toLowerCase() &&
              x.state.trim().toLowerCase() === d.state.trim().toLowerCase()
            );

            if (!featureAppartionCity) {
              // fallback basic tooltip if city-level data not found
              return `${d.city}, ${d.state}\nHaunted Places: ${d.count}`;
            }

            const { state, state_abbrev, apparition_mentions, haunted_place_count, apparition_type_counts } = featureAppartionCity;
            const apparition_places = featureAppartionCity["apparition:places"]; 

            const apparitionTypeString = Object.entries(apparition_type_counts)
              .map(([type, count]) => `${type}: ${count}`)
              .join(", ");
          
            // Otherwise, pull detailed city apparition info
            const tooltipText2 = "Sightings in City: " + featureAppartionCity.city + ", " + featureAppartionCity.state + "\n" +
            "Apparition mentions: " + apparition_mentions + "\n" +
            "Haunted place count: " + haunted_place_count + "\n" +
            "Apparition to places ratio: " + apparition_places + "\n" +
            "---\n" +
            "Apparition Types: " + apparitionTypeString;
            return tooltipText2;
          });

        // Append to the DOM
        const container = ref.current;
        container.innerHTML = "";
        container.appendChild(svg.node());
      })
      .catch(err => console.error("Failed to load map data:", err));
  }, [sightings], [apparitionData]);

  return (
    <div className="spike-map-wrapper">
      <h2>Spike Map of Haunted Sightings</h2>
      <p>
        Illustrates where haunted sightings occurred and their respective magnitudes.<br/>
        <ul>
          <li>Spikes represent the city aggregated haunted places.</li>
          <li>Hover tool tip for the US state-level delves deeper into the haunted apparition sightings within the haunted places.</li>
          <li>Hover tool tip for spikes displays similar haunted sighting metrics but at the city scope.</li>
        </ul>
        <strong>Insight:</strong><br/>
        The map aligns somewhat well with US population densities, though there are some interesting hotspots that seem to disproportionately break free of this alignment.
        A large spike in Honolulu, Hawaii may suggest numerous dark occurrences there, or maybe superstitions? 
        Same with San Antonio, Tuscon, and El Paso - perhaps the spirits of Native Americans affected by Manifest Destiny?<br/>
        At the state aggregate level, California, Texas, and Pennsylvania have substantially more haunted places hotspot compared to other US states. California and Texas have large populations that may lead to more reported sightings. Pennsylvania has many historic towns like Philadelphia where many key battles were fought during the Revolutionary War and Civil War that may contribute to more hauntings.<br/>
        When looking at the apparitions mentioned within the haunted places, we find that the average is 0.59 apparition mentions for every haunted place. Ghosts, apparitions, spirits, and figures tend to be most frequently sighted supernatural occurences. This indicates that haunted places are predominantly occupied and associated with the decessed that linger with Earthly attachments.
      </p>
      <div ref={ref}></div>
    </div>
  );
};

export default SpikeMap;
