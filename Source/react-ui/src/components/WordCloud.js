import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import d3Cloud from 'd3-cloud';

const WordCloud = () => {
  const containerRef = useRef();
  const [descriptionsText, setDescriptionsText] = useState("");
  const [fileIndex, setFileIndex] = useState(1);

  // Rotate descriptions every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setFileIndex(prev => (prev < 50 ? prev + 1 : 1));
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  

  // Load description
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + `/WordCloud/descriptions_${fileIndex}.json`)
      .then(res => res.json())
      .then(json => {
        const descriptions = json
          .filter(desc => typeof desc === "string" && desc.trim() !== "")
          .join(" ");
        setDescriptionsText(descriptions);
      })
      .catch(err => console.error("Failed to load data:", err));
  }, [fileIndex]);

  // Load WordCloud
  useEffect(() => {
    if (!descriptionsText || typeof descriptionsText !== "string") return;

    const words = descriptionsText.split(/\W+/g).filter(word => word.length > 2);
    const frequency = d3.rollup(words, v => v.length, d => d.toLowerCase());
    const wordArray = Array.from(frequency, ([text, size]) => ({ text, size }));

    const width = 800;
    const height = 500;
    const fontFamily = "sans-serif";
    const fontScale = 10;

    const svg = d3.create("svg")
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height)
      .style("font-family", fontFamily)
      .style("text-anchor", "middle");

      const g = svg.append("g")
      .attr("transform", `translate(0, 0)`);    

    const layout = d3Cloud()
      .size([width, height])
      .words(wordArray)
      .padding(5)
      .rotate(() => ~~(Math.random() * 2) * 90)
      .font(fontFamily)
      .fontSize(d => Math.sqrt(d.size) * fontScale)
      .on("word", ({ size, x, y, rotate, text }) => {
        g.append("text")
          .attr("font-size", size)
          .attr("fill", () => d3.schemePuBu[9][Math.floor(Math.random() * 9)])
          .attr("transform", `translate(${x},${y}) rotate(${rotate})`)
          .text(text);
      });

    layout.start();

    const container = containerRef.current;
    container.innerHTML = "";
    container.appendChild(svg.node());

    return () => layout.stop();
  }, [descriptionsText]);

  return (
    <div className="wordcloud-wrapper">
      <h2>Word Cloud</h2>
      <p>
        Illustrates frequent words used in sighting descriptions.
        Cycles through ~200 sighting descriptions at a time.<br/><br/>
        <strong>Insight:</strong><br/>
        Many of the larger words indicate common settings such as at a school or cemetery, 
        as well as insight into the type of event that may have triggered the haunting such as a fire or murder.
        These commonalities suggest that many of these sightings were triggered by dark, tragic events in public areas.
      </p>
      <div ref={containerRef}></div>
    </div>
  );
};

export default WordCloud;
