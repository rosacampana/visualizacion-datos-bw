let allCalls;
let calls;
let nestedCalls;
let donutChart;
let lineChart;
let barChart;
let date1 = "1/1/2021 00:00";
let date2 = "1/30/2021 00:00";
let selectedYear = 2020;
let selectedCity = "";
let range1 = 10;
let range2 = 50;
let alto = [50, 100];
let bajo = [0, 30];
let medio = [30, 50];
let filteredData = {};
let dataAnio = [];
let dataAllAnio = [];
let dataClase = [];
let dataAllCiudad = [];
let dataCiudad = [];

const color = d3.scaleOrdinal(d3.schemePastel1);

const parseTime = d3.timeParse("%m/%d/%Y %H:%M");
const formatTime = d3.timeFormat("%m/%d/%Y %H:%M");

/* trafico */
d3.csv("data/dataTrafico.csv").then((data) => {
  data.forEach((d) => {
    d.trafico = Number(d.trafico);
    d.fecha = parseTime(d.fecha);
  });
  filteredData = data;

  lineChart = new LineChart("#vis-trafico");
});

/* clasificacion */
d3.csv("data/dataTraficoPorCiudad.csv").then((data) => {
  data.forEach((d) => {
    d.trafico = Number(d.trafico);
    d.anio = Number(d.anio);
  });
  dataAllAnio = data;
  dataAnio = data.filter((d) => {
    return d.anio == selectedYear;
  });
  dataClase = getInitialData();
  allCalls = dataClase;
  calls = dataClase;

  nestedCalls = d3
    .nest()
    .key((d) => d.clase)
    .entries(calls);
  donutChart = new DonutChart("#left-clasificacion");
  barChart = new BarChart("right-clasificacion");
});

d3.csv("data/dataServiciosPorCiudad.csv").then((data) => {
  data.forEach((d) => {
    d.valor = Number(d.valor);
  });
  dataAllCiudad = data;
  dataCiudad = getDataByCiudad();
  barChart = new BarChart("#right-clasificacion");
});

function brushedVis() {
  lineChart.updateVis();
}

function getInitialData() {
  let min = d3.min(dataAnio, (d) => d.trafico);
  let max = d3.max(dataAnio, (d) => d.trafico);
  range1 = Math.round(max / 3);
  range2 = Math.round(2 * range1);

  bajo = [min, range1];
  medio = [range1, range2];
  alto = [range2, max];
  console.log("ranges initial", bajo, medio, alto);
  return dataAnio.map(getType);
}
function getDataByRanges() {
  let min = d3.min(dataAnio, (d) => d.trafico);
  let max = d3.max(dataAnio, (d) => d.trafico);
  bajo = [min, range1];
  medio = [range1, range2];
  alto = [range2, max];
  console.log("ranges by slider", bajo, medio, alto);
  return dataAnio.map(getType);
}

function getDataByCiudad() {
  return dataAllCiudad
    .filter((d) => {
      return d.ciudad == selectedCity;
    })
    .map((x) => {
      return {
        servicio: x.servicio,
        valor: x.valor,
      };
    });
}

function getType(d) {
  var clasificacion = "";

  if (d.trafico >= bajo[0] && d.trafico < bajo[1]) {
    clasificacion = "bajo";
  } else {
    if (d.trafico >= medio[0] && d.trafico <= medio[1]) {
      clasificacion = "medio";
    } else {
      clasificacion = "alto";
    }
  }
  return {
    ciudad: d.ciudad,
    trafico: d.trafico,
    clase: clasificacion,
  };
}

/******* controls********/

$(function () {
  $('input[name="daterange"]').daterangepicker(
    {
      opens: "left",
    },
    function (start, end, label) {
      date1 = start.format("MM/DD/YYYY 00:00");
      date2 = end.format("MM/DD/YYYY 23:59");

      lineChart.updateVis();
    }
  );

  $("#slider-range").slider({
    range: true,
    min: bajo[0],
    max: alto[1],
    values: [medio[0], medio[1]],
    slide: function (event, ui) {
      range1 = ui.values[0];
      range2 = ui.values[1];

      calls = getDataByRanges();
      donutChart.updateVis();
      $("#slider-range").slider("values", range1, range2);
    },
  });
  $(".anio").on("click", function (e) {
    selectedYear = e.target.innerHTML.trim();
    console.log(selectedYear);
    dataAnio = dataAllAnio.filter((d) => {
      return d.anio == selectedYear;
    });
    calls = getDataByRanges();
    donutChart.updateVis();
  });
});
