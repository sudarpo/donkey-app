function CurrencyItem() {
    let baseCur = "";
    let targetCur = "";
    let excRate = 1.0;
    let baseAmt = 0.0;
    let baseAmtText = "";
    let targetAmt = 0.0;
    let targetAmtText = "";
}

function CurrencyCode() {
    let code = "";
    let countryName = "";
}

function UserPreferences() {
    let baseCurrency = "";
    let targetCurrency = "";
    let totalPerPage = 1;
    let currentInput = 1;
    let baseDecimalPoint = 2;
    let targetDecimalPoint = 2;
}

//////////////////////////////////////////////////////////////////////
var SC_CurrencyList = [];

var SC_UserOpt = new UserPreferences();
SC_UserOpt.baseCurrency = "SGD";
SC_UserOpt.targetCurrency = "MYR";
SC_UserOpt.totalPerPage = 10;
SC_UserOpt.currentInput = 1;
SC_UserOpt.baseDecimalPoint = 2;
SC_UserOpt.targetDecimalPoint = 2;
console.log(SC_UserOpt);

Vue.component('v-select', VueSelect.VueSelect);
//////////////////////////////////////////////////////////////////////
window.onload = () => {
    new Vue({
        el: "#app",
        data() {
            return {
                totalPerPage: SC_UserOpt.totalPerPage,
                baseCurrency: SC_UserOpt.baseCurrency,
                targetCurrency: SC_UserOpt.targetCurrency,
                currencyItems: [],
                currencyList: [],
                xchangeRate: 0.0,
                rateLastUpdated: "",
                isLoading: true
            };
        },
        
        created: function () {
            GetCurrencyList();
            if (localStorage.XRates) {
                console.log("LocalStorage is not empty", localStorage.XRates);
                SC_XChangeRate = JSON.parse(localStorage.XRates);
                this.isLoading = false;
                this.initialize();
            }
            else {
                
                const rateUrl = "https://openexchangerates.org/api/latest.json?app_id=1370818c6bf04d01aafc2ca379aa171e";
                axios
                    .get(rateUrl)
                    .then(response => {
                        SC_XChangeRate = response.data;
                        localStorage.XRates = JSON.stringify(SC_XChangeRate);
                        console.log("RetrieveLatestXchangeRate", response);
                    })
                    .catch(error => {
                        console.error("RetrieveLatestXchangeRate", error);
                        // this.errored = true;
                    })
                    .finally(() => {
                        this.isLoading = false;
                        this.initialize();
                    });
                
            }
        },
        
        methods: {
            initialize: function() {
                this.currencyList = SC_CurrencyList;
                this.refreshLastUpdatedDate();
                this.setXchangeRate();
                this.currencyItems = [];
                for (let i = SC_UserOpt.currentInput; i <= this.totalPerPage; i++) {
                    let item = new CurrencyItem();
                    item.baseCur = this.baseCurrency;
                    item.targetCur = this.targetCurrency;
                    item.excRate = this.xchangeRate;
                    item.baseAmt = i;
                    item.baseAmtText = formatMoney(i, SC_UserOpt.baseDecimalPoint);
                    item.targetAmt = (item.baseAmt * item.excRate);
                    item.targetAmtText = formatMoney(item.targetAmt, SC_UserOpt.targetDecimalPoint);
                    this.currencyItems.push(item);
                }
            },

            setXchangeRate: function() {
                let xrates = SC_XChangeRate.rates;
                let baseXRate = parseFloat(xrates[this.targetCurrency]) / parseFloat(xrates[this.baseCurrency]);
                console.log("xchange rates", baseXRate, parseFloat(xrates[this.targetCurrency]), parseFloat(xrates[this.baseCurrency]));
                this.xchangeRate = baseXRate;
            },

            showNext10: function (event) {
                let multiplier = SC_UserOpt.currentInput * 10;
                SC_UserOpt.currentInput = multiplier;
                this.buildItemList(multiplier);
            },

            showPrev10: function (event) {
                if (SC_UserOpt.currentInput > 1) {
                    let multiplier = SC_UserOpt.currentInput / 10;
                    SC_UserOpt.currentInput = multiplier;
                    this.buildItemList(multiplier);
                }
                else {
                    this.makeToast("warning", "Lowest base number is 1");
                }
            },

            refreshLastUpdatedDate: function() {
                let epochTime = SC_XChangeRate.timestamp * 1000;
                this.rateLastUpdated = new Date(epochTime);
            },

            switchCurrency() {
                this.$bvModal.show("modal-switch-currency");
            },

            setCurrency(updatedCurrency) {
                // console.log("setTargetCurrency", updatedCurrency);
                this.targetCurrency = updatedCurrency.target;
                this.baseCurrency = updatedCurrency.base;

                SC_UserOpt.currentInput = 1;
                this.initialize();
            },

            buildItemList(multiplier) {
                this.currencyItems = [];
                for (
                    let i = SC_UserOpt.currentInput;
                    i <= this.totalPerPage * multiplier;
                    i += multiplier
                ) {
                    let item = new CurrencyItem();
                    item.baseCur = this.baseCurrency;
                    item.targetCur = this.targetCurrency;
                    item.excRate = this.xchangeRate;
                    item.baseAmt = i;
                    item.baseAmtText = formatMoney(item.baseAmt, SC_UserOpt.baseDecimalPoint);
                    item.targetAmt = (i * item.excRate);
                    item.targetAmtText = formatMoney(item.targetAmt, SC_UserOpt.targetDecimalPoint);
                    this.currencyItems.push(item);
                }
            },

            makeToast(variant = null, message = "") {
                this.$bvToast.toast(message, {
                    title: `SC`,
                    variant: variant,
                    solid: true
                })
            }
        }
    });
};


