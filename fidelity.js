var keyStatTimer = setInterval(keyStatisticsExtension, 1000);

function keyStatisticsExtension() 
{
  console.log(document.URL);

  var isKeyStatsView = document.URL.indexOf("/keyStatistics") > -1;
  if (!isKeyStatsView)
    return;

  // these are loaded asynchronously, so make sure we have them
  var divYield = $("#box11 .col2").text();
  var marketCap = _getMarketCap();
  var freeCashFlow = _getFreeCashFlow();

  if (typeof divYield === "string" && !isNaN(marketCap) && !isNaN(freeCashFlow))
  {
    clearInterval(keyStatTimer);
  }
  else
  {
    console.log("statistics not ready. waiting...");
    return;
  }

  var isDivYieldSet = divYield.indexOf('%') > -1;
  if (!isDivYieldSet)
  {
    return;
  }
  
  var yieldPercentage = divYield.substring(divYield.indexOf('/') + 2);
  var yieldRate = parseFloat(yieldPercentage) / 100;
  var divPerFreeCashFlow = 100 * marketCap * yieldRate / freeCashFlow;
  var divPerFreeCashFlowRounded = Math.round(divPerFreeCashFlow * 100) / 100;
  console.debug("dividends / free cash flow: " + divPerFreeCashFlowRounded + "%");
  $("#box11 .col2").text($("#box11 .col2").text() + "\n" + divPerFreeCashFlowRounded + "% FCF");    
}

/**
 * Get market cap in raw number (in $).
 */
function _getMarketCap()
{
  var marketCapString = $(".datatable-component:eq(1) tbody tr:eq(1) td:eq(1)").text().trim();
  return _convertCurrencyToRawNumber(marketCapString);
}

/**
 * Get free cash flow in raw number (in $).
 */
function _getFreeCashFlow()
{
  var freeCashFlow = $(".datatable-component:eq(2) tbody tr:eq(11) td:eq(1)").text().trim();
  return _convertCurrencyToRawNumber(freeCashFlow);
}

/**
 * @param currency like "$4.02B" or "$12.25M"
 * @return raw number in USD, like 402000000 or 12250000.
 */
function _convertCurrencyToRawNumber(currency)
{
  var value = parseFloat(currency.substring(1));
  var unit = currency.charAt(currency.length - 1);

  if (unit == 'B')
  {
    value = value * 1000000000;
  }
  else if (unit == 'M')
  {
    value = value * 1000000;
  }

  return value;
}