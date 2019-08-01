
Vue.component("donkey-item", {
    props: ["currencyItem", "isParent"],
    data: function () {
        return {
            currencyName: ""
        };
    },
    template: `
    <b-list-group-item 
    :variant="isParent ? 'primary' : 'info'" 
    :button="isParent" 
    v-on:click="$emit('click')">
        <span>{{ currencyItem.baseAmt }}</span>
        <span> &raquo; </span>
        <span>{{ currencyItem.targetAmt }}</span>
    </b-list-group-item>
`
});


Vue.component("donkey-parent", {
    props: ["currencyItem", "isParent"],
    data: function () {
        return {
            isOpened: false,
            counter: 0,
            childItems: []
        }
    },
    methods: {
        
        toggleInnerList: function (event) {
            this.counter += 1;
            this.isOpened = !this.isOpened;
            console.log("toggleInnerList", this.isOpened, this.counter);
            let currentItem = this.currencyItem;

            console.log(currentItem);
            
            this.childItems = [];
            if (this.isOpened) {
                this.generateInnerList(currentItem);
            }
        },

        generateInnerList: function(currentItem) {
            
            for (let index = 1; index < 10; index++) {
                let item = new CurrencyItem();
                item.baseCur = currentItem.baseCurrency;
                item.targetCur = currentItem.targetCurrency;
                item.excRate = currentItem.excRate;

                let noOfZeros = parseInt(Math.log10(currentItem.baseAmt)) - 1;
                let tempBaseAmt = Math.pow(10, noOfZeros) * index;

                item.baseAmt = formatMoney(parseFloat(currentItem.baseAmt) + tempBaseAmt, userOpt.baseDecimalPoint);
                item.targetAmt = formatMoney((item.baseAmt * item.excRate), userOpt.targetDecimalPoint);
                this.childItems.push(item);
            }
        }

    },
    template: `
        <div>
            <donkey-item 
                v-on:click="toggleInnerList"
                v-bind:currency-item="currencyItem"
                v-bind:is-parent="isParent">
            </donkey-item>
            <b-list-group-item variant="warning" v-if="isOpened">
                <b-list-group>
                    <donkey-item 
                    v-for="(item, index) in childItems"
                    v-bind:index-no="index"
                    v-bind:key="index"
                    v-bind:currency-item="item"></donkey-item>
                </b-list-group>
            </b-list-group-item>
        </div>
    `
});
