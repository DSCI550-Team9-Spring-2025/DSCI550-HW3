import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const ApparitionChart = () => {
  const ref = useRef();
  const [aggData, setAggData] = useState([]);
  const [filterSettings, setFilterSettings] = useState({
    time_of_day: "all",
    audio: null,
    visual: null,
    witness_min: 0,
    witness_max: Infinity,
    include_unknowns: false
    });
    const [chartWidth, setChartWidth] = useState(975);
    const [chartHeight, setChartHeight] = useState(630);

  // filter other extraneous features (time of day, audio/visual evidence, witness count)
  const applyFilters = (data, filters) => {
    return data.filter(d => {
      const passTime = filters.time_of_day === "all" || filters.time_of_day.includes(d.time_of_day);
      const passAudio = filters.audio === null || d.audio_evidence === filters.audio;
      const passVisual = filters.visual === null || d.visual_evidence === filters.visual;
      const count = +d.witness_count;
      const passWitness = count >= filters.witness_min && count <= filters.witness_max;
      const passUnknown = filters.include_unknowns || d.event !== "Unknown" && d.apparition_types_str !== "Unknown";
      return passTime && passAudio && passVisual && passWitness && passUnknown;
    });
  };

  // Load aggregate apparition json and does additional cleaning
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/ApparitionTypes/apparition_features.json")
      .then(res => res.json())
      .then(rawData => {
        const normalized = rawData.map(d => ({
        ...d,
        event: d["Event"],
        audio_evidence: d["Audio Evidence"] === "Yes",
        visual_evidence: !!d["Visual Evidence"],
        witness_count: parseInt(d["Witness Count"]) || 0,
      }));
      setAggData(normalized);
      })
      .catch(err => console.error("Failed to load data:", err));
  }, []);

  const extractApparitionTypes = (d, excludeUnknown = false) => {
    const types = d.apparition_types_str ? d.apparition_types_str.split(" ") : [];
    return excludeUnknown ? types.filter(t => t !== "Unknown") : types;
  };
  const prepareData = filtered => {
    const grouped = d3.rollups(
      filtered.flatMap(d =>
        extractApparitionTypes(d, !filterSettings.include_unknowns).map(type => ({
          event: d.event,
          type
        }))
      ),      v => v.length,
      d => d.type,
      d => d.event
    );

    // Flatten the event with apparition types
    const types = new Set();
    const flatData = [];
    grouped.forEach(([type, arr]) => {
      const entry = { type };
      let total = 0;
      arr.sort((a, b) => b[1] - a[1]); // Sorting by the count (second element of the array)
      arr.forEach(([event, count]) => {
        entry[event] = count;
        total += count;
        types.add(event);
      });
      entry.total = total;
      flatData.push(entry);
    });
    const eventSet = new Set();
    grouped.forEach(([type, arr]) => {
      arr.forEach(([event]) => eventSet.add(event));
    });
    return { data: flatData, types: Array.from(types), eventTypes: Array.from(eventSet) };
  };

  useEffect(() => {
    const filtered = applyFilters(aggData, filterSettings);
    const { data: chartDataRaw, types, eventTypes } = prepareData(filtered);
    const chartData = chartDataRaw.sort((a, b) => b.total - a.total);
    
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const margin = { top: 50, right: 30, bottom: 100, left: 60 };
    const width = 975 - margin.left - margin.right;
    const height = 630 - margin.top - margin.bottom;

    setChartWidth(975);
    setChartHeight(630);


    const chart = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    // Create the scales
    const x0 = d3.scaleBand()
      .domain(chartData.map(d => d.type))      
      .range([0, width])
      .paddingInner(0.2); // Apparition Types
      const x1 = d3.scaleBand().domain(eventTypes).range([0, x0.bandwidth()]).padding(0.05); // Event Types
      const y = d3.scaleLinear()
      .domain([0, d3.max(chartData, d =>
        eventTypes.reduce((sum, k) => sum + (d[k] || 0), 0)
      )])
      .nice()
      .range([height, 0]);

    // Add chart axes
    chart.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x0))
      .selectAll("text")
      .style("fill", "white");

    chart.append("g").call(d3.axisLeft(y))
      .selectAll("text")
      .style("fill", "white");

    // Color scale for event Types
    const colorScale = d3.scaleOrdinal()
      .domain(eventTypes)
      .range(d3.schemeTableau10);

    // Render grouped bars
    const stack = d3.stack().keys(eventTypes);
    const stackedData = stack(chartData);
    
    const group = chart.selectAll("g.layer")
      .data(stackedData)
      .enter().append("g")
      .attr("class", "layer")
      .attr("fill", d => colorScale(d.key));
    
    group.selectAll("rect")
      .data(d => d)
      .enter().append("rect")
      .attr("x", d => x0(d.data.type))
      .attr("y", d => y(d[1]))
      .attr("height", d => y(d[0]) - y(d[1]))
      .attr("width", x0.bandwidth());
    

    // Add number labels to top of bars
    chart.selectAll("text.bar-label")
      .data(chartData)
      .enter()
      .append("text")
      .attr("class", "bar-label")
      .attr("x", d => x0(d.type) + x0.bandwidth() / 2)
      .attr("y", d => y(d.total) - 5)
      .attr("text-anchor", "middle")
      .style("fill", "white")
      .style("font-size", "10px")
      .text(d => d.total);

    // Add legend information
    const legend = svg.append("g").attr("transform", `translate(${margin.left},${height + margin.top + 20})`);
    eventTypes.forEach((type, i) => {
      const g = legend.append("g").attr("transform", `translate(${i * 100}, 0)`);
      g.append("rect").attr("width", 12).attr("height", 12).attr("fill", colorScale(type));
      g.append("text")
        .attr("x", 16)
        .attr("y", 10)
        .style("font-size", "10px")
        .style("fill", "white")
        .text(type);    });
  }, [aggData, filterSettings]);

  return (
    <div className="apparition-features-wrapper">
      <h2>Apparition Characteristics</h2>
      <p>
        Keyword match and extracted apparition types from the haunted places descriptions.<br/><br/>
        <strong>Insight:</strong><br/>
        "Ghost" overwhelmingly dominate apparition landscape being 2.7x more frequently occuring the next largest apparition, "spirit".  likely because ghostly figures are deeply embedded in cultural beliefs about being haunted by those who have passed with unfinished business from Earth.
        The vast majority of apparitions are associated with "Supernatural" elements followed by "murder" related events. The origins of these hauntings can be traced back to the idea that unnatural disturbances and deaths can serve as the catalyst for paranormal activity.  
        When looking at the availability of audio and visual evidence, there is more prevalence of audio evidence (whispers, footsteps, creaks) likely because it is far easier to record sounds in dark or fast-moving situations. Capturing visual proof (photos, footage, videos) can be especially tricky with elusive apparitions and creatures compounded with the technological challenges and panic that may ensue with these near encounters.
        Apparitions spike significantly during Dusk - nearly 6x more than in Morning. As daylight fades, reduced visibility and heightened environmental sensitivity may amplify the perception of supernatural activity, making Dusk a prime window for encounters with apparitions.
      </p>
      <div
        className="filters"
        style={{ marginBottom: "1rem", textAlign: "center" }}
      >
        <label>
          Time of Day: 
          <select
            onChange={(e) => setFilterSettings(prev => ({ ...prev, time_of_day: e.target.value }))}
            value={filterSettings.time_of_day}
          >
            <option value="all">All</option>
            <option value="Morning">Morning</option>
            <option value="Dusk">Dusk</option>
            <option value="Evening">Evening</option>
          </select>
        </label>

        <label>
          Audio Evidence:
          <select
            onChange={(e) =>
              setFilterSettings(prev => ({
                ...prev,
                audio: e.target.value === "all" ? null : e.target.value === "true"
              }))
            }
            value={filterSettings.audio === null ? "all" : filterSettings.audio.toString()}
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label>
          Visual Evidence:
          <select
            onChange={(e) =>
              setFilterSettings(prev => ({
                ...prev,
                visual: e.target.value === "all" ? null : e.target.value === "true"
              }))
            }
            value={filterSettings.visual === null ? "all" : filterSettings.visual.toString()}
          >
            <option value="all">All</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>

        <label>
          Min Witnesses:
          <input
            type="number"
            value={filterSettings.witness_min}
            onChange={e =>
              setFilterSettings(prev => ({ ...prev, witness_min: parseInt(e.target.value) || 0 }))
            }
            style={{ width: "60px", marginLeft: "5px" }}
          />
        </label>

        <label>
          Max Witnesses:
          <input
            type="number"
            value={filterSettings.witness_max === Infinity ? "" : filterSettings.witness_max}
            onChange={e =>
              setFilterSettings(prev => ({
                ...prev,
                witness_max: e.target.value === "" ? Infinity : parseInt(e.target.value)
              }))
            }
            style={{ width: "60px", marginLeft: "5px" }}
          />
        </label>

        <label>
          <input
            type="checkbox"
            checked={filterSettings.include_unknowns}
            onChange={(e) =>
              setFilterSettings(prev => ({
                ...prev,
                include_unknowns: e.target.checked
              }))
            }
          />
          Include Unknowns
        </label>
      </div>
      <div style={{ marginBottom: "1rem", textAlign: "center" }}>
        <svg ref={ref} width={chartWidth} height={chartHeight}></svg>
      </div>
    </div>
  );
};

export default ApparitionChart;