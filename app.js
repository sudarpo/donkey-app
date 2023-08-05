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
if (localStorage.UserPreferences) {
    SC_UserOpt = JSON.parse(localStorage.UserPreferences);
}
else {
    SC_UserOpt.baseCurrency = "SGD";
    SC_UserOpt.targetCurrency = "MYR";
    SC_UserOpt.totalPerPage = 10;
    SC_UserOpt.currentInput = 1;
    SC_UserOpt.baseDecimalPoint = 2;
    SC_UserOpt.targetDecimalPoint = 2;
    localStorage.UserPreferences = JSON.stringify(SC_UserOpt);
}

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
                currentPageNo: 1,
                isLoading: true,
                GlobalErrorMessage: "",
                isAlertVisible: false
            };
        },
        
        created: function () {
            GetCurrencyList();
            if (localStorage.XRates) {
                console.log("LocalStorage is NOT empty");
                SC_XChangeRate = JSON.parse(localStorage.XRates);
                
                let differentInMinutes = this.getDifferentInMinutes();
                if (differentInMinutes > 120) {
                    this.triggerUpdateExchangeRate();
                }
                else{
                    this.initialize();
                }
                
                this.isLoading = false;

            }
            else {
                console.log("LocalStorage is empty");
                this.refreshExchangeRate()
                    .finally(() => {
                        this.isLoading = false;
                        this.initialize();
                    });
                
            }
        },
        
        methods: {
            initialize: function() {
                this.currentPageNo = 1;
                this.currencyList = SC_CurrencyList;
                this.refreshLastUpdatedDate();
                this.setXchangeRate();
                this.currencyItems = [];
                for (let i = this.currentPageNo; i <= this.totalPerPage; i++) {
                    let item = new CurrencyItem();
                    item.baseCur = this.baseCurrency;
                    item.targetCur = this.targetCurrency;
                    item.excRate = this.xchangeRate;
                    item.baseAmt = i;
                    item.baseAmtText = FormatMoney(i, SC_UserOpt.baseDecimalPoint);
                    item.targetAmt = (item.baseAmt * item.excRate);
                    item.targetAmtText = FormatMoney(item.targetAmt, SC_UserOpt.targetDecimalPoint);
                    this.currencyItems.push(item);
                }
            },

            refreshExchangeRate: function() {
                const rateUrl = "https://openexchangerates.org/api/latest.json?app_id=330efd1b3dda49ecab74a654f7e436fd";
                return axios
                    .get(rateUrl)
                    .then(response => {
                        SC_XChangeRate = response.data;
                        localStorage.XRates = JSON.stringify(SC_XChangeRate);
                        console.log("RetrieveLatestXchangeRate", response);
                    })
                    .catch(error => {
                        console.error("RetrieveLatestXchangeRate", error);
                        this.showErrorMessage("Unexpected error when retrieving latest exchange rates. Please try again later. " + error);
                        // this.errored = true;
                    });
            },

            setXchangeRate: function() {
                let xrates = SC_XChangeRate.rates;
                let baseXRate = parseFloat(xrates[this.targetCurrency]) / parseFloat(xrates[this.baseCurrency]);
                console.log("xchange rates", baseXRate, parseFloat(xrates[this.targetCurrency]), parseFloat(xrates[this.baseCurrency]));
                this.xchangeRate = baseXRate;
            },

            showNext10: function (event) {
                let multiplier = this.currentPageNo * 10;
                this.currentPageNo = multiplier;
                this.buildItemList(multiplier);
            },

            showPrev10: function (event) {
                if (this.currentPageNo > 1) {
                    let multiplier = this.currentPageNo / 10;
                    this.currentPageNo = multiplier;
                    this.buildItemList(multiplier);
                }
                else {
                    this.makeToast("danger", "Lowest base number is 1");
                }
            },

            refreshLastUpdatedDate: function() {
                let epochTime = SC_XChangeRate.timestamp * 1000;
                this.rateLastUpdated = new Date(epochTime);
            },

            switchCurrency() {
                this.$bvModal.show("modal-switch-currency");
            },

            getDifferentInMinutes() {
                let lastUpdateTime = SC_XChangeRate.timestamp * 1000;
                let currentTime = Date.now();
                let differentInMinutes = (currentTime - lastUpdateTime) / 1000 / 60;
                return differentInMinutes;
            },

            triggerUpdateExchangeRate() {

                // Check last updated time
                let differentInMinutes = this.getDifferentInMinutes();
                if (differentInMinutes > 60) {
                    // If more than 60 minutes, get the latest exchange rates
                    this.makeToast("info", "Updating exchange rate...");
                    this.refreshExchangeRate()
                    .finally(() => {
                        this.initialize();
                        this.makeToast("success", "Exchange rate has been updated. Please update exchange rate ONLY every 1 hour.");
                    });
                }
                else {
                    this.makeToast("info", "Exchange rate is already the latest available rate. Please update exchange rate every 1 hour.");
                }
                
            },

            setCurrency(updatedCurrency) {
                // console.log("setTargetCurrency", updatedCurrency);
                this.targetCurrency = updatedCurrency.target;
                this.baseCurrency = updatedCurrency.base;
                this.currentPageNo = 1;

                SC_UserOpt.baseCurrency = this.baseCurrency;
                SC_UserOpt.targetCurrency = this.targetCurrency;
                localStorage.UserPreferences = JSON.stringify(SC_UserOpt);
                this.initialize();
            },

            buildItemList(multiplier) {
                this.currencyItems = [];
                for (
                    let i = this.currentPageNo;
                    i <= this.totalPerPage * multiplier;
                    i += multiplier
                ) {
                    let item = new CurrencyItem();
                    item.baseCur = this.baseCurrency;
                    item.targetCur = this.targetCurrency;
                    item.excRate = this.xchangeRate;
                    item.baseAmt = i;
                    item.baseAmtText = FormatMoney(item.baseAmt, SC_UserOpt.baseDecimalPoint);
                    item.targetAmt = (i * item.excRate);
                    item.targetAmtText = FormatMoney(item.targetAmt, SC_UserOpt.targetDecimalPoint);
                    this.currencyItems.push(item);
                }
            },

            makeToast(variant = null, message = "", isAutoHide = false) {
                this.$bvToast.toast(message, {
                    title: `Donkey App`,
                    variant: variant,
                    solid: true,
                    noAutoHide: isAutoHide
                })
            },

            showErrorMessage(errorMsg) {
                this.makeToast("danger", errorMsg, true);
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
        ccode.countryName = tempCurrencyList[curCode] + ' (' + curCode + ')';
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
function FormatMoney(amount, decimalCount = 2, decimal = ".", thousands = ",") {
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
var SC_XChangeRate = {}