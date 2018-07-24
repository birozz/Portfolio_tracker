//Example: https://api.coinmarketcap.com/v2/ticker/1/
//Example: https://api.coinmarketcap.com/v2/ticker/1/?convert=EUR
//Example: https://api.coinmarketcap.com/v2/ticker/1/?convert=BCH

/**
 * Our Vue.js application.
 *
 * This manages the entire front-end website.
 */
// The API we're using for grabbing metadata about each cryptocurrency
// (including logo images). The service can be found at:
let CRYPTOCOMPARE_API_URI = "https://min-api.cryptocompare.com";
let CRYPTOCOMPARE_URI = "https://www.cryptocompare.com";
// The API we're using for grabbing cryptocurrency prices.  The service can be
// found at: https://coinmarketcap.com/api/
let COINMARKETCAP_API_URI = "https://api.coinmarketcap.com";
// The amount of milliseconds (ms) after which we should update our currency
// charts.
let coinsList
let coins = []
let currentTab = 0
let UPDATE_INTERVAL = 60 * 10000;
let file_content = ""

function createCoinObj(id, symbol) {
    let tmp = []
    tmp.push(id)
    tmp.push(symbol)

    //why it is first pushed to tmp and later shifted ?
    let coinObj = {
        id: tmp.shift(),
        symbol: tmp.shift(),
        hidden: false,
        data: {
            quotes: {
                USD: {}
            }
        },
        amount: 0,
        invested: 0,
        purchese_price_S: 0,
        purchese_price_B: 0
    }

    return coinObj
}

