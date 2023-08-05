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

function UserOptions() {
    let baseCurrency = "";
    let targetCurrency = "";
    let totalItemsPerPage = 10;
    let baseNumber = 1;
    let baseDecimalPoint = 2;
    let targetDecimalPoint = 2;
}

let UserPrefs = {

    // Initialize default values if no data is available.
    initialize() {
        SC_UserOpt.baseCurrency = "SGD";
        SC_UserOpt.targetCurrency = "MYR";
        SC_UserOpt.totalItemsPerPage = 10;
        SC_UserOpt.baseNumber = 1;
        SC_UserOpt.baseDecimalPoint = 2;
        SC_UserOpt.targetDecimalPoint = 2;
        this.save();
    },

    // Load user local storage.
    load() {
        SC_UserOpt = JSON.parse(localStorage.UserPreferences);
    },

    // Save user local storage.
    save() {
        localStorage.UserPreferences = JSON.stringify(SC_UserOpt);
    },

}

//////////////////////////////////////////////////////////////////////
let SC_XChangeRate = {};
let SC_CurrencyList = [];
let SC_UserOpt = new UserOptions();

if (localStorage.UserPreferences) {
    UserPrefs.load();
    if (SC_UserOpt.baseNumber === undefined || SC_UserOpt.totalItemsPerPage === undefined) 
        UserPrefs.initialize();
}
else {
    UserPrefs.initialize();
}

console.log(SC_UserOpt);

Vue.component('v-select', VueSelect.VueSelect);

//////////////////////////////////////////////////////////////////////
const app_id = "330efd1b3dda49ecab74a654f7e436fd";

window.onload = () => {
    new Vue({
        el: "#app",
        data() {
            return {
                totalItemsPerPage: SC_UserOpt.totalItemsPerPage,
                baseCurrency: SC_UserOpt.baseCurrency,
                targetCurrency: SC_UserOpt.targetCurrency,
                currentBaseNumber: SC_UserOpt.baseNumber,
                currencyItems: [],
                currencyList: [],
                xchangeRate: 0.0,
                rateLastUpdated: "",
                isLoading: true,
                GlobalErrorMessage: "",
                isAlertVisible: false
            };
        },
        
        // Vue2 created - Called synchronously after the instance is created. 
        // Initialization code.
        // - Init and parse currency list
        // - Check localstorage exchange rates data
        // - Retrieve exchange rate if required
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
            // Initialize component data.
            initialize: function() {
                console.log("initialize this.currentBaseNumber", this.currentBaseNumber)
                this.currencyList = SC_CurrencyList;
                this.refreshLastUpdatedDate();
                this.setXchangeRate();
                this.buildItemList(this.currentBaseNumber);
            },

            // Refresh exchange rate via openexchangerates
            refreshExchangeRate: function() {
                const rateUrl = `https://openexchangerates.org/api/latest.json?app_id=${app_id}`;
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

            // Calculate and set exchange rate
            setXchangeRate: function() {
                let xrates = SC_XChangeRate.rates;
                let baseXRate = parseFloat(xrates[this.targetCurrency]) / parseFloat(xrates[this.baseCurrency]);
                console.log("xchange rates", baseXRate, parseFloat(xrates[this.targetCurrency]), parseFloat(xrates[this.baseCurrency]));
                this.xchangeRate = baseXRate;
            },

            // Update base number
            updateBaseNumber: function(baseNumber) {
                this.currentBaseNumber = baseNumber;
                SC_UserOpt.baseNumber = this.currentBaseNumber;
                UserPrefs.save();
                this.buildItemList();
            },

            // Multiple 10
            showNext10: function (event) {
                let multiplier = this.currentBaseNumber * 10;
                this.updateBaseNumber(multiplier);
            },

            // Divide by 10
            showPrev10: function (event) {
                if (this.currentBaseNumber > 1) {
                    let multiplier = this.currentBaseNumber / 10;
                    this.updateBaseNumber(multiplier);
                }
                else {
                    this.makeToast("danger", "Lowest base number is 1");
                }
            },

            // Refresh last updated text label
            refreshLastUpdatedDate: function() {
                let epochTime = SC_XChangeRate.timestamp * 1000;
                this.rateLastUpdated = new Date(epochTime);
            },

            // Toggle Switch Currency modal dialog
            switchCurrency() {
                this.$bvModal.show("modal-switch-currency");
            },

            // 
            getDifferentInMinutes() {
                let lastUpdateTime = SC_XChangeRate.timestamp * 1000;
                let currentTime = Date.now();
                let differentInMinutes = (currentTime - lastUpdateTime) / 1000 / 60;
                return differentInMinutes;
            },

            // Trigger update exchange rate on click
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

            // For swap-currency clicked event from option modal page.
            onCurrencyChangeEvent(updatedCurrency) {
                this.setCurrency(updatedCurrency);
            },

            // For swap-currency clicked event.
            swapCurrencyClicked() {
                this.setCurrency({ base: this.targetCurrency, target: this.baseCurrency });
            },

            // Set currency event handler.
            setCurrency(updatedCurrency) {
                // console.log("setTargetCurrency", updatedCurrency);
                this.targetCurrency = updatedCurrency.target;
                this.baseCurrency = updatedCurrency.base;

                SC_UserOpt.baseCurrency = this.baseCurrency;
                SC_UserOpt.targetCurrency = this.targetCurrency;
                UserPrefs.save();
                this.initialize();
            },

            // Build and generate item list.
            buildItemList() {
                this.currencyItems = [];
                let multiplier = this.currentBaseNumber;

                for (let i = this.currentBaseNumber; i <= this.totalItemsPerPage * multiplier; i += multiplier) {
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

            // Create toast message.
            makeToast(variant = null, message = "", isAutoHide = false) {
                this.$bvToast.toast(message, {
                    title: `Donkey App`,
                    variant: variant,
                    solid: true,
                    noAutoHide: isAutoHide
                })
            },

            // Show toast error message.
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
let formatter = new Intl.NumberFormat('en-SG', {
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
