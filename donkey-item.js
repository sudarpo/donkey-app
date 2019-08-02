//////////////////////////////////////////////////////////////////////
Vue.component("donkey-item", {
    props: ["currencyItem", "isParent"],

    template: `
    <b-list-group-item 
    :variant="isParent ? 'primary' : 'info'" 
    :button="isParent" 
    v-on:click="$emit('click')">
        <span>{{ currencyItem.baseAmtText }}</span>
        <span> &raquo; </span>
        <span>{{ currencyItem.targetAmtText }}</span>
    </b-list-group-item>
`
});

//////////////////////////////////////////////////////////////////////
Vue.component("donkey-parent", {
    props: ["currencyItem", "isParent"],
    data: function () {
        return {
            isOpened: false,
            counter: 0,
            id: "",
            childItems: []
        }
    },
    
    created: function() {
        console.log(this.id, "donkey-parent CREATED", this.$vnode.key);
        this.id = this.$vnode.key;
        this.isOpened = false;
        this.counter = 0;
        this.childItems = [];
    },

    // updated: function() {
    //     console.log(this.id, "donkey-parent UPDATED", "is it opened? " + this.isOpened);
    // },

    // mounted: function() {
    //     console.log(this.id, "donkey-parent MOUNTED");
    // },

    // destroyed: function() {
    //     console.log(this.id, "donkey-parent DESTROYED");
    // },

    methods: {
        
        toggleInnerList: function (event) {
            this.counter += 1;
            this.isOpened = !this.isOpened;
            
            let currentItem = this.currencyItem;
            // console.log("toggleInnerList", this.isOpened, this.counter);
            // console.log(currentItem);
            
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

                item.baseAmt = parseFloat(currentItem.baseAmt) + tempBaseAmt;
                item.baseAmtText = FormatMoney(item.baseAmt, SC_UserOpt.baseDecimalPoint);
                item.targetAmt = (item.baseAmt * item.excRate);
                item.targetAmtText = FormatMoney(item.targetAmt, SC_UserOpt.targetDecimalPoint);
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
                    v-bind:key="id + '_' + index"
                    v-bind:currency-item="item"></donkey-item>
                </b-list-group>
            </b-list-group-item>
        </div>
    `
});


//////////////////////////////////////////////////////////////////////
Vue.component("donkey-option", {
    props: ["CurrencyList", "BaseCurrency", "TargetCurrency"],
    data: function() {
        return {
            baseCurrencyCode: "",
            targetCurrencyCode: ""
        }
    },

    created: function() {
        this.baseCurrencyCode = this.BaseCurrency;
        this.targetCurrencyCode = this.TargetCurrency;
    },

    methods: {
        swapCurrency() {
            console.log("swapCurrency");
            let tempCode = this.targetCurrencyCode;
            this.targetCurrencyCode = this.baseCurrencyCode;
            this.baseCurrencyCode = tempCode;
        },

        confirmCurrencyChanged() {
            this.$emit("currency-changed", {
                base: this.baseCurrencyCode,
                target: this.targetCurrencyCode
            });
        }
        
    },

    template: `
        <b-modal id="modal-switch-currency" size="xl" title="Switch Currency"
            ok-only
            v-on:ok="confirmCurrencyChanged">
            <b-row>
                <b-col>
                    <label for="baseCurrency">Base currency</label>
                </b-col>
                <b-col cols="6">
                    <v-select id="baseCurrency" placeholder="-- select Base currency --" 
                        :options="CurrencyList"
                        :reduce="c => c.code"
                        v-model="baseCurrencyCode"
                        :key="baseCurrencyCode"
                        label="countryName">
                    </v-select>
                </b-col>
                <b-col>{{ baseCurrencyCode }}</b-col>
            </b-row>
            <b-row>
                <b-col>
                    <label for="targetCurrency">Target currency</label>
                </b-col>
                <b-col cols="6">
                    <v-select id="targetCurrency" placeholder="-- select Target currency --" 
                        :options="CurrencyList"
                        :reduce="c => c.code"
                        v-model="targetCurrencyCode"
                        :key="targetCurrencyCode"
                        label="countryName">
                    </v-select>
                </b-col>
                <b-col>{{ targetCurrencyCode }}</b-col>
            </b-row>
            <b-row>
                <b-col cols="4">
                </b-col>
                <b-col cols="8">
                    <b-button class="symbol-2" v-b-tooltip.hover.right title="Swap currency"
                        v-on:click="swapCurrency">&udarr;</b-button>
                </b-col>
            </b-row>
        </b-modal>
    `
});