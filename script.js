// COPYRIGHT 2018-2020 KingVA LLC.

var canvas;
var animInterval;
var ctx;
var resolution = 8;
var time_left = 1;

var initial_price = 0;
var initial_vol = 0;
var vol_range = 0;
var initial_stdev = 0;
var risk_free = 0;

var initial_dte = 1;

var numLegs = 0;
// quantity, isCall, strike_price, dte
var legs = [];


var max_p = 0;
var max_l = 0;

var brightgreen = "rgba(0, 255, 0, 0.7)";
var brightred = "rgba(255, 0, 0, 0.7)";
var lightgreen = "rgba(0, 255, 0, 0.3)";
var lightred = "rgba(255, 0, 0, 0.3)";


function initialize() {
  canvas = document.getElementById("pvtgraph");
  // window.addEventListener('mousemove', updateInfo, false);
  //window.addEventListener('click', updateInfo, false);
  addEvent(canvas, 'mousemove', updateInfo);
  addEvent(canvas, 'click', updateInfo);

  ctx = canvas.getContext("2d");

  ctx.font = "48px Courier";
  ctx.fillText("ERROR in Javascript. Reload.", 10, 50);

  var pl_matrix = new Array(canvas.width / resolution);
  for (var cnt = 0; cnt < pl_matrix.length; cnt++) {
    pl_matrix[cnt] = new Array(canvas.height / resolution);
  }

  update();

  addRow();
}


function addEvent(element, eventName, callback) {
  if (element.addEventListener) {
    element.addEventListener(eventName, callback, false);
  } else if (element.attachEvent) {
    element.attachEvent("on" + eventName, callback);
  }
}


function update() {
  resetValues();

  initial_price = Number(document.getElementsByName("sel_price")[0].value);
  initial_vol = Number(document.getElementsByName("sel_vol")[0].value) / 100;
  initial_stdev = Number(document.getElementsByName("sel_stdev")[0].value);
  risk_free = 0.01 * Number(document.getElementsByName("sel_riskfree")[0].value);

  for (var i = 0; i < document.getElementsByName("sel_quantity").length; i++) {
    document.getElementsByName("sel_legprice")[i].value = Math.abs(Number(document.getElementsByName("sel_legprice")[i].value));
    legs.push({
      quantity: Number(document.getElementsByName("sel_quantity")[i].value),
      dte: Number(document.getElementsByName("sel_dte")[i].value),
      strike_price: Number(document.getElementsByName("sel_strike")[i].value),
      //vol: 0.01 * Number(document.getElementsByName("sel_vol")[0].value),
      isCall: document.getElementsByName("sel_optionType")[2 * i].checked,
      purchase_price: Number(document.getElementsByName("sel_legprice")[i].value),
      zero_value: 0
    });
  }


  document.getElementsByName("sel_timeleft")[0].disabled = false;
  document.getElementsByName("sel_timeleft")[0].setAttribute("min", 0);

  initial_dte = Math.max.apply(Math, legs.map(function (legs) { return legs.dte; }));
  document.getElementsByName("sel_timeleft")[0].setAttribute("max", initial_dte);
  if (!document.getElementsByName("sel_timeleft")[0].disabled) {
    time_left = Number(document.getElementsByName("sel_timeleft")[0].value);
    document.getElementById("lbl_timeleft").innerHTML = time_left + " DTE";
  }

  document.getElementById("lbl_stdev").innerHTML = " ± " + initial_stdev;

  document.getElementsByName("sel_volrange")[0].disabled = false;
  document.getElementsByName("sel_volrange")[0].setAttribute("min", 0);
  document.getElementsByName("sel_volrange")[0].setAttribute("max", initial_vol * 100);
  vol_range = Number(document.getElementsByName("sel_volrange")[0].value) / 100;

  document.getElementById("lbl_volrange").innerHTML = " ± " + (vol_range * 100).toFixed(0) + "%";
  /*for (var i = 0; i < legs.length; i++) {
      var leg = legs[i];
      leg['zero_value'] = leg['quantity']*leg['purchase_price'];//BlackScholes(leg['isCall'] ? "c" : "p", initial_price, leg['strike_price'], leg['dte']/365, risk_free, leg['vol']);
  }*/


  brightgreen = "rgba(0, 255, 0, 0.7)";
  brightred = "rgba(255, 0, 0, 0.7)";
  lightgreen = "rgba(0, 255, 0, 0.3)";
  lightred = "rgba(255, 0, 0, 0.3)";


  fillCanvas();
}


