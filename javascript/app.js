var todaysChartData = [];
var todaysChartLabels = [];
var chartLabels = [];
var chartData = [];

$(document).ready(function () {   

    var activityName;
    var startTime;
    var startTimeLegible;
    var stopTime;
    var stopTimeLegible;
    var handle; 
    var timer;
    var today = moment().format("LL");
    var email; 
    var uid;
    var now; 
    var duration;
    var durationLegible;
    
    // check auth status.
        auth.onAuthStateChanged(user => {
            if (user) {
            
            // Adjust nav display if user already logged in.
            $(".auth-buttons").hide(250);
            $("#log-in-prompt").hide(250);
            $("#chartView").show(0);
            $(".inputForm").show(250);
            $("#log-out-div").slideDown(250);
            email = user.email;
            uid = user.uid;
            console.log(uid);
            console.log(email);
            var welcomeMessage = `Welcome back, ${email}!`;
            $("#welcome-message").html(welcomeMessage);
            
            // Activate logout 
            logOut(); 

            // detect if data for today already exists
            db.collection("timelog").where("date", "==", today).where("userID", "==", uid).orderBy("start").get().then(querySnapshot => {
                querySnapshot.forEach(function (doc) {
                    // console.log(doc.id, "=> ", doc.data());
                    var data = doc.data();
                    var dataID = doc.id; 
                    var todaysActivities = data.activity;
                    var todaysDurations = data.duration;
                    var todaysDurationsLegible = moment.utc(data.duration).format("HH:mm:ss"); 
                    var todaysStartTimes = data.start;
                    var todaysEndTimes = data.end;
                
                    // display data on table
                    var tableItemHtml = `
                        <tr id="${dataID}">
                            <td>${todaysActivities}</td>
                            <td>${todaysDurationsLegible}</td>
                            <td>${todaysStartTimes}</td>
                            <td>${todaysEndTimes}</td>
                            <td>
                                <a href="" class="delete-link">X</a>
                            </td>
                        </tr>
                        `;
                    $("#timeLog").append(tableItemHtml);

                    // add today's data to chartData + chartLabels, and display chart
                    todaysChartLabels = todaysActivities;
                    todaysChartData = todaysDurations;
                    chartData.unshift(todaysChartData);
                    chartLabels.unshift(todaysChartLabels);
                    updateChart();
                });    
                
                // for the chart on refresh, remove duplicate labels & add duration data
                for (i = 0; i < chartLabels.length; i++) {
                    for (n = i + 1; n < chartLabels.length; n++)  {
                        if (chartLabels[i] === chartLabels[n] && i !== n && i < n) {
                        console.log(`duplicates at i= ${i} and n = ${n}. Values are ${chartLabels[i]} and ${chartLabels[n]}`);
                        chartData[i]=chartData[i] + chartData[n];
                        
                        //remove the duplicates from the arrays
                        chartData.splice(n, 1);
                        chartLabels.splice(n, 1);
                        updateChart();
                        };
                    };
                };
                // activite delete capability
                deleteItem(); 
            });
            
            } else {
                console.log("user logged out");
                $("#log-in-prompt").show();
                $(".inputForm").hide();
            };
        });

    // brings up sign-up form
    $("#sign-up").on("click", function (event) {
        event.preventDefault();

        $(".auth-buttons").hide(250);
        $("#nav-sign-up").slideDown(250); 

        // reverses action in case user needs to cancel 
        $("#sign-up-go-back").on("click", function (event) {
            event.preventDefault();
            $("#nav-sign-up").hide(250);
            $(".auth-buttons").slideDown(250);
        });

        // collect user signup data
        $("#sign-up-form").on("submit", function (event) {
            event.preventDefault(); 
            const email = $("#sign-up-email").val();
            const password = $("#sign-up-password-verified").val(); 

            // sign up the user
            auth.createUserWithEmailAndPassword(email, password).then(cred => {
                $("#nav-sign-up").hide(250);
                $("#log-out-div").slideDown(250); 

                // Display welcome message for new user
                var welcomeMessage = `Welcome, ${email}!`;
                $("#welcome-message").html(welcomeMessage);
                $("#sign-up-email").val("");
                $("#first-password").val("");
                $("#sign-up-password-verified").val("");
            });

            // enable logout function
            logOut(); 
        });
    });

    // brings up the sign-in form
    $("#sign-in").on("click", function(event) {
        event.preventDefault();

        $(".auth-buttons").hide(250);
        $("#nav-sign-in").slideDown(250);

        // reverses action in case user needs to cancel 
        $("#sign-in-go-back").on("click", function (event) {
            event.preventDefault();
            $("#nav-sign-in").hide(250);
            $(".auth-buttons").slideDown(250);
        });   

        // sign-in functionality
        $("#sign-in-form").on("submit", function (event) {
            event.preventDefault();
            const email = $("#sign-in-email").val();
            const password = $("#sign-in-password").val();
            auth.signInWithEmailAndPassword(email, password).then(cred =>
                {
                    $("#nav-sign-in").hide(250);
                    $("#log-out-div").slideDown(250); 

                    // Display welcome message for returning user
                    var welcomeMessage = `Welcome back, ${email}!`;
                    $("#welcome-message").html(welcomeMessage);
                    $("#sign-in-email").val("");
                    $("#sign-in-password").val("");
                });
            
            // enable logout function
            logOut();
        });     
    });

    // on click of "start time" button: 
    $("#startTimer").on("click", function (event) {
        event.preventDefault();

            // HIDE "start time" button and input form and SHOW timer and "stop timer" button
        $(".inputForm").hide();
        $(".timerHide").slideDown(500);

            // ASSIGN var for present time at time of button click and var for string in the input form at time of click
        activityName = $("#nameActivity").val();
        startTime = moment();
        startTimeLegible = moment(startTime).format("hh:mm:ss a").toString();

            // DISPLAY activityName as string in column 1 of the table and currentTime as string in column 3 of the table
        var tableItemHtml = `
            <tr id="data-id">
                <td>${activityName}</td>
                <td id="replace1">--:--</td>
                <td>${startTimeLegible}</td>
                <td id="replace2">--:--</td>
                <td>
                    <a href="" id="replace3"></a>
                </td>
            </tr>
        `;
        $("#timeLog").append(tableItemHtml);

        // run stopwatch function
        runClock();
    });

    // on click of "Stop" button, timer stops and disappears, form and "start timer" button reappear.
    $("#stopTimer").on("click", function(event) {
        event.preventDefault();

            // HIDE "stop" button and timer and SHOW "start time" button and input form
        $(".timerHide").hide();
        $(".inputForm").slideDown(500);

            // ASSIGN var for present time at time of button click
        stopTime = moment();
        stopTimeLegible = moment(stopTime).format("hh:mm:ss a").toString();
        var endTime = `
            <td>${stopTimeLegible}</td>
        `;

            // DISPLAY currentTime as string in column 4 of table
        $("#replace2").replaceWith(endTime);
        $("#replace3").replaceWith(`<a href="" class="delete-link">X</a>`);

        // run stopwatch stop function
        stopClock();
        
        // run update chart function
        updateChart();

        // activate delete-item capability
        deleteItem();
    });

    // FUNCTIONS defined for reusability
    function logOut() {
        $("#log-out-button").on("click", function () {
            chartData.splice(0,chartData.length);
            chartLabels.splice(0,chartLabels.length);
            auth.signOut().then(() => {
                $("#log-out-div").hide(250);
                $(".auth-buttons").show(250);
                $("#welcome-message").html("");
                $("#timeLog").html("");
                $("#chartView").hide();
            });    
        });
    };

    function runClock() {
    
        // calls out html element where time will be displayed
        timer = document.getElementById("timer");

        // creates the functionality for the application to count seconds
        handle = setInterval(() => {
            now = moment();
            duration = (now - startTime);
            
            // workaround for moment.js timer display issue. Adds hours to clock as it counts 
            var H = 0;
            H = H + Math.floor( duration / 3600000);

            // converts the time into a legible string format
            var durationLegible = activityName + ": " + moment(duration).format(`${H}:mm:ss:S`);

            // Displays the running timer in the DOM of the #timer element
            timer.textContent = durationLegible;
        }, 100);
    };

    function stopClock() {

        // at time of button click, measure and display duration of current time session
        durationLegible = moment.utc(duration).format("HH:mm:ss").toString(); 
        var durationDisplay = `
            <td>${durationLegible}</td>
        `;
        $("#replace1").replaceWith(durationDisplay);

        // reset variables and DOM of timer element to 00 : 00
        clearInterval(handle);
        now = "00 : 00";
        timerCount = "00 : 00";
        timerCountLegible = "00 : 00"; 
        timer.textContent = timerCountLegible; 

        // add data to firebase 
        db.collection("timelog").add({
            userID: uid,
            email: email, 
            date: today,
            activity: activityName,
            duration: duration,
            start: startTimeLegible,
            end: stopTimeLegible
        });

        // adds firebase id to table row so user can delete without refreshing (this happens automatically on refresh)
        db.collection("timelog").where("date", "==", today).where("activity", "==", activityName).get().then(querySnapshot => {
            querySnapshot.forEach(function (doc) {
                var dataID = doc.id;
                $("#data-id").attr("id", dataID);
            });
        });

        // combines data if the activityName already exists
        for ( var i = 0; i < (chartLabels.length); i++) {
            if ( activityName === chartLabels[i]) {
                chartData[i] = chartData[i] + duration ;
                return;
            } 
        };

        chartLabels.push(activityName);
        chartData.push(duration);           
    };

    function updateChart () {
        var chart = $("#chartView");
        var myDoughnutChart = new Chart(chart, {
            type: 'doughnut',
            
            data: {
                // DISPLAY activityName as label on chart
                labels: chartLabels,
                datasets: [
                    {   
                        label: "Duration of Activities",
                        backgroundColor: ["#FF6384","#FFCD56","#36A2EB","#4BC0C0","#33A02C","#FB9C9B","#E31A1C","#FDBF6F","#CAB2D6","#6A3D9A","#FFFF99","#FF6384","#FFCD56","#36A2EB","#4BC0C0","#33A02C","#FB9C9B","#E31A1C","#FDBF6F","#CAB2D6","#6A3D9A","#FFFF99"],
                        data: chartData,
                    }
                ]
            },
            options: {
                animation: {
                    animateScale: true
                },
                tooltips: {
                    callbacks: {
                        enabled: true,
                        mode: 'single',
                        title: function(tooltipItems, data) {
                            return data["labels"][tooltipItems[0]["index"]];
                        },
                        label: function(tooltipItems, data) {

                            // parses out time readings in the legible format "hh hours mm minutes ss seconds"
                            if ((data["datasets"][0]["data"][tooltipItems["index"]]) < 60000 ) {
                                return ( Math.round( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 ) ) + " seconds";
                            } else if ( 60000 <= (data["datasets"][0]["data"][tooltipItems["index"]]) && (data["datasets"][0]["data"][tooltipItems["index"]]) < 3600000) {
                                var m = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) / 60000 );
                                return ( Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60) ) + " minutes "
                                + ( Math.round( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - ( 60000 * m ) )/1000 ) ) + " seconds";
                            } else if ((data["datasets"][0]["data"][tooltipItems["index"]]) > 3600000) {
                                var h = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60 / 60 );
                                m = Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) / 60000 );
                                return ( Math.floor( (data["datasets"][0]["data"][tooltipItems["index"]]) /1000 / 60 / 60) ) + " hours "
                                + ( Math.floor( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - (3600000 * h) )/1000 / 60) ) + " minutes "
                                + ( Math.round( ( (data["datasets"][0]["data"][tooltipItems["index"]]) - ( 60000 * m ) )/1000 ) ) + " seconds";
                            };
                        }
                    }
                },
                title: {
                    display: true, 
                    fontColor: "rgb(208, 212, 212)",
                    text: "Today's time allocations"
                },
            }
        });
    };

    function deleteItem() {
        $(".delete-link").on("click", function(event) {
            event.preventDefault();
            
            // removes row from the table and adds row data into an array
            $(this).parent().parent().css("display", "none");
            var docID = $(this).parent().parent().attr("id");
            var activityValue = $(this).parent().prev().prev().prev().prev().html();
            var startTimeValue = $(this).parent().prev().prev().html();
            var endTimeValue = $(this).parent().prev().html(); 
            var durationValue = moment(endTimeValue, "hh:mm:ss a").format("x") - moment(startTimeValue, "hh:mm:ss a").format("x");
            var dataValue = {activityValue, durationValue, startTimeValue, endTimeValue};
            console.log(dataValue);
            console.log(docID);
            
            for (i = 0; i < chartLabels.length; i++ ) {
                if (chartLabels[i] === activityValue) {
                    chartData[i] = chartData[i] - durationValue;
                    // re-parse duration back into milliseconds is not perfect math, so this eliminates the chart data if the new value is less than two seconds
                    if (chartData[i] < 2000) {
                        chartData.splice(i, 1);
                        chartLabels.splice(i, 1);
                    }
                };
            };

            updateChart(); 

            // deletes item from firebase db so it does not reappear on refresh
            db.collection("timelog").doc(docID).delete();
        });
    };
});