let app = new Vue({
    el: "#app",
    data: {
        sum_sat: 0,
        sum_dolar: 0,
        name: '',
        second_tab: true,
        portfolio_file: null,
        loaded_portfolio: [],
        portfolio: [],
        searched_coin_arr: [],
        coins_arr: [],
        coinData: {},
        currentPage: 1,
        totalrows: 1,
        perpage: 50
    },

    methods: {

        searchCoin: function (value){
            this.searched_coin_arr = []
            console.log(value)
            var result = coinsList.filter( current => current.symbol.includes(value.toUpperCase())
                                          || current.name.toUpperCase().includes(value.toUpperCase()) )
            result.forEach((element, index, theArray) => {
                  this.searched_coin_arr.push(createCoinObj(element.id, element.symbol))
            })

            //console.log(this.searched_coin_arr)
            //this.updateCoinsById(this.searched_coin_arr)
            console.log(this.searched_coin_arr)
        },

        importFile: function (e) {
            var files = e.target.files || e.dataTransfer.files;
            if (!files.length)
                return;
            //this.createInput(files[0]);

            var reader = new window.FileReader();
            var vm = this

            reader.onload = (e) => {
                vm.fileinput = reader.result;
                vm.loaded_portfolio = JSON.parse(vm.fileinput)
                vm.portfolio = vm.portfolio.concat(vm.loaded_portfolio)
                console.log(vm.loaded_portfolio)
            }

            reader.readAsText(files[0]);
            //console.log(vm.fileinput);
        },

        setAmount: function () {
            this.sum_dolar = 0
            this.sum_sat = 0
            this.portfolio.forEach((coin, index, theArray) => {
                if (!theArray[index].hidden) {
                    this.sum_dolar += theArray[index].data.quotes.USD.price * theArray[index].amount
                    this.sum_sat += coin.data.quotes.BTC.price * theArray[index].amount
                }
            })
        },

        portfolio_export: function () {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this.portfolio));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "portfolio.json");
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        },

        addCoin: function (addEvent) {
            ////////////console.log(event.target.parentElement.parentElement.children[3].innerHTML)
            this.portfolio.push(createCoinObj(addEvent.target.parentElement.parentElement.children[1].innerHTML, addEvent.target.parentElement.parentElement.children[4].innerHTML))
            //this.updatePortfolioCoins()
            this.updateCoinsById()
            this.second_tab = false
            console.log(JSON.stringify(this.portfolio))
        },

        hideCoin: function (hideEvent) {
            coinIndex = hideEvent.target.closest('tr').rowIndex - 1
            hideEvent.target.closest('tr').setAttribute('hidden', 'true')
            this.portfolio[coinIndex].hidden = true
        },

        delCoin: function (delEvent) {
            coinIndex = delEvent.target.closest('tr').rowIndex - 1
            this.portfolio.splice(coinIndex, 1)
            console.log(JSON.stringify(this.portfolio))

            if (this.portfolio.length == 0) {
                this.second_tab = true
            }
        },
        /**
         * Update the coins on tab input (change) 
         */
        btabChange: function (tab_index) {
            if (tab_index == 0) {
                this.getCoins()
            } else {
                this.totalrows = this.portfolio.length
            }
            currentTab = tab_index
        },
        /**
         * Update the coins on pagination input (change) 
         */
        paginationChange: function () {
            if (currentTab == 0) {
                this.getCoins()
            } else {
                this.totalrows = this.portfolio.length
            }
        },
        /**
         * Get the cryptocurrencies that are in the users portfolio. 
         */
        updatePortfolioCoins: function () {
            let self = this
            //this.totalrows = this.portfolio.length
            this.portfolio.forEach((coin, index, theArray) => {
                axios.get(COINMARKETCAP_API_URI + "/v2/ticker/" + coin.id + "/?convert=BTC").then(function (response) {
                    theArray[index].data = response.data.data
                    /** if (somevarialble.toLowerCase() == response.data[0].itemValue.toLowerCase()) {
                        $this.filteredItems.push(item);
                    }**/
                }).catch(function (error) {
                    console.log(error);
                });
            })

            console.log("Updateeee")
            //console.log(JSON.stringify(theArray))
        },

        updateCoinsById: function (coinsArray = this.portfolio) {
            let self = this
            //this.totalrows = this.portfolio.length
            coinsArray.forEach((coin, index, theArray) => {
                axios.get(COINMARKETCAP_API_URI + "/v2/ticker/" + coin.id + "/?convert=BTC").then(function (response) {
                    theArray[index].data = response.data.data
                    /** if (somevarialble.toLowerCase() == response.data[0].itemValue.toLowerCase()) {
                        $this.filteredItems.push(item);
                    }**/
                }).catch(function (error) {
                    console.log(error);
                });
            })

            console.log("Updateeee")
            //console.log(JSON.stringify(theArray))
        },

        /**
         * Load up all cryptocurrency data.  This data is used to find what logos
         * each currency has, so we can display things in a friendly way.
         */
        getCoinData: function () {
            let self = this;
            axios.get(CRYPTOCOMPARE_API_URI + "/data/all/coinlist").then((resp) => {
                this.coinData = resp.data.Data;

                this.getCoins();
            }).catch((err) => {
                this.getCoins();
                console.error(err);
            });
        },
        /**
         * Get the top 10 cryptocurrencies by value.  This data is refreshed each 5
         * minutes by the backing API service.
         */
        getCoins: function () {
            let self = this;
            let start = this.currentPage * this.perpage - 50

            axios.get(COINMARKETCAP_API_URI + "/v2/ticker/?start=" + start + "&limit=50").then((resp) => {
                //get coins data
                this.coins = resp.data.data;
                // get the number of currencies
                this.totalrows = resp.data.metadata.num_cryptocurrencies
                this.coins_arr = []
                for (const [key, value] of Object.entries(this.coins)) {
                    this.coins_arr.push(this.coins[key]);
                }
                //sort by rank with array functions :)
                this.coins_arr.sort((a, b) => a.rank - b.rank)
                //////////////////console.log(JSON.stringify(this.coins_arr))

            }).catch((err) => {
                console.error(err);
            });
        },
        /**
         * Given a cryptocurrency ticket symbol, return the currency's logo
         * image.
         */
        getCoinImage: function (symbol) {
            // These two symbols don't match up across API services. I'm manually
            // replacing these here so I can find the correct image for the currency.
            //
            // In the future, it would be nice to find a more generic way of searching
            // for currency images
            symbol = (symbol === "MIOTA" ? "IOT" : symbol);
            symbol = (symbol === "VERI" ? "VRM" : symbol);
            //console.log(this.coinData[symbol].FullName);
            //console.log(JSON.stringify(this.coinData[symbol]));
            if (typeof this.coinData[symbol] != 'undefined') {
                return CRYPTOCOMPARE_URI + this.coinData[symbol].ImageUrl;
            } else {
                //return CRYPTOCOMPARE_URI + "/media/19633/btc.png"
                return "../static/images/no_image.png"
            }
        },
        /**
         * Return a CSS color (either red or green) depending on whether or
         * not the value passed in is negative or positive.
         */
        getColor: (num) => {
            return num > 0 ? "color:green;" : "color:red;";
        },
    },
    /**
     * Using this lifecycle hook, we'll populate all of the cryptocurrency data as
     * soon as the page is loaded a single time.
     */
    created: function () {
        this.getCoinData();
    }
});


onload = function () {
    
        axios.get(COINMARKETCAP_API_URI + "/v2/listings/").then((resp) => {
            //get coins data
            coinsList = resp.data.data;
            console.log("betotott")
            console.log(coinsList)

        }).catch((err) => {
            console.error(err);
        });
    },

    /**
     * Once the page has been loaded and all of our app stuff is working, we'll
     * start polling for new cryptocurrency data every minute.
     *
     * This is sufficiently dynamic because the API's we're relying on are updating
     * their prices every 5 minutes, so checking every minute is sufficient.
     */
    setInterval(() => {

        app.updatePortfolioCoins();

        if (currentTab == 0) {
            app.getCoins();
        }

    }, UPDATE_INTERVAL);