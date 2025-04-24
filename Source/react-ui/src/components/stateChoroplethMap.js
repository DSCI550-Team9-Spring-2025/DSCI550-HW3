import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { legendColor } from "d3-svg-legend"; //npm install d3-svg-legend

const ChoroplethMap = () => {
  const ref = useRef();
  const [aggData, setAggData] = useState([]); // stores entire dataset for agg_stats_data.json
  const [selectedMetric, setSelectedMetric] = useState("death_rate_All causes"); // stores currently selected metric
  

  // Load aggregate state map (suicide rates)
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/ChoroplethMap/agg_stats_data.json")
      .then(res => res.json())
      .then(data => setAggData(data))
      .catch(err => console.error("Failed to load data:", err));
  }, []);

  // Load TopoJSON US map
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/ChoroplethMap/usMap.json")
      .then(res => res.json())
      .then(us => {
        const svg = d3.create("svg")
          .attr("viewBox", [0, -20, 975, 630])
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
        


        // Inputs the death rates per capita
        const dataMap = new Map(
        aggData.map(d => [d.state.trim().toLowerCase(), +d[selectedMetric]])
        );

        const metricValues = aggData.map(d => +d[selectedMetric]).filter(v => !isNaN(v));
        console.log("metricValues", metricValues); // Add this line for debugging
        const color = d3.scaleSequential()
        .domain(d3.extent(metricValues)) // [min, max] range based on data
        .interpolator(d3.interpolateReds);
        
        // Legend that dynamically adapts to the metricValue user selects
        const legend = legendColor()
          .labelFormat(d3.format(".0f"))
          .scale(color)
          .title(selectedMetric.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()))
          .cells(8)
          .labels("center")
          .shapeWidth(30)
          .shapePadding(30);
        
        svg.append("g")
          .attr("class", "legend")
          .attr("transform", "translate(650,30)")
          .call(legend.orient("horizontal"))

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
          .style("font-size", "14px");
        
        const states = topojson.feature(us, us.objects.states).features;

        // State gradient fill colors and stroke lines
        svg.append("g")
          .selectAll("path")
          .data(states)
          .join("path")
          .attr("fill", d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const rate = dataMap.get(stateName);
            return rate != null ? color(rate) : "#ccc"; // fallback color if no data
          })
          .attr("stroke", "gray") 
          .attr("stroke-width", 1)        
          .attr("d", path)
          .append("title")
          .text(d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const rate = dataMap.get(stateName);
            return `${d.properties.name}\n${selectedMetric.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}: ${rate ?? "No data"}`;
          });

        // State value labels
        svg.append("g")
          .attr("class", "state-labels")
          .selectAll("text")
          .data(states)
          .join("text")
          .attr("x", d => path.centroid(d)[0])
          .attr("y", d => path.centroid(d)[1])
          .text(d => {
            const stateName = d.properties.name.trim().toLowerCase();
            const rate = dataMap.get(stateName);
            return rate != null ? d3.format(".1f")(rate) : "";
          })
          .attr("fill", "black")
          .attr("font-size", "14px")
          .attr("text-anchor", "middle")
          .attr("alignment-baseline", "central");

        // Append to the DOM
        const container = ref.current;
        container.innerHTML = "";
        container.appendChild(svg.node());
      })
      .catch(err => console.error("Failed to load map data:", err))
    }, [aggData, selectedMetric]);

  return (
    <div className="choropleth-map-wrapper">
      <h2>Death Rate Choropleth Map</h2>
      <p>
        Interactive map showing the age-adjusted death rates per state.
        Choose between one or all of the top 10 leading causes of death in the US.<br/><br/>
        <strong>Insight:</strong><br/>
        There appears to be negative correlation between sightings (see Spike Map) and suicides. 
        Besides potentially unintentional injuries, suicide seems to be the most morbid among the leading causes - Word Cloud suggests that a significant portion of trigger events were morbid.
        This map supports the notion that many of such suicide-triggering hauntings may have happened where suicide rates were greatest such as in Montana, Wyoming, and New Mexico.
      </p>
      <label>
          Choose a metric (<i>per 100k capita</i>):{" "}
          <select value={selectedMetric} onChange={(e) => setSelectedMetric(e.target.value)}>
            <option value="death_rate_All causes">All Causes Death Rate</option>
            <option value="death_rate_Alzheimer's disease">Alzheimer's Death Rate</option>
            <option value="death_rate_Cancer">Cancer Death Rate</option>
            <option value="death_rate_CLRD">CLRD Death Rate</option>
            <option value="death_rate_Diabetes">Diabetes Death Rate</option>
            <option value="death_rate_Heart disease">Heart Disease Death Rate</option>
            <option value="death_rate_Influenza and pneumonia">Influenza and Pneumonia Death Rate</option>
            <option value="death_rate_Kidney disease">Kidney Disease Death Rate</option>
            <option value="death_rate_Suicide">Suicide Death Rate</option>
            <option value="death_rate_Unintentional injuries">Unintentional Injuries Death Rate</option>
          </select>
        </label>
      <div ref={ref}></div>
    </div>
  );
};

export default ChoroplethMap;