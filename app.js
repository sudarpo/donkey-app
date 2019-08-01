function CurrencyItem() {
    let baseCur = "";
    let targetCur = "";
    let excRate = 1.0;
    let baseAmt = 0.0;
    let targetAmt = 0.0;
}

function UserPreferences() {
    let baseCurrency = "";
    let targetCurrency = "";
    let totalPerPage = 1;
    let currentInput = 1;
    let baseDecimalPoint = 2;
    let targetDecimalPoint = 2;
}

// Create our number formatter.
var formatter = new Intl.NumberFormat('en-SG', {
    style: 'currency',
    currency: 'SGD',
});
// formatter.format(2500); /* $2,500.00 */

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

var userOpt = new UserPreferences();
userOpt.baseCurrency = "SGD";
userOpt.targetCurrency = "MYR";
userOpt.totalPerPage = 10;
userOpt.currentInput = 1;
userOpt.baseDecimalPoint = 2;
userOpt.targetDecimalPoint = 6;
console.log(userOpt);

window.onload = () => {
    new Vue({
        el: "#app",
        data() {
            return {
                totalPerPage: userOpt.totalPerPage,
                baseCurrency: userOpt.baseCurrency,
                targetCurrency: userOpt.targetCurrency,
                currencyItems: []
            };
        },

        created: function () {
            // console.log('Initialize');
            this.currencyItems = [];
            for (let i = userOpt.currentInput; i <= this.totalPerPage; i++) {
                let item = new CurrencyItem();
                item.baseCur = this.baseCurrency;
                item.targetCur = this.targetCurrency;
                item.excRate = 3.008;
                item.baseAmt = formatMoney(i, userOpt.baseDecimalPoint); //.toFixed(2);
                item.targetAmt = formatMoney((i * item.excRate), userOpt.targetDecimalPoint); // (i * item.excRate).toFixed(4);
                this.currencyItems.push(item);
                // console.log(item);
            }
        },
        
        methods: {
            showNext10: function (event) {
                let multiplier = userOpt.currentInput * 10;
                userOpt.currentInput = multiplier;
                this.buildPage(multiplier);
            },

            showPrev10: function (event) {
                if (userOpt.currentInput > 1) {
                    let multiplier = userOpt.currentInput / 10;
                    userOpt.currentInput = multiplier;
                    this.buildPage(multiplier);
                }
                else {
                    this.makeToast("warning", "Lowest base number is 1");
                }
            },

            buildPage(multiplier) {
                this.currencyItems = [];
                for (
                    let i = userOpt.currentInput;
                    i <= this.totalPerPage * multiplier;
                    i += multiplier
                ) {
                    let item = new CurrencyItem();
                    item.baseCur = this.baseCurrency;
                    item.targetCur = this.targetCurrency;
                    item.excRate = 3.008;
                    item.baseAmt = formatMoney(i, userOpt.baseDecimalPoint); //.toFixed(2);
                    item.targetAmt = formatMoney((i * item.excRate), userOpt.targetDecimalPoint); // (i * item.excRate).toFixed(4);
                    this.currencyItems.push(item);
                    // console.log(item);
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