//////////////////////////////////////////////////////////////////////
function GetCurrencyList() {
    SC_CurrencyList = [];
    for(curCode in tempCurrencyList) {
        let ccode = new CurrencyCode();
        ccode.code = curCode;
        ccode.countryName = tempCurrencyList[curCode];
        SC_CurrencyList.push(ccode);
    }
}

// Create our number formatter.
var formatter = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
});
// formatter.format(2500); /* $2,500.00 */

// 
function formatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? "-" : "";

        let i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        let j = (i.length > 3) ? i.length % 3 : 0;

        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : "");
    } catch (e) {
        console.error(e)
    }
};

//////////////////////////////////////////////////////////////////////
var SC_XChangeRate = {
    "disclaimer": "Usage subject to terms: https://openexchangerates.org/terms",
    "license": "https://openexchangerates.org/license",
    "timestamp": 1564477200,
    "base": "USD",
    "rates": {
      "AED": 3.673281,
      "AFN": 79.7255,
      "ALL": 109.2,
      "AMD": 476.001805,
      "ANG": 1.785944,
      "AOA": 347.657,
      "ARS": 43.749,
      "AUD": 1.451052,
      "AWG": 1.797496,
      "AZN": 1.7025,
      "BAM": 1.755257,
      "BBD": 2,
      "BDT": 84.456,
      "BGN": 1.755013,
      "BHD": 0.377017,
      "BIF": 1839.344423,
      "BMD": 1,
      "BND": 1.350597,
      "BOB": 6.91121,
      "BRL": 3.7813,
      "BSD": 1,
      "BTC": 0.000105533216,
      "BTN": 68.839634,
      "BWP": 10.695988,
      "BYN": 2.033704,
      "BZD": 2.016737,
      "CAD": 1.317523,
      "CDF": 1650.333952,
      "CHF": 0.990485,
      "CLF": 0.024628,
      "CLP": 696.539301,
      "CNH": 6.88556,
      "CNY": 6.8828,
      "COP": 3232.788076,
      "CRC": 573.772482,
      "CUC": 1,
      "CUP": 25.75,
      "CVE": 99.0725,
      "CZK": 23.0195,
      "DJF": 178,
      "DKK": 6.698209,
      "DOP": 51.03,
      "DZD": 119.68,
      "EGP": 16.5893,
      "ERN": 14.999581,
      "ETB": 28.808993,
      "EUR": 0.897098,
      "FJD": 2.155548,
      "FKP": 0.821604,
      "GBP": 0.821604,
      "GEL": 2.935,
      "GGP": 0.821604,
      "GHS": 5.351257,
      "GIP": 0.821604,
      "GMD": 50.0025,
      "GNF": 9204.130986,
      "GTQ": 7.667416,
      "GYD": 208.679932,
      "HKD": 7.82215,
      "HNL": 24.442538,
      "HRK": 6.62192,
      "HTG": 94.319994,
      "HUF": 294.057149,
      "IDR": 14022.15,
      "ILS": 3.508513,
      "IMP": 0.821604,
      "INR": 68.7523,
      "IQD": 1191.33782,
      "IRR": 42105,
      "ISK": 121.579905,
      "JEP": 0.821604,
      "JMD": 135.96,
      "JOD": 0.709001,
      "JPY": 108.57125,
      "KES": 104.31,
      "KGS": 69.618898,
      "KHR": 4079.539652,
      "KMF": 442.6745,
      "KPW": 900,
      "KRW": 1181.75,
      "KWD": 0.304505,
      "KYD": 0.83383,
      "KZT": 384.449743,
      "LAK": 8746.516662,
      "LBP": 1509.781949,
      "LKR": 176.25,
      "LRD": 202.375497,
      "LSL": 14.189312,
      "LYD": 1.401445,
      "MAD": 9.5988,
      "MDL": 17.76524,
      "MGA": 3661.604139,
      "MKD": 55.194815,
      "MMK": 1508.350281,
      "MNT": 2661.433948,
      "MOP": 8.057812,
      "MRO": 357,
      "MRU": 36.8,
      "MUR": 36.254204,
      "MVR": 15.450018,
      "MWK": 752.534184,
      "MXN": 19.053071,
      "MYR": 4.121503,
      "MZN": 61.620551,
      "NAD": 14.189312,
      "NGN": 361.91,
      "NIO": 32.937317,
      "NOK": 8.72425,
      "NPR": 110.140323,
      "NZD": 1.510152,
      "OMR": 0.385032,
      "PAB": 1,
      "PEN": 3.296018,
      "PGK": 3.392392,
      "PHP": 50.9055,
      "PKR": 160.95,
      "PLN": 3.849292,
      "PYG": 5985.453723,
      "QAR": 3.640738,
      "RON": 4.243778,
      "RSD": 105.577038,
      "RUB": 63.371,
      "RWF": 914.540344,
      "SAR": 3.7508,
      "SBD": 8.228548,
      "SCR": 13.660004,
      "SDG": 45.04001,
      "SEK": 9.549703,
      "SGD": 1.37006,
      "SHP": 0.821604,
      "SLL": 7114.37678,
      "SOS": 577.550807,
      "SRD": 7.458,
      "SSP": 130.26,
      "STD": 21560.79,
      "STN": 22.075,
      "SVC": 8.754876,
      "SYP": 515.105054,
      "SZL": 14.192352,
      "THB": 30.8235,
      "TJS": 9.440153,
      "TMT": 3.50998,
      "TND": 2.883599,
      "TOP": 2.287117,
      "TRY": 5.578179,
      "TTD": 6.77295,
      "TWD": 31.097456,
      "TZS": 2299.100343,
      "UAH": 25.39,
      "UGX": 3694.011053,
      "USD": 1,
      "UYU": 34.106181,
      "UZS": 8629.092771,
      "VEF": 248487.642241,
      "VES": 8537.511486,
      "VND": 23163.893573,
      "VUV": 115.626295,
      "WST": 2.623067,
      "XAF": 588.457462,
      "XAG": 0.06073503,
      "XAU": 0.00070098,
      "XCD": 2.70265,
      "XDR": 0.727085,
      "XOF": 588.457462,
      "XPD": 0.00064476,
      "XPF": 107.052222,
      "XPT": 0.00113559,
      "YER": 250.399249,
      "ZAR": 14.214344,
      "ZMW": 12.879018,
      "ZWL": 322.000001
    }
  }