function resetValues() {
  time_left = 1;

  initial_price = 0;
  initial_vol = 0;
  initial_stdev = 0;
  risk_free = 0;

  initial_dte = 1;

  numLegs = 0;
  legs = new Array();

  max_p = 0;
  max_l = 0;

  pl_matrix = new Array(canvas.width / resolution);
  for (var cnt = 0; cnt < pl_matrix.length; cnt++) {
    pl_matrix[cnt] = new Array(canvas.height / resolution);
  }
}


function fillCanvas() {
  populateMatrix();

  for (x = 0; x < pl_matrix.length; x++) {
    for (y = 0; y < pl_matrix[0].length; y++) {
      if (pl_matrix[x][y] > max_p) {
        max_p = pl_matrix[x][y];
      } else if (pl_matrix[x][y] < max_l) {
        max_l = pl_matrix[x][y];
      }
    }
  }


  for (x = 0; x < pl_matrix.length; x++) {
    for (y = 0; y < pl_matrix[0].length; y++) {
      var pl = pl_matrix[x][y];
      if (pl > 0) {

        ctx.fillStyle = rgbToHex(0, Math.round(Math.abs(255 * (pl / max_p))), 0);

      } else {

        ctx.fillStyle = rgbToHex(Math.round(Math.abs(pl / max_l) * 255), 0, 0);

      }
      ctx.fillRect(x * resolution, y * resolution, (x + 1) + resolution, (y + 1) + resolution);
    }
  }

  ctx.fillStyle = "#ffffff";

  ctx.font = "14px Arial";
  ctx.fillText(Math.round((Math.round(vol_range * 100) + initial_vol * 100)) + "% IV", canvas.width / 2, 20);
  ctx.fillText(Math.round((initial_vol * 100 - Math.round(vol_range * 100))) + "% IV", canvas.width / 2, canvas.height - 10);
  ctx.fillText("+" + initial_stdev + " Ïƒ", canvas.width - 40, canvas.height / 2 - 2);
  ctx.fillText("+" + initial_stdev / 2 + " Ïƒ", 3 * canvas.width / 4 + 10, canvas.height / 2 - 2);
  ctx.fillText("-" + initial_stdev + " Ïƒ", 5, canvas.height / 2 - 2);
  ctx.fillText("-" + initial_stdev / 2 + " Ïƒ", 1 * canvas.width / 4 + 10, canvas.height / 2 - 2);

  ctx.fillText("$" + (Math.round((initial_price + initial_stdev * initial_vol * initial_price) * 100) / 100).toFixed(2), canvas.width - 50, canvas.height / 2 + 16);
  ctx.fillText("$" + (Math.round((initial_price + initial_stdev * initial_vol * initial_price / 2) * 100) / 100).toFixed(2), 3 * canvas.width / 4 + 10, canvas.height / 2 + 16);
  ctx.fillText("$" + (Math.round((initial_price - initial_stdev * initial_vol * initial_price) * 100) / 100).toFixed(2), 5, canvas.height / 2 + 16);
  ctx.fillText("$" + (Math.round((initial_price - initial_stdev * initial_vol * initial_price / 2) * 100) / 100).toFixed(2), 1 * canvas.width / 4 + 10, canvas.height / 2 + 16);

  ctx.fillText(Math.round(initial_vol * 100) + "% IV", canvas.width / 2, canvas.height / 2 - 2);
  ctx.fillText("$" + initial_price, canvas.width / 2, canvas.height / 2 + 16);

  ctx.strokeStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(3 * canvas.width / 4, canvas.height / 2 + 10);
  ctx.lineTo(3 * canvas.width / 4, canvas.height / 2 - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(1 * canvas.width / 4, canvas.height / 2 + 10);
  ctx.lineTo(1 * canvas.width / 4, canvas.height / 2 - 10);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 0);
  ctx.lineTo(canvas.width / 2, canvas.height);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(0, canvas.height / 2);
  ctx.lineTo(canvas.width, canvas.height / 2);
  ctx.stroke();
}



function addRow() {
  var numRows = document.getElementById("legTable").getElementsByTagName("tr").length;
  var newRow = document.getElementById("legTable").insertRow(numRows - 1);
  newRow.innerHTML = '<tr><td><input type="image" src="assets/minus.png" alt="Delete this leg" name="btn_delrow" height="25px" width="25px" value="-" onclick="deleteRow(this);" /></td><td><input type="number" name="sel_quantity" class="smallinput textbox" value="1" onchange="update();" /></td><td><form><input type="radio" id="sel_call' + numRows + '" name="sel_optionType" value="call" onchange="update();" checked /> <label for="sel_call' + numRows + '" class="radiolabel">Call</label> <input type="radio" name="sel_optionType" value="put" id="sel_put' + numRows + '" onchange="update();" /><label for="sel_put' + numRows + '" class="radiolabel">Put</label> </form></td><td>+$<input type="number" name="sel_strike" class="smallinput textbox" value="100" onchange="update();" /></td><td>+<input type="number" name="sel_dte" class="smallinput textbox" value="30" onchange="update();" /> days</td><td>+$<input type="number" name="sel_legprice" class="smallinput textbox" value="3.50" onchange="update();" /></td></tr>';

  update();
}


