import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { legendColor } from "d3-svg-legend";

const SpikeMap = () => {
  const ref = useRef();
  const [sightings, setSightings] = useState([]);
  const [apparitionData, setApparitionData] = useState([]);
  const [apparitionCityData, setApparitionCityData] = useState([]);
  const [resetZoom, setResetZoom] = useState(null);

  // Load sightings data
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/us.json")
      .then(res => res.json())
      .then(data => setSightings(data))
      .catch(err => console.error("Failed to load sightings:", err));
  }, []);

  // Load apparition data by state
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/apparitions_by_states.json")
      .then(res => res.json())
      .then(data => setApparitionData(data))
      .catch(err => console.error("Failed to load apparition data:", err));
  }, []);

  // Load apparition data by city
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/apparitions_by_city.json")
      .then(res => res.json())
      .then(data => setApparitionCityData(data))
      .catch(err => console.error("Failed to load city apparition data:", err));
  }, []);

  // Load map
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/SightingMap/usMap.json")
      .then(res => res.json())
      .then(us => {
        const width = 975;
        const height = 610;
        const svg = d3.create("svg")
          .attr("viewBox", [0, 0, width, height])
          .attr("width", width)
          .attr("height", height)
          .style("max-width", "100%")
          .style("height", "auto")
          .style("background", "#1e1e1e");

        const projection = d3.geoAlbersUsa().scale(1300).translate([487.5, 305]);
        const path = d3.geoPath(projection);

        const g = svg.append("g");

        // Prepare data map for states
        const dataMap = new Map(
          apparitionData.map(d => [d.state.trim().toLowerCase(), d.haunted_place_count])
        );

        const metricValues = apparitionData.map(d => d.haunted_place_count).filter(v => !isNaN(v));

        // Grayscale color scale
        const color = d3.scaleSequential()
          .domain([0, d3.max(metricValues) * 0.7])
          .interpolator(d3.interpolateRgb("#bbbbbb", "#111"));

        // Create legend
        const legend = legendColor()
          .labelFormat(d3.format(".0f"))
          .scale(color)
          .title("Haunted Places Count")
          .cells(8)
          .labels("center")
          .shapeWidth(30)
          .shapePadding(30);

        const legendGroup = svg.append("g")
          .attr("class", "legend")
          .attr("transform", "translate(650,30)")
          .call(legend.orient("horizontal"));

        // Insert a dark background rectangle *before* the legend contents
        legendGroup.insert("rect", ":first-child")
        .attr("x", -10) // some padding
        .attr("y", -27) // move up to cover title space
        .attr("width", 260) // depends on your legend width
        .attr("height", 67) // enough to wrap title + gradient + ticks
        .attr("fill", "#1e1e1e") // dark grey like your main background
        .attr("rx", 8) // slight rounded corners
        .attr("opacity", 0.85); // slightly see-through if you want, or 1 for solid

        svg.select(".legend").select("text.legendTitle").style("fill", "white").style("font-size", "20px").attr("dy", "-0.3em");
        svg.select(".legend").selectAll("g.cell text").attr("dy", "0.9em").attr("x", 15).style("fill", "white").style("font-size", "11px");

        const states = topojson.feature(us, us.objects.states).features;

        g.append("g")
          .attr("fill", "#444")
          .attr("cursor", "pointer")
          .selectAll("path")
          .data(states)
          .join("path")
          .attr("fill", d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const val = dataMap.get(stateName);
            return val != null ? color(val) : "#ccc";
          })
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("d", path)
          .append("title")
          .text(d => {
            const feature = apparitionData.find(x => x.state.trim().toLowerCase() === d.properties.name.trim().toLowerCase());
            if (!feature) return d.properties.name + ": No data available";
            const apparitionRatio = Number(feature["apparition:places"]).toFixed(2);
            const apparitionTypes = Object.entries(feature.apparition_type_counts)
              .map(([type, count]) => `${type}: ${count}`)
              .join(", ");
            return `Sightings in US State: ${feature.state} (${feature.state_abbrev})\n` +
              `Apparition mentions: ${feature.apparition_mentions}\n` +
              `Haunted place count: ${feature.haunted_place_count}\n` +
              `Apparition to places ratio: ${apparitionRatio}\n\n----------------\nApparition Types\n----------------\n${apparitionTypes}`;
          });

        g.append("path")
          .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
          .attr("fill", "none")
          .attr("stroke", "white")
          .attr("stroke-width", 0.5)
          .attr("d", path);

        // Spike data
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

        const spike = len => `M-3,0L0,${-len}L3,0Z`;

        g.append("g")
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
            const cityData = apparitionCityData.find(x => 
              x.city.trim().toLowerCase() === d.city.trim().toLowerCase() &&
              x.state.trim().toLowerCase() === d.state.trim().toLowerCase()
            );
            if (!cityData) return `${d.city}, ${d.state}\nHaunted Places: ${d.count}`;
            const apparitionRatio = Number(cityData["apparition:places"]).toFixed(2);
            const apparitionTypes = Object.entries(cityData.apparition_type_counts)
              .map(([type, count]) => `${type}: ${count}`)
              .join(", ");
            return `Sightings in City: ${cityData.city}, ${cityData.state}\n` +
              `Apparition mentions: ${cityData.apparition_mentions}\n` +
              `Haunted place count: ${cityData.haunted_place_count}\n` +
              `Apparition to places ratio: ${apparitionRatio}\n\n----------------\nApparition Types\n----------------\n${apparitionTypes}`;
          });

        const zoom = d3.zoom()
          .scaleExtent([1, 8])
          .on("zoom", event => {
            g.attr("transform", event.transform);
            g.attr("stroke-width", 1 / event.transform.k);
          });

        svg.call(zoom);

        setResetZoom(() => () => {
          svg.transition().duration(750).call(
            zoom.transform,
            d3.zoomIdentity,
            d3.zoomTransform(svg.node()).invert([width / 2, height / 2])
          );
        });

        const container = ref.current;
        container.innerHTML = "";
        container.appendChild(svg.node());

      })
      .catch(err => console.error("Failed to load map data:", err));
  }, [sightings, apparitionData, apparitionCityData]);

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
        When looking at the apparitions mentioned within the haunted places, we find that the average is 0.59 apparition mentions for every haunted place. Ghosts, apparitions, spirits, and figures tend to be most frequently sighted supernatural occurences. This indicates that haunted places are predominantly occupied and associated with the deceased that linger with Earthly attachments.
      </p>
      <div style={{ marginBottom: '1rem' }}>
        {resetZoom && <button onClick={resetZoom}>Reset View</button>}
      </div>
      <div ref={ref}/>
    </div>
  );
};

export default SpikeMap;
