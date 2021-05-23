class LineChart {
  // constructor function - make a new visualization object.
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.initVis();
  }

  // initVis method - set up static parts of our visualization.
  initVis() {
    const vis = this;

    vis.MARGIN = { LEFT: 100, RIGHT: 100, TOP: 30, BOTTOM: 30 };
    vis.WIDTH = 1200 - vis.MARGIN.LEFT - vis.MARGIN.RIGHT;
    vis.HEIGHT = 350 - vis.MARGIN.TOP - vis.MARGIN.BOTTOM;
    vis.tooltip = { width: 100, height: 100, x: 10, y: -30 };

    vis.svg = d3
      .select(vis.parentElement)
      .append("svg")
      .attr("width", vis.WIDTH + vis.MARGIN.LEFT + vis.MARGIN.RIGHT)
      .attr("height", vis.HEIGHT + vis.MARGIN.TOP + vis.MARGIN.BOTTOM);

    vis.g = vis.svg
      .append("g")
      .attr("transform", `translate(${vis.MARGIN.LEFT}, ${vis.MARGIN.TOP})`);

    // time parsers/formatters
    vis.parseTime = d3.timeParse("%m/%d/%Y %H:%M");
    vis.formatTime = d3.timeFormat("%m/%d/%Y %H:%M");
    // for tooltip
    vis.bisectDate = d3.bisector((d) => d.fecha).left;

    // add the line for the first time
    vis.g
      .append("path")
      .attr("class", "line")
      .attr("fill", "none")
      .attr("stroke", "grey")
      .attr("stroke-width", "3px");

    vis.yLabel = vis.g
      .append("text")
      .attr("class", "y axisLabel")
      .attr("transform", "rotate(-90)")
      .attr("y", -60)
      .attr("x", -170)
      .attr("font-size", "20px")
      .attr("text-anchor", "middle")
      .text("Trafico (Gbps)");

    // scales
    vis.x = d3.scaleTime().range([0, vis.WIDTH]);
    vis.y = d3.scaleLinear().range([vis.HEIGHT, 0]);

    // axis generators
    vis.xAxisCall = d3.axisBottom().ticks(5);
    vis.yAxisCall = d3
      .axisLeft()
      .ticks(6)
      .tickFormat((d) => `${parseInt(d / 1000)}k`);

    // axis groups
    vis.xAxis = vis.g
      .append("g")
      .attr("class", "x axis")
      .attr("transform", `translate(0, ${vis.HEIGHT})`);
    vis.yAxis = vis.g.append("g").attr("class", "y axis");
    vis.updateVis();
  }

  // updateVis method - updating our elements to match the new data.
  updateVis() {
    const vis = this;
    vis.rangeValues = [new Date(date1).getTime(), new Date(date2).getTime()];
    vis.sliderValuesFormat = vis.rangeValues.map(
      (val) => new Date(vis.formatTime(val))
    );

    vis.dataTimeFiltered = filteredData.filter((d) => {
      return (
        d.fecha >= vis.sliderValuesFormat[0] &&
        d.fecha <= vis.sliderValuesFormat[1]
      );
    });

    vis.t = d3.transition().duration(1000);

    // update scales
    vis.x.domain(d3.extent(vis.dataTimeFiltered, (d) => d.fecha));
    vis.y.domain([
      d3.min(vis.dataTimeFiltered, (d) => d.trafico),
      d3.max(vis.dataTimeFiltered, (d) => d.trafico),
    ]);
    console.log(
      "y values",
      d3.min(vis.dataTimeFiltered, (d) => d.trafico),
      d3.max(vis.dataTimeFiltered, (d) => d.trafico)
    );

    // fix for format values
    const formatSi = d3.format(".2s");
    function formatAbbreviation(x) {
      const s = formatSi(x);
      return x + " Gbps";
    }

    // update axes
    vis.xAxisCall.scale(vis.x);
    vis.xAxis.transition(vis.t).call(vis.xAxisCall);
    vis.yAxisCall.scale(vis.y);
    vis.yAxis
      .transition(vis.t)
      .call(vis.yAxisCall.tickFormat(formatAbbreviation));

    // clear old tooltips
    vis.g.select(".focus").remove();
    vis.g.select(".overlay").remove();

    //******************************** Tooltip  ********************************/

    vis.focus = vis.g
      .append("g")
      .attr("class", "focus")
      .style("display", "none");

    vis.focus
      .append("line")
      .attr("class", "x-hover-line hover-line")
      .attr("y1", 0)
      .attr("y2", vis.HEIGHT);

    vis.focus
      .append("line")
      .attr("class", "y-hover-line hover-line")
      .attr("x1", 0)
      .attr("x2", vis.WIDTH);

    vis.focus.append("circle").attr("r", 7.5);

    vis.focus.append("text").attr("x", 15).attr("dy", ".31em");

    vis.g
      .append("rect")
      .attr("class", "overlay")
      .attr("width", vis.WIDTH)
      .attr("height", vis.HEIGHT)
      .on("mouseover", () => vis.focus.style("display", null))
      .on("mouseout", () =>
        vis.focus
          .style("display", "none")
          .style("left", d3.event.pageX + "px")
          .style("top", d3.event.pageY - 28 + "px")
      )
      .on("mousemove", mousemove);

    function mousemove() {
      const x0 = vis.x.invert(d3.mouse(this)[0]);
      const i = vis.bisectDate(vis.dataTimeFiltered, x0, 1);

      const d0 = vis.dataTimeFiltered[i - 1]
        ? vis.dataTimeFiltered[i - 1]
        : { "": "" };
      const d1 = vis.dataTimeFiltered[i] ? vis.dataTimeFiltered[i] : { "": "" };
      const d = x0 - d0.fecha > d1.fecha - x0 ? d1 : d0;
      vis.focus.attr(
        "transform",
        `translate(${vis.x(d.fecha)}, ${vis.y(d.trafico)})`
      );
      vis.focus
        .select("text")
        .html(
          "<tspan  x='0' dy='20'>" +
            d.trafico +
            " Gbps </tspan>" +
            "<tspan  x='0' dy='20'>" +
            vis.formatTime(new Date(d.fecha).getTime()) +
            " </tspan>"
        ); //text(d.trafico); // .html(d.trafico + "<br/> " + vis.formatTime(new Date(d.fecha).getTime()));
      vis.focus
        .select(".x-hover-line")
        .attr("y2", vis.HEIGHT - vis.y(d.trafico));
      vis.focus.select(".y-hover-line").attr("x2", -vis.x(d.fecha));
    }

    // Path generator
    vis.line = d3
      .line()
      .x((d) => vis.x(d.fecha))
      .y((d) => vis.y(d.trafico));

    // Update our line path
    vis.g
      .select(".line")
      .attr("stroke", "rgb(179, 205, 227)")
      .transition(vis.t)
      .attr("d", vis.line(vis.dataTimeFiltered));
  }
}