function deleteRow(caller) {
  document.getElementById("legTable").deleteRow(caller.parentNode.parentNode.rowIndex);
  update();
}


function animateTime(isStart) {
  if (isStart) {
    document.getElementsByName("btn_animate")[0].setAttribute("src", "assets/stop.png");
    document.getElementsByName("btn_animate")[0].onclick = function () { animateTime(false) };
    animInterval = setInterval(function () {
      var newVal = (parseInt(document.getElementsByName("sel_timeleft")[0].value) - 1);
      if (newVal < 0) {
        newVal = document.getElementsByName("sel_timeleft")[0].max;
      }
      document.getElementsByName("sel_timeleft")[0].value = newVal;
      update();
    }, 75);
  } else {
    document.getElementsByName("btn_animate")[0].setAttribute("src", "assets/rewind.png");
    document.getElementsByName("btn_animate")[0].onclick = function () { animateTime(true) };
    clearTimeout(animInterval);
  }
}



function populateMatrix() {
  var x_1 = 0;
  for (x = 0; x < canvas.width; x += resolution) {
    var y_1 = 0;
    for (y = 0; y < canvas.height; y += resolution) {
      var simprice = xtoprice(x);
      var simvol = ytovol(y);
      pl_matrix[x_1][y_1] = getPL(simprice, simvol);

      y_1++;
    }

    x_1++;
  }
}


function xtoprice(x) {
  var lowprice = initial_price - (initial_stdev * (initial_price * initial_vol));
  var highprice = initial_price + (initial_stdev * (initial_price * initial_vol));

  var simprice = (lowprice + (x / canvas.width) * (highprice - lowprice));
  return simprice;
}


function ytovol(y) {
  var lowvol = initial_vol - vol_range;
  var highvol = initial_vol + vol_range;

  var simvol = (highvol - (y / canvas.height) * (highvol - lowvol));
  return simvol;
}


function getPL(price, vol) {
  var pl = 0;

  for (var i = 0; i < legs.length; i++) {
    var leg = legs[i];
    var indivTimeRem = leg['dte'] - (initial_dte - time_left);
    if (indivTimeRem < 0) {
      indivTimeRem = 0;
    }
    pl += leg['quantity'] * (BlackScholes(leg['isCall'] ? "c" : "p", price, leg['strike_price'], indivTimeRem / 365, risk_free, vol) - leg['purchase_price']);
  }

  return pl;
}


function getOverallGreeks(price, vol) {
  var delta = 0;
  var gamma = 0;
  var vega = 0;
  var theta = 0;
  var rho = 0;
  var greeks;

  for (var i = 0; i < legs.length; i++) {
    var leg = legs[i];
    var indivTimeRem = leg['dte'] - (initial_dte - time_left);
    if (indivTimeRem < 0) {
      continue;
    }
    greeks = BlackScholesGreeks(leg['isCall'] ? "c" : "p", price, leg['strike_price'], indivTimeRem / 365, risk_free, vol);
    for (var j = 0; j < greeks.length; j++) {
      greeks[j] *= leg['quantity'];
    }
  }

  return greeks;
}



function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}



function getMousePos(canvas, evt) {
  var rect = canvas.getBoundingClientRect();
  return {
    x: evt.clientX - rect.left,
    y: evt.clientY - rect.top
  };
}


