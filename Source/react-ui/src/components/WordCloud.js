import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import d3Cloud from 'd3-cloud';

const WordCloud = () => {
  const containerRef = useRef();
  const [descriptionsText, setDescriptionsText] = useState(""); // <-- it's a string now

  // Load description
  useEffect(() => {
    fetch(process.env.PUBLIC_URL + "/WordCloud/descriptions_1.json")
      .then(res => res.json())
      .then(json => {
        const descriptions = json
          .filter(desc => typeof desc === "string" && desc.trim() !== "")
          .join(" ");
        setDescriptionsText(descriptions);
      })
      .catch(err => console.error("Failed to load data:", err));
  }, []);

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
          .attr("fill", d3.schemeCategory10[Math.floor(Math.random() * 10)])
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
      <div ref={containerRef}></div>
    </div>
  );
};

export default WordCloud;
