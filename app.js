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
}

var userOpt = new UserPreferences();
userOpt.baseCurrency = "SGD";
userOpt.targetCurrency = "MYR";
userOpt.totalPerPage = 10;
userOpt.currentInput = 1;
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
        // watch: {
        //   show(newVal) {
        //     console.log('Alert is now ' + (newVal ? 'visible' : 'hidden'))
        //   }
        // },
        created: function () {
            // console.log('Initialize');
            this.currencyItems = [];
            for (let i = userOpt.currentInput; i <= this.totalPerPage; i++) {
                let item = new CurrencyItem();
                item.baseCur = this.baseCurrency;
                item.targetCur = this.targetCurrency;
                item.excRate = 3.008;
                item.baseAmt = i.toFixed(2);
                item.targetAmt = ((i + 1) * item.excRate).toFixed(4);
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
                let multiplier = userOpt.currentInput / 10;
                userOpt.currentInput = multiplier;
                this.buildPage(multiplier);
            },

            buildPage: function (multiplier) {
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
                    item.baseAmt = i.toFixed(2);
                    item.targetAmt = ((i + 1) * item.excRate).toFixed(4);
                    this.currencyItems.push(item);
                    // console.log(item);
                }
            }
        }
    });
};
