class DonutChart {
  constructor(_parentElement) {
    this.parentElement = _parentElement;
    this.initVis();
  }

  initVis() {
    const vis = this;

    //vis.data = calls.sort((a, b) => (a.clase > b.clase ? 1 : -1));
    vis.margin = { top: 100, right: 0, bottom: 0, left: 0 };
    vis.width = 460 - vis.margin.left - vis.margin.right;
    vis.height = 460 - vis.margin.top - vis.margin.bottom;
    vis.innerRadius = 90;
    vis.outerRadius = Math.min(vis.width, vis.height) / 2; // the outerRadius goes from the middle of the vis.svg area to the border

    // append the vis.svg object
    vis.svg = d3
      .select(vis.parentElement)
      .append("svg")
      .attr("width", vis.width + vis.margin.left + vis.margin.right)
      .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
      .append("g")
      .attr(
        "transform",
        "translate(" +
          (vis.width / 2 + vis.margin.left) +
          "," +
          (vis.height / 2 + vis.margin.top) +
          ")"
      );
    vis.svg.append("g").attr("class", "legends");
    vis.svg.append("g").attr("class", "slices");
    vis.svg.append("g").attr("class", "labels");

    //vis.color = vis.color =d3.scaleOrdinal(d3.schemeAccent);
    vis.color = d3
      .scaleOrdinal()
      .domain(["alto", "medio", "bajo"])
      .range(["rgb(89, 161, 79)", "rgb(237, 201, 73)", "rgb(128, 177, 211)"]);

    vis.updateVis();
    vis.addLegend();
  }

  updateVis() {
    const vis = this;
    vis.data = calls.sort((a, b) => (a.clase > b.clase ? 1 : -1));
    console.log(vis.data);
    vis.t = d3.transition().duration(750);

    d3.select(".slices").selectAll("path").remove();
    d3.select(".labels").selectAll("g").remove();

    // Scales
    vis.x = d3
      .scaleBand()
      .range([0, 2 * Math.PI]) // X axis goes from 0 to 2pi = all around the circle. If I stop at 1Pi, it will be around a half circle
      .align(0) // This does nothing
      .domain(
        vis.data.map(function (d) {
          return d.ciudad;
        })
      ); // The domain of the X axis is the list of states.
    vis.y = d3
      .scaleRadial()
      .range([vis.innerRadius, vis.outerRadius]) // Domain will be define later.
      .domain([0, 14000]); // Domain of Y is from 0 to the max seen in the vis.data

    // Add the bars
    vis.slice = vis.svg
      .select(".slices")
      .selectAll("path.slice")
      .data(vis.data);
    vis.slice
      .enter()
      .append("path")
      .attr("fill", (d) => vis.color(d.clase))
      .transition(vis.t)
      .attr(
        "d",
        d3
          .arc() // imagine your doing a part of a donut plot
          .innerRadius(vis.innerRadius)
          .outerRadius(function (d) {
            return vis.y(5000);
          })
          .startAngle(function (d) {
            return vis.x(d.ciudad);
          })
          .endAngle(function (d) {
            return vis.x(d.ciudad) + vis.x.bandwidth();
          })
          .padAngle(0.01)
          .padRadius(vis.innerRadius)
      );

    // Add the cities
    vis.texts = vis.svg.select(".labels").selectAll("g").data(vis.data);
    vis.texts
      .enter()
      .append("g")
      .attr("text-anchor", function (d) {
        return (vis.x(d.ciudad) + vis.x.bandwidth() / 2 + Math.PI) %
          (2 * Math.PI) <
          Math.PI
          ? "end"
          : "start";
      })
      .attr("transform", function (d) {
        return (
          "rotate(" +
          (((vis.x(d.ciudad) + vis.x.bandwidth() / 2) * 180) / Math.PI - 90) +
          ")" +
          "translate(" +
          (vis.y(5000) + 10) +
          ",0)"
        );
      })
      .append("text")
      .attr("class", "ciudad")
      .text(function (d) {
        return d.ciudad;
      })
      .on("click", function (d) {
        selectedCity = d.ciudad;

        dataCiudad = getDataByCiudad();
        barChart.updateVis();
      })
      .on("mouseover", function (d, i) {
        d3.select(this).transition().duration("50").attr("opacity", ".50");
      })
      .on("mouseout", function (d, i) {
        d3.select(this).transition().duration("50").attr("opacity", "1");
      })
      .attr("transform", function (d) {
        return (vis.x(d.ciudad) + vis.x.bandwidth() / 2 + Math.PI) %
          (2 * Math.PI) <
          Math.PI
          ? "rotate(180)"
          : "rotate(0)";
      })

      .style("font-size", "11px")
      .attr("alignment-baseline", "middle");

    $(".ciudad").on("click", function (e) {
      selectedCity = e.target.innerHTML;

      dataCiudad = getDataByCiudad();
      barChart.updateVis();
      $("#right-clasificacion-title").text(
        "Servicios para la ciudad " + selectedCity
      );
    });
  }
  addLegend() {
    const vis = this;

    const legend = vis.svg.select("g.legends").append("g");

    const legendArray = [
      { label: "Bajo", color: vis.color("bajo") },
      { label: "Medio", color: vis.color("medio") },
      { label: "Alto", color: vis.color("alto") },
    ];

    const legendRow = legend
      .selectAll(".legendRow")
      .data(legendArray)
      .enter()
      .append("g")
      .attr("class", "legendRow")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

    legendRow
      .append("rect")
      .attr("class", "legendRect")
      .attr("width", 10)
      .attr("height", 10)
      .attr("fill", (d) => d.color);

    legendRow
      .append("text")
      .attr("class", "legendText")
      .attr("x", -10)
      .attr("y", 10)
      .attr("text-anchor", "end")
      .text((d) => d.label);
  }
}
