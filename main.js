/// <reference path="jquery-3.5.1.js" />
"use strict";

$(document).ready(function () {
    let fiveCoins = [];
    let globalCoins = [];

    // container of all the requests are in this function, draw coins and display more info,
    // taggle buttom for top five,modal for switch
    function drawCoins(coins) {
        $(".firstContainer").empty();   // first make shore is empty
        for (let i = 0; i < coins.length; i++) {
            $(".firstContainer").append(`
                <div class="row-sm containerCoins">
                 
                <div class="form-check form-switch topFive">
                <input class="form-check-input topFive fiveOnly" type="checkbox" id="five${coins[i].id}">
                </div>
                
                <div class="col-sm d-flex flex-wrap containerCoin">
                <div="col-sm"><strong>${coins[i].symbol}</strong>
                <br><div="col-sm">${coins[i].name}</div>
                
                <div class="spinner-border spinner" id="spinner${coins[i].id}" role="status">
                <span class="visually-hidden spinner">Loading...</span>
                </div>

                <div id="more${coins[i].id}" class="moreInfo"></div>
                
                <div="col-sm">

                <button type="button" class="btn btn-primary btn-sm more"
                id="${coins[i].id}">more info</button>

                </div></div></div></div>`);
        }

        // in case some one switch it on, that the color will switch and stay
        for (let i = 0; i < fiveCoins.length; i++) {
            $(`#five${fiveCoins[i]}`).prop('checked', true);
        }

        // more information about the coin you choose
        $(".more").click(async function (e) {
            try {
                // first make shore it empty
                const id = e.target.id;
                if (!($(`#more${id}`).is(':empty'))) {
                    $(`#more${id}`).empty();
                }
                else {
                    const coins = await getDataAsyncLoadMore(`https://api.coingecko.com/api/v3/coins/${id}`, id);
                    $(".moreInfo").empty();
                    //display more info on a coin
                    $(`#more${id}`).append(`
                        <div class="col-sm container4">
                        <div>
                        <img src="${coins.image.small}" /><br>
                        ${coins.market_data.current_price.usd}$<br>
                        ${coins.market_data.current_price.eur}€<br>
                        ${coins.market_data.current_price.ils}₪<br>
                        </div></div>`);
                }
            }

            catch (err) {
                alert("Error: " + err.status);
            }
        });

        // check only 5 coins are checked and in 6 modal pop up
        $(".fiveOnly").change(function (e) {
            const id = e.target.id.substr(4); // start after the five
            const check = e.target.checked; // is it checked

            if (!check) { // if it is not checked
                let index = fiveCoins.indexOf(id);
                if (index > -1) {
                    fiveCoins.splice(index, 1);
                }
            }

            else {
                if (fiveCoins.length < 5) {
                    fiveCoins.push(id);
                }
                else {
                    e.target.checked = false; //isn't checked
                    $(".coinsModal").empty(); // make shore it empty

                    // choose five coins and creat in a modal 5 names
                    // and toggle for remove and choose different coin
                    for (let i = 0; i < fiveCoins.length; i++) {
                        $(".coinsModal").append(` 
                        <div class="form-check form-switch topFive topfivemodal">
                        <input class="form-check-input topFive fiveOnly" type="checkbox"
                        id="modal${fiveCoins[i]}" checked>
                        </div><div class="coinsNameModal">${fiveCoins[i]}</div>`);
                    }

                    $(".saveButton").on("click", function () {
                        // console.log(fiveCoins);
                        for (let i = fiveCoins.length - 1; i > -1; i--) {
                            if (!$(`#modal${fiveCoins[i]}`).is(":checked")) {
                                $(`#five${fiveCoins[i]}`).prop('checked', false);
                                fiveCoins.splice(i, 1);
                            }
                        }
                        if (fiveCoins.length < 5) {
                            $(`#five${id}`).prop('checked', true);
                            fiveCoins.push(id);
                            $("#moreThenFiveModal").modal('hide');
                        }
                        else {
                            alert("you did not remove any coin, the limit is 5!");
                        }
                    });
                    $("#moreThenFiveModal").modal('show');
                }
            }
        });
    }

    //--------------------------------------------------------------------------------------
    //bring all the api to work with, the first async await
    async function getCoinsList() {
        try {
            const coins = await getDataAsyncAllCoins("https://api.coingecko.com/api/v3/coins/list");
            globalCoins = coins.slice(1100, 1300); // the coins i choose for showing
            // console.log(globalCoins); // check were it is
            drawCoins(globalCoins);
        }
        catch (err) {
            alert("Error: " + err.status);
        }
    }
    //-----------------------------------------------------------------------------------------
    // cache save
    // save the information for 2 min
    function saveStorage(url, data) {
        sessionStorage.setItem(url, JSON.stringify(data));
        setTimeout(function () {
            deleteStorage(url);
        }, 20000);
    }

    // delete item after the time over
    function deleteStorage(url) {
        sessionStorage.removeItem(url);
    }

    // get the information from save
    function getStorage(url) {
        return JSON.parse(sessionStorage.getItem(url));
    }

    // check if the information is exist
    function checkIfExist(url) {
        if (sessionStorage.getItem(url)) {
            return true;
        }
        return false;
    }
    //-------------------------------------------------------------------------------------------
    // Search
    // search by filter to search one or more coins like this.
    $(`.searchButton`).click(function () {
        let search = $(".searchInput").val();
        let coins = globalCoins.filter(x => x.symbol == search);
        // console.log(coins);
        drawCoins(coins);
    });
    //----------------------------------------------------------------------------------------
    // onclick go back to all the coins
    $(".coin").click(function () {
        $(".firstContainer").empty();
        $(".firstContainer").append(getCoinsList());
    });

    // onload show all the coins that we have
    $(".coin").on("load", getCoinsList());
    //---------------------------------------------------------------------------------------------
    // first data of all the coins
    function getDataAsyncAllCoins(url) {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                beforeSend: function () {
                    $('.spinner').show();
                },
                complete: function () {
                    $('.spinner').hide();
                },
                success: data => resolve(data),

                reject: err => reject(err),
            });
        });
    }
    //------------------------------------------------------------------------------------------
    // second data of a specific currency with more info
    function getDataAsyncLoadMore(url, id) {
        // checking if the info exist
        if (checkIfExist(url)) {
            // console.log("getStorage"); // checking that it came from storage
            return getStorage(url);
        }
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                beforeSend: function () {
                    $(`#spinner${id}`).show();
                },
                complete: function () {
                    $(`#spinner${id}`).hide();
                },
                success: data => {
                    resolve(data);
                    saveStorage(url, data);
                    // console.log("ajax"); // checking that it came from ajax
                },
                reject: err => reject(err)
            });
        });
    }

    //----------------------------------------------------------------------------------------------
    // the page that is all about me and the coins, all the data is in here
    $(".about").on("click", function () {
        $(".firstContainer").empty();
        $(".firstContainer").append(`
        <div class="row-sm aboutPage">

        <h1 class="display-6">ABOUT</h1>

        <h6>About Crypto Currency</h6>
        
        <p class="lead">
        Crypto Currency is a means of payment created by technological means <br>
        and its value is not determined by the value of goods <br>
        or by the determination of one central body, <br>
        but by agreement between a network of users. <br>
        The best known example of a decentralized currency is Bitcoin. <br>
        Other examples are etherium and ripple systems. <br>
        Most decentralized currencies are based on blockchain technology, <br>
        of which Bitcoin was its first prominent implementation. <br>
        </p>

        <h6>About The Website</h6>
        
        <p class="lead">
        the site is build for a school project about Crypto Currency, <br>
        here you can see and laern about some Crypto Currency that we have and the value in the market. <br>
        for better information go to the credit in the buttum of the website.
        </p>

        <h6>About The creator</h6>
        
        <p class="lead">
        hi, my name is maayan biton, i'm from beit dagan, i'm 25 year old, <br>
        student in John Bryce for web developer full Stack. <br>
        love gaming, and code, the computer in general. <br>
        <img  class="maayanPhotos" src="assets/images/maayan.jpg" />
        <img  class="maayanPhotos" src="assets/images/maayan2.jpg" />
        </p>

        <p class="lead">
        i hope i was use full to you, with the information.
        </p>

        </div>`);
    });
});