var memo = { rbi: {} };
var keyStatTimer = setInterval(keyStatisticsExtension, 100);
var positionsTimer;

if (document.URL.indexOf('oftop/portfolio') > -1)
{
  var positionsTab = $('.tabs--tab-link')[3];
  $(positionsTab).click(function() {
    clearInterval(positionsTimer);
    positionsTimer =  setInterval(positionsExtension, 100);
  });
  positionsTimer = setInterval(positionsExtension, 100);
}

function keyStatisticsExtension() {
  var isKeyStatsView = document.URL.indexOf("/keyStatistics") > -1;
  if (!isKeyStatsView) {
    clearInterval(keyStatTimer);
    return;
  }

  // these are loaded asynchronously, so make sure we have them
  var divYield = $("#box11 .col2").text();
  var marketCap = _getMarketCap();
  var freeCashFlow = _getFreeCashFlow();

  if (typeof divYield === "string" && !isNaN(marketCap) && !isNaN(freeCashFlow)) {
    clearInterval(keyStatTimer);
  }
  else {
    console.log("statistics not ready. waiting...");
    return;
  }

  var isDivYieldSet = divYield.indexOf('%') > -1;
  if (!isDivYieldSet) {
    return;
  }

  var yieldPercentage = divYield.substring(divYield.indexOf('/') + 2);
  var yieldRate = parseFloat(yieldPercentage) / 100;
  var divPerFreeCashFlow = 100 * marketCap * yieldRate / freeCashFlow;
  var divPerFreeCashFlowRounded = Math.round(divPerFreeCashFlow * 100) / 100;
  console.debug("dividends / free cash flow: " + divPerFreeCashFlowRounded + "%");
  $("#box11 .col2").html($("#box11 .col2").text() + "<br />" + divPerFreeCashFlowRounded + "% FCF");
}

function positionsExtension() {
  var isPositionsView = document.URL.indexOf("oftop/portfolio#positions") > -1;
  if (!isPositionsView) {
    return;
  }

  if ($('.magicgrid--table:eq(1)').length == 0 || $('.progress-bar').css('display') != 'none') {
    console.debug("positions table not ready. waiting...");
    return;
  }

  clearInterval(positionsTimer);
  var skipSymbols = ['FCASH**', 'FXAIX', 'TDP2', 'VSCPX'];
  var updateStockName = function (parentDiv, rbi) {
    var stockName = $(parentDiv).find('span.stock-name');
    stockName.text(rbi + ' : ' + stockName.text());
  }

  $('div.symbol').each(function () {
    var div = $(this);
    var symbol = $(div).find('span.stock-symbol').text();
    if ($.isNumeric(symbol.charAt(0)) || skipSymbols.indexOf(symbol) > -1)
      return;

    var memoized = memo.rbi[symbol];
    if (memoized != null) {
      updateStockName(div, memoized);
      return;
    }

    $.ajax({
      url: "https://oltx.fidelity.com/myresearch/xhr/stocks/bricklet.jhtml?brickletType=AO&securityType=EQUITY&symbol=" + symbol,
      type: "GET",
      async: false, // slower than async, but false makes use of memoization
      success: function (data) {
        var regexp = /"rbi-number">([^<]+)<\/div>/g;
        var match = regexp.exec(data);
        if (match != null) {
          var rbi = match[1];
          console.debug(symbol + ': ' + rbi);
          memo.rbi[symbol] = rbi;
          updateStockName(div, rbi);
        }
      }
    });
  });
}

/**
 * Get market cap in raw number (in $).
 */
function _getMarketCap() {
  var marketCapString = $(".datatable-component:eq(1) tbody tr:eq(1) td:eq(1)").text().trim();
  return _convertCurrencyToRawNumber(marketCapString);
}

/**
 * Get free cash flow in raw number (in $).
 */
function _getFreeCashFlow() {
  var freeCashFlow = $(".datatable-component:eq(2) tbody tr:eq(11) td:eq(1)").text().trim();
  return _convertCurrencyToRawNumber(freeCashFlow);
}

/**
 * @param currency like "$4.02B" or "$12.25M"
 * @return raw number in USD, like 402000000 or 12250000.
 */
function _convertCurrencyToRawNumber(currency) {
  var value = parseFloat(currency.substring(1));
  var unit = currency.charAt(currency.length - 1);

  if (unit == 'B') {
    value = value * 1000000000;
  }
  else if (unit == 'M') {
    value = value * 1000000;
  }

  return value;
}