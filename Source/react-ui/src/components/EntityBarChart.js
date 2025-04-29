import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const EntityBarChart = () => {
  const svgRef = useRef();
  const [data, setData] = useState([]);
  const [sortOrder, setSortOrder] = useState("desc");

  // Fetch the data
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/EntityBarChart/spacy_entities.json")
      .then(res => res.json())
      .then(json => {
        const parsed = Object.entries(json).map(([label, count]) => ({
          label,
          count
        }));
        setData(parsed);
      });
  }, []);

  // Draw chart when data or sortOrder changes
  useEffect(() => {
    if (!data.length) return;

    const sorted = [...data];
    if (sortOrder === "asc") sorted.sort((a, b) => a.count - b.count);
    if (sortOrder === "desc") sorted.sort((a, b) => b.count - a.count);
    if (sortOrder === "az") sorted.sort((a, b) => d3.ascending(a.label, b.label));
    if (sortOrder === "za") sorted.sort((a, b) => d3.descending(a.label, b.label));

    const width = 700;
    const height = 400;
    const margin = { top: 20, right: 10, bottom: 40, left: 50 };

    const x = d3.scaleBand()
      .domain(sorted.map(d => d.label))
      .range([margin.left, width - margin.right])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, d3.max(sorted, d => d.count)]).nice()
      .range([height - margin.bottom, margin.top]);

    const svg = d3.select(svgRef.current)
    .attr("viewBox", [0, 0, width, height])
    .attr("preserveAspectRatio", "xMidYMid meet") // add this line
    .attr("width", "100%") // fluid width
    .attr("height", "auto"); // dynamic height
    svg.selectAll("*").remove(); // clear previous

    svg
      .attr("width", width)
      .attr("height", height)
      .style("font", "10px sans-serif");

    svg.append("g")
      .selectAll("rect")
      .data(sorted)
      .join("rect")
      .attr("fill", "#6BADCE")
      .attr("x", d => x(d.label))
      .attr("y", d => y(d.count))
      .attr("height", d => y(0) - y(d.count))
      .attr("width", x.bandwidth());

    svg.append("g")
      .attr("transform", `translate(0,${height - margin.bottom})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-20)")
      .style("text-anchor", "end");

    svg.append("g")
      .attr("transform", `translate(${margin.left},0)`)
      .call(d3.axisLeft(y));
  }, [data, sortOrder]);

  return (
    <div className="barchart-wrapper">
      <h2>Named Entity Sortable Bar Chart</h2>
      <p>
        SpaCy-recognized named-entities across all sighting descriptions.<br/><br/>
        <strong>Insight:</strong><br/>
        The most frequent named entity type was <small>DATE</small>. Together with <small>TIME</small>, the chart suggests that the sightings were well-documented temporally. 
        With strong nighttime indicators from WordCloud, the sightings seem to predominately take place at night which of course makes sense... spooky! 
        By slight contrast, there also seems to be not nearly as many location-based entities (<small>FAC</small>, <small>LOC</small>, not including <small>GPE</small> which is already given in "city" and "state" fields). 
        This indicates that these sightings were not very descriptive spatially and that the hauntings affect not just landmarks, but many generic/unnamed locations.
      </p>
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <label htmlFor="sort-order">Sort by: </label>
        <select
          id="sort-order"
          className="sort-dropdown"
          onChange={e => setSortOrder(e.target.value)}
          value={sortOrder}
        >
          <option value="desc">Count ↓</option>
          <option value="asc">Count ↑</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>
      <svg ref={svgRef}></svg>
    </div>
  );
  
};

export default EntityBarChart;