function updateInfo(e) {
  var pos = getCanvasRelativeMousePosition(e, canvas);
  xpos = pos.x;
  ypos = pos.y;

  if (xpos > 0 && xpos < canvas.width && ypos > 0 && ypos < canvas.height) {
    var greeks = getOverallGreeks(xtoprice(xpos), ytovol(ypos));

    document.getElementById("d_date").innerHTML = "<span class='dashboard_heading dashboard_heading_date'>Date</span><br />" + time_left + " DTE";

    var stockprice_projected = round(xtoprice(xpos)).toFixed(2);
    document.getElementById("d_stockprice").innerHTML = "<span class='dashboard_heading dashboard_heading_stockprice'>Stock Price</span><br />" + "$" + stockprice_projected;

    if (Number(stockprice_projected) > initial_price) {
      document.getElementsByClassName("dashboard_heading_stockprice")[0].style.backgroundColor = brightgreen;
    } else if (Number(stockprice_projected) < initial_price) {
      document.getElementsByClassName("dashboard_heading_stockprice")[0].style.backgroundColor = brightred;
    } else { }


    var iv_projected = (Math.round(100 * 100 * ytovol(ypos)) / 100).toFixed(2);
    document.getElementById("d_vol").innerHTML = "<span class='dashboard_heading dashboard_heading_iv'>IV</span><br />" + iv_projected + "%";

    if (Number(iv_projected) > initial_vol * 100) {
      document.getElementsByClassName("dashboard_heading_iv")[0].style.backgroundColor = brightgreen;
    } else if (Number(iv_projected) < initial_vol * 100) {
      document.getElementsByClassName("dashboard_heading_iv")[0].style.backgroundColor = brightred;
    } else { }

    var pl_projected = getPL(xtoprice(xpos), ytovol(ypos)).toFixed(2);
    document.getElementById("d_pl").innerHTML = "<span class='dashboard_heading dashboard_heading_pl'>P/L</span><br /><span class='dashboard_pl'>" + "$" + pl_projected + "</span>";

    if (Number(pl_projected) > 0) {
      document.getElementsByClassName("dashboard_heading_pl")[0].style.backgroundColor = brightgreen;
      document.getElementsByClassName("dashboard_pl")[0].style.backgroundColor = lightgreen;
    } else if (Number(pl_projected) < 0) {
      document.getElementsByClassName("dashboard_heading_pl")[0].style.backgroundColor = brightred;
      document.getElementsByClassName("dashboard_pl")[0].style.backgroundColor = lightred;
    } else { }


    var delta = round(greeks[0]).toFixed(2);
    document.getElementById("d_delta").innerHTML = "<span class='dashboard_heading dashboard_heading_delta'>Delta</span><br />" + delta;

    if (Number(delta) > 0) {
      document.getElementsByClassName("dashboard_heading_delta")[0].style.backgroundColor = brightgreen;
    } else if (Number(delta) < 0) {
      document.getElementsByClassName("dashboard_heading_delta")[0].style.backgroundColor = brightred;
    } else { }

    var gamma = round(greeks[1]).toFixed(2);
    document.getElementById("d_gamma").innerHTML = "<span class='dashboard_heading dashboard_heading_gamma'>Gamma</span><br />" + gamma;

    if (Number(gamma) > 0) {
      document.getElementsByClassName("dashboard_heading_gamma")[0].style.backgroundColor = brightgreen;
    } else if (Number(gamma) < 0) {
      document.getElementsByClassName("dashboard_heading_gamma")[0].style.backgroundColor = brightred;
    } else { }

    var vega = round(greeks[2]).toFixed(2);
    document.getElementById("d_vega").innerHTML = "<span class='dashboard_heading dashboard_heading_vega'>Vega</span><br />" + vega;

    if (Number(vega) > 0) {
      document.getElementsByClassName("dashboard_heading_vega")[0].style.backgroundColor = brightgreen;
    } else if (Number(vega) < 0) {
      document.getElementsByClassName("dashboard_heading_vega")[0].style.backgroundColor = brightred;
    } else { }

    var theta = round(greeks[3]).toFixed(2);
    document.getElementById("d_theta").innerHTML = "<span class='dashboard_heading dashboard_heading_theta'>Theta</span><br />" + theta;

    if (Number(theta) > 0) {
      document.getElementsByClassName("dashboard_heading_theta")[0].style.backgroundColor = brightgreen;
    } else if (Number(theta) < 0) {
      document.getElementsByClassName("dashboard_heading_theta")[0].style.backgroundColor = brightred;
    } else { }

    var rho = round(greeks[4]).toFixed(2);
    document.getElementById("d_rho").innerHTML = "<span class='dashboard_heading dashboard_heading_rho'>Rho</span><br />" + rho;

    if (Number(rho) > 0) {
      document.getElementsByClassName("dashboard_heading_rho")[0].style.backgroundColor = brightgreen;
    } else if (Number(rho) < 0) {
      document.getElementsByClassName("dashboard_heading_rho")[0].style.backgroundColor = brightred;
    } else { }

    /* document.getElementById("info").innerHTML = "If the stock price goes to $" + round(xtoprice(xpos)) +
         " and volatility goes to " + Math.round(100*100*ytovol(ypos))/100 + "% " + time_left + " DTE, then your P/L will be: &nbsp;&nbsp;&nbsp;&nbsp;" + 
         getPL(xtoprice(xpos), ytovol(ypos)).toFixed(2) + ". <br />Delta: " + round(greeks[0]) + " | Gamma: " + round(greeks[1]) + " | Vega: " + 
         round(greeks[2]) + " | Theta: " + round(greeks[3]) + " | Rho: " + round(greeks[4]);*/
  } else {
    // document.getElementById("info").innerHTML = "Hover over graph to see info.";
  }

}

function round(x) {
  return Math.round(100 * x) / 100;
}



// The following are based on various functions on the Internet. 



function getRelativeMousePosition(event, target) {
  target = target || event.target;
  var rect = target.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

function getStyleSize(style, propName) {
  return parseInt(style.getPropertyValue(propName));
}

// assumes target or event.target is canvas
function getCanvasRelativeMousePosition(event, target) {
  // target = target || event.target;
  var pos = getRelativeMousePosition(event, target);

  // you can remove this if padding is 0. 
  // I hope this always returns "px"
  var style = window.getComputedStyle(target);

  var nonContentWidthLeft = getStyleSize(style, "padding-left") +
    getStyleSize(style, "border-left");
  var nonContentWidthTop = getStyleSize(style, "padding-top") +
    getStyleSize(style, "border-top");
  var nonContentWidthRight = getStyleSize(style, "padding-right") +
    getStyleSize(style, "border-right");
  var nonContentWidthBottom = getStyleSize(style, "padding-bottom") +
    getStyleSize(style, "border-bottom");

  var rect = target.getBoundingClientRect();
  var contentDisplayWidth = rect.width - nonContentWidthLeft - nonContentWidthRight;
  var contentDisplayHeight = rect.height - nonContentWidthTop - nonContentWidthBottom;

  if (isNaN(nonContentWidthBottom)) {
    document.getElementById("pvtgraph").style.border = "none";
    return pos;
  }
  pos.x = (pos.x - nonContentWidthLeft) * target.width / contentDisplayWidth;
  pos.y = (pos.y - nonContentWidthTop) * target.height / contentDisplayHeight;

  return pos;
}



// "c"/"p", Stock price, Strike, Years to Maturity, risk free rate (not %), volatility (not %).
// Projected Price
function BlackScholes(PutCallFlag, S, X, T, r, v) {

  var d1, d2;

  if (T == 0) {
    T = 1 / Number.MAX_VALUE;
  }

  d1 = (Math.log(S / X) + (r + v * v / 2.0) * T) / (v * Math.sqrt(T));
  d2 = d1 - v * Math.sqrt(T);


  if (PutCallFlag == "c")
    return S * CND(d1) - X * Math.exp(-r * T) * CND(d2);
  else
    return X * Math.exp(-r * T) * CND(-d2) - S * CND(-d1);

}

// "c"/"p", Stock price, Strike, Years to Maturity, risk free rate, volatility.
// Delta, Gamma, Vega, Theta, Rho
function BlackScholesGreeks(PutCallFlag, S, X, T, r, v) {
  var d1, d2;

  if (T == 0) {
    T = 1 / Number.MAX_VALUE;
  }
  d1 = (Math.log(S / X) + (r + v * v / 2.0) * T) / (v * Math.sqrt(T));
  d2 = d1 - v * Math.sqrt(T);



  var Nd2 = 0;
  var delta = 0;
  var sqt = Math.sqrt(T);

  if (PutCallFlag == "c") {
    delta = CND(d1);
    Nd2 = CND(d2);
  } else { //put
    delta = -CND(-d1);
    Nd2 = -CND(-d2);
  }

  var ert = Math.exp(-r * T);
  var nd1 = ndist(d1);

  var gamma = nd1 / (S * v * sqt);
  var vega = S * sqt * nd1 / 100;
  var theta = (-(S * v * nd1) / (2 * sqt) - r * X * ert * Nd2) / 365;
  var rho = X * T * ert * Nd2 / 100;

  return [delta, gamma, vega, theta, rho];
}


function CND(x) {

  var a1, a2, a3, a4, a5, k;

  a1 = 0.31938153, a2 = -0.356563782, a3 = 1.781477937, a4 = -1.821255978, a5 = 1.330274429;

  if (x < 0.0)
    return 1 - CND(-x);
  else
    k = 1.0 / (1.0 + 0.2316419 * x);
  return 1.0 - Math.exp(-x * x / 2.0) / Math.sqrt(2 * Math.PI) * k *
    (a1 + k * (-0.356563782 + k * (1.781477937 + k * (-1.821255978 + k * 1.330274429))));

}

function ndist(z) {
  return (1.0 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z);
  //??  Math.exp(-0.5*z*z)
}


